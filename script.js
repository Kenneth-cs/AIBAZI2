// 配置选项 - coze工作流配置
// 修改CONFIG配置（第2-16行）
const CONFIG = {
    // 使用Vercel API路由作为代理
    USE_PROXY: true,
    PROXY_URL: '/api/coze-workflow',
    
    // coze工作流API配置（现在会使用环境变量）
    COZE_API_URL: 'https://api.coze.cn/v1/workflow/run',
    COZE_API_KEY: '', // 留空，使用Vercel环境变量
    WORKFLOW_ID: '7527326304544161826', // 你的实际工作流ID
    
    // 其他配置
    LOADING_DURATION: 10000,
    PROGRESS_ANIMATION_SPEED: 50,
    API_TIMEOUT: 960000  // 16分钟，比后端稍长以避免前端先超时
};

// DOM元素引用
const elements = {
    inputSection: document.getElementById('inputSection'),
    loadingSection: document.getElementById('loadingSection'),
    resultSection: document.getElementById('resultSection'),
    birthForm: document.getElementById('birthForm'),
    submitBtn: document.getElementById('submitBtn'),
    newReadingBtn: document.getElementById('newReadingBtn'),
    progressFill: document.getElementById('progressFill'),
    resultContent: document.getElementById('resultContent')
};

// 应用状态
let isProcessing = false;

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // 绑定事件监听器
    elements.birthForm.addEventListener('submit', handleFormSubmit);
    elements.newReadingBtn.addEventListener('click', handleNewReading);
    
    // 添加表单验证
    addFormValidation();
    
    console.log('八字算命应用已初始化');
}

// 处理表单提交
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (isProcessing) return;
    
    // 获取表单数据
    const formData = getFormData();
    
    // 验证表单数据
    if (!validateFormData(formData)) {
        return;
    }
    
    // 开始处理
    isProcessing = true;
    elements.submitBtn.disabled = true;
    
    try {
        // 显示加载状态
        showLoadingState();
        
        // 调用coze工作流
        const result = await callCozeWorkflow(formData);
        
        // 显示结果
        showResult(result);
        
    } catch (error) {
        console.error('算命过程中发生错误:', error);
        showError(error.message || '算命过程中发生了未知错误，请重试。');
    } finally {
        isProcessing = false;
        elements.submitBtn.disabled = false;
    }
}

// 获取表单数据
function getFormData() {
    const formData = new FormData(elements.birthForm);
    const data = {};
    
    // 获取所有表单字段
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // 构建birth_datetime字符串
    data.birth_datetime = `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')} ${String(data.hour).padStart(2, '0')}:${String(data.minute).padStart(2, '0')}:${String(data.second).padStart(2, '0')}`;
    
    // 转换数字类型
    data.year = parseInt(data.year);
    data.month = parseInt(data.month);
    data.day = parseInt(data.day);
    data.hour = parseInt(data.hour);
    data.minute = parseInt(data.minute);
    data.second = parseInt(data.second);
    
    return data;
}

// 验证表单数据
function validateFormData(data) {
    const errors = [];
    
    // 验证必填字段
    if (!data.name.trim()) errors.push('请输入姓名');
    if (!data.gender) errors.push('请选择性别');
    if (!data.birth_place.trim()) errors.push('请输入出生地点');
    
    // 验证日期
    if (!data.year || data.year < 1900 || data.year > 2030) {
        errors.push('请输入有效的出生年份(1900-2030)');
    }
    if (!data.month || data.month < 1 || data.month > 12) {
        errors.push('请选择有效的出生月份');
    }
    if (!data.day || data.day < 1 || data.day > 31) {
        errors.push('请输入有效的出生日期');
    }
    
    // 验证时间
    if (data.hour < 0 || data.hour > 23) {
        errors.push('请输入有效的小时(0-23)');
    }
    if (data.minute < 0 || data.minute > 59) {
        errors.push('请输入有效的分钟(0-59)');
    }
    if (data.second < 0 || data.second > 59) {
        errors.push('请输入有效的秒数(0-59)');
    }
    
    // 验证日期是否存在
    const date = new Date(data.year, data.month - 1, data.day);
    if (date.getFullYear() !== data.year || 
        date.getMonth() !== data.month - 1 || 
        date.getDate() !== data.day) {
        errors.push('请输入存在的日期');
    }
    
    if (errors.length > 0) {
        alert('表单验证失败：\n' + errors.join('\n'));
        return false;
    }
    
    return true;
}

