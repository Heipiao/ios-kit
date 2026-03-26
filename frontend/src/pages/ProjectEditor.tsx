import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { generateMetadata } from '../lib/api'

export function ProjectEditor() {
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    description: '',
    keywords: '',
    appDescription: '',
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateMetadata = async () => {
    if (!formData.appDescription) return

    setIsGenerating(true)
    try {
      const { data } = await generateMetadata(formData.appDescription)
      // 解析 AI 返回的 JSON
      const parsed = JSON.parse(data)
      setFormData((prev) => ({
        ...prev,
        name: parsed.names?.[0] || '',
        subtitle: parsed.subtitles?.[0] || '',
        description: parsed.description || '',
        keywords: parsed.keywords || '',
      }))
    } catch (error) {
      console.error('生成失败:', error)
      alert('生成失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">元数据生成</h1>
        <p className="text-gray-500">填写 App 描述，AI 自动生成上架所需元数据</p>
      </div>

      {/* App 描述输入 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          App 功能描述
        </label>
        <textarea
          value={formData.appDescription}
          onChange={(e) => setFormData((prev) => ({ ...prev, appDescription: e.target.value }))}
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={4}
          placeholder="请描述你的 App 的主要功能、目标用户、核心特色..."
        />
        <button
          onClick={handleGenerateMetadata}
          disabled={isGenerating || !formData.appDescription}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5" />
          {isGenerating ? '生成中...' : 'AI 生成元数据'}
        </button>
      </div>

      {/* 生成结果 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            App 名称
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="不超过 30 字符"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            副标题
          </label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="不超过 30 字符"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            App Store 描述
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={6}
            placeholder="150-200 字"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            关键词
          </label>
          <input
            type="text"
            value={formData.keywords}
            onChange={(e) => setFormData((prev) => ({ ...prev, keywords: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="逗号分隔，100 字符以内"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.keywords.length}/100</p>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          保存
        </button>
        <button className="px-6 py-2 border rounded-lg hover:bg-gray-50">
          下一步：截图工厂
        </button>
      </div>
    </div>
  )
}
