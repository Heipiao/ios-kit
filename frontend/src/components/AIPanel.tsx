'use client'

import { useState } from 'react'
import { MessageSquare, X, ChevronRight, Upload, Image } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AIPanel({ isOpen, onClose }: AIPanelProps) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your iOS App Store assistant 🤖\n\nUpload screenshots and I\'ll help you:\n• Analyze your app type\n• Recommend styles\n• Generate full-size screenshots\n\nLet\'s get started!',
    },
  ])
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  return (
    <div className="w-96 border-l-2 border-black bg-white flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-black bg-yellow-400">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border-2 border-black bg-black flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold uppercase tracking-wider text-sm">AI Assistant</h2>
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
              </div>
            </div>
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
      <form className="p-4 border-t-2 border-black bg-gray-50">
        <div className="flex gap-2">
          <button
            type="button"
            className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
            title="Upload image"
          >
            <Image className="w-5 h-5" alt="Upload" />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
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
    </div>
  )
}
