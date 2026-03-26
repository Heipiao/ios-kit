# iOS Kit 运行配置

## 环境变量配置

### 1. 后端配置 (backend/.env)

```bash
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
```

### 2. 前端配置 (frontend/.env)

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:8000
```

## 快速启动

### 方式一：分别启动

```bash
# 终端 1 - 启动后端
cd backend
source venv/bin/activate  # Mac/Linux
# 或 venv\Scripts\activate  # Windows
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 终端 2 - 启动前端
cd frontend
npm run dev
```

### 方式二：使用启动脚本

```bash
# Mac/Linux
./start.sh

# Windows
start.bat
```

## 访问地址

- 前端：http://localhost:5173
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

## Supabase 初始化

1. 访问 https://supabase.com 创建新项目
2. 进入 SQL Editor，运行 `supabase/init.sql`
3. 创建 Storage Buckets:
   - `screenshots` (公开访问)
   - `privacy-documents` (公开访问)

## 常见问题

### 1. 后端启动失败

```bash
# 检查虚拟环境
source venv/bin/activate
pip install -r requirements.txt
```

### 2. 前端构建失败

```bash
# 重新安装依赖
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 3. Playwright 报错

```bash
# 安装 Playwright 浏览器
source venv/bin/activate
playwright install chromium
```
