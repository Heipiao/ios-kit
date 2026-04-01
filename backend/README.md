# iOS Kit Backend

FastAPI 后端服务，为 iOS Kit 前端提供项目管理和截图生成 API。

## 功能

- **项目管理**: 创建、读取、更新、删除项目
- **资源管理**: 上传和管理截图、Logo 等素材
- **截图配置**: 保存和加载 LayerTree 截图配置
- **AI 生成**: 使用 Anthropic Claude 生成 App 元数据和隐私政策

## 技术栈

- **FastAPI**: Web 框架
- **Supabase**: 数据库和存储
- **Anthropic API**: AI 模型服务
- **Pillow**: 图片处理
- **Playwright**: HTML 渲染和截图

## 设置步骤

### 1. 克隆仓库并进入后端目录

```bash
cd backend
```

### 2. 创建虚拟环境

```bash
python -m venv venv
source venv/bin/activate  # macOS/Linux
# 或
.\venv\Scripts\activate  # Windows
```

### 3. 安装依赖

```bash
pip install -r requirements.txt
```

### 4. 设置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 5. 设置 Supabase 数据库

在 Supabase 管理控制台运行 `supabase-schema.sql` 中的 SQL 语句：

1. 登录 [Supabase](https://supabase.com)
2. 选择你的项目
3. 进入 SQL Editor
4. 复制并运行 `supabase-schema.sql` 文件中的内容

这将创建：
- `projects` 表
- `assets` 表
- `screenshot_configs` 表
- 相关索引和 RLS 策略

### 6. 设置 Supabase Storage

在 Supabase 管理控制台创建存储桶：

1. 进入 Storage 部分
2. 创建名为 `assets` 的新存储桶
3. 设置为公共访问（允许公开读取）

或者在 SQL Editor 中运行：

```sql
-- 创建存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true);

-- 允许公开读取
CREATE POLICY "Allow public read access to assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assets');

-- 允许认证用户上传
CREATE POLICY "Allow authenticated users to upload assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'assets');
```

### 7. 启动服务器

```bash
python main.py
```

服务器将在 `http://localhost:8000` 启动。

访问 `http://localhost:8000/docs` 查看 API 文档。

## API 端点

### 项目相关

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/projects` | 获取项目列表 |
| GET | `/api/projects/{id}` | 获取项目详情 |
| POST | `/api/projects` | 创建新项目 |
| PUT | `/api/projects/{id}` | 更新项目 |
| DELETE | `/api/projects/{id}` | 删除项目 |

### 资源相关

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/assets/upload` | 上传资源 |
| DELETE | `/api/assets/{id}` | 删除资源 |

### 截图配置相关

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/projects/{id}/screenshot-config` | 获取截图配置 |
| POST | `/api/projects/{id}/screenshot-config` | 保存截图配置 |

### AI 功能

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/chat` | AI 对话 |
| POST | `/api/metadata/generate` | 生成 App 元数据 |
| POST | `/api/privacy/generate` | 生成隐私政策 |
| POST | `/api/screenshot/process` | 处理单张截图 |
| POST | `/api/screenshot/process-all` | 批量处理截图 |

## 开发

### 运行测试

```bash
pytest
```

### 代码格式化

```bash
black .
```

### 类型检查

```bash
mypy .
```

## 项目结构

```
backend/
├── main.py              # FastAPI 应用入口
├── models.py            # Pydantic 数据模型
├── database.py          # Supabase 数据库客户端
├── routes.py            # API 路由
├── supabase-schema.sql  # 数据库迁移脚本
├── requirements.txt     # Python 依赖
└── templates/           # HTML 模板
    └── screenshot.html  # 截图渲染模板
```

## 注意事项

1. **认证**: 当前使用演示用户 ID，生产环境需要实现 Supabase 认证
2. **CORS**: 已配置允许本地开发端口，生产环境需调整
3. **错误处理**: API 错误会返回适当的 HTTP 状态码和错误消息

## 许可证

MIT
