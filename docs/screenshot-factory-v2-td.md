# 截图工厂 V2 技术设计文档

## 1. 概述

### 1.1 目标

将现有「语义 Config → 模板引擎展开」的截图生成流程升级为 **端到端 LayerTree 流水线**：

- 用户在创建项目时上传素材（截图、Logo 等）
- 大模型直接生成 `AiLayerTreeConfig`（每页一张 LayerTree）
- 前端提供可视化编辑器支持用户微调
- 导出符合 App Store 要求的截图

### 1.2 核心变更

| 旧方案 | 新方案 |
|--------|--------|
| 语义 Config（高层描述） | AiLayerTreeConfig（完整图层树） |
| 模板引擎展开渲染 | Konva 直接按 LayerTree 渲染 |
| 不可编辑，AI 生成即最终结果 | 可视化编辑器，AI 生成后可微调 |
| HTML + Playwright 截图 | Konva 离屏渲染导出 PNG |
| 无状态，不保留中间结果 | 项目级持久化存储（AI 原始 + 用户编辑后） |
| 在截图页面内上传素材 | 创建项目时统一上传，多处复用 |

---

## 1.3 系统架构

### 1.3.1 页面结构

```
┌─────────────────────────────────────────────────────────────┐
│                      页面架构                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  /dashboard              → 项目列表（所有已创建的项目）        │
│                                                             │
│  /projects/new           → 创建新项目                        │
│  ├─ 填写基本信息（App Name, Description）                   │
│  ├─ 上传截图（1-10 张）                                      │
│  ├─ 上传 Logo（可选）                                        │
│  └─ 选择目标设备类型                                        │
│                                                             │
│  /projects/[id]          → 项目详情                          │
│  ├─ 基本信息展示                                             │
│  ├─ 已上传的素材列表                                         │
│  └─ 进入各编辑模块                                           │
│                                                             │
│  /projects/[id]/screenshots  → 截图编辑器                    │
│  /projects/[id]/metadata     → App Store 元数据编辑           │
│  /projects/[id]/privacy      → 隐私政策生成                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3.2 数据流

```
创建项目时：
┌─────────────────────────────────────────────────────────────┐
│  Project (创建时)                                           │
│  ├── name: string                                           │
│  ├── description: string                                    │
│  ├── deviceType: string                                     │
│  ├── screenshots: Asset[]  ← 上传的截图（存到 Supabase）    │
│  └── logo: Asset?          ← 可选 Logo                       │
└─────────────────────────────────────────────────────────────┘
                            ↓ 保存到 Supabase
┌─────────────────────────────────────────────────────────────┐
│  ScreenshotConfig (编辑时)                                  │
│  ├── projectId: string                                      │
│  ├── aiConfig: AiLayerTreeConfig  ← AI 生成的原始配置        │
│  ├── editedConfig: AiLayerTreeConfig ← 用户编辑后的配置     │
│  └── exportedPngUrls: string[]    ← 导出的 PNG 链接          │
└─────────────────────────────────────────────────────────────┘
```

### 1.3.3 资源复用

```
┌─────────────────────────────────────────────────────────────┐
│                    资源库（Assets）                          │
│                                                             │
│  创建项目时上传的素材 → 存到 Supabase Storage                │
│  ├── screenshots/proj-abc/screenshot-1.png                 │
│  ├── screenshots/proj-abc/screenshot-2.png                 │
│  └── logos/proj-abc/logo.png                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   各个编辑模块复用资源                        │
│                                                             │
│  截图编辑器  ← 读取已上传的截图 → 生成 LayerTree              │
│  元数据生成  ← 读取 App Name/Description → 生成文案          │
│  隐私政策    ← 读取项目信息 → 生成政策文档                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 数据结构设计

### 2.1 项目与资源（Projects & Assets）

#### Project（项目）

```typescript
interface Project {
  id: string;           // 项目唯一 ID
  name: string;         // App 名称
  description: string;  // App 描述
  deviceType: string;   // 设备类型，如 "iphone_67"
  createdAt: string;    // 创建时间
  updatedAt: string;    // 最后更新时间
}
```

#### Asset（资源）

```typescript
interface Asset {
  id: string;           // 资源唯一 ID
  projectId: string;    // 所属项目 ID
  type: 'screenshot' | 'logo' | 'other';
  storageUrl: string;   // Supabase Storage URL
  filename: string;     // 原始文件名
  width?: number;       // 图片宽度（可选）
  height?: number;      // 图片高度（可选）
  createdAt: string;    // 创建时间
}
```

#### ScreenshotConfig（截图配置）

