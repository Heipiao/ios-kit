'use client'

import { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import type Konva from 'konva'
import { Circle, Group, Image as KonvaImage, Layer, Rect, Stage, Text, Transformer, RegularPolygon } from 'react-konva'
import { DEVICE_PRESETS, FONT_LIBRARY, updateSceneElement, deleteElement, type SceneElement, type SceneSpec, type ScreenshotAsset, type FontFamily } from '@/lib/screenshot-spec'

export interface ScreenshotCanvasProps {
  scene: SceneSpec | null
  uploads: ScreenshotAsset[]
  logoAsset: ScreenshotAsset | null
  selectedElementId: string | null
  onSelectElement: (elementId: string | null) => void
  onChangeScene: (scene: SceneSpec) => void
  exportRequest: number
  onExportReady: (dataUrl: string) => void
}

// Phone frame component with realistic iPhone styling
function PhoneFrame({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  const cornerRadius = Math.min(width, height) * 0.14
  const borderWidth = Math.max(8, Math.min(width, height) * 0.025)
  const screenCornerRadius = cornerRadius - borderWidth
  const notchWidth = width * 0.32
  const notchHeight = borderWidth * 1.4

  return (
    <Group>
      {/* Outer metallic frame with multi-layer gradient for depth */}
      <Rect
        width={width}
        height={height}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: width, y: height }}
        fillLinearGradientColorStops={[0, '#3a3a3a', 0.2, '#1f1f1f', 0.5, '#0d0d0d', 0.8, '#1a1a1a', 1, '#2d2d2d']}
        cornerRadius={cornerRadius}
        shadowColor="rgba(0,0,0,0.7)"
        shadowBlur={40}
        shadowOffset={{ x: 0, y: 20 }}
      />
      {/* Metallic edge highlight */}
      <Rect
        x={2}
        y={2}
        width={width - 4}
        height={height - 4}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={2}
        cornerRadius={cornerRadius - 2}
      />
      {/* Inner bezel - deep black */}
      <Rect
        x={borderWidth}
        y={borderWidth}
        width={width - borderWidth * 2}
        height={height - borderWidth * 2}
        fill="#050505"
        cornerRadius={screenCornerRadius}
        shadowColor="rgba(0,0,0,0.8)"
        shadowBlur={10}
        shadowOffset={{ x: 0, y: 2 }}
      />
      {/* Notch with subtle gradient */}
      <Rect
        x={(width - notchWidth) / 2}
        y={borderWidth - 1}
        width={notchWidth}
        height={notchHeight}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: 0, y: notchHeight }}
        fillLinearGradientColorStops={[0, '#1a1a1a', 1, '#0a0a0a']}
        cornerRadius={4}
      />
      {/* Speaker mesh in notch */}
      <Rect
        x={(width - notchWidth * 0.6) / 2}
        y={borderWidth}
        width={notchWidth * 0.6}
        height={2}
        fill="#2a2a2a"
        cornerRadius={1}
      />
      {/* Screen area - where content shows */}
      <Group
        x={borderWidth + 4}
        y={borderWidth + 4}
        width={width - borderWidth * 2 - 8}
        height={height - borderWidth * 2 - 8}
        clipFunc={(ctx) => {
          const r = screenCornerRadius - 4
          ctx.beginPath()
          ctx.roundRect(0, 0, width - borderWidth * 2 - 8, height - borderWidth * 2 - 8, r)
          ctx.closePath()
        }}
      >
        {children}
      </Group>
      {/* Inner screen highlight edge */}
      <Rect
        x={borderWidth + 4}
        y={borderWidth + 4}
        width={width - borderWidth * 2 - 8}
        height={height - borderWidth * 2 - 8}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1.5}
        cornerRadius={screenCornerRadius - 4}
      />
      {/* Outer glow for depth */}
      <Rect
        width={width}
        height={height}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={1}
        cornerRadius={cornerRadius}
      />
    </Group>
  )
}

function useLoadedImages(sources: Record<string, string>) {
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({})

  useEffect(() => {
    const entries = Object.entries(sources)
    if (entries.length === 0) {
      setImages({})
      return
    }

    let cancelled = false

    Promise.all(
      entries.map(
        ([key, src]) =>
          new Promise<[string, HTMLImageElement]>((resolve, reject) => {
            const image = new window.Image()
            image.onload = () => resolve([key, image])
            image.onerror = reject
            image.src = src
          })
      )
    )
      .then((loadedEntries) => {
        if (!cancelled) {
          setImages(Object.fromEntries(loadedEntries))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setImages({})
        }
      })

    return () => {
      cancelled = true
    }
  }, [sources])

  return images
}

// Resize handle component
interface ResizeHandleProps {
  x: number
  y: number
  onDragEnd: (deltaX: number, deltaY: number) => void
  color?: string
}

