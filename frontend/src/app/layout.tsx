import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_SITE_URL || 'https://ioskit.vercel.app'),
  title: {
    default: 'iOS Kit - AI-Powered App Store Screenshot Generator',
    template: '%s | iOS Kit',
  },
  description: 'Generate professional iOS App Store screenshots, metadata, and marketing materials in seconds using AI. Support for all iPhone and iPad sizes.',
  keywords: ['iOS', 'App Store', 'screenshot generator', 'AI', 'metadata', 'ASO', 'app marketing'],
  authors: [{ name: 'iOS Kit' }],
  creator: 'iOS Kit',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ioskit.vercel.app',
    siteName: 'iOS Kit',
    title: 'iOS Kit - AI-Powered App Store Screenshot Generator',
    description: 'Generate professional iOS App Store screenshots, metadata, and marketing materials in seconds using AI.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'iOS Kit - AI Studio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'iOS Kit - AI-Powered App Store Screenshot Generator',
    description: 'Generate professional iOS App Store screenshots in seconds using AI.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here
    // google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
