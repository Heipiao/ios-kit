import { Zap, Layers, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 动态背景层 */}
      <div className="absolute inset-0 z-0">
        <svg className="w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id="torn-edge" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="rough-stroke" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>

          {/* 底色 */}
          <rect width="100%" height="100%" fill="#F4F4F0" />

          {/* 大面积色块 */}
          <circle cx="1600" cy="300" r="400" fill="#42C0B7" opacity="0.3" />
          <circle cx="300" cy="800" r="300" fill="#FFCC00" opacity="0.4" />

          {/* 撕裂色块 */}
          <path d="M-100,400 L900,350 L900,900 L-100,900 Z" fill="#FFCC00" filter="url(#torn-edge)" />
          <path d="M1000,200 C1300,100 1700,400 1920,300 L1920,700 C1600,900 1200,500 900,750 C600,1000 200,600 -100,750 Z" fill="#E62A3B" filter="url(#torn-edge)" opacity="0.8" />
          <path d="M1400,-100 L1920,-100 L1920,400 L1500,450 L1200,400 L1400,-100 Z" fill="#42C0B7" filter="url(#torn-edge)" />

          {/* 装饰线条 */}
          <g stroke="#111" strokeWidth="6" fill="none" strokeLinecap="round" filter="url(#rough-stroke)" opacity="0.5">
            <path d="M 200,200 Q 300,150 400,250 T 500,300" />
            <path d="M 1400,600 Q 1500,700 1600,550 T 1800,650" />
            <path d="M 100,500 C 150,500 150,700 100,700" />
            <path d="M 800,100 A 350 350 0 0 1 1200,200" strokeWidth="30" />
          </g>

          {/* 白色覆盖层 - 创造层次 */}
          <path d="M-100,-100 L2000,-100 L2000,300 L1500,350 L900,300 L400,380 L-100,340 Z" fill="#F4F4F0" filter="url(#torn-edge)" />
        </svg>
      </div>

      {/* 内容层 */}
      <div className="relative z-10">
        {/* 导航栏 */}
        <header className="flex items-center justify-between px-6 py-4 md:px-12 md:py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border-2 border-black bg-black flex items-center justify-center" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}>
              <span className="text-xl">📱</span>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold uppercase tracking-wider leading-none">iOS Kit</h1>
              <p className="text-xs font-mono uppercase tracking-widest leading-none mt-0.5">AI 工作室</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-bold uppercase tracking-wider hover:text-red-600 transition-colors">功能</a>
            <a href="#" className="text-sm font-bold uppercase tracking-wider hover:text-red-600 transition-colors">价格</a>
            <a href="#" className="text-sm font-bold uppercase tracking-wider hover:text-red-600 transition-colors">关于</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden md:block px-4 py-2 border-2 border-black font-bold text-sm uppercase tracking-wider hover:bg-yellow-400 transition-colors">
              登录
            </Link>
            <Link to="/login" className="btn-brutal text-sm px-5 py-2">
              开始使用
            </Link>
          </div>
        </header>

        {/* 主内容区 */}
        <main className="px-6 md:px-12 py-12 md:py-20">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="mb-16 md:mb-24">
              <div className="inline-block px-3 py-1 border-2 border-black bg-yellow-400 mb-6" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}>
                <span className="text-xs font-mono uppercase tracking-widest">✨ AI 驱动</span>
              </div>

              <h2 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold uppercase leading-[0.85] tracking-tight mb-6">
                <span className="block">生成</span>
                <span className="block text-transparent" style={{ WebkitTextStroke: '3px #111' }}>App Store</span>
                <span className="block" style={{ color: '#E62A3B' }}>上架素材</span>
              </h2>

              <p className="text-lg md:text-xl font-medium text-gray-700 max-w-2xl mb-8 leading-relaxed">
                AI 驱动的工作室，快速创建专业的 iOS App Store 截图、
                元数据和营销素材，只需几秒钟。
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/login" className="btn-brutal text-base px-8 py-4">
                  开始创作 →
                </Link>
                <a href="#" className="px-8 py-4 border-2 border-black font-display font-bold text-base uppercase tracking-wider hover:bg-black hover:text-white transition-colors">
                  观看演示
                </a>
              </div>
            </div>

            {/* 特性网格 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <FeatureCard
                icon={<Zap className="w-6 h-6" />}
                title="极速生成"
                description="几秒钟生成精美的截图，无需数小时。AI 帮你完成繁重工作。"
                color="yellow"
              />
              <FeatureCard
                icon={<Layers className="w-6 h-6" />}
                title="全尺寸支持"
                description="自动生成 iPhone 6.5 英寸、6.7 英寸、iPad 12.9 英寸等所有尺寸。一键生成全部格式。"
                color="teal"
              />
              <FeatureCard
                icon={<Sparkles className="w-6 h-6" />}
                title="AI 设计"
                description="根据你的 App 内容和类别，智能推荐风格配色。"
                color="red"
              />
            </div>

            {/* 装饰性展示区 - 空缺占位 */}
            <div className="card-brutal p-8 md:p-12 min-h-[300px] flex items-center justify-center bg-white">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 border-2 border-black bg-gray-100 flex items-center justify-center">
                  <span className="text-4xl opacity-50">🎨</span>
                </div>
                <h3 className="font-display font-bold text-2xl uppercase mb-2">即将上线</h3>
                <p className="text-gray-500 font-mono text-sm uppercase tracking-wider">实时预览展示</p>
              </div>
            </div>

            {/* 数据展示 */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBlock value="10x" label="工作效率提升" />
              <StatBlock value="500+" label="模板数量" />
              <StatBlock value="100%" label="App Store 就绪" />
              <StatBlock value="24/7" label="AI 全天候" />
            </div>
          </div>
        </main>

        {/* 页脚 */}
        <footer className="px-6 md:px-12 py-8 border-t-2 border-black mt-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono uppercase tracking-wider">© 2024 iOS Kit</span>
              <span className="text-gray-300">|</span>
              <a href="#" className="text-xs font-mono uppercase tracking-wider hover:text-red-600">条款</a>
              <a href="#" className="text-xs font-mono uppercase tracking-wider hover:text-red-600">隐私</a>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-6 barcode" />
              <span className="text-xs font-mono">SYS.IOS-KIT // V1.0</span>
            </div>
          </div>
        </footer>
      </div>

      {/* 装饰标记 */}
      <div className="absolute top-6 right-6 z-20 w-8 h-8 border-2 border-black flex items-center justify-center bg-white">
        <div className="w-full h-0.5 bg-black absolute" />
        <div className="h-full w-0.5 bg-black absolute" />
      </div>
      <div className="absolute bottom-6 left-6 z-20 w-6 h-6 border-2 border-black bg-yellow-400 flex items-center justify-center">
        <span className="text-xs font-bold">⚡</span>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description, color }: {
  icon: React.ReactNode
  title: string
  description: string
  color: 'yellow' | 'teal' | 'red'
}) {
  const colors = {
    yellow: 'bg-yellow-400',
    teal: 'bg-teal-400',
    red: 'bg-red-400',
  }

  return (
    <div className="card-brutal p-6 bg-white">
      <div className={`w-12 h-12 border-2 border-black ${colors[color]} flex items-center justify-center mb-4`}
        style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}>
        {icon}
      </div>
      <h3 className="font-display font-bold text-xl uppercase mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-2 border-black p-4 bg-white text-center">
      <div className="font-display font-bold text-3xl uppercase mb-1">{value}</div>
      <div className="text-xs font-mono uppercase tracking-wider text-gray-500">{label}</div>
    </div>
  )
}
