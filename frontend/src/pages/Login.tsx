import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        alert('注册成功！请检查邮箱验证链接')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        navigate('/dashboard')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 z-0">
        <svg className="w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id="rough-stroke" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="torn-edge" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>

          {/* 底色 */}
          <rect width="100%" height="100%" fill="#F4F4F0" />

          {/* 黄色色块 */}
          <path d="M-100,400 L800,350 L800,800 L-100,800 Z" fill="#FFCC00" filter="url(#torn-edge)" />

          {/* 红色色块 */}
          <path d="M600,200 C800,100 1200,400 1500,300 C1700,250 1920,400 1920,400 L1920,600 C1600,800 1200,500 900,700 C600,900 200,600 -100,750 Z" fill="#E62A3B" filter="url(#torn-edge)" />

          {/* 青色色块 */}
          <path d="M1200,-100 L1920,-100 L1920,500 L1400,550 L1000,500 L1200,-100 Z" fill="#42C0B7" filter="url(#torn-edge)" />

          {/* 装饰线条 */}
          <g stroke="#111" strokeWidth="8" fill="none" strokeLinecap="round" filter="url(#rough-stroke)">
            <path d="M 200,150 Q 300,100 400,200" />
            <path d="M 1400,600 Q 1500,700 1600,550" />
            <path d="M 100,900 C 150,900 150,1000 100,1000" />
          </g>

          {/* 白色覆盖层 */}
          <path d="M-100,-100 L2000,-100 L2000,350 L1400,400 L800,350 L300,420 L-100,380 Z" fill="#F4F4F0" filter="url(#torn-edge)" />
        </svg>
      </div>

      {/* 登录表单容器 */}
      <div className="relative z-10 flex items-center justify-center w-full p-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 border-2 border-black bg-yellow-400 mb-4" style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)' }}>
              <span className="text-4xl">📱</span>
            </div>
            <h1 className="text-4xl font-display font-bold text-black uppercase tracking-wider">iOS Kit</h1>
            <p className="text-sm font-medium text-gray-600 mt-2 uppercase tracking-widest">AI 驱动的上架工作室</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="card-brutal p-8 rounded-none">
            <div className="space-y-5">
              <div>
                <label className="meta-label block mb-2">
                  邮箱
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-black bg-white focus:outline-none focus:ring-0 focus:border-yellow-400 transition-colors font-mono text-sm"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="meta-label block mb-2">
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-black bg-white focus:outline-none focus:ring-0 focus:border-yellow-400 transition-colors font-mono text-sm"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="text-sm font-bold text-white bg-red-500 p-3 border-2 border-black" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-brutal disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '加载中...' : isSignUp ? '注册账号' : '登录'}
              </button>
            </div>

            {/* 切换 */}
            <div className="mt-6 text-center">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                {isSignUp ? '已有账号？' : '还没有账号？'}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="ml-2 text-black font-bold underline decoration-2 underline-offset-2 hover:text-red-600 transition-colors"
                >
                  {isSignUp ? '登录' : '注册'}
                </button>
              </p>
            </div>
          </form>

          {/* 装饰元素 */}
          <div className="mt-6 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-black bg-yellow-400" />
              <span className="uppercase tracking-wider">SYS.REF // 认证</span>
            </div>
            <div className="w-24 h-6 barcode" />
          </div>
        </div>
      </div>

      {/* 装饰性标记 */}
      <div className="absolute top-4 right-4 z-20 w-6 h-6 border-2 border-black flex items-center justify-center">
        <div className="w-full h-0.5 bg-black absolute" />
        <div className="h-full w-0.5 bg-black absolute" />
      </div>
      <div className="absolute bottom-4 left-4 z-20 w-6 h-6 border-2 border-black bg-yellow-400 flex items-center justify-center">
        <span className="text-xs font-bold">⚡</span>
      </div>
    </div>
  )
}
