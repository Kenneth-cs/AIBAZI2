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
        
        // 添加业务错误检查
        if (result.code && result.code !== 0) {
            return res.status(400).json({
                success: false,
                error: result.msg || 'Coze workflow error',
                code: result.code
            });
        }
        
        // 成功响应
        res.status(200).json({
            success: true,
            data: {
                name: result.data?.name,
                basic_info: result.data?.basic_info,
                fortune_content: result.data?.fortune_content,
                debug_url: result.debug_url,
                usage: result.usage
            }
        });
        
    } catch (error) {
        console.error('API调用错误:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: error.message 
        });
    }
}