import { Plus, Clock } from 'lucide-react'

export function Dashboard() {
  const projects = [
    { id: 1, name: 'Fitness App', updated: '2 小时前', progress: 60 },
    { id: 2, name: '记事本', updated: '昨天', progress: 30 },
  ]

  return (
    <div className="p-6 lg:p-10">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-black">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold uppercase tracking-wider">我的项目</h1>
          <p className="text-xs font-mono text-gray-500 mt-1 uppercase tracking-widest">MY PROJECTS // DASHBOARD</p>
        </div>
        <button className="btn-brutal flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">新建项目</span>
        </button>
      </div>

      {/* 项目网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="card-brutal p-6 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 border-2 border-black bg-yellow-400 flex items-center justify-center" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}>
                <span className="text-2xl">📱</span>
              </div>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="font-display font-bold text-xl uppercase mb-1">{project.name}</h3>
            <p className="text-xs font-mono text-gray-500 mb-4 uppercase">更新于 {project.updated}</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-200 border border-black overflow-hidden">
                <div
                  className="h-full bg-black transition-all duration-300 group-hover:bg-red-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <span className="text-sm font-bold font-mono">{project.progress}%</span>
            </div>
          </div>
        ))}

        {/* 新项目卡片 */}
        <div className="border-2 border-dashed border-black p-6 flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-yellow-50 transition-colors min-h-[200px]">
          <div className="w-14 h-14 border-2 border-black bg-gray-200 flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-gray-500" />
          </div>
          <span className="font-display font-bold text-lg uppercase">创建新项目</span>
          <span className="text-xs font-mono text-gray-500 mt-1 uppercase">CREATE NEW PROJECT</span>
        </div>
      </div>

      {/* 快速开始 */}
      <div className="mt-8 card-brutal p-6">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-black">
          <span className="text-2xl">💡</span>
          <h2 className="font-display font-bold text-xl uppercase">快速开始</h2>
          <span className="ml-auto text-xs font-mono uppercase tracking-wider text-gray-500">QUICK START</span>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <li className="flex items-start gap-3 p-3 bg-gray-50 border border-black">
            <span className="w-4 h-4 bg-black flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm uppercase">创建项目</p>
              <p className="text-xs text-gray-500 font-mono mt-1">创建新的 iOS 项目</p>
            </div>
          </li>
          <li className="flex items-start gap-3 p-3 bg-gray-50 border border-black">
            <span className="w-4 h-4 bg-teal-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm uppercase">AI 生成</p>
              <p className="text-xs text-gray-500 font-mono mt-1">生成上架材料</p>
            </div>
          </li>
          <li className="flex items-start gap-3 p-3 bg-gray-50 border border-black">
            <span className="w-4 h-4 bg-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm uppercase">截图工厂</p>
              <p className="text-xs text-gray-500 font-mono mt-1">多尺寸截图生成</p>
            </div>
          </li>
        </ul>
      </div>

      {/* 装饰性页脚 */}
      <div className="mt-8 flex items-center justify-between text-xs font-mono text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-black" />
          <span className="uppercase tracking-wider">iOS Kit v1.0</span>
        </div>
        <div className="w-32 h-6 barcode" />
      </div>
    </div>
  )
}
