export type SceneDeviceType = 'iphone_65' | 'iphone_67' | 'ipad_129' | 'ipad_109'

// Free fonts for commercial use (Google Fonts - SIL Open Font License)
export const FONT_LIBRARY = [
  { value: 'Anton', label: 'Anton (Bold, Display)', category: 'display' },
  { value: 'Noto Sans SC', label: 'Noto Sans SC (Chinese)', category: 'cjk' },
  { value: 'Roboto', label: 'Roboto (Clean, Modern)', category: 'sans' },
  { value: 'Montserrat', label: 'Montserrat (Geometric)', category: 'sans' },
  { value: 'Open Sans', label: 'Open Sans (Friendly)', category: 'sans' },
  { value: 'Lato', label: 'Lato (Professional)', category: 'sans' },
  { value: 'Playfair Display', label: 'Playfair Display (Elegant)', category: 'serif' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro (Readable)', category: 'sans' },
] as const

export type FontFamily = typeof FONT_LIBRARY[number]['value']

export interface DevicePreset {
  label: string
  width: number
  height: number
  previewWidth: number
}

export interface ScreenshotAsset {
  id: string
  name: string
  dataUrl: string
  width: number
  height: number
}

export interface BrandKit {
  themeName: string
  palette: [string, string, string]
  headingFont: string
  bodyFont: string
  textColor: string
  accentColor: string
  logoMode: 'upload' | 'badge'
}

export interface StoryboardItem {
  id: string
  assetId: string
  title: string
  subtitle: string
}

export interface SceneBaseElement {
  id: string
  kind: 'text' | 'image' | 'logo'
  x: number
  y: number
  width: number
  height: number
}

export interface TextSceneElement extends SceneBaseElement {
  kind: 'text'
  role: 'headline' | 'subheadline' | 'badge'
  text: string
  fontSize: number
  fontFamily: string
  fontWeight: number
  color: string
}

export interface ImageSceneElement extends SceneBaseElement {
  kind: 'image'
  assetId: string
  shadowColor: string
}

export interface LogoSceneElement extends SceneBaseElement {
  kind: 'logo'
  assetId?: string
  label: string
  fill: string
  textColor: string
}

export type SceneElement = TextSceneElement | ImageSceneElement | LogoSceneElement

export interface SceneSpec {
  id: string
  deviceType: SceneDeviceType
  width: number
  height: number
  brandKit: BrandKit
  background: {
    from: string
    to: string
  }
  showPhoneFrame: boolean
  story: StoryboardItem
  elements: SceneElement[]
}

export interface SceneDeck {
  brandKit: BrandKit
  storyboard: StoryboardItem[]
  scenes: SceneSpec[]
}

const STORY_BEATS = [
  { titleLead: '打开就能开始', subtitleLead: '把核心流程放在第一屏，让审核和用户都更快理解你的产品。' },
  { titleLead: '关键功能更清楚', subtitleLead: '用一句副标题解释这一页解决了什么问题，而不是简单描述界面。' },
  { titleLead: '流程一步到位', subtitleLead: '把操作路径压缩成一句话，减少认知负担。' },
  { titleLead: '信息密度刚刚好', subtitleLead: '强调结果和收益，不要让画面只停留在功能截图。' },
  { titleLead: '最后一张强调价值', subtitleLead: '让用户在翻完最后一张时，知道为什么应该下载。' },
]

const THEME_LIBRARY = [
  {
    name: 'focus_brutal',
    keywords: ['tool', 'productivity', '效率', 'todo', 'note', 'task'],
    palette: ['#111111', '#f4f1ea', '#ff6b35'] as [string, string, string],
    headingFont: 'Anton',
    bodyFont: 'Inter',
    textColor: '#f4f1ea',
    accentColor: '#ffcc00',
  },
  {
    name: 'calm_health',
    keywords: ['fitness', 'health', 'workout', '健身', '冥想', '睡眠'],
    palette: ['#0f172a', '#e0f2fe', '#31c48d'] as [string, string, string],
    headingFont: 'Noto Sans SC',
    bodyFont: 'Inter',
    textColor: '#f8fafc',
    accentColor: '#31c48d',
  },
  {
    name: 'bright_creator',
    keywords: ['photo', 'design', 'video', '创作', '相机', '剪辑'],
    palette: ['#312e81', '#eef2ff', '#f472b6'] as [string, string, string],
    headingFont: 'Anton',
    bodyFont: 'Inter',
    textColor: '#ffffff',
    accentColor: '#f472b6',
  },
]

export const DEVICE_PRESETS: Record<SceneDeviceType, DevicePreset> = {
  iphone_65: { label: 'iPhone 6.5"', width: 1284, height: 2778, previewWidth: 320 },
  iphone_67: { label: 'iPhone 6.7"', width: 1290, height: 2796, previewWidth: 320 },
  ipad_129: { label: 'iPad 12.9"', width: 2048, height: 2732, previewWidth: 360 },
  ipad_109: { label: 'iPad 10.9"', width: 1640, height: 2360, previewWidth: 340 },
}

function getKeywords(appName: string, description: string) {
  return `${appName} ${description}`.toLowerCase().split(/[\s,.;:!?，。；：！、]+/).filter(Boolean)
}

function pickTheme(appName: string, description: string) {
  const keywords = getKeywords(appName, description)

  return (
    THEME_LIBRARY.find((theme) => theme.keywords.some((keyword) => keywords.includes(keyword))) ??
    THEME_LIBRARY[0]
  )
}

function prettifyAppName(appName: string) {
  return appName.trim() || 'Your App'
}

function summarizeDescription(description: string) {
  const trimmed = description.trim()
  if (!trimmed) {
    return '把这一页当成价值解释，而不是单纯贴一张截图。'
  }

  return trimmed.length > 46 ? `${trimmed.slice(0, 46)}...` : trimmed
}

export function getInitials(appName: string) {
  return prettifyAppName(appName)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'IK'
}

export function createBrandKit(appName: string, description: string, hasLogo: boolean): BrandKit {
  const theme = pickTheme(appName, description)

  return {
    themeName: theme.name,
    palette: theme.palette,
    headingFont: theme.headingFont,
    bodyFont: theme.bodyFont,
    textColor: theme.textColor,
    accentColor: theme.accentColor,
    logoMode: hasLogo ? 'upload' : 'badge',
  }
}

export function createStoryboard(appName: string, description: string, uploads: ScreenshotAsset[]) {
  const niceName = prettifyAppName(appName)
  const summary = summarizeDescription(description)

  return uploads.map((upload, index) => {
    const beat = STORY_BEATS[index % STORY_BEATS.length]

    return {
      id: `story-${index + 1}`,
      assetId: upload.id,
      title: index === 0 ? `${niceName} · ${beat.titleLead}` : `第 ${index + 1} 屏 · ${beat.titleLead}`,
      subtitle: index === 0 ? summary : beat.subtitleLead,
    }
  })
}

function fitImage(asset: ScreenshotAsset, frameWidth: number, frameHeight: number) {
  const ratio = Math.min(frameWidth / asset.width, frameHeight / asset.height)
  return {
    width: Math.round(asset.width * ratio),
    height: Math.round(asset.height * ratio),
  }
}

export function buildSceneSpec(options: {
  appName: string
  brandKit: BrandKit
  story: StoryboardItem
  asset: ScreenshotAsset
  deviceType: SceneDeviceType
  logoAssetId?: string
}) {
  const device = DEVICE_PRESETS[options.deviceType]
  const frameWidth = Math.round(device.width * 0.82)
  const frameHeight = Math.round(device.height * 0.62)
  const fitted = fitImage(options.asset, frameWidth, frameHeight)
  const imageX = Math.round((device.width - fitted.width) / 2)
  const imageY = Math.round(device.height * 0.3)
  const initials = getInitials(options.appName)

  const elements: SceneElement[] = [
    {
      id: `${options.story.id}-headline`,
      kind: 'text',
      role: 'headline',
      text: options.story.title,
      x: Math.round(device.width * 0.08),
      y: Math.round(device.height * 0.07),
      width: Math.round(device.width * 0.76),
      height: Math.round(device.height * 0.11),
      fontSize: options.deviceType.startsWith('ipad') ? 96 : 82,
      fontFamily: options.brandKit.headingFont,
      fontWeight: 700,
      color: options.brandKit.textColor,
    },
    {
      id: `${options.story.id}-subheadline`,
      kind: 'text',
      role: 'subheadline',
      text: options.story.subtitle,
      x: Math.round(device.width * 0.08),
      y: Math.round(device.height * 0.18),
      width: Math.round(device.width * 0.74),
      height: Math.round(device.height * 0.08),
      fontSize: options.deviceType.startsWith('ipad') ? 34 : 28,
      fontFamily: options.brandKit.bodyFont,
      fontWeight: 500,
      color: options.brandKit.textColor,
    },
    {
      id: `${options.story.id}-screen`,
      kind: 'image',
      assetId: options.asset.id,
      x: imageX,
      y: imageY,
      width: fitted.width,
      height: fitted.height,
      shadowColor: 'rgba(17,17,17,0.32)',
    },
    {
      id: `${options.story.id}-logo`,
      kind: 'logo',
      assetId: options.logoAssetId,
      label: initials,
      x: Math.round(device.width * 0.08),
      y: Math.round(device.height * 0.88),
      width: Math.round(device.width * 0.14),
      height: Math.round(device.width * 0.14),
      fill: options.brandKit.accentColor,
      textColor: '#111111',
    },
  ]

  return {
    id: `scene-${options.story.id}`,
    deviceType: options.deviceType,
    width: device.width,
    height: device.height,
    brandKit: options.brandKit,
    background: {
      from: options.brandKit.palette[0],
      to: options.brandKit.palette[2],
    },
    showPhoneFrame: false,
    story: options.story,
    elements,
  } satisfies SceneSpec
}

export function generateSceneDeck(options: {
  appName: string
  description: string
  uploads: ScreenshotAsset[]
  deviceType: SceneDeviceType
  logoAsset?: ScreenshotAsset
}): SceneDeck {
  const brandKit = createBrandKit(options.appName, options.description, Boolean(options.logoAsset))
  const storyboard = createStoryboard(options.appName, options.description, options.uploads)

  return {
    brandKit,
    storyboard,
    scenes: storyboard.map((story) => {
      const asset = options.uploads.find((upload) => upload.id === story.assetId)

      if (!asset) {
        throw new Error(`Missing asset for storyboard item ${story.id}`)
      }

      return buildSceneSpec({
        appName: options.appName,
        brandKit,
        story,
        asset,
        deviceType: options.deviceType,
        logoAssetId: options.logoAsset?.id,
      })
    }),
  }
}

export function updateSceneElement(
  scene: SceneSpec,
  elementId: string,
  updater: Partial<SceneElement> | ((element: SceneElement) => SceneElement)
) {
  return {
    ...scene,
    elements: scene.elements.map((element) => {
      if (element.id !== elementId) {
        return element
      }

      if (typeof updater === 'function') {
        return updater(element)
      }

      return {
        ...element,
        ...updater,
      } as SceneElement
    }),
  }
}

export function updateSceneBackground(scene: SceneSpec, background: { from: string; to: string }) {
  return {
    ...scene,
    background,
  }
}

export function togglePhoneFrame(scene: SceneSpec, show: boolean) {
  return {
    ...scene,
    showPhoneFrame: show,
  }
}

export function deleteElement(scene: SceneSpec, elementId: string) {
  return {
    ...scene,
    elements: scene.elements.filter((element) => element.id !== elementId),
  }
}

export function scaleSceneSpec(scene: SceneSpec, deviceType: SceneDeviceType) {
  const nextDevice = DEVICE_PRESETS[deviceType]
  const ratioX = nextDevice.width / scene.width
  const ratioY = nextDevice.height / scene.height

  return {
    ...scene,
    deviceType,
    width: nextDevice.width,
    height: nextDevice.height,
    elements: scene.elements.map((element) => {
      const base = {
        ...element,
        x: Math.round(element.x * ratioX),
        y: Math.round(element.y * ratioY),
        width: Math.round(element.width * ratioX),
        height: Math.round(element.height * ratioY),
      }

      if (element.kind === 'text') {
        return {
          ...base,
          fontSize: Math.max(18, Math.round(element.fontSize * ratioX)),
        } as TextSceneElement
      }

      return base
    }),
  }
}
