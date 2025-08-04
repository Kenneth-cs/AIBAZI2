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
        
        // 使用异步API端点
        const apiUrl = 'https://api.coze.cn/v1/workflow/stream_run';
        
        console.log('代理请求到coze异步API:', apiUrl);
        
        // 构建符合Coze异步API格式的请求体
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
        
        console.log('发送到Coze的异步请求体:', JSON.stringify(cozeRequestBody, null, 2));
        
        // 创建AbortController用于超时控制 - 设置为10分钟
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000);
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer pat_BoKyWehPisvL0EYs9SuGpBsgaKrwqFngYXmlTgNP82Ft2yrHQG5tH7bgaKqRv2JG',
                    'Accept': 'text/event-stream', // 异步API使用SSE格式
                    'User-Agent': 'AILife/1.0'
                },
                body: JSON.stringify(cozeRequestBody),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log('coze异步API响应状态:', response.status);
            console.log('响应头:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('coze异步API错误:', errorText);
                
                if (response.status === 401) {
                    return res.status(401).json({
                        error: 'API认证失败',
                        message: '请检查API密钥是否正确',
                        details: errorText
                    });
                }
                
                return res.status(response.status).json({
                    error: `异步API调用失败: ${response.status} ${response.statusText}`,
                    details: errorText
                });
            }
            
            // 处理SSE流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let finalResult = null;
            let buffer = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // 保留不完整的行
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            break;
                        }
                        
                        try {
                            const eventData = JSON.parse(data);
                            console.log('SSE事件:', eventData);
                            
                            // 检查是否是认证中断
                            if (eventData.interrupt_data && eventData.interrupt_data.need_auth) {
                                const authInfo = eventData.interrupt_data;
                                return res.status(400).json({
                                    success: false,
                                    error: '工作流需要认证',
                                    message: `${authInfo.plugin_name}需要OAuth认证`,
                                    auth_required: true,
                                    details: '请在Coze后台完成插件认证后重试'
                                });
                            }
                            
                            // 修改：检查多种成功完成的条件
                            if ((eventData.event === 'workflow.finish' && eventData.data) ||
                                (eventData.node_is_finish && eventData.node_title === 'End' && eventData.content)) {
                                
                                // 处理不同的响应格式
                                if (eventData.data) {
                                    // 标准的 workflow.finish 格式
                                    finalResult = eventData.data;
                                } else if (eventData.content) {
                                    // 新的响应格式
                                    finalResult = {
                                        output: eventData.content,
                                        usage: eventData.usage,
                                        debug_url: null // 会在后续的事件中获取
                                    };
                                }
                            }
                            
                            // 单独处理 debug_url
                            if (eventData.debug_url && finalResult) {
                                finalResult.debug_url = eventData.debug_url;
                            }
                            
                        } catch (e) {
                            console.log('解析SSE数据失败:', e.message);
                        }
                    }
                }
            }
            
            if (finalResult) {
                console.log('异步工作流最终结果:', finalResult);
                
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
                        fortune_content: finalResult.output, // 直接使用内容
                        debug_url: finalResult.debug_url,
                        usage: finalResult.usage
                    }
                };
                
                res.json(formattedResponse);
            } else {
                res.status(500).json({
                    success: false,
                    error: '异步工作流执行失败',
                    message: '未收到最终结果'
                });
            }
            
        } catch (fetchError) {
            clearTimeout(timeoutId);
            console.error('异步API请求失败:', fetchError);
            
            if (fetchError.name === 'AbortError') {
                return res.status(408).json({
                    success: false,
                    error: '请求超时',
                    message: '工作流执行超过10分钟，请稍后重试'
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