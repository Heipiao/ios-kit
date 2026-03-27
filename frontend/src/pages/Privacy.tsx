import { Link } from 'react-router-dom'

export function Privacy() {
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
          <Link to="/" className="text-sm font-bold uppercase tracking-wider hover:text-red-600 transition-colors">
            ← Back Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-wider mb-8">Privacy Policy</h1>

        <div className="card-brutal p-8 bg-white">
          <div className="prose prose-lg max-w-none">
            <div className="bg-yellow-50 border-2 border-black p-4 mb-8">
              <p className="text-sm font-mono uppercase tracking-wider mb-2">⚠️ Important Notice</p>
              <p className="text-gray-700">
                This is a demo privacy policy. iOS Kit is currently in development. Please review carefully
                before providing any personal information.
              </p>
            </div>

            <h2 className="font-display font-bold text-xl uppercase mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 mb-6">
              We collect information you provide directly to us when you:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Create an account (email address and password)</li>
              <li>Upload images for processing</li>
              <li>Use the AI generation features</li>
              <li>Communicate with our support team</li>
            </ul>

            <h2 className="font-display font-bold text-xl uppercase mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 mb-6">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process your requests and transactions</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Protect against fraudulent or illegal activity</li>
            </ul>

            <h2 className="font-display font-bold text-xl uppercase mb-4">3. Images and Content</h2>
            <p className="text-gray-700 mb-6">
              Images you upload are processed by our AI systems to generate app store assets. We do not use
              your uploaded images for training our AI models without your explicit consent. Your images are
              deleted from our servers after processing is complete.
            </p>

            <h2 className="font-display font-bold text-xl uppercase mb-4">4. Third-Party Services</h2>
            <p className="text-gray-700 mb-6">
              We use the following third-party services:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li><strong>Supabase</strong> - For user authentication and data storage (supabase.com/privacy)</li>
              <li><strong>Vercel</strong> - For hosting and deployment (vercel.com/privacy)</li>
              <li><strong>Anthropic API</strong> - For AI-powered features (anthropic.com/privacy)</li>
            </ul>

            <h2 className="font-display font-bold text-xl uppercase mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-6">
              We take reasonable measures to help protect your personal information from loss, theft, misuse,
              and unauthorized access, disclosure, alteration, and destruction.
            </p>

            <h2 className="font-display font-bold text-xl uppercase mb-4">6. Your Rights</h2>
            <p className="text-gray-700 mb-6">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Export your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>

            <h2 className="font-display font-bold text-xl uppercase mb-4">7. Cookies</h2>
            <p className="text-gray-700 mb-6">
              We use cookies and similar tracking technologies to improve your experience. You can control
              cookie settings through your browser preferences.
            </p>

            <h2 className="font-display font-bold text-xl uppercase mb-4">8. Children's Privacy</h2>
            <p className="text-gray-700 mb-6">
              The Service is not intended for children under 13 years of age. We do not knowingly collect
              personal information from children under 13.
            </p>

            <h2 className="font-display font-bold text-xl uppercase mb-4">9. Changes to This Policy</h2>
            <p className="text-gray-700 mb-6">
              We may update this Privacy Policy from time to time. We will notify you of any changes by
              posting the new policy on this page and updating the "Last updated" date.
            </p>

            <h2 className="font-display font-bold text-xl uppercase mb-4">10. Contact Us</h2>
            <p className="text-gray-700">
              For privacy-related questions, please contact us at:{" "}
              <a href="mailto:privacy@ioskit.com" className="underline hover:text-red-600">privacy@ioskit.com</a>
            </p>
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
            <Link to="/terms" className="hover:text-red-600">Terms</Link>
            <span>|</span>
            <Link to="/privacy" className="hover:text-red-600">Privacy</Link>
            <span>|</span>
            <Link to="/about" className="hover:text-red-600">About</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
