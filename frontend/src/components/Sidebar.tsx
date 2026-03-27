'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Image, FileText, Settings, Plus } from 'lucide-react'

interface SidebarProps {
  onCreateProject?: () => void
}

export function Sidebar({ onCreateProject }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <div className="w-64 border-r-2 border-black bg-white flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b-2 border-black bg-yellow-400">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 border-2 border-black bg-black flex items-center justify-center">
            <span className="text-xl">📱</span>
          </div>
          <div>
            <h1 className="text-lg font-display font-bold uppercase tracking-wider leading-none">iOS Kit</h1>
            <p className="text-xs font-mono uppercase tracking-widest leading-none mt-1">AI Studio</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          <li>
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-3 py-3 transition-all border-2 ${
                isActive('/dashboard')
                  ? 'bg-black text-white border-black'
                  : 'border-transparent hover:border-black hover:bg-yellow-50'
              }`}
              style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}
            >
              <Home className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-wide">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              href="/screenshots"
              className={`flex items-center gap-3 px-3 py-3 transition-all border-2 ${
                isActive('/screenshots')
                  ? 'bg-black text-white border-black'
                  : 'border-transparent hover:border-black hover:bg-yellow-50'
              }`}
              style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}
              aria-label="Screenshots"
            >
              <Image className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-wide">Screenshots</span>
            </Link>
          </li>
          <li>
            <Link
              href="/editor"
              className={`flex items-center gap-3 px-3 py-3 transition-all border-2 ${
                isActive('/editor')
                  ? 'bg-black text-white border-black'
                  : 'border-transparent hover:border-black hover:bg-yellow-50'
              }`}
              style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}
            >
              <FileText className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-wide">Metadata</span>
            </Link>
          </li>
        </ul>

        {/* Projects */}
        <div className="mt-6">
          <div className="flex items-center justify-between px-3 py-2 border-t-2 border-black mt-4">
            <span className="text-xs font-display font-bold uppercase tracking-widest">
              Projects
            </span>
            <button
              onClick={onCreateProject}
              className="p-1 hover:bg-black hover:text-white transition-colors border border-black"
              title="New Project"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <ul className="mt-2 space-y-1">
            <li>
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2 border-2 border-transparent hover:border-black hover:bg-yellow-50 transition-all"
              >
                <span className="w-2 h-2 bg-green-500 border border-black" />
                <span className="text-sm font-bold uppercase tracking-wide">Fitness App</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2 border-2 border-transparent hover:border-black hover:bg-yellow-50 transition-all"
              >
                <span className="w-2 h-2 bg-gray-300 border border-black" />
                <span className="text-sm font-bold uppercase tracking-wide">Notes App</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t-2 border-black bg-gray-50">
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2 border-2 border-transparent hover:border-black hover:bg-white transition-all"
        >
          <Settings className="w-5 h-5" />
          <span className="font-bold text-sm uppercase">Settings</span>
        </a>
      </div>

      {/* Decorative element */}
      <div className="absolute bottom-3 right-3 w-4 h-4 border border-black opacity-30" />
    </div>
  )
}