```typescript
interface ScreenshotConfig {
  id: string;                    // 配置 ID
  projectId: string;             // 所属项目 ID
  version: 'ai_original' | 'user_edited';  // 配置版本
  config: AiLayerTreeConfig;     // LayerTree 配置（JSON）
  exportedPngUrls?: string[];    // 导出的 PNG URL 列表
  createdAt: string;             // 创建时间
  updatedAt: string;             // 最后更新时间
}
```

### 2.2 LayerTree 配置

### 2.2.1 顶层配置

### 2.1 顶层配置

```typescript
interface AiLayerTreeConfig {
  version: "1.0";
  exportedPngSize: { w: number; h: number; };  // 导出尺寸，如 1206×2622

  // 设备框架全局配置
  device?: {
    frameRef?: string;  // 如 "iphone-17-pro-silver"
  };

  slides: SlideConfig[];  // 多页截图，至少 1 页
}
```

### 2.2 Slide（单页截图）

```typescript
interface SlideConfig {
  slideId: string;      // 唯一 ID，如 "slide-1"
  name?: string;        // 页面名称，如 "首页"
  layers: Layer[];      // 从底到顶的图层栈
}
```

### 2.3 图层基础字段

```typescript
interface BaseLayer {
  id: string;           // 图层唯一 ID
  type: "background" | "image" | "text" | "sticker";
  visible: boolean;     // 可见性
  x: number;            // 左上角 X（相对于 exportedPngSize）
  y: number;            // 左上角 Y
  width: number;        // 图层宽度
  height: number;       // 图层高度
  rotation?: number;    // 旋转角度 (0-360)
  opacity?: number;     // 透明度 (0-1)
  zIndex: number;       // 层级顺序
}
```

### 2.4 四种图层类型

#### BackgroundLayer（背景层）

```typescript
interface BackgroundLayer extends BaseLayer {
  type: "background";
  bgType: "solid" | "gradient" | "image";
  color?: string;                                   // 纯色，如 "#667eea"
  gradient?: {
    type: "linear" | "radial";
    stops: { offset: number; color: string; }[];
    angle?: number;                                 // 渐变角度
  };
  assetRef?: string;                                // 背景图资源 ID
}
```

#### ImageLayer（图片层/设备截图）

```typescript
interface ImageLayer extends BaseLayer {
  type: "image";
  assetRef: string;             // 用户上传截图的资源 ID

  fit: "cover" | "contain" | "fill";
  cornerRadius?: number;        // 圆角

  // 设备边框（可选）
  showDeviceFrame?: boolean;    // 是否显示设备边框
  frameRef?: string;            // frame 资源 ID，如 "iphone-17-pro-silver"

  // 用户微调（前端专用）
  imageTransform?: {
    scale: number;
    translateX?: number;
    translateY?: number;
  };
}
```

#### TextLayer（文字层）

```typescript
interface TextLayer extends BaseLayer {
  type: "text";
  content: string;              // 文案内容
  fontFamily: string;           // 字体
  fontSize: number;             // 字号
  fontWeight: "normal" | "bold" | "600" | "700";
  color: string;                // 颜色
  align: "left" | "center" | "right";
  lineHeight?: number;
  maxLines?: number;
  textShadow?: {
    blur: number;
    color: string;
    offsetX: number;
    offsetY: number;
  };
}
```

#### StickerLayer（贴纸层）

```typescript
interface StickerLayer extends BaseLayer {
  type: "sticker";
  stickerId: string;            // 贴纸 ID，如 "5g-badge", "ai-chip"
  assetRef?: string;            // 贴纸图片资源 ID
}
```

### 2.5 示例 JSON

```json
{
  "version": "1.0",
  "exportedPngSize": { "w": 1206, "h": 2622 },
  "device": {
    "frameRef": "iphone-17-pro-silver"
  },
  "slides": [
    {
      "slideId": "slide-1",
      "name": "首页",
      "layers": [
        {
          "id": "bg-1",
          "type": "background",
          "visible": true,
          "zIndex": 0,
          "x": 0, "y": 0, "width": 1206, "height": 2622,
          "bgType": "gradient",
          "gradient": {
            "type": "linear",
            "stops": [
              { "offset": 0, "color": "#667eea" },
              { "offset": 1, "color": "#764ba2" }
            ],
            "angle": 135
          }
        },
        {
          "id": "img-1",
          "type": "image",
          "visible": true,
          "zIndex": 1,
          "x": 14, "y": 14, "width": 412, "height": 878,
          "assetRef": "user-upload-001",
          "fit": "cover",
          "cornerRadius": 47,
          "showDeviceFrame": true,
          "frameRef": "iphone-17-pro-silver"
        },
        {
          "id": "text-1",
          "type": "text",
          "visible": true,
          "zIndex": 2,
          "x": 100, "y": 2400, "width": 1006, "height": 100,
          "content": "智能助手，随时陪伴",
          "fontFamily": "SF Pro Display",
          "fontSize": 42,
          "fontWeight": "600",
          "color": "#ffffff",
          "align": "center"
        }
      ]
    }
  ]
}
```

