'use client'

import { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import type Konva from 'konva'
import { Circle, Group, Image as KonvaImage, Layer, Rect, Stage, Text } from 'react-konva'
import { DEVICE_PRESETS, updateSceneElement, type SceneElement, type SceneSpec, type ScreenshotAsset } from '@/lib/screenshot-spec'

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

function PhoneFrame({ width, height }: { width: number; height: number }) {
  const cornerRadius = Math.min(width, height) * 0.08
  const borderWidth = Math.max(4, Math.min(width, height) * 0.015)
  const screenCornerRadius = cornerRadius - borderWidth

  return (
    <Group>
      <Rect
        width={width}
        height={height}
        fill="#1a1a1a"
        cornerRadius={cornerRadius}
        shadowColor="rgba(0,0,0,0.5)"
        shadowBlur={20}
        shadowOffset={{ x: 0, y: 10 }}
      />
      <Rect
        x={borderWidth}
        y={borderWidth}
        width={width - borderWidth * 2}
        height={height - borderWidth * 2}
        fill="#000000"
        cornerRadius={screenCornerRadius}
      />
      <Rect
        x={borderWidth + 2}
        y={borderWidth + 2}
        width={width - borderWidth * 2 - 4}
        height={height - borderWidth * 2 - 4}
        fill="transparent"
        cornerRadius={screenCornerRadius - 2}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={1}
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

// Memoized selection outline
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

// Memoized element node to prevent re-renders during drag
const SceneElementNode = ({
  element,
  images,
  onSelectElement,
  onChangeScene,
  scene,
}: {
  element: SceneElement
  images: Record<string, HTMLImageElement>
  onSelectElement: (elementId: string | null) => void
  onChangeScene: (scene: SceneSpec) => void
  scene: SceneSpec
}) => {
  if (element.kind === 'text') {
    return (
      <Text
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        text={element.text}
        fontSize={element.fontSize}
        fontFamily={element.fontFamily}
        fontStyle={element.fontWeight >= 700 ? 'bold' : 'normal'}
        fill={element.color}
        lineHeight={1.1}
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
      />
    )
  }

  if (element.kind === 'image') {
    const image = images[element.assetId]
    const showFrame = scene.showPhoneFrame

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
          <PhoneFrame width={frameWidth} height={frameHeight} />
          <Group
            x={12}
            y={12}
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
              <KonvaImage image={image} width={element.width} height={element.height} />
            ) : (
              <Rect width={element.width} height={element.height} fill="#d9d4c9" />
            )}
          </Group>
        </Group>
      )
    }

    // No frame - keep original image size, clip to container
    return (
      <Group
        x={element.x}
        y={element.y}
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
        {/* Clip the image to the card bounds */}
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
      </Group>
    )
  }

  const logoImage = element.assetId ? images[element.assetId] : null

  return (
    <Group
      x={element.x}
      y={element.y}
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
      <Circle
        radius={Math.round(element.width / 2)}
        x={Math.round(element.width / 2)}
        y={Math.round(element.height / 2)}
        fill={element.fill}
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
    </Group>
  )
}

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

  // Memoize asset sources to prevent unnecessary re-renders
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

  // Handle drag move with batch rendering for smoother performance
  const handleElementDragEnd = useCallback((elementId: string, newX: number, newY: number) => {
    if (layerRef.current) {
      layerRef.current.batchDraw()
    }
    onChangeScene(updateSceneElement(scene!, elementId, { x: Math.round(newX), y: Math.round(newY) }))
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
                <Rect
                  width={scene.width}
                  height={scene.height}
                  fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                  fillLinearGradientEndPoint={{ x: scene.width, y: scene.height }}
                  fillLinearGradientColorStops={[0, scene.background.from, 1, scene.background.to]}
                />
                <Rect
                  x={Math.round(scene.width * 0.06)}
                  y={Math.round(scene.height * 0.84)}
                  width={Math.round(scene.width * 0.88)}
                  height={Math.round(scene.height * 0.08)}
                  fill="rgba(244,241,234,0.16)"
                />

                {scene.elements.map((element) => {
                  const isSelected = selectedElementId === element.id

                  if (isSelected) {
                    return (
                      <Group key={element.id}>
                        <SelectionOutline element={element} />
                        <SceneElementNode
                          element={element}
                          images={images}
                          onSelectElement={onSelectElement}
                          onChangeScene={onChangeScene}
                          scene={scene}
                        />
                      </Group>
                    )
                  }

                  return (
                    <SceneElementNode
                      key={element.id}
                      element={element}
                      images={images}
                      onSelectElement={onSelectElement}
                      onChangeScene={onChangeScene}
                      scene={scene}
                    />
                  )
                })}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  )
}
