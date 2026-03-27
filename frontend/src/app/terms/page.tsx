import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service - iOS Kit',
  description: 'Read the iOS Kit Terms of Service and understand your rights and responsibilities.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b-2 border-black bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-black bg-black flex items-center justify-center">
              <span className="text-lg">📱</span>
            </div>
            <span className="font-display font-bold uppercase tracking-wider">iOS Kit</span>
          </div>
          <Link href="/" className="text-sm font-bold uppercase tracking-wider hover:text-red-600 transition-colors">
            ← Back Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-wider mb-8">Terms of Service</h1>

        <div className="card-brutal p-8 bg-white">
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="font-display font-bold text-xl uppercase mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using iOS Kit (the &quot;Service&quot;), you accept and agree to be bound by the terms
                and provision of this agreement. If you do not agree to these Terms of Service, please do not
                use the Service.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl uppercase mb-4">2. Description of Service</h2>
              <p>
                iOS Kit is an AI-powered studio for creating iOS App Store screenshots, metadata, and marketing
                materials. The Service provides tools for generating professional app store assets using
                artificial intelligence.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl uppercase mb-4">3. User Accounts</h2>
              <p>
                To use the Service, you must create an account. You are responsible for maintaining the security
                of your account and for all activities that occur under your account. You must immediately notify
                us of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl uppercase mb-4">4. Acceptable Use</h2>
              <p className="mb-2">You agree not to use the Service to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Generate content that violates any applicable laws or regulations</li>
                <li>Infringe on any third-party intellectual property rights</li>
                <li>Create misleading or fraudulent app store listings</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Attempt to access other users&apos; accounts or data</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl uppercase mb-4">5. Intellectual Property</h2>
              <p>
                You retain ownership of all content you create using the Service. However, you grant iOS Kit a
                license to use, store, and process your content as necessary to provide the Service.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl uppercase mb-4">6. Disclaimer of Warranties</h2>
              <p>
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express
                or implied. We do not warrant that the Service will be uninterrupted, error-free, or completely
                secure.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl uppercase mb-4">7. Limitation of Liability</h2>
              <p>
                iOS Kit shall not be liable for any indirect, incidental, special, consequential, or punitive
                damages resulting from your use of or inability to use the Service.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl uppercase mb-4">8. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms of Service at any time. We will notify users of any
                material changes via email or through prominent notice on the Service.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl uppercase mb-4">9. Contact Information</h2>
              <p>
                For questions about these Terms of Service, please contact us at:{' '}
                <a href="mailto:support@ioskit.com" className="underline hover:text-red-600">support@ioskit.com</a>
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 font-mono">
          Last updated: January 2025
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black bg-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
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
