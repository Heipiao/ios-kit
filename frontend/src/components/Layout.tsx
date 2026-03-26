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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>

      {/* AI Panel Toggle Button */}
      {!isAIPanelOpen && (
        <button
          onClick={() => setIsAIPanelOpen(true)}
          className="fixed right-4 bottom-4 p-4 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* AI Panel */}
      <AIPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
      />
    </div>
  )
}