---

## 3. 后端设计

### 3.1 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      后端 API                                │
├─────────────────────────────────────────────────────────────┤
│  POST /api/screenshot/generate                              │
│    → AI 生成 LayerTree（输入：用户描述 + 上传素材）            │
│                                                              │
│  POST /api/screenshot/validate                              │
│    → Schema 校验（输入：AiLayerTreeConfig）                  │
│                                                              │
│  POST /api/screenshot/export                                │
│    → 导出 PNG（输入：AiLayerTreeConfig，返回：PNG base64）   │
│                                                              │
│  GET  /api/screenshot/:projectId                            │
│    → 获取项目（返回：AI 原始 Config + 用户编辑后 Config）      │
│                                                              │
│  POST /api/screenshot/:projectId/save                       │
│    → 保存项目（输入：AiLayerTreeConfig）                     │
├─────────────────────────────────────────────────────────────┤
│  Frame 资源配置表（启动时加载）                               │
│  Asset 存储服务（图片上传/引用）                              │
│  Sticker 资源库（贴纸 ID → 图片映射）                          │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Frame 资源配置表

#### 3.2.1 预定义 Frame

```typescript
interface FrameConfig {
  id: string;                   // 如 "iphone-17-pro-silver"
  name: string;                 // 如 "iPhone 17 Pro Silver"
  pngUrl: string;               // PNG 资源 URL
  screenRect: {                 // 屏幕开窗 bbox（从 SVG mask 提取）
    x: number;
    y: number;
    w: number;
    h: number;
  };
  deviceSize: {                 // Frame 原始尺寸
    w: number;
    h: number;
  };
}

// 启动时加载的 Frame 注册表
const FRAME_REGISTRY: Record<string, FrameConfig> = {
  "iphone-17-pro-silver": {
    id: "iphone-17-pro-silver",
    name: "iPhone 17 Pro Silver",
    pngUrl: "/assets/frames/iphone-17-pro-silver.png",
    screenRect: { x: 14, y: 14, w: 412, h: 878 },
    deviceSize: { w: 440, h: 916 }
  }
};
```

#### 3.2.2 SVG → PNG 预转换脚本

```bash
# 工具脚本：将 asset/ 目录下的 SVG 转为 PNG 并提取 screenRect
python scripts/convert-frame-svg2png.py
```

转换逻辑：
1. 解析 SVG 的 `<mask>` 元素，提取路径
2. 计算路径的包围盒 (bbox) 作为 `screenRect`
3. 使用 `rsvg-convert` 或 `sharp` 将 SVG 渲染为 PNG

#### 3.2.3 App Store 导出尺寸配置

```typescript
interface ExportPreset {
  id: string;                   // 如 "iphone_65"
  name: string;                 // 如 "iPhone 6.5 英寸"
  width: number;
  height: number;
  requiredByAppStore: boolean;  // 是否为 App Store 必需尺寸
}

const EXPORT_PRESETS: ExportPreset[] = [
  { id: "iphone_65", name: "iPhone 6.5 英寸", width: 1284, height: 2778, requiredByAppStore: true },
  { id: "iphone_67", name: "iPhone 6.7 英寸", width: 1290, height: 2796, requiredByAppStore: true },
  { id: "ipad_129", name: "iPad 12.9 英寸", width: 2048, height: 2732, requiredByAppStore: false },
  // ...
];
```

### 3.3 API 设计

#### 3.3.1 项目相关 API

**创建项目**
```
POST /api/projects

Request:
{
  "name": string,           // App 名称
  "description": string,    // App 描述
  "deviceType": string,     // 设备类型
  "screenshotIds": string[], // 截图 Asset ID 列表
  "logoId"?: string         // Logo Asset ID（可选）
}

Response:
{
  "project": Project,
  "assets": Asset[]
}
```

**获取项目列表**
```
GET /api/projects

Response:
{
  "projects": Project[]
}
```

**获取项目详情**
```
GET /api/projects/:id

Response:
{
  "project": Project,
  "assets": Asset[],
  "screenshotConfig"?: {
    "aiRaw": AiLayerTreeConfig,
    "userEdited": AiLayerTreeConfig,
    "exportedPngs": string[]
  }
}
```

**更新项目**
```
PUT /api/projects/:id

Request:
{
  "name"?: string,
  "description"?: string,
  "deviceType"?: string
}

Response: { "project": Project }
```

**删除项目**
```
DELETE /api/projects/:id

Response: { "success": true }
```

#### 3.3.2 资源相关 API

**上传资源**
```
POST /api/assets/upload

Request: multipart/form-data
- file: File
- type: 'screenshot' | 'logo'
- projectId?: string  // 如果已关联项目

Response:
{
  "asset": Asset,
  "storageUrl": string
}
```

