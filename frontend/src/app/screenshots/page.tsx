'use client'

import { startTransition, useState } from 'react'
import { Download, ImagePlus, Layers3, Palette, Sparkles, Type, Upload } from 'lucide-react'
import { AIPanel } from '@/components/AIPanel'
import ScreenshotCanvas from '@/components/screenshots/ScreenshotCanvas'
import { Sidebar } from '@/components/Sidebar'
import {
  DEVICE_PRESETS,
  generateSceneDeck,
  scaleSceneSpec,
  updateSceneElement,
  type SceneDeck,
  type SceneDeviceType,
  type SceneElement,
  type ScreenshotAsset,
} from '@/lib/screenshot-spec'

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

export default function ScreenshotsPage() {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false)
  const [appName, setAppName] = useState('Pulse Studio')
  const [description, setDescription] = useState('用更轻的流程管理训练计划、习惯追踪和每日反馈，让用户在第一屏就理解核心价值。')
  const [deviceType, setDeviceType] = useState<SceneDeviceType>('iphone_67')
  const [uploads, setUploads] = useState<ScreenshotAsset[]>([])
  const [logoAsset, setLogoAsset] = useState<ScreenshotAsset | null>(null)
  const [deck, setDeck] = useState<SceneDeck | null>(null)
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [exportRequest, setExportRequest] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currentScene = deck?.scenes.find((scene) => scene.id === currentSceneId) ?? deck?.scenes[0] ?? null
  const selectedElement = currentScene?.elements.find((element) => element.id === selectedElementId) ?? null

  async function handleUploadFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])

    if (files.length === 0) {
      return
    }

    setErrorMessage(null)

    try {
      const nextAssets = await Promise.all(files.map(fileToAsset))
      setUploads((current) => [...current, ...nextAssets])
    } catch {
      setErrorMessage('部分截图读取失败，请重新上传。')
    } finally {
      event.target.value = ''
    }
  }

  async function handleLogoFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      setLogoAsset(await fileToAsset(file))
      setErrorMessage(null)
    } catch {
      setErrorMessage('Logo 读取失败，请换一张图片重试。')
    } finally {
      event.target.value = ''
    }
  }

  function handleGenerateDraft() {
    if (uploads.length === 0) {
      setErrorMessage('请先上传至少一张截图。')
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
      setCurrentSceneId(nextDeck.scenes[0]?.id ?? null)
      setSelectedElementId(nextDeck.scenes[0]?.elements[0]?.id ?? null)
      setErrorMessage(null)
    })
  }

  function updateCurrentScene(nextScene: NonNullable<typeof currentScene>) {
    setDeck((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        scenes: current.scenes.map((scene) => (scene.id === nextScene.id ? nextScene : scene)),
      }
    })
  }

  function handleDeviceTypeChange(nextType: SceneDeviceType) {
    setDeviceType(nextType)

    setDeck((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        scenes: current.scenes.map((scene) => scaleSceneSpec(scene, nextType)),
      }
    })
  }

  function updateSelectedElement(patch: Partial<SceneElement>) {
    if (!currentScene || !selectedElement) {
      return
    }

    updateCurrentScene(updateSceneElement(currentScene, selectedElement.id, patch))
  }

  function handleExportReady(dataUrl: string) {
    const link = document.createElement('a')
    const sceneLabel = currentScene?.story.title ?? 'scene'
    link.href = dataUrl
    link.download = `${sanitizeFilename(appName)}-${sanitizeFilename(sceneLabel)}-${deviceType}.png`
    link.click()
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-black">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.35em] text-gray-500">Screenshot Workbench</p>
            <h1 className="text-4xl font-display font-bold uppercase tracking-wide mt-2">Design App Store Screens</h1>
          </div>
          <div className="flex gap-3">
            <button className="btn-brutal btn-brutal-secondary" onClick={handleGenerateDraft}>
              <Sparkles className="w-5 h-5" />
              Generate Draft
            </button>
            <button
              className="btn-brutal"
              onClick={() => setExportRequest((current) => current + 1)}
              disabled={!currentScene}
            >
              <Download className="w-5 h-5" />
              Download PNG
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_320px] gap-6">
          <section className="space-y-6">
            <div className="card-brutal p-5 bg-white">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-black">
                <Palette className="w-5 h-5" />
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500">Project Brief</p>
                  <h2 className="font-display text-2xl uppercase">Inputs</h2>
                </div>
              </div>

              <label className="block mb-4">
                <span className="meta-label">App Name</span>
                <input
                  value={appName}
                  onChange={(event) => setAppName(event.target.value)}
                  className="mt-2 w-full border-2 border-black px-3 py-3 text-sm font-medium"
                />
              </label>

              <label className="block mb-4">
                <span className="meta-label">Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  className="mt-2 w-full border-2 border-black px-3 py-3 text-sm leading-relaxed"
                />
              </label>

              <label className="block mb-4">
                <span className="meta-label">Target Device</span>
                <select
                  value={deviceType}
                  onChange={(event) => handleDeviceTypeChange(event.target.value as SceneDeviceType)}
                  className="mt-2 w-full border-2 border-black px-3 py-3 text-sm font-medium bg-white"
                >
                  {Object.entries(DEVICE_PRESETS).map(([value, preset]) => (
                    <option key={value} value={value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-4">
                <label className="block border-2 border-dashed border-black p-4 cursor-pointer hover:bg-yellow-50 transition-colors">
                  <span className="flex items-center gap-2 font-display uppercase text-lg">
                    <Upload className="w-5 h-5" />
                    Upload Screenshots
                  </span>
                  <span className="block text-xs font-mono uppercase tracking-[0.25em] text-gray-500 mt-2">
                    Multiple files supported
                  </span>
                  <input className="hidden" type="file" accept="image/*" multiple onChange={handleUploadFiles} />
                </label>

                <label className="block border-2 border-dashed border-black p-4 cursor-pointer hover:bg-teal-50 transition-colors">
                  <span className="flex items-center gap-2 font-display uppercase text-lg">
                    <ImagePlus className="w-5 h-5" />
                    Upload Logo
                  </span>
                  <span className="block text-xs font-mono uppercase tracking-[0.25em] text-gray-500 mt-2">
                    Optional badge override
                  </span>
                  <input className="hidden" type="file" accept="image/*" onChange={handleLogoFile} />
                </label>
              </div>

              {errorMessage ? (
                <p className="mt-4 border-2 border-red-500 bg-red-50 px-3 py-3 text-sm font-medium text-red-700">{errorMessage}</p>
              ) : null}
            </div>

            <div className="card-brutal p-5 bg-white">
              <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-black">
                <div className="flex items-center gap-3">
                  <Layers3 className="w-5 h-5" />
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500">Uploads</p>
                    <h2 className="font-display text-2xl uppercase">{uploads.length} Screens</h2>
                  </div>
                </div>
                {logoAsset ? <span className="text-xs font-mono uppercase tracking-[0.25em]">Logo Ready</span> : null}
              </div>

              <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
                {uploads.length === 0 ? (
                  <p className="text-sm font-mono uppercase tracking-[0.25em] text-gray-500">No screenshots uploaded yet.</p>
                ) : (
                  uploads.map((upload, index) => (
                    <div key={upload.id} className="border-2 border-black p-3 bg-gray-50">
                      <p className="font-bold text-sm uppercase">Screen {index + 1}</p>
                      <p className="text-xs font-mono uppercase tracking-[0.25em] text-gray-500 mt-1">{upload.name}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="min-w-0">
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

            {deck ? (
              <div className="card-brutal p-5 bg-white mt-6">
                <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-black">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500">Storyboard</p>
                    <h2 className="font-display text-2xl uppercase">Generated Pages</h2>
                  </div>
                  <p className="text-sm font-bold uppercase">{deck.brandKit.themeName}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {deck.scenes.map((scene) => (
                    <button
                      key={scene.id}
                      onClick={() => {
                        setCurrentSceneId(scene.id)
                        setSelectedElementId(scene.elements[0]?.id ?? null)
                      }}
                      className={`text-left border-2 p-4 transition-colors ${
                        currentScene?.id === scene.id ? 'border-black bg-yellow-100' : 'border-black bg-gray-50 hover:bg-white'
                      }`}
                    >
                      <p className="font-display text-lg uppercase leading-none">{scene.story.title}</p>
                      <p className="text-xs font-mono uppercase tracking-[0.25em] text-gray-500 mt-3">{scene.story.subtitle}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="space-y-6">
            <div className="card-brutal p-5 bg-white">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-black">
                <Type className="w-5 h-5" />
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500">Inspector</p>
                  <h2 className="font-display text-2xl uppercase">{selectedElement ? selectedElement.kind : 'Select Layer'}</h2>
                </div>
              </div>

              {!selectedElement ? (
                <p className="text-sm font-mono uppercase tracking-[0.2em] text-gray-500">
                  Click a title, screenshot, or logo on the canvas to edit it.
                </p>
              ) : (
                <div className="space-y-4">
                  <label className="block">
                    <span className="meta-label">Position X</span>
                    <input
                      type="number"
                      value={selectedElement.x}
                      onChange={(event) => updateSelectedElement({ x: Number(event.target.value) })}
                      className="mt-2 w-full border-2 border-black px-3 py-3 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="meta-label">Position Y</span>
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={(event) => updateSelectedElement({ y: Number(event.target.value) })}
                      className="mt-2 w-full border-2 border-black px-3 py-3 text-sm"
                    />
                  </label>

                  {selectedElement.kind === 'text' ? (
                    <>
                      <label className="block">
                        <span className="meta-label">Copy</span>
                        <textarea
                          value={selectedElement.text}
                          onChange={(event) => updateSelectedElement({ text: event.target.value })}
                          rows={4}
                          className="mt-2 w-full border-2 border-black px-3 py-3 text-sm"
                        />
                      </label>

                      <label className="block">
                        <span className="meta-label">Font Size</span>
                        <input
                          type="number"
                          value={selectedElement.fontSize}
                          onChange={(event) => updateSelectedElement({ fontSize: Number(event.target.value) })}
                          className="mt-2 w-full border-2 border-black px-3 py-3 text-sm"
                        />
                      </label>

                      <label className="block">
                        <span className="meta-label">Width</span>
                        <input
                          type="number"
                          value={selectedElement.width}
                          onChange={(event) => updateSelectedElement({ width: Number(event.target.value) })}
                          className="mt-2 w-full border-2 border-black px-3 py-3 text-sm"
                        />
                      </label>
                    </>
                  ) : null}

                  {selectedElement.kind !== 'text' ? (
                    <>
                      <label className="block">
                        <span className="meta-label">Width</span>
                        <input
                          type="number"
                          value={selectedElement.width}
                          onChange={(event) => updateSelectedElement({ width: Number(event.target.value) })}
                          className="mt-2 w-full border-2 border-black px-3 py-3 text-sm"
                        />
                      </label>

                      <label className="block">
                        <span className="meta-label">Height</span>
                        <input
                          type="number"
                          value={selectedElement.height}
                          onChange={(event) => updateSelectedElement({ height: Number(event.target.value) })}
                          className="mt-2 w-full border-2 border-black px-3 py-3 text-sm"
                        />
                      </label>
                    </>
                  ) : null}
                </div>
              )}
            </div>

            <div className="card-brutal p-5 bg-black text-white">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5" />
                <h2 className="font-display text-2xl uppercase">Next Up</h2>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="border-b border-white/20 pb-3">接入 AI 输出 `Brand Kit / Storyboard / Scene Spec`，替换当前规则草稿生成。</li>
                <li className="border-b border-white/20 pb-3">加入多选图层、对齐线、吸附和缩放手柄。</li>
                <li>把付费导出和 ZIP 批量导出接到后端授权层。</li>
              </ul>
            </div>
          </section>
        </div>
      </main>

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