const ResizeHandle = ({ x, y, onDragEnd, color = '#ffcc00' }: ResizeHandleProps) => {
  const handleSize = 16

  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragEnd={(e) => {
        onDragEnd(e.target.x(), e.target.y())
        e.target.x(0)
        e.target.y(0)
      }}
    >
      <Rect
        x={-handleSize / 2}
        y={-handleSize / 2}
        width={handleSize}
        height={handleSize}
        fill={color}
        stroke="#000"
        strokeWidth={2}
      />
      <RegularPolygon
        sides={3}
        radius={4}
        fill="#000"
        rotation={180}
      />
    </Group>
  )
}

// Selected element with transformer for resize
const SelectedElementWrapper = ({
  element,
  images,
  onSelectElement,
  onChangeScene,
  scene,
  onResize,
}: {
  element: SceneElement & { kind: 'image' }
  images: Record<string, HTMLImageElement>
  onSelectElement: (elementId: string | null) => void
  onChangeScene: (scene: SceneSpec) => void
  scene: SceneSpec
  onResize: (width: number, height: number) => void
}) => {
  const groupRef = useRef<any>(null)
  const image = images[element.assetId]
  const showFrame = scene.showPhoneFrame

  const handleResizeDragEnd = (deltaX: number, deltaY: number) => {
    const newWidth = Math.max(100, element.width + deltaX)
    const newHeight = Math.max(100, element.height + deltaY)
    onResize(newWidth, newHeight)
  }

  if (showFrame) {
    const frameWidth = element.width + 24
    const frameHeight = element.height + 24

    return (
      <Group
        x={element.x - 12}
        y={element.y - 12}
        draggable
        onClick={() => onSelectElement(element.id)}
        onTap={() => onSelectElement(element.id)}
        onDragEnd={(event) => {
          onChangeScene(
            updateSceneElement(scene, element.id, {
              x: Math.round(event.target.x()) + 12,
              y: Math.round(event.target.y()) + 12,
            })
          )
        }}
      >
        <PhoneFrame width={frameWidth} height={frameHeight}>
          <Group
            width={element.width}
            height={element.height}
            clipFunc={(ctx) => {
              const r = Math.min(element.width, element.height) * 0.05
              ctx.beginPath()
              ctx.roundRect(0, 0, element.width, element.height, r)
              ctx.closePath()
            }}
          >
            {image ? (
              <KonvaImage
                image={image}
                x={(element.width - (image.width * element.height / image.height)) / 2}
                y={0}
                width={image.width * element.height / image.height}
                height={element.height}
              />
            ) : (
              <Rect width={element.width} height={element.height} fill="#d9d4c9" />
            )}
          </Group>
        </PhoneFrame>
        {/* Resize handles */}
        <ResizeHandle x={frameWidth} y={frameHeight} onDragEnd={handleResizeDragEnd} />
      </Group>
    )
  }

  // No frame version
  return (
    <Group
      x={element.x}
      y={element.y}
      ref={groupRef}
      draggable
      onClick={() => onSelectElement(element.id)}
      onTap={() => onSelectElement(element.id)}
      onDragEnd={(event) => {
        onChangeScene(
          updateSceneElement(scene, element.id, {
            x: Math.round(event.target.x()),
            y: Math.round(event.target.y()),
          })
        )
      }}
    >
      {/* Background card */}
      <Rect
        width={element.width}
        height={element.height}
        fill="#ffffff"
        cornerRadius={42}
        shadowColor={element.shadowColor}
        shadowBlur={44}
        shadowOffset={{ x: 0, y: 24 }}
        shadowOpacity={0.45}
      />
      {/* Image with clip */}
      <Group
        width={element.width}
        height={element.height}
        clipFunc={(ctx) => {
          const r = 42
          ctx.beginPath()
          ctx.roundRect(0, 0, element.width, element.height, r)
          ctx.closePath()
        }}
      >
        {image ? (
          <KonvaImage
            image={image}
            x={(element.width - image.width) / 2}
            y={(element.height - image.height) / 2}
          />
        ) : (
          <Rect width={element.width} height={element.height} fill="#d9d4c9" cornerRadius={42} />
        )}
      </Group>
      {/* Border */}
      <Rect
        width={element.width}
        height={element.height}
        stroke="rgba(17,17,17,0.14)"
        strokeWidth={6}
        cornerRadius={42}
      />
      {/* Resize handle */}
      <ResizeHandle x={element.width} y={element.height} onDragEnd={handleResizeDragEnd} />
    </Group>
  )
}