**删除资源**
```
DELETE /api/assets/:id

Response: { "success": true }
```

#### 3.3.3 AI 生成 LayerTree

```
POST /api/screenshot/generate

Request:
{
  "prompt": "生成一个 iOS 社交 App 的截图，展示聊天界面",
  "images": ["base64..."],      // 用户上传的素材
  "exportPreset": "iphone_65",  // 目标尺寸
  "frameRef": "iphone-17-pro-silver"  // 可选，指定边框
}

Response:
{
  "projectId": "proj-xxx",
  "config": AiLayerTreeConfig,  // AI 生成的完整配置
  "aiRaw": true                 // 标记为 AI 原始输出
}
```

#### 3.3.2 Schema 校验

```
POST /api/screenshot/validate

Request: AiLayerTreeConfig

Response:
{
  "valid": boolean,
  "errors": [
    {
      "path": "slides[0].layers[1].assetRef",
      "message": "assetRef 不能为空"
    }
  ],
  "warnings": [
    {
      "path": "slides[0].layers[2].content",
      "message": "文案长度 52 字，建议不超过 30 字"
    }
  ]
}
```

#### 3.3.3 Normalizer 补全

```
POST /api/screenshot/normalize

Request: AiLayerTreeConfig

Response: AiLayerTreeConfig  // 已补全缺省值

补全规则：
- slideId 缺失 → 自动生成 "slide-{index}"
- 文案 trim → 去除前后空格
- invalid template/frameRef → 回退到默认值
- 剔除非法节点（类型错误、必填字段缺失）
- 修补非法节点（缺省坐标、尺寸）
```

#### 3.3.4 导出 PNG

```
POST /api/screenshot/export

Request:
{
  "config": AiLayerTreeConfig,
  "slideId": "slide-1"  // 导出单页，或留空导出全部
}

Response:
{
  "images": [
    {
      "slideId": "slide-1",
      "imageBase64": "data:image/png;base64,..."
    }
  ]
}
```

**注意**：导出功能可以由前端 Konva 直接完成，后端导出作为备选方案。

#### 3.3.5 保存项目

```
POST /api/screenshot/:projectId/save

Request:
{
  "config": AiLayerTreeConfig,
  "isAiRaw": boolean  // 是否为 AI 原始版本
}

Response: { "success": true, "savedAt": "2026-04-01T12:00:00Z" }
```

#### 3.3.6 获取项目

```
GET /api/screenshot/:projectId

Response:
{
  "projectId": "proj-xxx",
  "aiRawConfig": AiLayerTreeConfig,     // AI 原始生成版本
  "userEditedConfig": AiLayerTreeConfig, // 用户编辑后版本
  "lastModified": "2026-04-01T12:00:00Z"
}
```

### 3.4 Schema 校验器

```typescript
interface ValidationError {
  path: string;       // JSON Path，如 "slides[0].layers[1].assetRef"
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// 校验规则
function validate(config: AiLayerTreeConfig): ValidationResult {
  // 1. 结构校验：version, exportedPngSize, slides 必填
  // 2. 类型校验：各字段类型是否正确
  // 3. 白名单校验：
  //    - type ∈ ["background", "image", "text", "sticker"]
  //    - bgType ∈ ["solid", "gradient", "image"]
  //    - fit ∈ ["cover", "contain", "fill"]
  //    - frameRef ∈ FRAME_REGISTRY.keys()
  // 4. 文案长度校验：text.content.length ≤ 50
  // 5. Slide 数量校验：1 ≤ slides.length ≤ 10
  // 6. 坐标范围校验：x, y ≥ 0; width, height > 0
  // 7. 层级唯一性：zIndex 不重复（或前端处理）
}
```

### 3.5 Normalizer

```typescript
function normalize(config: AiLayerTreeConfig): AiLayerTreeConfig {
  // 1. 缺省 slideId 补全
  config.slides.forEach((slide, i) => {
    if (!slide.slideId) slide.slideId = `slide-${i + 1}`;
    if (!slide.name) slide.name = `第${i + 1}页`;
  });

  // 2. 文案 trim
  config.slides.forEach(slide => {
    slide.layers.forEach(layer => {
      if (layer.type === "text") {
        layer.content = layer.content.trim();
      }
    });
  });

  // 3. 无效 frameRef 回退
  const defaultFrame = Object.keys(FRAME_REGISTRY)[0];
  config.slides.forEach(slide => {
    slide.layers.forEach(layer => {
      if (layer.type === "image" && layer.frameRef) {
        if (!FRAME_REGISTRY[layer.frameRef]) {
          layer.frameRef = defaultFrame;
        }
      }
    });
  });

  // 4. 缺省坐标/尺寸修补
  config.slides.forEach(slide => {
    slide.layers.forEach(layer => {
      if (layer.x === undefined) layer.x = 0;
      if (layer.y === undefined) layer.y = 0;
      if (layer.width === undefined) layer.width = config.exportedPngSize.w;
      if (layer.height === undefined) layer.height = config.exportedPngSize.h;
      if (layer.visible === undefined) layer.visible = true;
      if (layer.opacity === undefined) layer.opacity = 1;
    });
  });

  // 5. 剔除非法节点（type 不存在、必填字段缺失）
  config.slides.forEach(slide => {
    slide.layers = slide.layers.filter(layer => {
      if (!["background", "image", "text", "sticker"].includes(layer.type)) {
        return false;
      }
      if (layer.type === "image" && !layer.assetRef) {
        return false;
      }
      if (layer.type === "text" && !layer.content) {
        return false;
      }
      return true;
    });
  });

  return config;
}
```

