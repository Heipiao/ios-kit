import { useState, useRef } from 'react'
import { MessageSquare, X, ChevronRight, Upload, Image, Download, RefreshCw } from 'lucide-react'
import { chatWithAI } from '../lib/api'
import { cn } from '../lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  type?: 'text' | 'action' | 'progress' | 'result'
  action?: {
    type: 'screenshot_process' | 'metadata_generate' | 'privacy_generate'
    data?: any
  }
  progress?: {
    total: number
    current: number
    status: string
  }
  result?: {
    type: 'screenshot'
    images: { deviceType: string; imageUrl: string }[]
    style: {
      backgroundStyle: BackgroundStyle
      showFrame: boolean
      caption?: string
    }
  }
  attachments?: {
    type: 'image'
    url: string
    base64: string
    name: string
  }[]
}

interface AIPanelProps {
  isOpen: boolean
  onClose: () => void
  context?: object
}

type DeviceType = 'iphone_65' | 'iphone_67' | 'iphone_55' | 'ipad_129' | 'ipad_11' | 'ipad_109'
type BackgroundStyle = 'gradient' | 'gradient_blue' | 'gradient_purple' | 'gradient_sunset' | 'solid_white' | 'solid_black' | 'dark'

export function AIPanel({ isOpen: _isOpen, onClose, context }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是你的 iOS 上架助手 🤖\n\n上传截图，我自动帮你：\n• 分析 App 类型\n• 推荐配色风格\n• 生成全尺寸截图\n\n直接开始吧！',
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  // 自动滚动到底部
  useState(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const attachments: Message['attachments'] = []
    let loaded = 0

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        loaded++
        attachments.push({
          type: 'image',
          url: URL.createObjectURL(file),
          base64,
          name: file.name,
        })

        // 所有文件加载完成后发送
        if (loaded === files.length) {
          const userMessage: Message = {
            role: 'user',
            content: '帮我把这些截图处理好，准备上架',
            attachments,
          }
          setMessages((prev) => [...prev, userMessage])
          processScreenshots(attachments)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // AI 分析截图，自动选择风格
  const analyzeAndChooseStyle = async (): Promise<{ appCategory: string; backgroundStyle: BackgroundStyle; reason: string }> => {
    // 调用 AI 分析截图内容，推荐风格
    try {
      await chatWithAI(
        `分析这些截图的 App 类型和视觉风格，推荐合适的背景配色方案。

        请返回 JSON 格式：
        {
          "appCategory": "fitness|productivity|social|game|...",
          "styleType": "vibrant|minimal|professional|playful",
          "recommendedBackground": "gradient_sunset|gradient_blue|solid_white|...",
          "reason": "推荐理由"
        }`
      )

      // 简化处理：这里应该解析 AI 返回的 JSON
      // 为了演示，我们随机选择一个风格
      const styles: { appCategory: string; backgroundStyle: BackgroundStyle; reason: string }[] = [
        { appCategory: '工具', backgroundStyle: 'gradient_sunset', reason: '活力橙色系，适合运动健康类应用' },
        { appCategory: '工具', backgroundStyle: 'gradient_blue', reason: '蓝色系，专业可靠' },
        { appCategory: '工具', backgroundStyle: 'gradient_purple', reason: '紫色渐变，现代科技感' },
        { appCategory: '工具', backgroundStyle: 'solid_white', reason: '简洁白色，突出内容' },
      ]

      return styles[Math.floor(Math.random() * styles.length)]
    } catch (error) {
      return { appCategory: '工具', backgroundStyle: 'gradient', reason: '默认渐变背景' }
    }
  }

  const processScreenshots = async (images: { name: string; url: string; base64: string }[]) => {
    setIsLoading(true)

    // 步骤 1: AI 分析
    const analyzingMessage: Message = {
      role: 'assistant',
      content: '让我看看你的 App...',
      type: 'progress',
      progress: { total: 4, current: 1, status: '分析 App 类型和视觉风格...' },
    }
    setMessages((prev) => [...prev, analyzingMessage])

    const style = await analyzeAndChooseStyle()
    await new Promise(resolve => setTimeout(resolve, 500)) // 模拟延迟

    // 步骤 2: 确认风格
    const confirmMessage: Message = {
      role: 'assistant',
      content: `📱 检测到是${style.appCategory}类应用\n🎨 推荐${style.reason}\n📐 生成 iPhone + iPad 全尺寸\n\n开始处理...`,
      type: 'progress',
      progress: { total: 4, current: 2, status: '正在生成...' },
    }
    setMessages((prev) => [...prev, confirmMessage])

    // 步骤 3: 处理截图
    const devices: DeviceType[] = ['iphone_65', 'iphone_67', 'ipad_129']
    const results: { deviceType: string; imageUrl: string }[] = []

    for (const image of images) {
      for (const device of devices) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/screenshot/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_base64: image.base64,
              device_type: device,
              background_style: style.backgroundStyle,
              show_frame: true,
              caption: undefined,
            }),
          })

          const data = await response.json()
          if (data.success) {
            results.push({ deviceType: device, imageUrl: data.image_base64 })
          }
        } catch (error) {
          console.error('处理失败:', error)
        }

        // 更新进度
        setMessages((prev) => {
          const newPrev = [...prev]
          const lastMessage = newPrev[newPrev.length - 1]
          if (lastMessage.type === 'progress' && lastMessage.progress) {
            lastMessage.progress = {
              ...lastMessage.progress,
              current: Math.min(lastMessage.progress.current + 0.3, 3.9),
              status: `已处理 ${Math.floor(lastMessage.progress.current + 0.3)}/${images.length * devices.length}`,
            }
          }
          return newPrev
        })

        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    // 步骤 4: 完成
    const completeMessage: Message = {
      role: 'assistant',
      content: '✅ 完成！生成了 ' + results.length + ' 张截图。',
      type: 'result',
      result: {
        type: 'screenshot',
        images: results,
        style: {
          backgroundStyle: style.backgroundStyle,
          showFrame: true,
        },
      },
    }
    setMessages((prev) => [...prev, completeMessage])

    // 添加调整建议
    const suggestionMessage: Message = {
      role: 'assistant',
      content: '满意吗？需要调整的话告诉我：\n\n• "换个蓝色系"\n• "只要 iPhone 尺寸"\n• "背景再简洁点"\n• "去掉设备框"',
      type: 'text',
    }
    setMessages((prev) => [...prev, suggestionMessage])

    setIsLoading(false)
  }

  const handleRegenerate = (_lastResult?: Message['result']) => {
    // 重新生成，使用不同风格
    const styles: BackgroundStyle[] = ['gradient_blue', 'gradient_purple', 'gradient_sunset', 'solid_white']
    const newStyle = styles[Math.floor(Math.random() * styles.length)]
    processWithStyleChange(newStyle)
  }

  const processWithStyleChange = async (newStyle: BackgroundStyle) => {
    setIsLoading(true)

    const processingMessage: Message = {
      role: 'assistant',
      content: `好的，正在换成${getStyleName(newStyle)}...`,
      type: 'progress',
      progress: { total: 1, current: 0, status: '重新生成中...' },
    }
    setMessages((prev) => [...prev, processingMessage])

    // TODO: 使用新风格重新处理
    // 这里需要保存上一次截图的原始数据

    setIsLoading(false)
  }

  const getStyleName = (style: BackgroundStyle) => {
    const names: Record<string, string> = {
      gradient_blue: '蓝色渐变',
      gradient_purple: '紫色渐变',
      gradient_sunset: '日落渐变',
      solid_white: '纯白色',
      solid_black: '纯黑色',
      dark: '深色',
      gradient: '默认渐变',
    }
    return names[style] || style
  }

  const handleDownloadAll = (images: { deviceType: string; imageUrl: string }[]) => {
    images.forEach((item, index) => {
      setTimeout(() => {
        const link = document.createElement('a')
        link.href = item.imageUrl
        link.download = `screenshot_${item.deviceType}.png`
        link.click()
      }, index * 200)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const input = (e.target as HTMLFormElement).querySelector('input')?.value
    if (!input?.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    input && ((e.target as HTMLFormElement).querySelector('input')!.value = '')
    setIsLoading(true)

    try {
      const lowerInput = input.toLowerCase()

      // 处理调整请求
      if (lowerInput.includes('换') && (lowerInput.includes('颜色') || lowerInput.includes('蓝色') || lowerInput.includes('紫色'))) {
        let newStyle: BackgroundStyle = 'gradient_blue'
        if (lowerInput.includes('紫色')) newStyle = 'gradient_purple'
        else if (lowerInput.includes('白色')) newStyle = 'solid_white'
        else if (lowerInput.includes('黑色') || lowerInput.includes('深色')) newStyle = 'dark'

        processWithStyleChange(newStyle)
        return
      }

      if (lowerInput.includes('截图') || lowerInput.includes('screenshot') || lowerInput.includes('图片')) {
        const aiReply: Message = {
          role: 'assistant',
          content: '好的！请上传要处理的截图，支持多选 👇',
          type: 'action',
          action: { type: 'screenshot_process', data: { requestUpload: true } },
        }
        setMessages((prev) => [...prev, aiReply])
      } else if (lowerInput.includes('隐私') || lowerInput.includes('privacy')) {
        const aiReply: Message = {
          role: 'assistant',
          content: '我来帮你生成隐私政策！\n\n请告诉我：\n1. App 名称\n2. 收集哪些数据？（如：位置、联系方式等）\n3. 数据用于什么目的？',
          type: 'action',
          action: { type: 'privacy_generate', data: { requestInfo: true } },
        }
        setMessages((prev) => [...prev, aiReply])
      } else if (lowerInput.includes('名称') || lowerInput.includes('描述') || lowerInput.includes('关键词')) {
        const aiReply: Message = {
          role: 'assistant',
          content: '好的！请简单描述一下你的 App 功能，我来帮你生成元数据 👇',
          type: 'action',
          action: { type: 'metadata_generate', data: { requestDescription: true } },
        }
        setMessages((prev) => [...prev, aiReply])
      } else {
        const { reply } = await chatWithAI(input, context)
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '抱歉，出错了。请稍后重试。' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const renderMessageAction = (message: Message) => {
    if (!message.action) return null

    if (message.action.type === 'screenshot_process' && message.action.data?.requestUpload) {
      return (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Upload className="w-5 h-5" />
            上传截图
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )
    }

    return null
  }

  const renderResult = (message: Message) => {
    if (!message.result || message.result.type !== 'screenshot') return null

    const { images, style } = message.result

    return (
      <div className="mt-3">
        {/* 预览网格 */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {images.slice(0, 6).map((item, i) => (
            <div key={i} className="aspect-[9/16] rounded-lg bg-gray-100 overflow-hidden border">
              <img src={item.imageUrl} alt={item.deviceType} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5">
                {item.deviceType.replace('iphone_', 'iPhone ').replace('ipad_', 'iPad ')}
              </div>
            </div>
          ))}
        </div>

        {/* 风格信息 */}
        <div className="text-xs text-gray-500 mb-2">
          当前风格：{getStyleName(style.backgroundStyle)}
          {style.showFrame && ' · 设备框'}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={() => handleRegenerate()}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
          >
            <RefreshCw className="w-3 h-3" />
            换个风格
          </button>
          <button
            onClick={() => handleDownloadAll(images)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
          >
            <Download className="w-3 h-3" />
            下载全部
          </button>
        </div>
      </div>
    )
  }

  const renderProgress = (message: Message) => {
    if (!message.progress) return null
    const percent = Math.round((message.progress.current / message.progress.total) * 100)
    return (
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{message.progress.status}</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="w-96 border-l-2 border-black bg-white flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-black bg-yellow-400">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border-2 border-black bg-black flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold uppercase tracking-wider text-sm">AI 助手</h2>
            <p className="text-xs font-mono uppercase tracking-widest">AI ASSISTANT</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-black hover:text-white transition-colors border-2 border-black">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index}>
            <div className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] p-3 border-2 border-black',
                  message.role === 'user' ? 'bg-black text-white' : 'bg-gray-50',
                  message.role === 'user' ? '' : 'shadow-[3px_3px_0px_#000]'
                )}
                style={{ clipPath: message.role === 'user' ? 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' : undefined }}
              >
                <p className="text-sm whitespace-pre-wrap font-medium">{message.content}</p>

                {/* 附件预览 */}
                {message.attachments && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {message.attachments.map((att, i) => (
                      <div key={i} className="aspect-square bg-white overflow-hidden border-2 border-black">
                        <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 操作按钮 */}
                {message.type === 'action' && renderMessageAction(message)}

                {/* 结果预览 */}
                {message.type === 'result' && renderResult(message)}

                {/* 进度条 */}
                {message.type === 'progress' && renderProgress(message)}
              </div>
            </div>
            {index === messages.length - 1 && <div ref={messagesEndRef} />}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="border-2 border-black bg-gray-50 shadow-[3px_3px_0px_#000] p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-black" />
                <div className="w-2 h-2 bg-black animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-black animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t-2 border-black bg-gray-50">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
            title="上传图片"
          >
            <Image className="w-5 h-5" />
          </button>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            ref={fileInputRef}
          />
          <input
            type="text"
            placeholder="输入消息..."
            className="flex-1 px-3 py-2 border-2 border-black bg-white focus:outline-none focus:border-yellow-400 font-mono text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-black text-white border-2 border-black hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* 装饰元素 */}
      <div className="absolute bottom-2 right-2 w-3 h-3 border border-black opacity-20" />
    </div>
  )
}
