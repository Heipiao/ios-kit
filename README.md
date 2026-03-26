# iOS Kit 📱

一键生成 iOS App 上架材料的 AI 平台

## 功能

- 🤖 **AI 助手** - 对话式生成上架材料
- ✨ **元数据生成** - App 名称、副标题、描述、关键词
- 🖼️ **截图工厂** - HTML 渲染 + 多尺寸自动生成
- 📄 **隐私文档** - 隐私政策/用户协议生成 + 托管

## 技术栈

**前端**
- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- React Router
- Supabase Auth

**后端**
- Python FastAPI
- Supabase (PostgreSQL + Storage)
- Anthropic Claude API
- Playwright (截图渲染)

## 快速开始

### 1. 配置环境变量

#### 后端
```bash
cd backend
cp .env.example .env
# 编辑 .env 填入：
# - SUPABASE_URL
# - SUPABASE_KEY
# - ANTHROPIC_API_KEY
```

#### 前端
```bash
cd frontend
cp .env.example .env
# 编辑 .env 填入：
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_API_BASE_URL
```

### 2. 初始化 Supabase

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 运行 `supabase/init.sql` 创建表结构
3. 创建 Storage Buckets: `screenshots`, `privacy-documents`

### 3. 启动服务

#### 后端
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 前端
```bash
cd frontend
npm install
npm run dev
```

### 4. 访问应用

打开 http://localhost:5173

## 项目结构

```
ios-kit/
├── frontend/          # React 前端
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   └── types.ts
│   └── .env.example
├── backend/           # FastAPI 后端
│   ├── main.py
│   └── .env.example
├── supabase/          # 数据库脚本
│   └── init.sql
└── PRD.md            # 产品需求文档
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| /health | GET | 健康检查 |
| /api/chat | POST | AI 助手对话 |
| /api/metadata/generate | POST | 生成元数据 |
| /api/privacy/generate | POST | 生成隐私政策 |
| /api/screenshot/process | POST | 处理截图 |

## 开发路线图

- [x] 项目初始化
- [x] 用户认证
- [x] AI 助手基础对话
- [x] Layout 框架
- [ ] 项目管理 CRUD
- [ ] 截图工厂 (HTML 渲染)
- [ ] 隐私文档托管
- [ ] 支付集成

## License

MIT