### 3.6 存储策略

#### 3.6.1 数据库 Schema

```sql
CREATE TABLE screenshot_projects (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE screenshot_versions (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  version_type ENUM('ai_raw', 'user_edited') NOT NULL,
  config JSON NOT NULL,  -- AiLayerTreeConfig
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES screenshot_projects(id)
);

CREATE TABLE screenshot_assets (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  mime_type VARCHAR(64) NOT NULL,
  file_size INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.6.2 存储逻辑

- **AI 生成后**：保存 `version_type = 'ai_raw'`
- **用户编辑后保存**：保存 `version_type = 'user_edited'`
- **追溯历史**：查询同一 `project_id` 的所有版本

---

## 4. 前端设计

### 4.1 页面结构

```
┌─────────────────────────────────────────────────────────────┐
│                      页面架构                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  /dashboard              → 项目列表（所有已创建的项目）        │
│                                                             │
│  /projects/new           → 创建新项目                        │
│  ├─ 填写基本信息（App Name, Description）                   │
│  ├─ 上传截图（1-10 张）                                      │
│  ├─ 上传 Logo（可选）                                        │
│  └─ 选择目标设备类型                                        │
│                                                             │
│  /projects/[id]          → 项目详情                          │
│  ├─ 基本信息展示                                             │
│  ├─ 已上传的素材列表                                         │
│  └─ 进入各编辑模块                                           │
│                                                             │
│  /projects/[id]/screenshots  → 截图编辑器                    │
│  /projects/[id]/metadata     → App Store 元数据编辑           │
│  /projects/[id]/privacy      → 隐私政策生成                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 目录结构

```
frontend/src/
├── app/
│   ├── dashboard/
│   │   └── page.tsx              # 项目列表页
│   ├── projects/
│   │   ├── new/
│   │   │   └── page.tsx          # 创建新项目
│   │   ├── [id]/
│   │   │   ├── page.tsx          # 项目详情页
│   │   │   ├── screenshots/
│   │   │   │   └── page.tsx      # 截图编辑器
│   │   │   ├── metadata/
│   │   │   │   └── page.tsx      # 元数据编辑
│   │   │   └── privacy/
│   │   │       └── page.tsx      # 隐私政策生成
│   │   └── page.tsx              # 重定向到 dashboard
│   └── ...
├── components/
│   ├── projects/
│   │   ├── ProjectList.tsx       # 项目列表组件
│   │   ├── ProjectForm.tsx       # 项目创建表单
│   │   └── ProjectCard.tsx       # 项目卡片
│   ├── screenshot-editor/
│   │   ├── EditorLayout.tsx      # 主布局
│   │   ├── CanvasPanel.tsx       # Konva 画布
│   │   ├── LayerList.tsx         # 图层列表
│   │   ├── PropertyPanel.tsx     # 属性面板
│   │   ├── SlideTabs.tsx         # Slide 页签栏
│   │   └── Toolbar.tsx           # 顶部工具栏
│   └── konva/
│       ├── KonvaStage.tsx        # Konva 容器
│       ├── LayerRenderer.tsx     # 图层渲染器
│       ├── BackgroundLayer.tsx   # 背景层渲染
│       ├── ImageLayer.tsx        # 图片层渲染
│       ├── TextLayer.tsx         # 文字层渲染
│       └── StickerLayer.tsx      # 贴纸层渲染
├── hooks/
│   ├── useProject.ts             # 项目相关操作
│   ├── useLayerTree.ts           # LayerTree 状态管理
│   ├── useSelection.ts           # 选中状态管理
│   └── useExport.ts              # 导出逻辑
├── lib/
│   ├── types/
│   │   ├── project.ts            # Project, Asset 类型
│   │   └── layer-tree.ts         # AiLayerTreeConfig 类型
│   ├── api/
│   │   ├── projects.ts           # 项目 API 调用
│   │   ├── assets.ts             # 资源 API 调用
│   │   └── screenshot.ts         # 截图 API 调用
│   └── utils/
│       ├── frame-registry.ts     # Frame 配置表
│       ├── layer-ops.ts          # 图层操作
│       └── export.ts             # PNG 导出工具
└── ...
```

