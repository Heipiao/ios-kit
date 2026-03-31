'use client'

import { useEffect, startTransition, useState, useRef } from 'react'
import { Download, ImagePlus, Layers3, Palette, Sparkles, Type, Undo2, Redo2, Upload, Plus, Trash2 } from 'lucide-react'
import { AIPanel } from '@/components/AIPanel'
import ScreenshotCanvas from '@/components/screenshots/ScreenshotCanvas'
import { Sidebar } from '@/components/Sidebar'
import {
  DEVICE_PRESETS,
  FONT_LIBRARY,
  generateSceneDeck,
  scaleSceneSpec,
  updateSceneElement,
  updateSceneBackground,
  togglePhoneFrame,
  deleteElement,
  type SceneDeck,
  type SceneDeviceType,
  type SceneElement,
  type ScreenshotAsset,
  type SceneSpec,
  type FontFamily,
} from '@/lib/screenshot-spec'
import { useUndoRedo } from '@/lib/useUndoRedo'

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function loadImageSize(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve({ width: image.width, height: image.height })
    image.onerror = reject
    image.src = src
  })
}

async function fileToAsset(file: File): Promise<ScreenshotAsset> {
  const dataUrl = await readFileAsDataUrl(file)
  const size = await loadImageSize(dataUrl)

  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    dataUrl,
    width: size.width,
    height: size.height,
  }
}

function sanitizeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'ios-kit'
}

// ─────────────────────────────────────────────────────────────────────────────
// Project Level Panel (Left Sidebar)
// ─────────────────────────────────────────────────────────────────────────────

interface ProjectPanelProps {
  appName: string
  description: string
  deviceType: SceneDeviceType
  uploads: ScreenshotAsset[]
  logoAsset: ScreenshotAsset | null
  deck: SceneDeck | null
  currentSceneIndex: number
  onAppNameChange: (name: string) => void
  onDescriptionChange: (desc: string) => void
  onDeviceTypeChange: (type: SceneDeviceType) => void
  onUploadFiles: (event: React.ChangeEvent<HTMLInputElement>) => void
  onLogoFile: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveUpload: (id: string) => void
  onRemoveLogo: () => void
  onAddScreenshotToCanvas: (asset: ScreenshotAsset) => void
  onSelectPage: (index: number) => void
}

