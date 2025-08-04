/**
 * coze工作流配置示例
 * 
 * 将此文件重命名为 config.js 并修改相应的配置项
 * 然后在 script.js 中引入此配置文件
 */

const COZE_CONFIG = {
    // coze工作流API配置
    API_URL: 'https://api.coze.com/v1/workflow/run',  // 示例URL，请替换为您的实际API端点
    API_KEY: 'your-coze-api-key-here',                // 您的coze API密钥
    WORKFLOW_ID: 'your-workflow-id',                  // 您的工作流ID（如需要）
    
    // 请求配置
    TIMEOUT: 30000,                                   // 请求超时时间(毫秒)
    RETRY_COUNT: 3,                                   // 重试次数
    
    // 响应处理配置
    SUCCESS_STATUS: 'success',                        // 成功状态标识
    ERROR_STATUS: 'error',                           // 错误状态标识
    
    // 演示模式（当API未配置时使用）
    DEMO_MODE: true,                                 // 设置为false以使用真实API
};

/**
 * coze工作流请求示例
 * 
 * 您的coze工作流应该期望接收以下格式的数据：
 */
const SAMPLE_REQUEST = {
    "name": "张三",                              // 用户姓名
    "gender": "男",                             // 性别
    "birth_place": "北京市朝阳区",               // 出生地点
    "birth_datetime": "1990-05-15 14:30:00",   // 完整的出生日期时间
    "year": 1990,                              // 出生年
    "month": 5,                                // 出生月
    "day": 15,                                 // 出生日
    "hour": 14,                                // 出生时
    "minute": 30,                              // 出生分
    "second": 0                                // 出生秒
};

/**
 * coze工作流响应示例
 * 
 * 您的coze工作流应该返回以下格式的数据：
 */
const SAMPLE_RESPONSE = {
    "success": true,                           // 成功标识
    "data": {
        "name": "张三",
        "basic_info": {
            "birth_date": "1990-05-15 14:30:00",
            "birth_place": "北京市朝阳区",
            "gender": "男"
        },
        "bazi_analysis": {
            "year_pillar": "庚午",              // 年柱
            "month_pillar": "辛巳",             // 月柱
            "day_pillar": "甲寅",               // 日柱
            "hour_pillar": "辛未",              // 时柱
            "five_elements": {
                "wood": 2,                     // 木
                "fire": 3,                     // 火
                "earth": 2,                    // 土
                "metal": 2,                    // 金
                "water": 1                     // 水
            }
        },
        "fortune_summary": "详细的命理分析文本...",  // 命理综述
        "recommendations": [                   // 人生建议
            "保持积极乐观的心态",
            "注重身体健康",
            "善待身边的人",
            "选择适合的职业道路",
            "理性投资理财"
        ]
    }
};

/**
 * coze工作流错误响应示例
 */
const SAMPLE_ERROR_RESPONSE = {
    "success": false,
    "error": {
        "code": "INVALID_INPUT",
        "message": "输入数据格式不正确"
    }
};

/**
 * 如何在您的coze工作流中处理请求：
 * 
 * 1. 接收POST请求的JSON数据
 * 2. 验证输入数据的完整性和格式
 * 3. 根据出生信息计算八字
 * 4. 进行五行分析
 * 5. 生成命理分析报告
 * 6. 返回标准格式的JSON响应
 * 
 * 建议在coze工作流中包含以下步骤：
 * - 数据验证节点
 * - 八字计算节点
 * - AI分析节点
 * - 报告生成节点
 * - 响应格式化节点
 */

// 导出配置（如果使用模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        COZE_CONFIG,
        SAMPLE_REQUEST,
        SAMPLE_RESPONSE,
        SAMPLE_ERROR_RESPONSE
    };
} 