### 4.3 Konva 渲染引擎

#### 4.3.1 渲染顺序

```typescript
// Konva Stage
<Stage width={1206} height={2622}>
  <Layer>
    {/* 按 zIndex 排序后的图层 */}
    {sortedLayers.map(layer => (
      <LayerRenderer key={layer.id} layer={layer} />
    ))}
  </Layer>
</Stage>
```

#### 4.3.2 各图层渲染实现

**BackgroundLayer**

```typescript
function BackgroundLayer({ layer }: { layer: BackgroundLayer }) {
  if (layer.bgType === "solid") {
    return <Rect fill={layer.color} {...layerProps} />;
  }
  if (layer.bgType === "gradient") {
    // Konva 渐变需要手动创建
    const gradient = new Konva.LinearGradient({ ... });
    return <Rect fillPattern={gradient} {...layerProps} />;
  }
  if (layer.bgType === "image" && layer.assetRef) {
    return <Image image={loadImage(layer.assetRef)} {...layerProps} />;
  }
}
```

**ImageLayer（重点）**

```typescript
function ImageLayer({ layer }: { layer: ImageLayer }) {
  const frameConfig = layer.frameRef ? FRAME_REGISTRY[layer.frameRef] : null;

  // 1. 创建离屏 Canvas 用于预合成
  const offscreenCanvas = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = layer.width;
    canvas.height = layer.height;
    const ctx = canvas.getContext('2d')!;

    // 2. 圆角 clip
    ctx.beginPath();
    ctx.roundRect(0, 0, layer.width, layer.height, layer.cornerRadius || 0);
    ctx.clip();

    // 3. 绘制用户截图（cover + imageTransform）
    const img = loadImage(layer.assetRef);
    const { scale, translateX, translateY } = layer.imageTransform || { scale: 1 };

    // cover 逻辑：保持宽高比，填满容器
    const imgRatio = img.width / img.height;
    const containerRatio = layer.width / layer.height;
    let drawW, drawH, offsetX, offsetY;

    if (imgRatio > containerRatio) {
      drawH = layer.height / scale;
      drawW = drawH * imgRatio;
      offsetX = -(drawW - layer.width) / 2 + (translateX || 0);
      offsetY = translateY || 0;
    } else {
      drawW = layer.width / scale;
      drawH = drawW / imgRatio;
      offsetX = translateX || 0;
      offsetY = -(drawH - layer.height) / 2 + (translateY || 0);
    }

    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

    // 4. 如果有 device frame，叠 frame PNG
    if (layer.showDeviceFrame && frameConfig) {
      const frameImg = loadImage(frameConfig.pngUrl);

      // 计算缩放比例（frame 原始尺寸 → 渲染尺寸）
      const scaleX = layer.width / frameConfig.deviceSize.w;
      const scaleY = layer.height / frameConfig.deviceSize.h;
      const scale = Math.min(scaleX, scaleY);

      // 居中绘制
      const drawFrameW = frameConfig.deviceSize.w * scale;
      const drawFrameH = frameConfig.deviceSize.h * scale;
      const frameX = (layer.width - drawFrameW) / 2;
      const frameY = (layer.height - drawFrameH) / 2;

      ctx.drawImage(frameImg, frameX, frameY, drawFrameW, drawFrameH);
    }

    return canvas;
  }, [layer]);

  return <Image image={offscreenCanvas} {...layerProps} />;
}
```

**TextLayer**

```typescript
function TextLayer({ layer }: { layer: TextLayer }) {
  return (
    <Text
      text={layer.content}
      fontFamily={layer.fontFamily}
      fontSize={layer.fontSize}
      fontStyle={layer.fontWeight === "bold" ? "bold" : "normal"}
      fill={layer.color}
      align={layer.align}
      lineHeight={layer.lineHeight}
      {...layerProps}
    />
  );
}
```

**StickerLayer**

```typescript
function StickerLayer({ layer }: { layer: StickerLayer }) {
  const stickerImg = STICKER_REGISTRY[layer.stickerId];
  return <Image image={loadImage(stickerImg)} {...layerProps} />;
}
```

### 4.4 图层列表

