import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { AIPanel } from './AIPanel'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-grid-pattern">
        {children}
      </main>

      {/* AI Panel Toggle Button */}
      {!isAIPanelOpen && (
        <button
          onClick={() => setIsAIPanelOpen(true)}
          className="fixed right-6 bottom-6 p-4 bg-black text-white border-2 border-black btn-brutal !rounded-none z-50 hover:bg-red-500"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* AI Panel */}
      <AIPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
      />

      {/* SVG Filters */}
      <svg className="svg-filters">
        <defs>
          <filter id="rough-stroke" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </div>
  )
}
