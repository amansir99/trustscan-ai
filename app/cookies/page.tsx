export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: November 12, 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. What Are Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
              They are widely used to make websites work more efficiently and provide information to website owners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. How We Use Cookies</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              TrustScan AI uses cookies to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Keep you signed in to your account</li>
              <li>Remember your preferences and settings</li>
              <li>Understand how you use our Service</li>
              <li>Improve our Service and user experience</li>
              <li>Provide security features</li>
              <li>Analyze site traffic and usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Types of Cookies We Use</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Essential Cookies</h3>
                <p className="text-gray-600 leading-relaxed">
                  These cookies are necessary for the Service to function properly. They enable core functionality 
                  such as security, authentication, and session management. The Service cannot function properly 
                  without these cookies.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4 mt-2">
                  <li>Authentication tokens</li>
                  <li>Session identifiers</li>
                  <li>Security cookies</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Functional Cookies</h3>
                <p className="text-gray-600 leading-relaxed">
                  These cookies enable enhanced functionality and personalization, such as remembering your 
                  preferences and settings.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4 mt-2">
                  <li>Language preferences</li>
                  <li>Theme settings</li>
                  <li>Display preferences</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Analytics Cookies</h3>
                <p className="text-gray-600 leading-relaxed">
                  These cookies help us understand how visitors interact with our Service by collecting and 
                  reporting information anonymously.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4 mt-2">
                  <li>Page views and navigation patterns</li>
                  <li>Time spent on pages</li>
                  <li>Error tracking</li>
                  <li>Performance metrics</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Performance Cookies</h3>
                <p className="text-gray-600 leading-relaxed">
                  These cookies help us improve the performance of our Service by collecting information about 
                  how users interact with it.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4 mt-2">
                  <li>Load times</li>
                  <li>Response times</li>
                  <li>Error rates</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Third-Party Cookies</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We may use third-party services that set cookies on your device. These include:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Supabase:</strong> For authentication and database services</li>
              <li><strong>Google Analytics:</strong> For website analytics (if enabled)</li>
              <li><strong>Payment Processors:</strong> For handling subscription payments</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              These third parties have their own privacy policies and cookie policies, which we encourage you to review.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Cookie Duration</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Cookies may be either:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Cookies that remain on your device for a set period or until you delete them</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Managing Cookies</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              You can control and manage cookies in various ways:
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Browser Settings</h3>
                <p className="text-gray-600 leading-relaxed">
                  Most browsers allow you to refuse or accept cookies, delete existing cookies, and set preferences 
                  for certain websites. Check your browser's help section for instructions.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Browser-Specific Instructions</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                  <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
                  <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
                  <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Disabling certain cookies may affect the functionality of our Service. 
                  Essential cookies cannot be disabled as they are necessary for the Service to work.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Do Not Track Signals</h2>
            <p className="text-gray-600 leading-relaxed">
              Some browsers include a "Do Not Track" (DNT) feature that signals to websites that you do not want 
              your online activities tracked. We currently do not respond to DNT signals, but we respect your 
              privacy choices and provide cookie management options.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Updates to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other 
              operational, legal, or regulatory reasons. We will notify you of any material changes by posting the 
              new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about our use of cookies, please contact us at{' '}
              <a href="mailto:amanmaurya55785@gmail.com" className="text-blue-600 hover:text-blue-700">
                amanmaurya55785@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
