#!/bin/bash

echo "🚀 启动AI八字算命应用..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，使用Python服务器..."
    echo "📝 请访问: http://localhost:8000"
    echo "🔧 如果遇到CORS问题，请安装Node.js后使用: npm install && npm start"
    python3 -m http.server 8000
    exit 0
fi

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
fi

echo "✅ 启动Node.js服务器..."
echo "🌐 主应用: http://localhost:3000"
echo "🧪 测试页面: http://localhost:3000/test-api.html"
echo ""
echo "按 Ctrl+C 停止服务器"

npm start 