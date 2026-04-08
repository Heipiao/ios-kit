from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="iOS Kit API")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:3003",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://localhost:8001",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include project routes
from routes import router as projects_router

app.include_router(projects_router, prefix="/api")


# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "ok"}


# AI 消息请求
class ChatMessage(BaseModel):
    message: str
    context: Optional[dict] = None


# AI 助手端点
@app.post("/api/chat")
async def chat(data: ChatMessage):
    """AI 助手对话接口"""
    from anthropic import Anthropic

    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    system_prompt = """你是一个 iOS App 上架助手，帮助用户生成 App Store 上架所需的材料。
你可以：
1. 生成 App 名称、副标题、描述、关键词
2. 帮助处理截图美化
3. 生成隐私政策和用户协议

请用简洁友好的中文回复。"""

    message = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1024,
        system=system_prompt,
        messages=[
            {"role": "user", "content": data.message}
        ]
    )

    return {"reply": message.content[0].text}


# 元数据生成
class MetadataRequest(BaseModel):
    app_description: str
    target_audience: Optional[str] = None
    language: Optional[str] = "zh"


@app.post("/api/metadata/generate")
async def generate_metadata(data: MetadataRequest):
    """生成 App 元数据（名称、描述、关键词）"""
    from anthropic import Anthropic

    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    prompt = f"""请为以下 App 生成 App Store 元数据：

App 描述：{data.app_description}

请生成：
1. 3 个 App 名称建议（每个不超过 30 字符）
2. 3 个副标题建议（每个不超过 30 字符）
3. App Store 描述（150-200 字）
4. 关键词（100 字符以内，逗号分隔）

请以 JSON 格式返回：
{{
  "names": ["名称 1", "名称 2", "名称 3"],
  "subtitles": ["副标题 1", "副标题 2", "副标题 3"],
  "description": "描述文案",
  "keywords": "关键词 1，关键词 2,..."
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1024,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    return {"data": message.content[0].text}


# 隐私政策生成
class PrivacyPolicyRequest(BaseModel):
    app_name: str
    data_collected: List[str]
    data_usage: List[str]
    third_party_sharing: bool
    user_deletion: bool


@app.post("/api/privacy/generate")
async def generate_privacy_policy(data: PrivacyPolicyRequest):
    """生成隐私政策"""
    from anthropic import Anthropic

    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    data_types = ", ".join(data.data_collected) if data.data_collected else "不收集任何数据"
    usage = ", ".join(data.data_usage) if data.data_usage else "仅提供服务"

    prompt = f"""请为以下 App 生成隐私政策：

App 名称：{data.app_name}
收集的数据类型：{data_types}
数据用途：{usage}
与第三方共享：{"是" if data.third_party_sharing else "否"}
用户可删除数据：{"是" if data.user_deletion else "否"}

请生成一份完整的隐私政策文档（HTML 格式），包含：
1. 引言
2. 收集的信息类型
3. 信息使用方式
4. 信息共享政策
5. 用户权利
6. 数据安全
7. 联系我们

直接返回 HTML 内容，不需要 markdown 格式。"""

    message = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=2048,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    return {"html": message.content[0].text}


class TermsOfServiceRequest(BaseModel):
    app_name: str
    app_description: Optional[str] = None


@app.post("/api/terms/generate")
async def generate_terms_of_service(data: TermsOfServiceRequest):
    """生成服务条款"""
    from anthropic import Anthropic

    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    prompt = f"""请为以下 App 生成服务条款：

App 名称：{data.app_name}
App 描述：{data.app_description or "未提供"}

请生成一份完整的服务条款文档（HTML 格式），包含：
1. 接受条款
2. 服务说明
3. 用户账号
4. 可接受使用范围
5. 知识产权
6. 免责声明
7. 责任限制
8. 终止
9. 条款变更
10. 联系方式

