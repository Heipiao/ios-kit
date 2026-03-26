import { useState, useRef } from 'react'
import { Upload, Download, Smartphone, Tablet, X, Check, Sparkles } from 'lucide-react'

type DeviceType = 'iphone_65' | 'iphone_67' | 'iphone_55' | 'ipad_129' | 'ipad_11' | 'ipad_109'
type BackgroundStyle = 'gradient' | 'gradient_blue' | 'gradient_purple' | 'gradient_sunset' | 'solid_white' | 'solid_black' | 'dark'

interface ProcessedResult {
  deviceType: string
  imageUrl: string
  status: 'pending' | 'processing' | 'completed' | 'error'
}

export function ScreenshotFactory() {
  const [uploadedImages, setUploadedImages] = useState<{ name: string; url: string; base64: string }[]>([])
  const [selectedDevices, setSelectedDevices] = useState<DeviceType[]>(['iphone_65', 'iphone_67', 'ipad_129'])
  const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStyle>('gradient_sunset')
  const [showFrame, setShowFrame] = useState(true)
  const [caption, setCaption] = useState('')
  const [processed, setProcessed] = useState<ProcessedResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setUploadedImages(prev => [...prev, {
          name: file.name,
          url: URL.createObjectURL(file),
          base64,
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  const toggleDevice = (device: DeviceType) => {
    setSelectedDevices(prev =>
      prev.includes(device)
        ? prev.filter(d => d !== device)
        : [...prev, device]
    )
  }

  const handleProcess = async () => {
    if (uploadedImages.length === 0 || selectedDevices.length === 0) return

    setIsProcessing(true)
    const results: ProcessedResult[] = []

    // 初始化结果列表
    uploadedImages.forEach(() => {
      selectedDevices.forEach(device => {
        results.push({ deviceType: device, imageUrl: '', status: 'pending' })
      })
    })
    setProcessed(results)

    try {
      let index = 0
      for (const image of uploadedImages) {
        for (const device of selectedDevices) {
          // 更新状态为处理中
          setProcessed(prev => prev.map((r, i) =>
            i === index ? { ...r, status: 'processing' } : r
          ))

          try {
            const response = await fetch(`${API_BASE_URL}/api/screenshot/process`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image_base64: image.base64,
                device_type: device,
                background_style: backgroundStyle,
                show_frame: showFrame,
                caption: caption || undefined,
              }),
            })

            const data = await response.json()

            if (data.success) {
              setProcessed(prev => prev.map((r, i) =>
                i === index ? { ...r, status: 'completed', imageUrl: data.image_base64 } : r
              ))
            } else {
              setProcessed(prev => prev.map((r, i) =>
                i === index ? { ...r, status: 'error' } : r
              ))
            }
          } catch (error) {
            setProcessed(prev => prev.map((r, i) =>
              i === index ? { ...r, status: 'error' } : r
            ))
          }

          index++
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadAll = () => {
    const completed = processed.filter(r => r.status === 'completed')
    completed.forEach((item, index) => {
      setTimeout(() => {
        const link = document.createElement('a')
        link.href = item.imageUrl
        link.download = `screenshot_${item.deviceType}_${index}.png`
        link.click()
      }, index * 200)
    })
  }

  const devices: { id: DeviceType; name: string; icon: React.ReactNode; size: string }[] = [
    { id: 'iphone_65', name: 'iPhone 6.5"', icon: <Smartphone className="w-4 h-4" />, size: '1284x2778' },
    { id: 'iphone_67', name: 'iPhone 6.7"', icon: <Smartphone className="w-4 h-4" />, size: '1290x2796' },
    { id: 'iphone_55', name: 'iPhone 5.5"', icon: <Smartphone className="w-4 h-4" />, size: '1242x2208' },
    { id: 'ipad_129', name: 'iPad 12.9"', icon: <Tablet className="w-4 h-4" />, size: '2048x2732' },
    { id: 'ipad_11', name: 'iPad 11"', icon: <Tablet className="w-4 h-4" />, size: '1668x2388' },
    { id: 'ipad_109', name: 'iPad 10.9"', icon: <Tablet className="w-4 h-4" />, size: '1640x2360' },
  ]

  const backgroundOptions: { id: BackgroundStyle; name: string; preview: string }[] = [
    { id: 'gradient_sunset', name: '日落', preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 'gradient_blue', name: '蓝色', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'gradient_purple', name: '紫色', preview: 'linear-gradient(135deg, #9b59b6 0%, #3498db 100%)' },
    { id: 'solid_white', name: '白色', preview: '#ffffff' },
    { id: 'solid_black', name: '黑色', preview: '#000000' },
    { id: 'dark', name: '深色', preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold">截图工厂</h1>
        </div>
        <p className="text-gray-500">
          上传截图，AI 自动生成全尺寸 App Store 截图
          <span className="ml-2 text-primary-600">💡 也可以用右侧 AI 助手对话处理</span>
        </p>
      </div>

      {/* 步骤 1: 上传 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-semibold mb-4">步骤 1: 上传原始截图</h2>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-1">拖拽截图到此处，或点击上传</p>
          <p className="text-sm text-gray-400">支持 PNG, JPG</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* 已上传预览 */}
        {uploadedImages.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mt-4">
            {uploadedImages.map((img, index) => (
              <div key={index} className="relative aspect-[9/16] rounded-lg overflow-hidden border">
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                <button
                  onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 步骤 2: 选择设备 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-semibold mb-4">步骤 2: 选择输出尺寸</h2>
        <div className="grid grid-cols-3 gap-3">
          {devices.map(device => (
            <button
              key={device.id}
              onClick={() => toggleDevice(device.id)}
              className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                selectedDevices.includes(device.id)
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`${selectedDevices.includes(device.id) ? 'text-primary-600' : 'text-gray-400'}`}>
                {device.icon}
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">{device.name}</div>
                <div className="text-xs text-gray-400">{device.size}</div>
              </div>
              {selectedDevices.includes(device.id) && (
                <Check className="w-4 h-4 text-primary-600 ml-auto" />
              )}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-3">
          💡 App Store 要求：iPhone 至少上传 6.5" 和 6.7"
        </p>
      </div>

      {/* 步骤 3: 背景样式 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-semibold mb-4">步骤 3: 选择背景样式</h2>
        <div className="grid grid-cols-4 gap-3">
          {backgroundOptions.map(bg => (
            <button
              key={bg.id}
              onClick={() => setBackgroundStyle(bg.id)}
              className={`h-20 rounded-lg border-2 transition-all ${
                backgroundStyle === bg.id
                  ? 'border-primary-500 scale-105 shadow-md'
                  : 'border-gray-200'
              }`}
              style={{ background: bg.preview }}
            >
              <span className="sr-only">{bg.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 步骤 4: 选项 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-semibold mb-4">步骤 4: 选项</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFrame}
              onChange={(e) => setShowFrame(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm">显示设备边框</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标题文字（可选）
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full max-w-md px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="如：Fitness Pro - 你的私人健身教练"
            />
          </div>
        </div>
      </div>

      {/* 处理按钮 */}
      <div className="mb-6">
        <button
          onClick={handleProcess}
          disabled={uploadedImages.length === 0 || selectedDevices.length === 0 || isProcessing}
          className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
        >
          {isProcessing ? '处理中...' : `生成 ${selectedDevices.length * uploadedImages.length} 张截图`}
        </button>
      </div>

      {/* 处理结果 */}
      {processed.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">处理结果</h2>
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Download className="w-4 h-4" />
              下载全部
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {processed.map((item, index) => (
              <div key={index} className="relative aspect-[9/16] rounded-lg overflow-hidden border">
                {item.status === 'completed' ? (
                  <img src={item.imageUrl} alt={item.deviceType} className="w-full h-full object-cover" />
                ) : item.status === 'error' ? (
                  <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-sm">
                    处理失败
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-2 py-1">
                  {item.deviceType.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
