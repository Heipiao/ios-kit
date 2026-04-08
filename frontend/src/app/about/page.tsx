import { Metadata } from 'next'
import Link from 'next/link'
import { Zap, Layers, Sparkles, Globe, Mail } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

export const metadata: Metadata = {
  title: 'About - iOS Kit',
  description: 'iOS Kit is an AI-powered studio designed to help developers create professional App Store assets in seconds.',
  openGraph: {
    title: 'About iOS Kit',
    description: 'Learn about iOS Kit - AI-powered App Store asset generator.',
  },
}

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b-2 border-black bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogo
            markClassName="w-10 h-10 bg-transparent"
            titleClassName="font-display font-bold uppercase tracking-wider"
            subtitle=""
          />
          <Link href="/" className="btn-brutal text-sm px-5 py-2">
            Back Home
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-wider mb-6">
            About iOS Kit
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl leading-relaxed">
            iOS Kit is an AI-powered studio designed to help developers create professional
            App Store assets in seconds, not hours.
          </p>
        </div>

        {/* Mission */}
        <section className="mb-16">
          <div className="card-brutal p-8 bg-white">
            <h2 className="font-display font-bold text-2xl uppercase mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              Creating app store assets shouldn&apos;t be a chore. We believe developers should focus on building
              great apps, not wrestling with design tools. iOS Kit uses artificial intelligence to automate
              the tedious parts of App Store optimization—generating screenshots, writing metadata, and
              creating marketing materials—so you can launch faster and with confidence.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-3xl uppercase mb-6">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Lightning Fast"
              description="Generate stunning screenshots and metadata in seconds using AI. What used to take hours now takes moments."
              color="yellow"
            />
            <FeatureCard
              icon={<Layers className="w-8 h-8" />}
              title="All Formats"
              description="Automatically generate assets for every iPhone and iPad size. One upload, all the formats you need."
              color="teal"
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title="AI Powered"
              description="Smart recommendations for styles, keywords, and descriptions based on your app&apos;s content and category."
              color="red"
            />
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-16">
          <div className="card-brutal p-8 bg-gradient-to-br from-teal-400 to-yellow-400">
            <h2 className="font-display font-bold text-2xl uppercase mb-4">Built With Modern Tech</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TechBadge name="React" description="UI Framework" />
              <TechBadge name="TypeScript" description="Type Safety" />
              <TechBadge name="Next.js" description="SSR Framework" />
              <TechBadge name="TailwindCSS" description="Styling" />
              <TechBadge name="Supabase" description="Auth & DB" />
              <TechBadge name="Vercel" description="Hosting" />
              <TechBadge name="Anthropic" description="AI Backend" />
              <TechBadge name="Konva" description="Canvas Editor" />
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <div className="card-brutal p-8 bg-white">
            <h2 className="font-display font-bold text-2xl uppercase mb-4">The Team</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              iOS Kit is built by developers who understand the pain of App Store submissions. We&apos;ve been
              through countless app launches and know exactly what assets you need to succeed.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 px-4 py-3 border-2 border-black bg-gray-50">
                <Globe className="w-5 h-5" />
                <span className="font-mono text-sm uppercase">Based in San Francisco</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 border-2 border-black bg-gray-50">
                <Mail className="w-5 h-5" />
                <span className="font-mono text-sm uppercase">support@ioskit.com</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-16">
          <div className="card-brutal p-12 bg-black text-white text-center">
            <h2 className="font-display font-bold text-3xl uppercase mb-4">Ready to Get Started?</h2>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              Join developers who are creating professional App Store assets in minutes.
            </p>
            <Link href="/login" className="btn-brutal bg-yellow-400 text-black inline-block">
              Create Free Account →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono uppercase tracking-wider">© 2024 iOS Kit</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-wider">
            <Link href="/terms" className="hover:text-red-600">Terms</Link>
            <span>|</span>
            <Link href="/privacy" className="hover:text-red-600">Privacy</Link>
            <span>|</span>
            <Link href="/about" className="hover:text-red-600">About</Link>
          </div>
        </div>
      </footer>
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
      <div className={`w-14 h-14 border-2 border-black ${colors[color]} flex items-center justify-center mb-4`}
        style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}>
        {icon}
      </div>
      <h3 className="font-display font-bold text-xl uppercase mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

function TechBadge({ name, description }: { name: string; description: string }) {
  return (
    <div className="px-4 py-3 border-2 border-black bg-white/80 backdrop-blur">
      <div className="font-display font-bold uppercase">{name}</div>
      <div className="text-xs text-gray-500 font-mono">{description}</div>
    </div>
  )
}
