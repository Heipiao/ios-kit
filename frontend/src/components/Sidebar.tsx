import { Link, useLocation } from 'react-router-dom'
import { Home, Image, FileText, Settings, Plus } from 'lucide-react'

interface SidebarProps {
  onCreateProject?: () => void
}

export function Sidebar({ onCreateProject }: SidebarProps) {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="w-60 border-r bg-white flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-primary-600">📱 iOS Kit</h1>
        <p className="text-xs text-gray-500 mt-1">AI 生成上架材料</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          <li>
            <Link
              to="/"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/') ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>首页</span>
            </Link>
          </li>
          <li>
            <Link
              to="/screenshots"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/screenshots') ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100'
              }`}
            >
              <Image className="w-5 h-5" />
              <span>截图工厂</span>
            </Link>
          </li>
          <li>
            <Link
              to="/editor"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/editor') ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>元数据</span>
            </Link>
          </li>
        </ul>

        {/* Projects */}
        <div className="mt-6">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              项目
            </span>
            <button
              onClick={onCreateProject}
              className="p-1 hover:bg-gray-100 rounded"
              title="新建项目"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <ul className="mt-1 space-y-1">
            <li>
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Fitness App
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                <span className="w-2 h-2 bg-gray-300 rounded-full" />
                记事本
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-2 border-t">
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>设置</span>
        </a>
      </div>
    </div>
  )
}