```typescript
function LayerList({ layers, selectedId, onSelect, onToggleVisible, onDelete, onMoveUp, onMoveDown }) {
  return (
    <div className="layer-list">
      {layers.slice().reverse().map((layer, index) => (  // 反向显示，顶层在上
        <div
          key={layer.id}
          className={`layer-item ${selectedId === layer.id ? 'selected' : ''}`}
          onClick={() => onSelect(layer.id)}
        >
          <span className="layer-icon">{getIconForType(layer.type)}</span>
          <span className="layer-name">{getLayerName(layer)}</span>
          <button onClick={(e) => { e.stopPropagation(); onToggleVisible(layer.id); }}>
            {layer.visible ? '👁' : '🚫'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMoveUp(index); }}>↑</button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown(index); }}>↓</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(layer.id); }}>🗑</button>
        </div>
      ))}
    </div>
  );
}
```

### 4.5 属性面板

```typescript
function PropertyPanel({ layer, onChange }) {
  if (!layer) return <div className="empty">请选择图层</div>;

  return (
    <div className="property-panel">
      <h3>{getLayerName(layer)}</h3>

      {/* 通用属性 */}
      <Section title="位置">
        <NumberInput label="X" value={layer.x} onChange={v => onChange({ ...layer, x: v })} />
        <NumberInput label="Y" value={layer.y} onChange={v => onChange({ ...layer, y: v })} />
        <NumberInput label="宽" value={layer.width} onChange={v => onChange({ ...layer, width: v })} />
        <NumberInput label="高" value={layer.height} onChange={v => onChange({ ...layer, height: v })} />
      </Section>

      <Section title="变换">
        <Slider label="旋转" value={layer.rotation || 0} onChange={v => onChange({ ...layer, rotation: v })} />
        <Slider label="透明度" min={0} max={1} step={0.01} value={layer.opacity || 1} onChange={v => onChange({ ...layer, opacity: v })} />
      </Section>

      {/* 类型特定属性 */}
      {layer.type === "background" && (
        <Section title="背景">
          <Select label="类型" value={layer.bgType} onChange={v => onChange({ ...layer, bgType: v })} />
          {layer.bgType === "solid" && (
            <ColorInput label="颜色" value={layer.color} onChange={v => onChange({ ...layer, color: v })} />
          )}
          {layer.bgType === "gradient" && (
            <GradientEditor value={layer.gradient} onChange={v => onChange({ ...layer, gradient: v })} />
          )}
        </Section>
      )}

      {layer.type === "image" && (
        <Section title="图片">
          <FileUpload label="替换图片" onUpload={url => onChange({ ...layer, assetRef: url })} />
          <Select label="填充" value={layer.fit} onChange={v => onChange({ ...layer, fit: v })} />
          <Slider label="圆角" value={layer.cornerRadius || 0} onChange={v => onChange({ ...layer, cornerRadius: v })} />
          <Checkbox label="显示边框" checked={layer.showDeviceFrame || false} onChange={v => onChange({ ...layer, showDeviceFrame: v })} />
          {layer.showDeviceFrame && (
            <Select label="边框样式" value={layer.frameRef || ""} onChange={v => onChange({ ...layer, frameRef: v })} />
          )}
        </Section>
      )}

      {layer.type === "text" && (
        <Section title="文字">
          <TextArea label="内容" value={layer.content} onChange={v => onChange({ ...layer, content: v })} />
          <Select label="字体" value={layer.fontFamily} onChange={v => onChange({ ...layer, fontFamily: v })} />
          <Slider label="字号" min={8} max={200} value={layer.fontSize} onChange={v => onChange({ ...layer, fontSize: v })} />
          <Select label="粗细" value={layer.fontWeight} onChange={v => onChange({ ...layer, fontWeight: v })} />
          <ColorInput label="颜色" value={layer.color} onChange={v => onChange({ ...layer, color: v })} />
          <Select label="对齐" value={layer.align} onChange={v => onChange({ ...layer, align: v })} />
        </Section>
      )}

      {layer.type === "sticker" && (
        <Section title="贴纸">
          <StickerPicker value={layer.stickerId} onChange={v => onChange({ ...layer, stickerId: v })} />
        </Section>
      )}
    </div>
  );
}
```

### 4.6 导出 PNG

```typescript
// 使用 Konva 导出
function exportSlideToPng(stage: Konva.Stage): Promise<string> {
  return new Promise((resolve) => {
    // 取消选中状态，避免导出选框
    stage.deselectChildren();

    // 导出 PNG
    const dataURL = stage.toDataURL({
      mimeType: 'image/png',
      quality: 1,
      pixelRatio: 1  // 确保导出尺寸与 exportedPngSize 一致
    });

    resolve(dataURL);
  });
}

// 批量导出所有 Slide
async function exportAllSlides(config: AiLayerTreeConfig) {
  const results = [];
  for (const slide of config.slides) {
    const dataURL = await renderAndExport(slide, config.exportedPngSize);
    results.push({ slideId: slide.slideId, imageBase64: dataURL });
  }
  return results;
}
```

---

## 5. 实现计划

### Phase 1: 后端基础（Task 1-4）

