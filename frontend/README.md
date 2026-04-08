# iOS Kit Frontend

基于 `Next.js 14` 的前端应用，使用 `App Router`、`TypeScript` 和 `Tailwind CSS` 构建。

## 技术栈

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Supabase

## 环境变量

创建 `frontend/.env.local`:

```bash
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
PUBLIC_API_BASE_URL=http://127.0.0.1:8000
PUBLIC_SITE_URL=http://127.0.0.1:3003
```

说明:
- 当前代码通过 `next.config.js` 暴露 `PUBLIC_*` 变量到前端
- 开发环境建议使用 `.env.local`

## 本地开发

```bash
npm install
npm run dev
```

默认访问地址:

- http://127.0.0.1:3003

推荐直接使用启动脚本:

```bash
bash ./start-frontend.sh
```

默认会先清理 `.next`，避免 dev chunk 404 或热更新状态损坏。

常用可选参数:

```bash
HOST=127.0.0.1 PORT=3003 API_BASE_URL=http://127.0.0.1:8000 bash ./start-frontend.sh
CLEAN_NEXT=1 bash ./start-frontend.sh
```

## 常用命令

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
```

## 目录说明

```text
src/
├── app/          # App Router 页面与布局
├── components/   # UI 组件
└── lib/          # API 与客户端工具
```