function ProjectPanel({
  appName,
  description,
  deviceType,
  uploads,
  logoAsset,
  deck,
  currentSceneIndex,
  onAppNameChange,
  onDescriptionChange,
  onDeviceTypeChange,
  onUploadFiles,
  onLogoFile,
  onRemoveUpload,
  onRemoveLogo,
  onAddScreenshotToCanvas,
  onSelectPage,
}: ProjectPanelProps) {
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleUploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    setUploadError(null)
    try {
      await onUploadFiles(event)
    } catch {
      setUploadError('Failed to read some files')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <aside className="w-80 border-r-2 border-black bg-white flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b-2 border-black bg-yellow-400">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 border-2 border-black bg-black flex items-center justify-center">
            <span className="text-xl">📱</span>
          </div>
          <div>
            <h1 className="text-lg font-display font-bold uppercase tracking-wider leading-none">iOS Kit</h1>
            <p className="text-xs font-mono uppercase tracking-widest leading-none mt-1">Screenshot Editor</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Project Settings */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4" />
            <h2 className="font-display text-sm uppercase tracking-wider">Project Settings</h2>
          </div>

          <label className="block mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500">App Name</span>
            <input
              value={appName}
              onChange={(e) => onAppNameChange(e.target.value)}
              className="mt-1 w-full border-2 border-black px-3 py-2 text-sm font-medium"
              placeholder="Enter app name"
            />
          </label>

          <label className="block mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500">Description</span>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              className="mt-1 w-full border-2 border-black px-3 py-2 text-sm leading-relaxed"
              placeholder="Describe your app's core value"
            />
          </label>

          <label className="block">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500">Device</span>
            <select
              value={deviceType}
              onChange={(e) => onDeviceTypeChange(e.target.value as SceneDeviceType)}
              className="mt-1 w-full border-2 border-black px-3 py-2 text-sm font-medium bg-white"
            >
              {Object.entries(DEVICE_PRESETS).map(([value, preset]) => (
                <option key={value} value={value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        {/* Uploads */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ImagePlus className="w-4 h-4" />
            <h2 className="font-display text-sm uppercase tracking-wider">Assets</h2>
          </div>

          {/* Screenshot Upload */}
          <label className="block border-2 border-dashed border-black p-3 cursor-pointer hover:bg-yellow-50 transition-colors mb-3">
            <span className="flex items-center justify-center gap-2 font-display uppercase text-sm">
              <Upload className="w-4 h-4" />
              Add Screenshots
            </span>
            <input className="hidden" type="file" accept="image/*" multiple onChange={handleUploadFiles} />
          </label>

          {/* Logo Upload */}
          {!logoAsset ? (
            <label className="block border-2 border-dashed border-black p-3 cursor-pointer hover:bg-teal-50 transition-colors">
              <span className="flex items-center justify-center gap-2 font-display uppercase text-sm">
                <ImagePlus className="w-4 h-4" />
                Add Logo (Optional)
              </span>
              <input className="hidden" type="file" accept="image/*" onChange={onLogoFile} />
            </label>
          ) : (
            <div className="border-2 border-black p-2 bg-teal-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={logoAsset.dataUrl} alt="Logo" className="w-8 h-8 object-contain" />
                <span className="text-xs font-mono uppercase truncate max-w-[120px]">{logoAsset.name}</span>
              </div>
              <button onClick={onRemoveLogo} className="text-xs font-bold hover:text-red-600">✕</button>
            </div>
          )}

          {/* Uploaded Screenshots List */}
          {uploads.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-500">{uploads.length} Screenshots</span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {uploads.map((upload, index) => (
                  <div key={upload.id} className="border-2 border-black p-2 bg-gray-50 flex items-center justify-between group">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold shrink-0">#{index + 1}</span>
                      <img src={upload.dataUrl} alt="" className="w-8 h-8 object-cover border border-gray-300" />
                      <span className="text-xs font-mono truncate max-w-[140px]">{upload.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onAddScreenshotToCanvas(upload)}
                        className="p-1 hover:bg-black hover:text-white transition-colors"
                        title="Add to canvas"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onRemoveUpload(upload.id)}
                        className="p-1 hover:text-red-600"
                      >
                        <span className="text-xs">✕</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadError && (
            <p className="mt-2 text-xs text-red-600 font-mono">{uploadError}</p>
          )}
        </section>

        {/* Pages Navigation */}
        {deck && deck.scenes.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Layers3 className="w-4 h-4" />
              <h2 className="font-display text-sm uppercase tracking-wider">Pages ({deck.scenes.length})</h2>
            </div>
            <div className="space-y-1">
              {deck.scenes.map((scene, index) => (
                <button
                  key={scene.id}
                  onClick={() => onSelectPage(index)}
                  className={`w-full text-left px-3 py-2 border-2 transition-colors text-xs ${
                    index === currentSceneIndex
                      ? 'border-black bg-black text-white'
                      : 'border-black bg-gray-50 hover:bg-yellow-50'
                  }`}
                >
                  <span className="font-bold uppercase">Page {index + 1}</span>
                  <span className="block font-mono truncate mt-1 opacity-75">{scene.story.title}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ScreenshotsPage() {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false)

  // Project Level State
  const [appName, setAppName] = useState('Pulse Studio')
  const [description, setDescription] = useState('用更轻的流程管理训练计划、习惯追踪和每日反馈，让用户在第一屏就理解核心价值。')
  const [deviceType, setDeviceType] = useState<SceneDeviceType>('iphone_67')
  const [uploads, setUploads] = useState<ScreenshotAsset[]>([])
  const [logoAsset, setLogoAsset] = useState<ScreenshotAsset | null>(null)

  // Page Level State
  const [deck, setDeck] = useState<SceneDeck | null>(null)
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)

  // Actions
  const [exportRequest, setExportRequest] = useState(0)

  // Undo/Redo
  const { present: deckPresent, set: setDeckWithHistory, undo, redo, canUndo, canRedo } = useUndoRedo<SceneDeck | null>(null)
  const currentDeck = deckPresent

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  // Sync deck state for undo/redo
  useEffect(() => {
    if (deck && deck !== deckPresent) {
      // Deck was regenerated, reset history
    }
  }, [deck, deckPresent])

  const currentScene = currentDeck?.scenes[currentSceneIndex] ?? null
  const selectedElement = currentScene?.elements.find((element) => element.id === selectedElementId) ?? null

  // ───────────────────────────────────────────────────────────────────────────
  // Handlers - Project Level
  // ───────────────────────────────────────────────────────────────────────────

  const handleUploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    const nextAssets = await Promise.all(files.map(fileToAsset))
    setUploads((current) => [...current, ...nextAssets])
  }

  const handleLogoFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const asset = await fileToAsset(file)
    setLogoAsset(asset)
  }

  const handleRemoveUpload = (id: string) => {
    setUploads((current) => current.filter((u) => u.id !== id))
  }

  const handleRemoveLogo = () => {
    setLogoAsset(null)
  }

  const handleAddScreenshotToCanvas = (asset: ScreenshotAsset) => {
    // Create a new scene with this screenshot
    const newScene: SceneSpec = {
      id: `scene-${Date.now()}`,
      deviceType,
      width: DEVICE_PRESETS[deviceType].width,
      height: DEVICE_PRESETS[deviceType].height,
      brandKit: currentDeck?.brandKit ?? {
        themeName: 'focus_brutal',
        palette: ['#111111', '#f4f1ea', '#ff6b35'],
        headingFont: 'Anton',
        bodyFont: 'Inter',
        textColor: '#f4f1ea',
        accentColor: '#ffcc00',
        logoMode: 'badge' as const,
      },
      background: { from: '#111111', to: '#ff6b35' },
      showPhoneFrame: false,
      story: {
        id: `story-${Date.now()}`,
        assetId: asset.id,
        title: `${appName} - Screen`,
        subtitle: description.slice(0, 46) || 'App screenshot',
      },
      elements: [
        {
          id: `text-${Date.now()}`,
          kind: 'text',
          role: 'headline',
          text: appName,
          x: Math.round(DEVICE_PRESETS[deviceType].width * 0.08),
          y: Math.round(DEVICE_PRESETS[deviceType].height * 0.07),
          width: Math.round(DEVICE_PRESETS[deviceType].width * 0.76),
          height: Math.round(DEVICE_PRESETS[deviceType].height * 0.1),
          fontSize: deviceType.startsWith('ipad') ? 96 : 82,
          fontFamily: 'Anton',
          fontWeight: 700,
          color: '#f4f1ea',
        },
        {
          id: `image-${Date.now()}`,
          kind: 'image',
          assetId: asset.id,
          x: Math.round(DEVICE_PRESETS[deviceType].width * 0.09),
          y: Math.round(DEVICE_PRESETS[deviceType].height * 0.25),
          width: Math.round(DEVICE_PRESETS[deviceType].width * 0.82),
          height: Math.round(DEVICE_PRESETS[deviceType].height * 0.5),
          shadowColor: 'rgba(17,17,17,0.32)',
        },
        {
          id: `logo-${Date.now()}`,
          kind: 'logo',
          assetId: logoAsset?.id,
          label: appName.split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2),
          x: Math.round(DEVICE_PRESETS[deviceType].width * 0.08),
          y: Math.round(DEVICE_PRESETS[deviceType].height * 0.88),
          width: Math.round(DEVICE_PRESETS[deviceType].width * 0.14),
          height: Math.round(DEVICE_PRESETS[deviceType].width * 0.14),
          fill: '#ffcc00',
          textColor: '#111111',
        },
      ],
    }

    if (currentDeck) {
      setDeckWithHistory({
        ...currentDeck,
        scenes: [...currentDeck.scenes, newScene],
      })
      setCurrentSceneIndex(currentDeck.scenes.length)
    } else {
      const newDeck: SceneDeck = {
        brandKit: newScene.brandKit,
        storyboard: [newScene.story],
        scenes: [newScene],
      }
      setDeck(newDeck)
      setDeckWithHistory(newDeck)
    }
    setSelectedElementId(null)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Handlers - Page Level
  // ───────────────────────────────────────────────────────────────────────────

  const handleGenerateDraft = () => {
    if (uploads.length === 0) {
      alert('Please upload at least one screenshot first.')
      return
    }

    startTransition(() => {
      const nextDeck = generateSceneDeck({
        appName,
        description,
        uploads,
        deviceType,
        logoAsset: logoAsset ?? undefined,
      })

      setDeck(nextDeck)
      setDeckWithHistory(nextDeck)
      setCurrentSceneIndex(0)
      setSelectedElementId(nextDeck.scenes[0]?.elements[0]?.id ?? null)
    })
  }

  const updateCurrentScene = (nextScene: SceneSpec) => {
    if (!currentDeck) return

    setDeckWithHistory({
      ...currentDeck,
      scenes: currentDeck.scenes.map((scene, index) => (index === currentSceneIndex ? nextScene : scene)),
    })
  }

  const handleDeviceTypeChange = (nextType: SceneDeviceType) => {
    setDeviceType(nextType)

    if (!currentDeck) return

    setDeckWithHistory({
      ...currentDeck,
      scenes: currentDeck.scenes.map((scene) => scaleSceneSpec(scene, nextType)),
    })
  }

  const updateSelectedElement = (patch: Partial<SceneElement>) => {
    if (!currentScene || !selectedElement) return
    updateCurrentScene(updateSceneElement(currentScene, selectedElement.id, patch))
  }

  const handleBackgroundChange = (colors: { from: string; to: string }) => {
    if (!currentScene) return
    updateCurrentScene(updateSceneBackground(currentScene, colors))
  }

  const handlePhoneFrameToggle = (show: boolean) => {
    if (!currentScene) return
    updateCurrentScene(togglePhoneFrame(currentScene, show))
  }

  const handleDeleteElement = () => {
    if (!currentScene || !selectedElement) return
    updateCurrentScene(deleteElement(currentScene, selectedElement.id))
    setSelectedElementId(null)
  }

  const handleSelectPage = (index: number) => {
    setCurrentSceneIndex(index)
    setSelectedElementId(null)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Handlers - Actions
  // ───────────────────────────────────────────────────────────────────────────

  const handleExportReady = (dataUrl: string) => {
    const link = document.createElement('a')
    const scene = currentDeck?.scenes[currentSceneIndex]
    const sceneLabel = scene?.story.title ?? 'scene'
    link.href = dataUrl
    link.download = `${sanitizeFilename(appName)}-${sanitizeFilename(sceneLabel)}-${deviceType}.png`
    link.click()
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />

      {/* Left Panel - Project Level */}
      <ProjectPanel
        appName={appName}
        description={description}
        deviceType={deviceType}
        uploads={uploads}
        logoAsset={logoAsset}
        deck={currentDeck}
        currentSceneIndex={currentSceneIndex}
        onAppNameChange={setAppName}
        onDescriptionChange={setDescription}
        onDeviceTypeChange={handleDeviceTypeChange}
        onUploadFiles={handleUploadFiles}
        onLogoFile={handleLogoFile}
        onRemoveUpload={handleRemoveUpload}
        onRemoveLogo={handleRemoveLogo}
        onAddScreenshotToCanvas={handleAddScreenshotToCanvas}
        onSelectPage={handleSelectPage}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Toolbar - Actions */}
        <header className="h-16 border-b-2 border-black bg-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`flex items-center gap-2 px-3 py-2 border-2 border-black transition-colors ${
                canUndo ? 'bg-white hover:bg-yellow-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title="Undo (Cmd/Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
              <span className="text-sm font-bold uppercase">Undo</span>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`flex items-center gap-2 px-3 py-2 border-2 border-black transition-colors ${
                canRedo ? 'bg-white hover:bg-yellow-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title="Redo (Cmd/Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
              <span className="text-sm font-bold uppercase">Redo</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateDraft}
              disabled={uploads.length === 0}
              className={`flex items-center gap-2 px-4 py-2 border-2 transition-colors ${
                uploads.length === 0
                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-black bg-white hover:bg-yellow-50'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-bold uppercase">Generate Draft</span>
            </button>
            <button
              onClick={() => setExportRequest((current) => current + 1)}
              disabled={!currentScene}
              className={`flex items-center gap-2 px-4 py-2 border-2 border-black transition-colors ${
                currentScene ? 'bg-black text-white hover:bg-red-500' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Download className="w-5 h-5" />
              <span className="text-sm font-bold uppercase">Download PNG</span>
            </button>
          </div>
        </header>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-[#ece9df] p-6">
          {currentScene ? (
            <div className="max-w-4xl mx-auto">
              <ScreenshotCanvas
                scene={currentScene}
                uploads={uploads}
                logoAsset={logoAsset}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onChangeScene={updateCurrentScene}
                exportRequest={exportRequest}
                onExportReady={handleExportReady}
              />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Empty State - Show screenshot grid */}
              <div className="card-brutal p-8 bg-white">
                <div className="text-center mb-6">
                  <h2 className="font-display text-2xl uppercase mb-2">No Pages Yet</h2>
                  <p className="text-sm font-mono uppercase tracking-wider text-gray-500">
                    {uploads.length === 0
                      ? 'Upload screenshots to get started'
                      : 'Click + on a screenshot to create a page, or click Generate Draft'}
                  </p>
                </div>

                {uploads.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploads.map((upload, index) => (
                      <button
                        key={upload.id}
                        onClick={() => handleAddScreenshotToCanvas(upload)}
                        className="border-2 border-black p-3 bg-gray-50 hover:bg-yellow-50 hover:border-red-500 transition-all group"
                      >
                        <div className="aspect-[9/19] bg-gray-200 mb-2 overflow-hidden">
                          <img src={upload.dataUrl} alt="" className="w-full h-full object-contain" />
                        </div>
                        <p className="text-xs font-bold uppercase truncate">Screen {index + 1}</p>
                        <p className="text-xs font-mono text-gray-500 truncate">{upload.name}</p>
                        <div className="mt-2 flex items-center justify-center gap-1 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-4 h-4" />
                          <span>Add to Canvas</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right Panel - Page Level (Appearance + Inspector) */}
      <aside className="w-80 border-l-2 border-black bg-white flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!currentScene ? (
            <div className="text-center py-8">
              <Palette className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm font-mono uppercase tracking-wider text-gray-500">
                Select or create a page to edit
              </p>
            </div>
          ) : (
            <>
              {/* Appearance Section */}
              <section>
                <div className="flex items-center gap-2 mb-3 pb-3 border-b-2 border-black">
                  <Palette className="w-4 h-4" />
                  <h2 className="font-display text-sm uppercase tracking-wider">Appearance</h2>
                </div>

                <div className="space-y-4">
                  {/* Background Gradient */}
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-gray-500 block mb-2">
                      Background Gradient
                    </span>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] font-mono uppercase text-gray-500">From</label>
                        <input
                          type="color"
                          value={currentScene.background.from}
                          onChange={(e) =>
                            handleBackgroundChange({ from: e.target.value, to: currentScene.background.to })
                          }
                          className="w-full h-8 border-2 border-black cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-mono uppercase text-gray-500">To</label>
                        <input
                          type="color"
                          value={currentScene.background.to}
                          onChange={(e) =>
                            handleBackgroundChange({ from: currentScene.background.from, to: e.target.value })
                          }
                          className="w-full h-8 border-2 border-black cursor-pointer"
                        />
                      </div>
                    </div>
                    <div
                      className="mt-2 h-6 rounded border-2 border-black"
                      style={{
                        background: `linear-gradient(135deg, ${currentScene.background.from}, ${currentScene.background.to})`,
                      }}
                    />
                  </div>

                  {/* Phone Frame Toggle */}
                  <div className="pt-3 border-t-2 border-black">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold uppercase">Phone Frame</span>
                        <p className="text-[10px] text-gray-500 mt-0.5">Add device bezel</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={currentScene.showPhoneFrame}
                        onChange={(e) => handlePhoneFrameToggle(e.target.checked)}
                        className="w-4 h-4 border-2 border-black"
                      />
                    </label>
                  </div>
                </div>
              </section>

              {/* Inspector Section */}
              <section>
                <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-black">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    <h2 className="font-display text-sm uppercase tracking-wider">
                      Inspector: {selectedElement ? selectedElement.kind.toUpperCase() : 'None'}
                    </h2>
                  </div>
                  {selectedElement && (
                    <button
                      onClick={handleDeleteElement}
                      className="flex items-center gap-1 px-2 py-1 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors text-xs font-bold uppercase"
                      title="Delete element"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  )}
                </div>

                {!selectedElement ? (
                  <p className="text-xs font-mono uppercase tracking-wider text-gray-500 text-center py-4">
                    Click an element on the canvas to edit
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="text-[10px] font-mono uppercase text-gray-500">X</span>
                        <input
                          type="number"
                          value={selectedElement.x}
                          onChange={(e) => updateSelectedElement({ x: Number(e.target.value) })}
                          className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-mono uppercase text-gray-500">Y</span>
                        <input
                          type="number"
                          value={selectedElement.y}
                          onChange={(e) => updateSelectedElement({ y: Number(e.target.value) })}
                          className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                        />
                      </label>
                    </div>

                    {selectedElement.kind === 'text' && (
                      <>
                        <label className="block">
                          <span className="text-[10px] font-mono uppercase text-gray-500">Text</span>
                          <textarea
                            value={selectedElement.text}
                            onChange={(e) => updateSelectedElement({ text: e.target.value })}
                            rows={3}
                            className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-mono uppercase text-gray-500">Font Family</span>
                          <select
                            value={selectedElement.fontFamily}
                            onChange={(e) => updateSelectedElement({ fontFamily: e.target.value as FontFamily })}
                            className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm bg-white"
                            style={{ fontFamily: selectedElement.fontFamily }}
                          >
                            {FONT_LIBRARY.map((font) => (
                              <option
                                key={font.value}
                                value={font.value}
                                style={{ fontFamily: font.value }}
                              >
                                {font.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-mono uppercase text-gray-500">Font Size</span>
                          <input
                            type="number"
                            value={selectedElement.fontSize}
                            onChange={(e) => updateSelectedElement({ fontSize: Number(e.target.value) })}
                            className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-mono uppercase text-gray-500">Width</span>
                          <input
                            type="number"
                            value={selectedElement.width}
                            onChange={(e) => updateSelectedElement({ width: Number(e.target.value) })}
                            className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                          />
                        </label>
                      </>
                    )}

                    {selectedElement.kind !== 'text' && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block">
                            <span className="text-[10px] font-mono uppercase text-gray-500">Width</span>
                            <input
                              type="number"
                              value={selectedElement.width}
                              onChange={(e) => updateSelectedElement({ width: Number(e.target.value) })}
                              className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[10px] font-mono uppercase text-gray-500">Height</span>
                            <input
                              type="number"
                              value={selectedElement.height}
                              onChange={(e) => updateSelectedElement({ height: Number(e.target.value) })}
                              className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                            />
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Next Up Section (Static) */}
        <div className="border-t-2 border-black p-4 bg-black text-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-display text-sm uppercase">Next Up</h3>
          </div>
          <ul className="text-xs space-y-1.5 opacity-80">
            <li>• AI-powered brand kit generation</li>
            <li>• Alignment guides & snapping</li>
            <li>• Multi-select & batch export</li>
          </ul>
        </div>
      </aside>

      {/* AI Panel */}
      {!isAIPanelOpen ? (
        <button
          onClick={() => setIsAIPanelOpen(true)}
          className="fixed right-6 bottom-6 p-4 bg-black text-white border-2 border-black btn-brutal z-50 hover:bg-red-500"
        >
          AI
        </button>
      ) : null}

      <AIPanel isOpen={isAIPanelOpen} onClose={() => setIsAIPanelOpen(false)} />
    </div>
  )
}
