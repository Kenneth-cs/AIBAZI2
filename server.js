const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// 启用CORS
app.use(cors());

// 解析JSON请求体
app.use(express.json());

// 提供静态文件
app.use(express.static(__dirname));

// 添加代理路由来调用coze API
app.post('/api/coze-workflow', async (req, res) => {
    try {
        console.log('收到代理请求，请求体:', req.body);
        
        // 验证请求体
        if (!req.body) {
            return res.status(400).json({
                error: '请求数据格式错误',
                message: '请求体为空'
            });
        }
        
        const { name, gender, birth_place, birth_datetime, year, month, day, hour, minute, second } = req.body;
        
        // 使用同步API端点
        const apiUrl = 'https://api.coze.cn/v1/workflow/run';
        
        console.log('代理请求到coze同步API:', apiUrl);
        
        // 构建符合Coze同步API格式的请求体
        const cozeRequestBody = {
            workflow_id: "7527326304544161826",
            parameters: {
                birth_datetime: birth_datetime || `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`,
                birth_place: birth_place,
                gender: gender,
                day: parseInt(day),
                hour: parseInt(hour),
                month: parseInt(month),
                year: parseInt(year),
                minute: parseInt(minute),
                second: parseInt(second),
                name: name
            }
        };
        
        console.log('发送到Coze的同步请求体:', JSON.stringify(cozeRequestBody, null, 2));
        
        // 创建AbortController用于超时控制 - 设置为15分钟，给Coze更多处理时间
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 900000);
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer pat_BoKyWehPisvL0EYs9SuGpBsgaKrwqFngYXmlTgNP82Ft2yrHQG5tH7bgaKqRv2JG',
                    'User-Agent': 'AILife/1.0',
                    'Connection': 'keep-alive'
                },
                body: JSON.stringify(cozeRequestBody),
                signal: controller.signal,
                // 增加一些网络配置来处理长时间响应
                keepalive: true
            });
            
            clearTimeout(timeoutId);
            
            console.log('coze同步API响应状态:', response.status);
            console.log('响应头:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('coze同步API错误:', errorText);
                
                if (response.status === 401) {
                    return res.status(401).json({
                        error: 'API认证失败',
                        message: '请检查API密钥是否正确',
                        details: errorText
                    });
                }
                
                return res.status(response.status).json({
                    error: `同步API调用失败: ${response.status} ${response.statusText}`,
                    details: errorText
                });
            }
            
            // 处理同步API响应
            const result = await response.json();
            console.log('同步工作流结果:', result);
            
            // 检查业务错误码
            if (result.code && result.code !== 0) {
                return res.status(400).json({
                    success: false,
                    error: '工作流执行失败',
                    message: result.msg || '参数错误',
                    code: result.code,
                    debug_url: result.debug_url
                });
            }
            
            // 构建符合前端期望的响应格式
            const formattedResponse = {
                success: true,
                data: {
                    name: name,
                    basic_info: {
                        birth_date: birth_datetime,
                        birth_place: birth_place,
                        gender: gender
                    },
                    fortune_content: result.data || result.output || '算命结果获取成功',
                    debug_url: result.debug_url,
                    usage: result.usage
                }
            };
            
            res.json(formattedResponse);
            
        } catch (fetchError) {
            clearTimeout(timeoutId);
            console.error('同步API请求失败:', fetchError);
            
            if (fetchError.name === 'AbortError') {
                return res.status(408).json({
                    success: false,
                    error: '请求超时',
                    message: '工作流执行超过15分钟，请稍后重试'
                });
            }
            
            // 处理Headers Timeout Error
            if (fetchError.cause && fetchError.cause.code === 'UND_ERR_HEADERS_TIMEOUT') {
                return res.status(408).json({
                    success: false,
                    error: '响应头超时',
                    message: 'Coze API响应头接收超时，可能是网络问题或API响应过慢，请稍后重试'
                });
            }
            
            return res.status(500).json({
                success: false,
                error: '网络请求失败',
                message: fetchError.message
            });
        }
        
    } catch (error) {
        console.error('代理服务器错误:', error);
        res.status(500).json({
            success: false,
            error: '代理服务器内部错误',
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`主应用: http://localhost:${PORT}/index.html`);
    console.log(`测试页面: http://localhost:${PORT}/test-proxy.html`);
});