const TextElement = ({
  element,
  onSelectElement,
  onChangeScene,
  scene,
  onDelete,
}: {
  element: SceneElement & { kind: 'text' }
  onSelectElement: (elementId: string | null) => void
  onChangeScene: (scene: SceneSpec) => void
  scene: SceneSpec
  onDelete: () => void
}) => {
  return (
    <Group
      x={element.x}
      y={element.y}
      draggable
      onClick={(e) => {
        e.cancelBubble = true
        onSelectElement(element.id)
      }}
      onTap={(e) => {
        e.cancelBubble = true
        onSelectElement(element.id)
      }}
      onDragEnd={(event) => {
        onChangeScene(
          updateSceneElement(scene, element.id, {
            x: Math.round(event.target.x()),
            y: Math.round(event.target.y()),
          })
        )
      }}
    >
      <Text
        text={element.text}
        fontSize={element.fontSize}
        fontFamily={element.fontFamily}
        fontStyle={element.fontWeight >= 700 ? 'bold' : 'normal'}
        fill={element.color}
        lineHeight={1.1}
        width={element.width}
      />
      {/* Delete button (shown on selection) */}
      <Group
        x={element.width + 8}
        y={-8}
        onClick={(e) => {
          e.cancelBubble = true
          onDelete()
        }}
        onTap={(e) => {
          e.cancelBubble = true
          onDelete()
        }}
        style={{ cursor: 'pointer' }}
      >
        <Rect width={20} height={20} fill="#ff4444" cornerRadius={4} />
        <Text text="×" fontSize={18} fill="#fff" align="center" width={20} offsetY={-2} />
      </Group>
    </Group>
  )
}

const LogoElement = ({
  element,
  images,
  onSelectElement,
  onChangeScene,
  onDelete,
  scene,
}: {
  element: SceneElement & { kind: 'logo' }
  images: Record<string, HTMLImageElement>
  onSelectElement: (elementId: string | null) => void
  onChangeScene: (scene: SceneSpec) => void
  onDelete: () => void
  scene: SceneSpec
}) => {
  const logoImage = element.assetId ? images[element.assetId] : null

  return (
    <Group
      x={element.x}
      y={element.y}
      draggable
      onClick={(e) => {
        e.cancelBubble = true
        onSelectElement(element.id)
      }}
      onTap={(e) => {
        e.cancelBubble = true
        onSelectElement(element.id)
      }}
      onDragEnd={(event) => {
        onChangeScene(
          updateSceneElement(scene, element.id, {
            x: Math.round(event.target.x()),
            y: Math.round(event.target.y()),
          })
        )
      }}
    >
      <Circle
        radius={Math.round(element.width / 2)}
        fill={element.fill}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={10}
        shadowOffset={{ x: 0, y: 4 }}
      />
      {logoImage ? (
        <KonvaImage
          image={logoImage}
          x={Math.round(element.width * 0.18)}
          y={Math.round(element.height * 0.18)}
          width={Math.round(element.width * 0.64)}
          height={Math.round(element.height * 0.64)}
        />
      ) : (
        <Text
          x={0}
          y={Math.round(element.height * 0.18)}
          width={element.width}
          height={element.height}
          align="center"
          verticalAlign="middle"
          text={element.label}
          fontSize={Math.round(element.width * 0.34)}
          fontStyle="bold"
          fill={element.textColor}
        />
      )}
      {/* Delete button */}
      <Group
        x={element.width + 4}
        y={-4}
        onClick={(e) => {
          e.cancelBubble = true
          onDelete()
        }}
        onTap={(e) => {
          e.cancelBubble = true
          onDelete()
        }}
        style={{ cursor: 'pointer' }}
      >
        <Rect width={16} height={16} fill="#ff4444" cornerRadius={3} />
        <Text text="×" fontSize={14} fill="#fff" align="center" width={16} offsetY={-1} />
      </Group>
    </Group>
  )
}

const SelectionOutline = ({ element }: { element: SceneElement }) => (
  <Rect
    x={element.x - 12}
    y={element.y - 12}
    width={element.width + 24}
    height={element.height + 24}
    stroke="#ffcc00"
    strokeWidth={10}
    dash={[24, 14]}
    listening={false}
    cornerRadius={element.kind === 'logo' ? element.width : 40}
  />
)

