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
        const { inputs } = req.body;
        
        const response = await fetch('https://api.coze.cn/v1/workflow/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.COZE_API_KEY}`,
            },
            body: JSON.stringify({
                workflow_id: process.env.WORKFLOW_ID || '73664689170551*****',
                parameters: inputs
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ 
                error: `API调用失败: ${response.status}`,
                details: errorText 
            });
        }
        
        const data = await response.json();
        res.status(200).json(data);
        
    } catch (error) {
        console.error('API调用错误:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}