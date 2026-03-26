import { Plus, Clock } from 'lucide-react'

export function Dashboard() {
  const projects = [
    { id: 1, name: 'Fitness App', updated: '2 小时前', progress: 60 },
    { id: 2, name: '记事本', updated: '昨天', progress: 30 },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">我的项目</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <Plus className="w-5 h-5" />
          新建项目
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
            <p className="text-sm text-gray-500 mb-4">更新于 {project.updated}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">{project.progress}%</span>
            </div>
          </div>
        ))}

        {/* New Project Card */}
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors">
          <Plus className="w-12 h-12 text-gray-400 mb-3" />
          <span className="text-gray-500 font-medium">创建新项目</span>
        </div>
      </div>

      {/* Quick Start */}
      <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="font-semibold text-lg mb-4">💡 快速开始</h2>
        <ul className="space-y-2 text-gray-600">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
            创建一个新项目
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
            用 AI 助手生成上架材料
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
            上传截图自动生成多尺寸
          </li>
        </ul>
      </div>
    </div>
  )
}