直接返回 HTML 内容，不需要 markdown 格式。"""

    message = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=2048,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    return {"html": message.content[0].text}


# 截图处理
import base64
import io
from pathlib import Path
from PIL import Image

class ScreenshotRequest(BaseModel):
    image_base64: str
    device_type: str = "iphone_65"  # iphone_65, iphone_67, ipad_129, ipad_109
    background_style: str = "gradient"  # gradient, solid, blur
    show_frame: bool = True
    caption: Optional[str] = None


# 设备尺寸配置
# Apple 官方要求的 App Store 截图尺寸
# 参考：https://developer.apple.com/app-store/screenshots/
DEVICE_SIZES = {
    # iPhone
    "iphone_65": {
        "name": "iPhone 6.5 英寸",
        "width": 1284,
        "height": 2778,
        "frame_width": 1200,
        "frame_height": 2600,
        "border_radius": 50,
        "padding": 4,
        "screen_radius": 45,
        "display_size": "1284 x 2778",
    },
    "iphone_67": {
        "name": "iPhone 6.7 英寸",
        "width": 1290,
        "height": 2796,
        "frame_width": 1206,
        "frame_height": 2618,
        "border_radius": 52,
        "padding": 4,
        "screen_radius": 47,
        "display_size": "1290 x 2796",
    },
    "iphone_55": {
        "name": "iPhone 5.5 英寸",
        "width": 1242,
        "height": 2208,
        "frame_width": 1160,
        "frame_height": 2050,
        "border_radius": 44,
        "padding": 4,
        "screen_radius": 39,
        "display_size": "1242 x 2208",
    },
    # iPad
    "ipad_129": {
        "name": "iPad 12.9 英寸",
        "width": 2048,
        "height": 2732,
        "frame_width": 1900,
        "frame_height": 2540,
        "border_radius": 40,
        "padding": 8,
        "screen_radius": 34,
        "display_size": "2048 x 2732",
    },
    "ipad_11": {
        "name": "iPad 11 英寸",
        "width": 1668,
        "height": 2388,
        "frame_width": 1550,
        "frame_height": 2250,
        "border_radius": 36,
        "padding": 6,
        "screen_radius": 30,
        "display_size": "1668 x 2388",
    },
    "ipad_109": {
        "name": "iPad 10.9 英寸",
        "width": 1640,
        "height": 2360,
        "frame_width": 1520,
        "frame_height": 2180,
        "border_radius": 36,
        "padding": 6,
        "screen_radius": 30,
        "display_size": "1640 x 2360",
    },
}

# App Store 必需尺寸要求
APP_STORE_REQUIRED_SIZES = {
    "iphone": ["iphone_65", "iphone_67"],  # 至少上传 6.5 和 6.7
    "ipad": ["ipad_129", "ipad_11"],       # 如果支持 iPad
}

# 背景样式库
BACKGROUND_STYLES = {
    # 渐变背景
    "gradient": "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);",
    "gradient_blue": "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);",
    "gradient_purple": "background: linear-gradient(135deg, #9b59b6 0%, #3498db 100%);",
    "gradient_sunset": "background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);",
    "gradient_ocean": "background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);",
    "gradient_forest": "background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);",

    # 纯色背景
    "solid_white": "background: #ffffff;",
    "solid_black": "background: #000000;",
    "solid_gray": "background: #f5f5f7;",
    "solid_blue": "background: #007aff;",
    "solid_purple": "background: #5e5ce6;",

    # 模糊背景 (需要配合底层颜色)
    "blur_light": "background: linear-gradient(135deg, #e0e0e0 0%, #f5f5f7 100%); backdrop-filter: blur(20px);",
    "blur_dark": "background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); backdrop-filter: blur(20px);",

    # 深色模式
    "dark": "background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);",
    "dark_purple": "background: linear-gradient(135deg, #2d1b4e 0%, #1a1a2e 100%);",
}


@app.post("/api/screenshot/process")
async def process_screenshot(data: ScreenshotRequest):
    """处理截图 - HTML 渲染 + Playwright 截图"""
    import playwright.async_api as playwright

    try:
        # 解码图片
        image_data = base64.b64decode(data.image_base64.split(",")[1] if "," in data.image_base64 else data.image_base64)
        img = Image.open(io.BytesIO(image_data))

        # 获取设备尺寸
        device_config = DEVICE_SIZES.get(data.device_type, DEVICE_SIZES["iphone_65"])

        # 读取模板
        template_path = Path(__file__).parent / "templates" / "screenshot.html"
        with open(template_path, "r", encoding="utf-8") as f:
            template = f.read()

        # 保存临时图片
        temp_dir = Path(__file__).parent / "temp"
        temp_dir.mkdir(exist_ok=True)
        temp_image_path = temp_dir / "temp_upload.png"
        img.save(temp_image_path)

        # 替换临时图片 URL（使用 file:// 协议）
        image_url = f"file://{temp_image_path.absolute()}"

        # 渲染 HTML
        html_content = template.replace("{{ width }}", str(device_config["width"]))
        html_content = html_content.replace("{{ height }}", str(device_config["height"]))
        html_content = html_content.replace("{{ frame_width }}", str(device_config["frame_width"]))
        html_content = html_content.replace("{{ frame_height }}", str(device_config["frame_height"]))
        html_content = html_content.replace("{{ border_radius }}", str(device_config["border_radius"]))
        html_content = html_content.replace("{{ padding }}", str(device_config["padding"]))
        html_content = html_content.replace("{{ screen_radius }}", str(device_config["border_radius"] - 5))
        html_content = html_content.replace("{{ background_style }}", BACKGROUND_STYLES.get(data.background_style, BACKGROUND_STYLES["gradient"]))
        html_content = html_content.replace("{{ image_url }}", image_url)

        if data.caption:
            html_content = html_content.replace("{{ caption }}", data.caption)
            html_content = html_content.replace("{{#caption}}", "")
            html_content = html_content.replace("{{/caption}}", "")
            html_content = html_content.replace("{{ font_size }}", "32")
            html_content = html_content.replace("{{ text_color }}", "#ffffff")
            html_content = html_content.replace("{{ caption_bottom }}", "80")
        else:
            html_content = html_content.replace("{{#caption}}", "<!--")
            html_content = html_content.replace("{{/caption}}", "-->")
            html_content = html_content.replace("{{ caption }}", "")
            html_content = html_content.replace("{{ font_size }}", "")
            html_content = html_content.replace("{{ text_color }}", "")
            html_content = html_content.replace("{{ caption_bottom }}", "")

        # 使用 Playwright 截图
        async with playwright.async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()

            # 保存临时 HTML
            temp_html_path = temp_dir / "temp.html"
            with open(temp_html_path, "w", encoding="utf-8") as f:
                f.write(html_content)

            await page.goto(f"file://{temp_html_path.absolute()}")

            # 截图
            screenshot_bytes = await page.screenshot(full_page=False)

            await browser.close()

        # 清理临时文件
        temp_image_path.unlink(missing_ok=True)
        temp_html_path.unlink(missing_ok=True)

        # 返回 base64 图片
        result_base64 = base64.b64encode(screenshot_bytes).decode()

        return {
            "success": True,
            "image_base64": f"data:image/png;base64,{result_base64}",
            "width": device_config["width"],
            "height": device_config["height"],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/screenshot/process-all")
async def process_all_screenshots(data: ScreenshotRequest):
    """批量处理所有尺寸的截图"""
    results = {}

    for device_type in DEVICE_SIZES.keys():
        try:
            req = ScreenshotRequest(
                image_base64=data.image_base64,
                device_type=device_type,
                background_style=data.background_style,
                show_frame=data.show_frame,
                caption=data.caption,
            )
            result = await process_screenshot(req)
            results[device_type] = result
        except Exception as e:
            results[device_type] = {"error": str(e)}

    return {"results": results}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
