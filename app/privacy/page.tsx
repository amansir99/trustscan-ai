export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: November 15, 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg mb-8">
            <p className="text-green-800 font-semibold mb-2">🔒 Your Privacy Matters</p>
            <p className="text-green-700 leading-relaxed">
              We believe in minimal data collection. We only collect what's essential to provide you with 
              secure access to TrustScan AI. No names, no phone numbers, no unnecessary personal information.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Information We Collect</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We practice data minimization and only collect what's necessary to operate our service:
            </p>
            
            <div className="bg-blue-50 border border-blue-200 p-5 rounded-lg mb-4">
              <p className="text-blue-900 font-semibold mb-3">Account Information (Required for Login)</p>
              <ul className="list-disc list-inside text-blue-800 space-y-2 ml-4">
                <li><strong>Email Address:</strong> Used for account identification and login</li>
                <li><strong>Password:</strong> Securely hashed and stored to protect your account</li>
              </ul>
              <p className="text-blue-700 text-sm mt-3">
                <strong>Note:</strong> We do NOT collect your name, phone number, address, or other personal 
                details. Your email is the only identifier we need.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 p-5 rounded-lg mb-4">
              <p className="text-purple-900 font-semibold mb-3">Audit Data (Temporary Processing Only)</p>
              <ul className="list-disc list-inside text-purple-800 space-y-2 ml-4">
                <li><strong>URLs Submitted:</strong> Processed temporarily to generate your audit report</li>
                <li><strong>Audit Reports:</strong> Generated in real-time and displayed to you immediately</li>
                <li><strong>No Storage:</strong> Audit reports are NOT stored permanently in our database</li>
              </ul>
              <p className="text-purple-700 text-sm mt-3">
                <strong>Important:</strong> We do NOT store your audit history. Each audit is processed in real-time, 
                and reports are temporarily cached for a short period (typically 30 minutes) to allow you to view 
                them during your session. After that, they are automatically deleted. This approach minimizes data 
                storage and enhances your privacy.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-5 rounded-lg">
              <p className="text-gray-900 font-semibold mb-3">Technical Information (Automatic)</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Usage Count:</strong> Number of audits performed this month (for subscription limit enforcement)</li>
                <li><strong>Subscription Tier:</strong> Your current plan (Free, Pro, or Max)</li>
                <li><strong>Session Data:</strong> Authentication tokens to keep you logged in securely</li>
                <li><strong>Basic Analytics:</strong> Anonymous, aggregated usage patterns to improve our service</li>
              </ul>
              <p className="text-gray-600 text-sm mt-3">
                We do NOT track your browsing behavior outside of TrustScan AI, store which specific projects 
                you audit, or sell your data to third parties.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Every piece of data we collect has a specific purpose. Here's exactly how we use your information:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Email Address:</strong> To authenticate your login, send important account notifications, 
              and communicate about service updates or security issues</li>
              <li><strong>Password:</strong> To verify your identity and protect your account (stored as a secure hash, 
              never in plain text)</li>
              <li><strong>Audit URLs:</strong> To process and analyze DeFi projects in real-time. URLs are processed 
              temporarily and not stored permanently</li>
              <li><strong>Usage Statistics:</strong> To track audit count for subscription limits, improve our AI models, 
              and optimize service performance</li>
              <li><strong>Technical Data:</strong> To maintain your session, prevent fraud, and ensure platform security</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              <strong>We will NEVER:</strong> Sell your data, share your email with marketers, or use your 
              information for purposes beyond operating TrustScan AI.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Information Sharing & Third Parties</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>We do NOT sell, trade, or rent your personal information to anyone. Period.</strong>
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              We may share limited information only in these specific circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>With Your Explicit Consent:</strong> If you authorize us to share specific information</li>
              <li><strong>Legal Requirements:</strong> If required by law, court order, or government regulation</li>
              <li><strong>Security & Fraud Prevention:</strong> To protect against abuse, fraud, or security threats</li>
              <li><strong>Essential Service Providers:</strong> With trusted partners who help operate our platform 
              (e.g., database hosting, authentication services). These providers are contractually bound to protect 
              your data and cannot use it for other purposes.</li>
            </ul>
            <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-lg mt-4">
              <p className="text-amber-900 font-semibold mb-2">Third-Party Services We Use</p>
              <p className="text-amber-800 text-sm">
                We use industry-standard services like Supabase for secure database hosting and authentication. 
                These providers have their own privacy policies and security measures. We carefully vet all 
                service providers to ensure they meet high security and privacy standards.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Data Security</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Protecting your data is our top priority. Here's how we keep your information secure:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Password Encryption:</strong> Your password is hashed using industry-standard bcrypt 
              encryption. We never store or see your actual password.</li>
              <li><strong>Secure Connections:</strong> All data transmission uses HTTPS/TLS encryption</li>
              <li><strong>Database Security:</strong> Your data is stored in secure, encrypted databases with 
              access controls and regular backups</li>
              <li><strong>Authentication Tokens:</strong> Session management uses secure, time-limited tokens</li>
              <li><strong>Regular Security Updates:</strong> We continuously monitor and update our security measures</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              <strong>Your Role:</strong> Use a strong, unique password for your TrustScan AI account. Never share 
              your login credentials with anyone.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Your Rights & Control</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Your data belongs to you. You have complete control over your information:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Access Your Data:</strong> View all information we have about you (email, subscription tier, 
              usage count) through your account dashboard or by contacting us</li>
              <li><strong>Update Information:</strong> Change your email address or password anytime through 
              account settings</li>
              <li><strong>Export Your Data:</strong> Request a copy of your account information (email, subscription 
              details, usage statistics)</li>
              <li><strong>Delete Your Account:</strong> Request complete account deletion, which will permanently 
              remove your email, usage statistics, and all associated data</li>
              <li><strong>Opt-Out of Communications:</strong> Unsubscribe from non-essential emails (you'll still 
              receive critical security notifications)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              <strong>Note on Audit Reports:</strong> Since we don't store audit history, there's no historical 
              audit data to export or delete. Each audit is processed in real-time and temporarily cached only 
              for your immediate viewing.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              <strong>How to Exercise Your Rights:</strong> Email us at{' '}
              <a href="mailto:amanmaurya55785@gmail.com" className="text-blue-600 hover:text-blue-700">
                amanmaurya55785@gmail.com
              </a>{' '}
              with your request. We'll respond within 48 hours.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Cookies & Tracking</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We use minimal cookies to provide essential functionality:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Authentication Cookies:</strong> Keep you logged in securely between sessions (essential)</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences (optional)</li>
              <li><strong>Analytics Cookies:</strong> Anonymous usage statistics to improve our service (optional)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              <strong>Your Control:</strong> You can configure your browser to refuse cookies, though this may 
              affect functionality. Essential authentication cookies are required for the service to work.
            </p>
            <p className="text-gray-600 leading-relaxed mt-2">
              <strong>No Third-Party Tracking:</strong> We do NOT use advertising cookies or share your browsing 
              data with ad networks.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We retain your data only as long as necessary:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Active Accounts:</strong> Your email, password hash, subscription details, and usage 
              statistics are retained while your account is active</li>
              <li><strong>Audit Reports:</strong> Temporarily cached for 30 minutes after generation, then 
              automatically deleted. No permanent storage of audit history</li>
              <li><strong>Deleted Accounts:</strong> When you delete your account, all personal data is permanently 
              removed within 30 days</li>
              <li><strong>Legal Requirements:</strong> Some data may be retained longer if required by law</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              <strong>Privacy by Design:</strong> By not storing audit history, we minimize the data we hold about 
              you, reducing privacy risks and giving you peace of mind that your research activities aren't 
              permanently tracked.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy as our service evolves or regulations change. When we make 
              significant changes, we'll notify you via email and update the "Last updated" date at the top 
              of this page. Continued use of TrustScan AI after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Questions & Contact</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We're committed to transparency and protecting your privacy. If you have any questions, concerns, 
              or requests regarding this Privacy Policy or your data:
            </p>
            <div className="bg-blue-50 border border-blue-200 p-5 rounded-lg">
              <p className="text-blue-900 font-semibold mb-2">📧 Get in Touch</p>
              <p className="text-blue-800">
                Email us at{' '}
                <a href="mailto:amanmaurya55785@gmail.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                  amanmaurya55785@gmail.com
                </a>
              </p>
              <p className="text-blue-700 text-sm mt-3">
                We typically respond within 24-48 hours. Your privacy matters to us, and we're here to help.
              </p>
            </div>
          </section>

          <div className="bg-gradient-to-r from-green-50 to-teal-50 border-l-4 border-green-500 p-6 rounded-r-lg mt-8">
            <p className="text-green-900 font-semibold mb-3">🔐 Our Privacy Commitment</p>
            <p className="text-green-800 leading-relaxed">
              At TrustScan AI, we believe privacy is a fundamental right. We collect only what's essential, 
              protect it rigorously, and give you complete control. No hidden tracking, no data selling, 
              no surprises—just transparent, secure service you can trust.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
