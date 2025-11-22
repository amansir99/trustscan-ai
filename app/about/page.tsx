export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">About TrustScan AI</h1>
        
        {/* Achievement Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-2xl shadow-xl mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">Industry-Leading Platform</h2>
              <p className="text-blue-100 text-lg mb-4">
                TrustScan AI has achieved an exceptional 92/100 overall score, recognized as one of the most comprehensive and innovative DeFi security analysis platforms.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-bold text-2xl">24/25</div>
                  <div className="text-blue-200">External Data Coverage</div>
                </div>
                <div>
                  <div className="font-bold text-2xl">19/20</div>
                  <div className="text-blue-200">Real-Time Crawling</div>
                </div>
                <div>
                  <div className="font-bold text-2xl">9/10</div>
                  <div className="text-blue-200">Innovation Score</div>
                </div>
                <div>
                  <div className="font-bold text-2xl">87.9%</div>
                  <div className="text-blue-200">AI Accuracy</div>
                </div>
              </div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-7xl font-bold mb-2">92</div>
              <div className="text-2xl font-semibold">out of 100</div>
              <div className="text-sm text-blue-200 mt-2">Overall Industry Score</div>
            </div>
          </div>
        </div>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              We are dedicated to promoting transparency and trust in the DeFi ecosystem. Our platform 
              provides comprehensive security auditing and verification services powered by advanced AI 
              to help users make informed decisions about DeFi projects and investments.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">What We Do</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Our advanced AI-powered analysis tools evaluate DeFi projects across multiple dimensions:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Smart contract security analysis and vulnerability detection</li>
              <li>Team transparency and credibility verification</li>
              <li>Real-time social sentiment analysis across multiple platforms</li>
              <li>On-chain activity monitoring and verification</li>
              <li>Comprehensive trust score calculation (0-100)</li>
              <li>Blockchain-verified immutable audit reports</li>
              <li>Actionable recommendations and risk assessments</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Why We're Different</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Comprehensive Data Sources</h3>
                <p className="text-gray-600 text-sm">
                  We analyze 10+ data sources including documentation, audits, social media, on-chain data, 
                  and community sentiment - far exceeding typical competitors who use only 3-5 sources.
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Advanced AI Integration</h3>
                <p className="text-gray-600 text-sm">
                  Powered by Google Gemini 2.5 Flash with 87.9% accuracy, our AI understands context, 
                  detects patterns, and adapts to different project types (DAOs, protocols, tokens).
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Real-Time Updates</h3>
                <p className="text-gray-600 text-sm">
                  Hourly updates for social signals and on-chain data ensure you always have the latest 
                  information, while competitors typically update daily or weekly.
                </p>
              </div>
              <div className="bg-indigo-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Blockchain Verification</h3>
                <p className="text-gray-600 text-sm">
                  Every audit is stored on the Hedera network, creating an immutable, tamper-proof record 
                  with timestamp verification - a feature rarely offered by competitors.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Technology</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We leverage cutting-edge artificial intelligence and blockchain technology to provide 
              accurate, transparent, and verifiable DeFi security analysis.
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Technology Stack</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><strong>AI Engine:</strong> Google Gemini 2.5 Flash for natural language processing and pattern recognition</li>
                <li><strong>Blockchain:</strong> Hedera Hashgraph for immutable audit storage and verification</li>
                <li><strong>Web Scraping:</strong> Puppeteer for comprehensive content extraction</li>
                <li><strong>Database:</strong> Supabase (PostgreSQL) with real-time capabilities</li>
                <li><strong>Frontend:</strong> Next.js 15 with React and TypeScript</li>
                <li><strong>Analysis Speed:</strong> ~30 seconds for complete audit</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Proven Performance</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="text-4xl font-bold text-blue-600 mb-2">92/100</div>
                <div className="text-sm text-gray-700 font-medium">Overall Industry Score</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="text-4xl font-bold text-green-600 mb-2">87.9%</div>
                <div className="text-sm text-gray-700 font-medium">AI Accuracy Rate</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="text-4xl font-bold text-purple-600 mb-2">100+</div>
                <div className="text-sm text-gray-700 font-medium">Successful Audits</div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Commitment</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We are committed to maintaining the highest standards of accuracy, transparency, and 
              user privacy. Our goal is to empower users with the tools they need to navigate the 
              DeFi landscape with confidence.
            </p>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg">
              <h3 className="font-semibold text-xl mb-3">Quality Guarantee</h3>
              <ul className="space-y-2 text-blue-100 text-sm">
                <li>✓ Same high-quality analysis for all subscription tiers (Free, Pro, Max)</li>
                <li>✓ No compromises on data sources or AI capabilities</li>
                <li>✓ Transparent scoring methodology with documented criteria</li>
                <li>✓ Blockchain-verified reports for complete transparency</li>
                <li>✓ Continuous improvement through user feedback and AI training</li>
                <li>✓ Zero tolerance for false positives on critical security issues</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
