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
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.png',
  },
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
        height: 1200,
        alt: 'iOS Kit - AI Studio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'iOS Kit - AI-Powered App Store Screenshot Generator',
    description: 'Generate professional iOS App Store screenshots in seconds using AI.',
    images: ['/og-image.png'],
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
        <link rel="icon" href="/favicon.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Google Fonts - Free fonts for commercial use (SIL Open Font License) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Lato:wght@400;700&family=Montserrat:wght@400;700&family=Noto+Sans+SC:wght@400;700&family=Open+Sans:wght@400;600;700&family=Playfair+Display:wght@400;700&family=Roboto:wght@400;500;700&family=Source+Sans+Pro:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