| # | 任务 | 预计工时 |
|---|------|----------|
| 1 | 定义 AiLayerTreeConfig TypeScript 类型 | 2h |
| 2 | Frame 资源配置表 + SVG→PNG 转换脚本 | 4h |
| 3 | Schema 校验器实现 | 4h |
| 4 | Normalizer 实现 | 4h |
| 5 | AI Prompt 设计与输出解析 | 4h |
| 6 | API 接口实现（generate/validate/normalize/save） | 8h |

### Phase 2: 前端核心（Task 5-9）

| # | 任务 | 预计工时 |
|---|------|----------|
| 7 | 编辑器布局框架（左画布 + 右面板） | 4h |
| 8 | Konva 渲染引擎（4 种图层） | 8h |
| 9 | 图层列表（选中/显隐/删除/排序） | 4h |
| 10 | 属性面板（动态渲染） | 6h |
| 11 | 图片上传 + 预裁剪绑定 assetRef | 4h |
| 12 | 设备开窗渲染（screenRect + 叠 frame） | 6h |

### Phase 3: 完善功能（Task 10-13）

| # | 任务 | 预计工时 |
|---|------|----------|
| 13 | PNG 导出功能 | 4h |
| 14 | 双版本存储（AI 原始 + 用户编辑） | 4h |
| 15 | Slide 页签管理（添加/删除/切换） | 4h |
| 16 | 端到端测试 + 调优 | 8h |

**总计约：78 小时**

---

## 6. 风险与注意事项

1. **Konva 对 SVG 支持有限**：Frame 必须预转为 PNG
2. **screenRect 提取准确性**：需要可靠的 SVG 解析脚本
3. **Cover 算法边界情况**：需要处理极端宽高比
4. **大文件上传**：图片素材需要压缩/分片上传
5. **撤销/重做**：需要维护命令历史栈（V2 可选）
6. **多 Slide 性能**：Slide 过多时考虑虚拟滚动

---

## 7. 实现状态

### 7.1 已完成

#### 前端 (Frontend)
- [x] 项目类型定义 (`frontend/src/lib/project-types.ts`)
- [x] 项目 API 客户端 (`frontend/src/lib/api-projects.ts`)
- [x] 项目列表页 (`/projects`)
- [x] 项目创建页 (`/projects/new`)
- [x] 项目详情页 (`/projects/[id]`)
- [x] 截图编辑器 (`/projects/[id]/screenshots`)
- [x] 可视化图层编辑（选中、拖拽、属性调整）
- [x] 透明度、旋转功能
- [x] 图层列表管理（显隐、排序、删除）
- [x] 导出 PNG 功能

#### 后端 (Backend)
- [x] Supabase 数据库 Schema (`backend/supabase-schema.sql`)
- [x] 项目 CRUD API (`GET/POST/PUT/DELETE /api/projects`)
- [x] 资源上传/删除 API (`POST /api/assets/upload`, `DELETE /api/assets/{id}`)
- [x] 截图配置保存/获取 API (`GET/POST /api/projects/{id}/screenshot-config`)
- [x] Supabase 客户端封装 (`backend/database.py`)
- [x] Pydantic 数据模型 (`backend/models.py`)

#### 文档 (Documentation)
- [x] 技术设计文档更新 (`docs/screenshot-factory-v2-td.md`)
- [x] 后端 README (`backend/README.md`)

### 7.2 待完成

- [ ] AI 生成 LayerTree 功能 (`POST /api/projects/{id}/screenshot/generate`)
- [ ] Supabase 存储桶配置（Storage Bucket）
- [ ] 用户认证（Supabase Auth）
- [ ] 元数据编辑页面 (`/projects/[id]/metadata`)
- [ ] 隐私政策生成页面 (`/projects/[id]/privacy`)
- [ ] Slide 页签管理（添加、删除、切换）
- [ ] 设备边框（Frame）渲染
- [ ] 贴纸（Sticker）功能

---

## 8. 风险与注意事项

1. **Konva 对 SVG 支持有限**：Frame 必须预转为 PNG
2. **screenRect 提取准确性**：需要可靠的 SVG 解析脚本
3. **Cover 算法边界情况**：需要处理极端宽高比
4. **大文件上传**：图片素材需要压缩/分片上传
5. **撤销/重做**：需要维护命令历史栈（V2 可选）
6. **多 Slide 性能**：Slide 过多时考虑虚拟滚动

---

## 9. 后续扩展

- [ ] 撤销/重做（Command Pattern）
- [ ] 图层分组/嵌套
- [ ] 批量操作（多选/对齐）
- [ ] 模板库（保存/加载模板）
- [ ] 协作编辑（WebSocket + OT/CRDT）
- [ ] AI 二次编辑（基于用户调整再生成新版本）
