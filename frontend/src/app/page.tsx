import { Metadata } from 'next'
import Link from 'next/link'
import { Zap, Layers, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI-Powered App Store Screenshot Generator',
  description: 'Generate professional iOS App Store screenshots, metadata, and marketing materials in seconds using AI. Support for all iPhone and iPad sizes.',
  keywords: ['iOS screenshot generator', 'App Store assets', 'AI screenshot tool', 'iOS marketing'],
  openGraph: {
    title: 'iOS Kit - Generate App Store Assets in Seconds',
    description: 'AI-powered studio for creating professional iOS App Store screenshots.',
    images: ['/og-image.png'],
  },
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Dynamic background layer */}
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

          {/* Base color */}
          <rect width="100%" height="100%" fill="#F4F4F0" />

          {/* Large color blocks */}
          <circle cx="1600" cy="300" r="400" fill="#42C0B7" opacity="0.3" />
          <circle cx="300" cy="800" r="300" fill="#FFCC00" opacity="0.4" />

          {/* Torn color blocks */}
          <path d="M-100,400 L900,350 L900,900 L-100,900 Z" fill="#FFCC00" filter="url(#torn-edge)" />
          <path d="M1000,200 C1300,100 1700,400 1920,300 L1920,700 C1600,900 1200,500 900,750 C600,1000 200,600 -100,750 Z" fill="#E62A3B" filter="url(#torn-edge)" opacity="0.8" />
          <path d="M1400,-100 L1920,-100 L1920,400 L1500,450 L1200,400 L1400,-100 Z" fill="#42C0B7" filter="url(#torn-edge)" />

          {/* Decorative lines */}
          <g stroke="#111" strokeWidth="6" fill="none" strokeLinecap="round" filter="url(#rough-stroke)" opacity="0.5">
            <path d="M 200,200 Q 300,150 400,250 T 500,300" />
            <path d="M 1400,600 Q 1500,700 1600,550 T 1800,650" />
            <path d="M 100,500 C 150,500 150,700 100,700" />
            <path d="M 800,100 A 350 350 0 0 1 1200,200" strokeWidth="30" />
          </g>

          {/* White overlay - create layers */}
          <path d="M-100,-100 L2000,-100 L2000,300 L1500,350 L900,300 L400,380 L-100,340 Z" fill="#F4F4F0" filter="url(#torn-edge)" />
        </svg>
      </div>

      {/* Content layer */}
      <div className="relative z-10">
        {/* Navigation */}
        <header className="flex items-center justify-between px-6 py-4 md:px-12 md:py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border-2 border-black bg-black flex items-center justify-center" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}>
              <span className="text-xl">📱</span>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold uppercase tracking-wider leading-none">iOS Kit</h1>
              <p className="text-xs font-mono uppercase tracking-widest leading-none mt-0.5">AI Studio</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-sm font-bold uppercase tracking-wider hover:text-red-600 transition-colors">Features</Link>
            <Link href="/about" className="text-sm font-bold uppercase tracking-wider hover:text-red-600 transition-colors">Pricing</Link>
            <Link href="/about" className="text-sm font-bold uppercase tracking-wider hover:text-red-600 transition-colors">About</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:block px-4 py-2 border-2 border-black font-bold text-sm uppercase tracking-wider hover:bg-yellow-400 transition-colors">
              Sign In
            </Link>
            <Link href="/login" className="btn-brutal text-sm px-5 py-2">
              Get Started
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="px-6 md:px-12 py-12 md:py-20">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <section className="mb-16 md:mb-24">
              <div className="inline-block px-3 py-1 border-2 border-black bg-yellow-400 mb-6" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}>
                <span className="text-xs font-mono uppercase tracking-widest">✨ AI Powered</span>
              </div>

              <h2 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold uppercase leading-[0.85] tracking-tight mb-6">
                <span className="block">Generate</span>
                <span className="block text-transparent" style={{ WebkitTextStroke: '3px #111' }}>App Store</span>
                <span className="block" style={{ color: '#E62A3B' }}>Assets</span>
              </h2>

              <p className="text-lg md:text-xl font-medium text-gray-700 max-w-2xl mb-8 leading-relaxed">
                AI-powered studio for creating professional iOS App Store screenshots,
                metadata, and marketing materials in seconds.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/login" className="btn-brutal text-base px-8 py-4">
                  Start Creating →
                </Link>
                <a href="#features" className="px-8 py-4 border-2 border-black font-display font-bold text-base uppercase tracking-wider hover:bg-black hover:text-white transition-colors">
                  Watch Demo
                </a>
              </div>
            </section>

            {/* Feature grid */}
            <section id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <FeatureCard
                icon={<Zap className="w-6 h-6" />}
                title="Lightning Fast"
                description="Generate stunning screenshots in seconds, not hours. AI handles the heavy lifting."
                color="yellow"
              />
              <FeatureCard
                icon={<Layers className="w-6 h-6" />}
                title="All Sizes"
                description="Auto-generate for iPhone 6.5 inch, 6.7 inch, iPad 12.9 inch and more. One click, all formats."
                color="teal"
              />
              <FeatureCard
                icon={<Sparkles className="w-6 h-6" />}
                title="AI Designed"
                description="Smart style recommendations based on your app content and category."
                color="red"
              />
            </section>

            {/* Decorative showcase - placeholder */}
            <section className="card-brutal p-8 md:p-12 min-h-[300px] flex items-center justify-center bg-white mb-16">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 border-2 border-black bg-gray-100 flex items-center justify-center">
                  <span className="text-4xl opacity-50">🎨</span>
                </div>
                <h3 className="font-display font-bold text-2xl uppercase mb-2">Coming Soon</h3>
                <p className="text-gray-500 font-mono text-sm uppercase tracking-wider">Live Preview Showcase</p>
              </div>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBlock value="10x" label="Faster Workflow" />
              <StatBlock value="500+" label="Templates" />
              <StatBlock value="100%" label="App Store Ready" />
              <StatBlock value="24/7" label="AI Available" />
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 md:px-12 py-8 border-t-2 border-black mt-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono uppercase tracking-wider">© 2024 iOS Kit</span>
              <span className="text-gray-300">|</span>
              <Link href="/terms" className="text-xs font-mono uppercase tracking-wider hover:text-red-600">Terms</Link>
              <Link href="/privacy" className="text-xs font-mono uppercase tracking-wider hover:text-red-600">Privacy</Link>
              <Link href="/about" className="text-xs font-mono uppercase tracking-wider hover:text-red-600">About</Link>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-6 barcode" />
              <span className="text-xs font-mono">SYS.IOS-KIT // V1.0</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Decorative markers */}
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
