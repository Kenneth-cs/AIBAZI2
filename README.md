# AI八字算命网页应用

一个现代化的PC端八字算命网页应用，集成coze工作流进行AI命理分析。

## 🌟 功能特点

- **现代化UI设计**: 采用渐变背景、毛玻璃效果、动画交互
- **完整的用户输入表单**: 包含姓名、性别、出生时间地点等信息
- **实时表单验证**: 防止用户输入错误的日期时间
- **美观的加载动画**: 太极图旋转、进度条动画
- **详细的命理报告**: 八字排盘、五行分析、命理综述、人生建议
- **响应式设计**: 适配PC、平板、手机等不同设备
- **coze工作流集成**: 支持调用外部AI服务

## 📁 文件结构

```
AILife/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── script.js           # JavaScript逻辑
├── config-example.js   # coze工作流配置示例
└── README.md          # 说明文档
```

## 🚀 快速开始

### 1. 下载文件

将所有文件下载到您的本地目录。

### 2. coze工作流已配置

应用已配置您的coze工作流：

- **工作流URL**: https://www.coze.cn/work_flow?space_id=7469754577143726134&workflow_id=7527326304544161826
- **API端点**: https://www.coze.cn/open/playground/workflow_run
- **工作流ID**: 7527326304544161826
- **空间ID**: 7469754577143726134

### 3. 运行应用

直接在浏览器中打开 `index.html` 文件即可使用。

## 🔧 coze工作流集成

### 已配置的API接口

应用会向您的coze工作流发送POST请求，请求格式如下：

**请求URL:**
```
https://www.coze.cn/open/playground/workflow_run?workflow_id=7527326304544161826&space_id=7469754577143726134
```

**请求头 (Headers):**
```
Content-Type: application/json
Authorization: Bearer pat_ZjwpkkmaoQIY20msu1C6exqi0wdscfgGSZvce2hHTdi7Va2Tid33AeFmd8zsYowA
Accept: application/json
```

**请求体 (Request Body):**
```json
{
    "inputs": {
        "name": "张三",
        "gender": "男",
        "birth_place": "北京市朝阳区",
        "birth_datetime": "1990-05-15 14:30:00",
        "year": 1990,
        "month": 5,
        "day": 15,
        "hour": 14,
        "minute": 30,
        "second": 0
    }
}
```

**期望的响应格式 (Response):**
```json
{
    "success": true,
    "data": {
        "name": "张三",
        "basic_info": {
            "birth_date": "1990-05-15 14:30:00",
            "birth_place": "北京市朝阳区",
            "gender": "男"
        },
        "bazi_analysis": {
            "year_pillar": "庚午",
            "month_pillar": "辛巳",
            "day_pillar": "甲寅",
            "hour_pillar": "辛未",
            "five_elements": {
                "wood": 2,
                "fire": 3,
                "earth": 2,
                "metal": 2,
                "water": 1
            }
        },
        "fortune_summary": "详细的命理分析文本...",
        "recommendations": [
            "建议1",
            "建议2",
            "建议3"
        ]
    }
}
```

### 备用演示模式

如果coze工作流调用失败，应用会自动使用模拟数据进行演示。

## 🎨 样式定制

### 修改配色方案

编辑 `styles.css` 文件中的CSS变量来更改配色：

```css
/* 主色调渐变 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 按钮颜色 */
.submit-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### 自定义动画效果

可以调整旋转动画速度：

```css
@keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.logo i {
    animation: rotate 10s linear infinite; /* 修改10s来调整速度 */
}
```

## 📱 响应式设计

应用已经适配不同设备尺寸：

- **PC端**: 1200px以上，完整布局
- **平板端**: 768px-1200px，网格自适应
- **手机端**: 768px以下，单列布局

## 🛠️ 部署指南

### 1. 静态部署

由于这是纯前端应用，可以部署到任何静态网站托管服务：

- **GitHub Pages**: 免费，适合个人项目
- **Netlify**: 免费额度，支持自定义域名
- **Vercel**: 快速部署，自动HTTPS
- **阿里云OSS**: 国内访问速度快

### 2. 服务器部署

也可以部署到您的服务器：

1. 将文件上传到服务器的web目录
2. 配置nginx或apache指向该目录
3. 确保支持HTTPS（推荐）

### 3. CDN加速

对于生产环境，建议使用CDN加速：

```html
<!-- 替换本地字体和图标库 -->
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.0.0/css/all.min.css" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

## 🔒 安全注意事项

1. **API密钥安全**: 当前配置仅用于演示，生产环境请使用环境变量
2. **数据验证**: 在coze工作流中也要对输入数据进行验证
3. **CORS设置**: 确保您的API支持跨域请求
4. **HTTPS部署**: 生产环境务必使用HTTPS

## 🐛 常见问题

### Q: 提交表单后没有反应？
A: 检查浏览器控制台的错误信息，通常是API配置问题。

### Q: 样式显示不正常？
A: 确保网络连接正常，CSS文件和字体库能够正常加载。

### Q: 在手机上显示有问题？
A: 清除浏览器缓存，或尝试在无痕模式下访问。

### Q: coze工作流调用失败？
A: 检查API端点地址、密钥配置，以及网络连接状态。

## 📝 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📞 联系方式

如有疑问，请通过以下方式联系：

- 邮箱: your-email@example.com
- GitHub: [您的GitHub用户名]

---

**免责声明**: 此应用仅供娱乐参考，不构成人生重大决策的依据。命运掌握在自己手中，努力奋斗才是成功的关键。 