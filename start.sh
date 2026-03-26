#!/bin/bash

# iOS Kit 启动脚本 (Mac/Linux)

echo "🚀 启动 iOS Kit..."

# 检查后端虚拟环境
if [ ! -d "backend/venv" ]; then
    echo "❌ 后端虚拟环境不存在，请先运行："
    echo "   cd backend && python3 -m venv venv"
    exit 1
fi

# 检查前端 node_modules
if [ ! -d "frontend/node_modules" ]; then
    echo "❌ 前端依赖未安装，请先运行："
    echo "   cd frontend && npm install"
    exit 1
fi

# 检查 .env 文件
if [ ! -f "backend/.env" ]; then
    echo "⚠️  后端 .env 文件不存在，请复制 .env.example 并配置"
    cp backend/.env.example backend/.env 2>/dev/null || true
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  前端 .env 文件不存在，请复制 .env.example 并配置"
    cp frontend/.env.example frontend/.env 2>/dev/null || true
fi

# 启动后端
echo "📦 启动后端服务..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 2

# 启动前端
echo "🎨 启动前端服务..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 服务已启动！"
echo ""
echo "📱 前端地址：http://localhost:5173"
echo "🔌 后端地址：http://localhost:8000"
echo "📖 API 文档：http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待中断信号
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo '👋 服务已停止'; exit" INT