// 添加表单验证
function addFormValidation() {
    // 实时验证日期
    const dayInput = document.getElementById('day');
    const monthSelect = document.getElementById('month');
    const yearInput = document.getElementById('year');
    
    function updateDayOptions() {
        const year = parseInt(yearInput.value);
        const month = parseInt(monthSelect.value);
        
        if (year && month) {
            const daysInMonth = new Date(year, month, 0).getDate();
            const currentDay = parseInt(dayInput.value);
            
            if (currentDay > daysInMonth) {
                dayInput.value = daysInMonth;
            }
            
            dayInput.max = daysInMonth;
        }
    }
    
    monthSelect.addEventListener('change', updateDayOptions);
    yearInput.addEventListener('input', updateDayOptions);
}

// 调用coze工作流
async function callCozeWorkflow(data, retryCount = 0) {
    const maxRetries = 3; // 增加重试次数
    
    try {
        // 构建请求体，直接发送用户数据给代理服务器
        const requestBody = {
            name: data.name,
            gender: data.gender,
            birth_place: data.birth_place,
            birth_datetime: data.birth_datetime,
            year: data.year,
            month: data.month,
            day: data.day,
            hour: data.hour,
            minute: data.minute,
            second: data.second
        };
        
        console.log(`=== 开始调用coze工作流 (第${retryCount + 1}次尝试) ===`);
        console.log('请求数据:', requestBody);
        
        // 创建AbortController用于超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
        
        let response;
        try {
            response = await fetch(CONFIG.PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
        } finally {
            clearTimeout(timeoutId);
        }
        
        console.log('响应状态:', response.status);
        
        // 检查是否需要重试的状态码
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API响应错误:', errorText);
            
            // 对于504、502、503等网关错误，进行重试
            if ([502, 503, 504].includes(response.status) && retryCount < maxRetries) {
                console.log(`检测到${response.status}错误，准备重试...`);
                // 等待一段时间后重试，使用指数退避策略
                const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
                console.log(`等待${delay}ms后重试`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return callCozeWorkflow(data, retryCount + 1);
            }
            
            throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('coze工作流响应:', result);
        
        // 处理成功响应
        if (result.success) {
            return {
                success: true,
                data: {
                    name: data.name,
                    basic_info: {
                        birth_date: data.birth_datetime,
                        birth_place: data.birth_place,
                        gender: data.gender
                    },
                    // 直接传递工作流的输出参数
                    outputs: result.data
                }
            };
        } else {
            throw new Error(result.message || '工作流执行失败');
        }
        
    } catch (error) {
        console.error(`=== coze工作流调用失败 (第${retryCount + 1}次尝试) ===`);
        console.error('错误信息:', error.message);
        
        // 处理超时错误 - 也可以重试
        if (error.name === 'AbortError' && retryCount < maxRetries) {
            console.log('请求超时，准备重试...');
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return callCozeWorkflow(data, retryCount + 1);
        }
        
        // 网络错误也可以重试
        if ((error.message.includes('fetch') || error.message.includes('network')) && retryCount < maxRetries) {
            console.log('网络错误，准备重试...');
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return callCozeWorkflow(data, retryCount + 1);
        }
        
        // 如果重试次数用完或其他错误，返回失败结果
        if (retryCount >= maxRetries) {
            console.error(`已达到最大重试次数(${maxRetries})，停止重试`);
        }
        
        return {
            success: false,
            message: error.name === 'AbortError' 
                ? `请求超时，已重试${retryCount + 1}次，请稍后重试` 
                : `${error.message}，已重试${retryCount + 1}次`
        };
    }
}

// 获取模拟结果（用于演示）
async function getMockResult(data) {
    // 模拟API调用延迟
    await sleep(2000);
    
    return {
        success: true,
        data: {
            name: data.name,
            basic_info: {
                birth_date: data.birth_datetime,
                birth_place: data.birth_place,
                gender: data.gender
            },
            bazi_analysis: {
                year_pillar: "庚子",
                month_pillar: "戊寅",
                day_pillar: "甲午",
                hour_pillar: "丙寅",
                five_elements: {
                    wood: 2,
                    fire: 2,
                    earth: 1,
                    metal: 1,
                    water: 2
                }
            },
            fortune_summary: `${data.name}您好，根据您的八字分析：\n\n您出生于${data.birth_datetime}，${data.birth_place}。\n\n八字为：庚子年 戊寅月 甲午日 丙寅时\n\n五行分析：木旺火相，性格开朗积极，具有很强的创造力和领导能力。您天生聪慧，善于思考，在事业上容易取得成功。\n\n财运方面：中年后财运亨通，投资理财方面有很好的天赋，但需要注意不要过于冒险。\n\n感情方面：感情丰富，桃花运较好，但要注意选择合适的伴侣，婚姻生活会是幸福。\n\n健康方面：整体健康状况良好，但需要注意肝胆方面的保养，多运动，保持良好作息。\n\n事业发展：适合从事创意、管理、教育等行业，贵人运较好，容易得到他人帮助。`,
            recommendations: [
                "保持积极乐观的心态，发挥自己的创造天赋",
                "在投资理财时要谨慎，不要盲目跟风",
                "注重身体健康，定期体检，保持良好作息",
                "善待身边的人，广结善缘，贵人运会更旺",
                "选择适合自己的职业道路，发挥专长优势"
            ]
        }
    };
}

// 显示加载状态
function showLoadingState() {
    elements.inputSection.style.display = 'none';
    elements.resultSection.style.display = 'none';
    elements.loadingSection.style.display = 'block';
    
    // 动画效果
    animateProgressBar();
    
    // 滚动到加载区域
    elements.loadingSection.scrollIntoView({ behavior: 'smooth' });
}

// 进度条动画
function animateProgressBar() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 95) progress = 95;
        
        elements.progressFill.style.width = progress + '%';
        
        if (progress >= 95) {
            clearInterval(interval);
        }
    }, CONFIG.PROGRESS_ANIMATION_SPEED);
}

