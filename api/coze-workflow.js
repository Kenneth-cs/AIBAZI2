export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        // 修改参数接收方式，与本地server.js保持一致
        const { name, gender, birth_place, birth_datetime, year, month, day, hour, minute, second } = req.body;
        
        const response = await fetch('https://api.coze.cn/v1/workflow/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer pat_BoKyWehPisvL0EYs9SuGpBsgaKrwqFngYXmlTgNP82Ft2yrHQG5tH7bgaKqRv2JG`,
            },
            body: JSON.stringify({
                workflow_id: '7527326304544161826',
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
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ 
                error: `API调用失败: ${response.status}`,
                details: errorText 
            });
        }
        
        const result = await response.json();
        console.log('Coze原始返回数据:', JSON.stringify(result, null, 2));
        
        // 添加业务错误检查
        if (result.code && result.code !== 0) {
            return res.status(400).json({
                success: false,
                error: '工作流执行失败',
                message: result.msg || '参数错误',
                code: result.code,
                debug_url: result.debug_url
            });
        }
        
        // 构建符合前端期望的响应格式（与本地server.js完全一致）
        const formattedResponse = {
            success: true,
            data: {
                name: name,
                basic_info: {
                    birth_date: birth_datetime,
                    birth_place: birth_place,
                    gender: gender
                },
                // 主要内容字段 - 与本地server.js保持一致
                fortune_content: result.data || result.output || '算命结果获取成功',
                
                // 添加前端支持的直接字段（支持markdown、表格等）
                dayun: result.data?.dayun,
                five_dayun: result.data?.five_dayun, 
                geju: result.data?.geju,
                output: result.data?.output,
                life: result.data?.life,
                wuxinggeju: result.data?.wuxinggeju,
                shishen: result.data?.shishen,
                old_dayun: result.data?.old_dayun,
                now_dayun: result.data?.now_dayun,
                now_dayun1: result.data?.now_dayun1,
                
                // 保留outputs结构以支持前端的多种数据格式
                outputs: {
                    fortune_content: result.data?.fortune_content || result.data || result.output,
                    dayun: result.data?.dayun,
                    five_dayun: result.data?.five_dayun,
                    geju: result.data?.geju,
                    output: result.data?.output,
                    debug_url: result.debug_url,
                    usage: result.usage
                },
                
                debug_url: result.debug_url,
                usage: result.usage
            }
        };
        
        res.json(formattedResponse);
        
    } catch (error) {
        console.error('API调用错误:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: error.message 
        });
    }
}