export default function ScreenshotCanvasInner({
  scene,
  uploads,
  logoAsset,
  selectedElementId,
  onSelectElement,
  onChangeScene,
  exportRequest,
  onExportReady,
}: ScreenshotCanvasProps) {
  const stageRef = useRef<Konva.Stage | null>(null)
  const layerRef = useRef<Konva.Layer | null>(null)
  const lastExportRequestRef = useRef(0)

  const previewWidth = scene ? DEVICE_PRESETS[scene.deviceType].previewWidth : 320
  const previewHeight = scene ? Math.round((scene.height / scene.width) * previewWidth) : 560

  const assetSources = useMemo(() => {
    const sources: Record<string, string> = {}
    for (const upload of uploads) {
      sources[upload.id] = upload.dataUrl
    }
    if (logoAsset) {
      sources[logoAsset.id] = logoAsset.dataUrl
    }
    return sources
  }, [uploads, logoAsset])

  const images = useLoadedImages(assetSources)

  useEffect(() => {
    if (!scene || exportRequest === 0 || exportRequest === lastExportRequestRef.current || !stageRef.current) {
      return
    }

    lastExportRequestRef.current = exportRequest
    onExportReady(stageRef.current.toDataURL({ pixelRatio: 1 }))
  }, [exportRequest, onExportReady, scene])

  const handleDeleteElement = useCallback((elementId: string) => {
    if (scene) {
      onChangeScene(deleteElement(scene, elementId))
    }
  }, [scene, onChangeScene])

  const handleImageResize = useCallback((elementId: string, newWidth: number, newHeight: number) => {
    if (scene) {
      onChangeScene(updateSceneElement(scene, elementId, { width: newWidth, height: newHeight }))
    }
  }, [scene, onChangeScene])

  if (!scene) {
    return (
      <div className="card-brutal p-8 bg-white flex items-center justify-center text-center min-h-[640px]">
        <div>
          <p className="font-display text-2xl uppercase tracking-wide">No Draft Yet</p>
          <p className="text-sm font-mono text-gray-500 mt-2 uppercase">Upload screenshots and generate a first pass.</p>
        </div>
      </div>
    )
  }

  const scale = previewWidth / scene.width

  return (
    <div className="card-brutal bg-white p-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-black">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500">Live Canvas</p>
          <h2 className="font-display text-2xl uppercase tracking-wide">{DEVICE_PRESETS[scene.deviceType].label}</h2>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs uppercase text-gray-500">Selected</p>
          <p className="font-bold text-sm uppercase">{selectedElementId ?? 'None'}</p>
        </div>
      </div>

      <div className="overflow-auto rounded-sm border-2 border-black bg-[#ece9df] p-5">
        <div style={{ width: previewWidth, height: previewHeight }}>
          <div
            style={{
              width: scene.width,
              height: scene.height,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <Stage
              ref={stageRef}
              width={scene.width}
              height={scene.height}
              onMouseDown={(event) => {
                if (event.target === event.target.getStage()) {
                  onSelectElement(null)
                }
              }}
            >
              <Layer ref={layerRef}>
                {/* Background gradient */}
                <Rect
                  width={scene.width}
                  height={scene.height}
                  fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                  fillLinearGradientEndPoint={{ x: scene.width, y: scene.height }}
                  fillLinearGradientColorStops={[0, scene.background.from, 1, scene.background.to]}
                />
                {/* Bottom reflection area */}
                <Rect
                  x={Math.round(scene.width * 0.06)}
                  y={Math.round(scene.height * 0.84)}
                  width={Math.round(scene.width * 0.88)}
                  height={Math.round(scene.height * 0.08)}
                  fill="rgba(244,241,234,0.16)"
                />

                {scene.elements.map((element) => {
                  const isSelected = selectedElementId === element.id

                  if (element.kind === 'text') {
                    return (
                      <TextElement
                        key={element.id}
                        element={element}
                        onSelectElement={onSelectElement}
                        onChangeScene={onChangeScene}
                        scene={scene}
                        onDelete={() => handleDeleteElement(element.id)}
                      />
                    )
                  }

                  if (element.kind === 'image') {
                    if (isSelected) {
                      return (
                        <Group key={element.id}>
                          <SelectedElementWrapper
                            element={element}
                            images={images}
                            onSelectElement={onSelectElement}
                            onChangeScene={onChangeScene}
                            scene={scene}
                            onResize={(w, h) => handleImageResize(element.id, w, h)}
                          />
                        </Group>
                      )
                    }
                    return (
                      <SelectedElementWrapper
                        key={element.id}
                        element={element}
                        images={images}
                        onSelectElement={onSelectElement}
                        onChangeScene={onChangeScene}
                        scene={scene}
                        onResize={(w, h) => handleImageResize(element.id, w, h)}
                      />
                    )
                  }

                  if (element.kind === 'logo') {
                    return (
                      <LogoElement
                        key={element.id}
                        element={element}
                        images={images}
                        onSelectElement={onSelectElement}
                        onChangeScene={onChangeScene}
                        onDelete={() => handleDeleteElement(element.id)}
                        scene={scene}
                      />
                    )
                  }

                  return null
                })}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>

      {/* Font info */}
      <div className="mt-4 p-3 bg-gray-100 border-2 border-black">
        <p className="text-xs font-mono uppercase tracking-wider text-gray-600 mb-2">Available Fonts (Free for Commercial Use)</p>
        <div className="flex flex-wrap gap-2">
          {FONT_LIBRARY.map((font) => (
            <span
              key={font.value}
              className="px-2 py-1 bg-white border border-black text-xs font-medium"
              style={{ fontFamily: font.value }}
            >
              {font.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