// 显示结果
function showResult(result) {
    // 完成进度条
    elements.progressFill.style.width = '100%';
    
    setTimeout(() => {
        elements.loadingSection.style.display = 'none';
        elements.resultSection.style.display = 'block';
        
        // 填充结果内容
        displayResultContent(result);
        
        // 滚动到结果区域
        elements.resultSection.scrollIntoView({ behavior: 'smooth' });
    }, 500);
}

// 显示结果内容
function displayResultContent(result) {
    if (!result.success) {
        elements.resultContent.innerHTML = `
            <div class="error-message">
                <h3>😔 算命失败</h3>
                <p>${result.message || '抱歉，无法完成您的八字分析，请稍后重试。'}</p>
            </div>
        `;
        return;
    }
    
    const data = result.data;
    console.log('前端接收到的数据:', data);
    
    // 处理分析内容
    let analysisContent = '';
    
    // 优先检查 outputs.fortune_content（新的数据格式）
    if (data.outputs && data.outputs.fortune_content) {
        console.log('使用 outputs.fortune_content:', data.outputs.fortune_content.substring(0, 200));
        
        let contentData = data.outputs.fortune_content;
        
        // 如果是JSON字符串，先解析
        if (typeof contentData === 'string' && contentData.trim().startsWith('{')) {
            try {
                contentData = JSON.parse(contentData);
                console.log('解析后的 fortune_content:', contentData);
            } catch (e) {
                console.log('fortune_content 不是有效的JSON，直接使用字符串');
            }
        }
        
        // 如果解析后是对象，处理其中的内容
        if (typeof contentData === 'object' && contentData !== null) {
            // 定义所有可能的参数及其对应的标题
            const parameterMap = {
                life: '🌟 命盘基本结构',
                wuxinggeju: '⚡ 五行格局强弱与阴阳平衡',
                shishen: '🎭 十神旺意与喜用神分析',
                geju: '🎯 格局特点与核心命题',
                old_dayun: '📜 往昔大运深度解析',
                now_dayun: '🔄 当前大运深度解析与人生导航',
                dayun: '📅 大运流年解析报告',
                five_dayun: '📊 近五年流年关键节点',
                now_dayun1: '🎯 现代可行建议',
                output: '📝 总结输出',
                output1: '📄 文本处理'
            };
            
            // 动态构建contentSections，只包含实际存在且有内容的参数
            const contentSections = Object.keys(parameterMap)
                .filter(key => contentData[key] && contentData[key].toString().trim())
                .map(key => ({
                    key: key,
                    title: parameterMap[key],
                    content: contentData[key]
                }));
            
            const validSections = contentSections.filter(section => 
                section.content && section.content.toString().trim()
            );
            
            if (validSections.length > 0) {
                // 初始化Mermaid
                if (typeof mermaid !== 'undefined') {
                    mermaid.initialize({ startOnLoad: false, theme: 'default' });
                }
                
                analysisContent = validSections.map(section => {
                    let content = section.content.toString();
                    
                    // 使用marked渲染Markdown内容
                    if (typeof marked !== 'undefined') {
                        marked.setOptions({
                            breaks: true,
                            gfm: true,
                            tables: true
                        });
                        content = marked.parse(content);
                    } else {
                        content = content
                            .replace(/\\n/g, '<br>')
                            .replace(/\n/g, '<br>')
                            .replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
                            .replace(/\\r/g, '');
                    }
                    
                    return `<div class="analysis-section">
                        <h5>${section.title}</h5>
                        <div class="section-content markdown-content">${content}</div>
                    </div>`;
                }).join('');
                
                // 处理Mermaid图表
                setTimeout(() => {
                    if (typeof mermaid !== 'undefined') {
                        mermaid.run();
                    }
                }, 100);
            }
        } else {
            // 如果是字符串，直接处理
            if (typeof mermaid !== 'undefined') {
                mermaid.initialize({ startOnLoad: false, theme: 'default' });
            }
            
            if (typeof marked !== 'undefined') {
                marked.setOptions({
                    breaks: true,
                    gfm: true,
                    tables: true
                });
                analysisContent = marked.parse(contentData);
            } else {
                analysisContent = contentData
                    .replace(/\\n/g, '<br>')
                    .replace(/\n/g, '<br>')
                    .replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
                    .replace(/\\r/g, '');
            }
            
            setTimeout(() => {
                if (typeof mermaid !== 'undefined') {
                    mermaid.run();
                }
            }, 100);
        }
    }
    // 检查旧的数据格式 (fortune_content)
    else if (data.fortune_content) {
        console.log('使用 fortune_content:', data.fortune_content.substring(0, 200));
        
        let contentData = data.fortune_content;
        
        // 初始化Mermaid
        if (typeof mermaid !== 'undefined') {
            mermaid.initialize({ startOnLoad: false, theme: 'default' });
        }
        
        // 使用marked渲染Markdown内容
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,
                gfm: true,
                tables: true
            });
            
            analysisContent = marked.parse(contentData);
            
            setTimeout(() => {
                if (typeof mermaid !== 'undefined') {
                    mermaid.run();
                }
            }, 100);
        } else {
            analysisContent = contentData
                .replace(/\\n/g, '<br>')
                .replace(/\n/g, '<br>')
                .replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
                .replace(/\\r/g, '');
        }
    }
    // 处理直接字段格式
    else if (data.dayun || data.five_dayun || data.geju || data.output || data.life || data.wuxinggeju || data.shishen || data.old_dayun || data.now_dayun || data.now_dayun1) {
        const contentSections = [
            { key: 'life', title: '🌟 命理基础', content: data.life },
            { key: 'wuxinggeju', title: '⚡ 五行格局', content: data.wuxinggeju },
            { key: 'shishen', title: '🎭 十神分析', content: data.shishen },
            { key: 'geju', title: '🎯 格局特点', content: data.geju },
            { key: 'old_dayun', title: '📜 过往大运', content: data.old_dayun },
            { key: 'now_dayun', title: '🔄 当前大运', content: data.now_dayun },
            { key: 'dayun', title: '📅 大运流年', content: data.dayun },
            { key: 'five_dayun', title: '📊 近五年流年', content: data.five_dayun },
            { key: 'now_dayun1', title: '🎯 现运详析', content: data.now_dayun1 },
            { key: 'output', title: '📝 综合分析', content: data.output }
        ];
        
        const validSections = contentSections.filter(section => 
            section.content && section.content.toString().trim()
        );
        
        if (validSections.length > 0) {
            analysisContent = validSections.map(section => {
                let content = section.content.toString();
                
                // 如果内容包含Markdown格式，使用marked渲染
                if (typeof marked !== 'undefined' && (content.includes('|') || content.includes('#') || content.includes('```'))) {
                    content = marked.parse(content);
                } else {
                    content = content.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
                }
                
                return `<div class="analysis-section">
                    <h5>${section.title}</h5>
                    <div class="section-content markdown-content">${content}</div>
                </div>`;
            }).join('');
            
            // 处理Mermaid图表
            setTimeout(() => {
                if (typeof mermaid !== 'undefined') {
                    mermaid.run();
                }
            }, 100);
        } else {
            analysisContent = '<p>AI正在分析您的命理信息，请稍后...</p>';
        }
    }
    // 兼容旧的数据格式 (outputs)
    else if (data.outputs) {
        const outputData = data.outputs;
        
        const contentSections = [
            { key: 'dayun', title: '📅 大运流年', content: outputData.dayun },
            { key: 'five_dayun', title: '📊 近五年流年', content: outputData.five_dayun },
            { key: 'geju', title: '🎯 格局特点', content: outputData.geju },
            { key: 'output', title: '📝 综合分析', content: outputData.output }
        ];
        
        const validSections = contentSections.filter(section => 
            section.content && section.content.toString().trim()
        );
        
        if (validSections.length > 0) {
            analysisContent = validSections.map(section => {
                let content = section.content.toString();
                
                // 如果内容包含Markdown格式，使用marked渲染
                if (typeof marked !== 'undefined' && (content.includes('|') || content.includes('#') || content.includes('```'))) {
                    content = marked.parse(content);
                } else {
                    content = content.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
                }
                
                return `<div class="analysis-section">
                    <h5>${section.title}</h5>
                    <div class="section-content markdown-content">${content}</div>
                </div>`;
            }).join('');
            
            // 处理Mermaid图表
            setTimeout(() => {
                if (typeof mermaid !== 'undefined') {
                    mermaid.run();
                }
            }, 100);
        } else {
            analysisContent = '<p>AI正在分析您的命理信息，请稍后...</p>';
        }
    } else {
        console.log('没有找到支持的数据格式');
        analysisContent = `
            <p>调试信息：</p>
            <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px; overflow-x: auto;">
                ${JSON.stringify(data, null, 2)}
            </pre>
        `;
    }
    
    // 如果分析内容为空，显示调试信息
    if (!analysisContent || analysisContent.trim() === '') {
        analysisContent = `
            <p>调试信息：</p>
            <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px; overflow-x: auto;">
                ${JSON.stringify(data, null, 2)}
            </pre>
        `;
    }
    
    // 获取表单数据作为基本信息的备选
    const formData = getFormData();
    // 安全地获取基本信息
    const basicInfo = {
        name: data.name || formData.name || '测试者',
        birth_date: (data.basic_info && data.basic_info.birth_date) || 
                   `${formData.year}-${String(formData.month).padStart(2, '0')}-${String(formData.day).padStart(2, '0')} ${String(formData.hour).padStart(2, '0')}:${String(formData.minute).padStart(2, '0')}:00`,
        birth_place: (data.basic_info && data.basic_info.birth_place) || formData.location || '北京',
        gender: (data.basic_info && data.basic_info.gender) || (formData.gender === 'male' ? '男' : '女')
    };
    
    elements.resultContent.innerHTML = `
        <div class="result-header">
            <h3>🎋 ${basicInfo.name} 的八字命理分析报告</h3>
            <div class="basic-info">
                <p><strong>出生时间：</strong>${basicInfo.birth_date}</p>
                <p><strong>出生地点：</strong>${basicInfo.birth_place}</p>
                <p><strong>性别：</strong>${basicInfo.gender}</p>
            </div>
        </div>
        
        <div class="fortune-summary">
            <h4>🔮 AI命理分析</h4>
            <div class="summary-text markdown-content">
                ${analysisContent}
            </div>
        </div>
        
        ${data.debug_url ? `<div style="margin-top: 20px; text-align: center;"><a href="${data.debug_url}" target="_blank" style="color: #667eea;">查看调试信息</a></div>` : ''}
        
        <div class="disclaimer">
            <p><small>© 2025 AI八字算命，仅供娱乐参考，不构成人生重大决策依据。</small></p>
        </div>
    `;
}

// 处理重新算命
function handleNewReading() {
    isProcessing = false;
    elements.submitBtn.disabled = false;
    elements.resultSection.style.display = 'none';
    elements.loadingSection.style.display = 'none';
    elements.inputSection.style.display = 'block';
    elements.inputSection.scrollIntoView({ behavior: 'smooth' });
    console.log('重新开始算命');
}

// 显示错误信息
function showError(message) {
    elements.loadingSection.style.display = 'none';
    elements.resultSection.style.display = 'block';
    elements.resultContent.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 40px; color: #e74c3c;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
            <h3>😔 算命失败</h3>
            <p>${message}</p>
            <button onclick="handleNewReading()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                重新尝试
            </button>
        </div>
    `;
    elements.resultSection.scrollIntoView({ behavior: 'smooth' });
}

// 在showLoadingState函数中添加重试状态显示
function updateLoadingMessage(message) {
    const loadingText = document.querySelector('#loadingSection .loading-text');
    if (loadingText) {
        loadingText.textContent = message;
    }
}