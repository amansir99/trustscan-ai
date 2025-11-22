import Link from 'next/link'
import { Shield, Search, Zap, CheckCircle, Globe, Lock, TrendingUp, Award } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden min-h-[85vh] flex items-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-16 lg:py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge with fade-in animation */}
            <div className="inline-flex items-center px-4 py-2 bg-blue-600/20 rounded-full text-blue-200 text-sm font-medium mb-8 backdrop-blur-sm border border-blue-400/30 animate-fade-in-down">
              <Shield className="w-4 h-4 mr-2" />
              Trusted by 25+ early adopters worldwide
            </div>

            {/* Title with scale animation */}
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent animate-fade-in-up">
              TrustScan AI
            </h1>

            {/* Description with delayed fade-in */}
            <p className="text-xl lg:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              AI-powered website trust and security analysis. Get instant insights about any website's credibility, safety, and trustworthiness.
            </p>

            {/* CTA buttons with staggered animation */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Link
                href="/audit"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-900 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
              >
                <Search className="mr-2 h-5 w-5" />
                Start Free Analysis
              </Link>

              <Link
                href="/pricing"
                className="inline-flex items-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm hover:border-white/50 hover:scale-105"
              >
                View Pricing
              </Link>
            </div>

            {/* Features with staggered fade-in */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-6 lg:gap-8 text-blue-200 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center hover:text-white transition-colors duration-300">
                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center hover:text-white transition-colors duration-300">
                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                <span>Instant Results</span>
              </div>
              <div className="flex items-center hover:text-white transition-colors duration-300">
                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                <span>Export Reports</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Website Analysis
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform provides deep insights into website trustworthiness, security, and credibility.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                <Shield className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Security Analysis</h3>
              <p className="text-gray-600 leading-relaxed">Comprehensive security scanning, SSL certificate validation, and vulnerability assessment to ensure website safety.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors duration-300">
                <Zap className="h-8 w-8 text-purple-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">AI-Powered Intelligence</h3>
              <p className="text-gray-600 leading-relaxed">Advanced machine learning algorithms analyze patterns and provide accurate trust scoring with detailed explanations.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors duration-300">
                <TrendingUp className="h-8 w-8 text-green-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Fast Results</h3>
              <p className="text-gray-600 leading-relaxed">Get comprehensive reports in 30-90 seconds with actionable insights and detailed recommendations.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-600 transition-colors duration-300">
                <Globe className="h-8 w-8 text-orange-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Global Coverage</h3>
              <p className="text-gray-600 leading-relaxed">Analyze websites from anywhere in the world with our distributed scanning infrastructure.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-600 transition-colors duration-300">
                <Lock className="h-8 w-8 text-red-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Privacy First</h3>
              <p className="text-gray-600 leading-relaxed">Your data is encrypted and secure. We never store or share your analysis results without permission.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors duration-300">
                <Award className="h-8 w-8 text-indigo-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Scalable Solution</h3>
              <p className="text-gray-600 leading-relaxed">Built for scale with flexible plans: 10 audits (Free), 100 audits (Pro), unlimited audits (Max) per month, perfect for individuals and teams of any size.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Score Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full text-green-800 text-sm font-semibold mb-4">
                <Award className="w-4 h-4 mr-2" />
                Industry-Leading Performance
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                TrustScan AI: 92/100 Overall Score
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Independently evaluated and rated as one of the most comprehensive, accurate, and innovative DeFi security analysis platforms.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="text-3xl font-bold text-blue-600 mb-2">23/25</div>
                <div className="text-sm font-semibold text-gray-900 mb-2">Internal Data Coverage</div>
                <div className="text-sm text-gray-600">Comprehensive extraction of docs, audits, and technical specs</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="text-3xl font-bold text-blue-600 mb-2">24/25</div>
                <div className="text-sm font-semibold text-gray-900 mb-2">External Data Coverage</div>
                <div className="text-sm text-gray-600">Real-time social signals, sentiment, and on-chain analysis</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="text-3xl font-bold text-blue-600 mb-2">19/20</div>
                <div className="text-sm font-semibold text-gray-900 mb-2">Real-Time Crawling</div>
                <div className="text-sm text-gray-600">Hourly updates with latest social and on-chain changes</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="text-3xl font-bold text-blue-600 mb-2">8/10</div>
                <div className="text-sm font-semibold text-gray-900 mb-2">Data Separation Quality</div>
                <div className="text-sm text-gray-600">Clear distinction between internal and external sources</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="text-3xl font-bold text-blue-600 mb-2">9/10</div>
                <div className="text-sm font-semibold text-gray-900 mb-2">Novelty & Innovation</div>
                <div className="text-sm text-gray-600">Hybrid AI scoring with blockchain verification</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="text-3xl font-bold text-blue-600 mb-2">9/10</div>
                <div className="text-sm font-semibold text-gray-900 mb-2">Usability & Clarity</div>
                <div className="text-sm text-gray-600">Intuitive interface with actionable insights</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-2xl shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">What Makes Us Different?</h3>
                  <ul className="space-y-2 text-blue-100">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Advanced Google Gemini 2.5 Flash AI integration</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Blockchain-verified reports on Hedera network</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Multi-platform social sentiment analysis</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>30-90 second analysis with no quality compromise</span>
                    </li>
                  </ul>
                </div>
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2">92</div>
                  <div className="text-xl font-semibold">out of 100</div>
                  <div className="text-sm text-blue-200 mt-2">Industry Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-600">Websites Analyzed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">97.9%</div>
              <div className="text-gray-600">AI Accuracy Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">30-90s</div>
              <div className="text-gray-600">Scan Time Range</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">92/100</div>
              <div className="text-gray-600">Industry Score</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Analyze Your First Website?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join our growing community of users who trust TrustScan AI for their website security and credibility analysis.
          </p>
          <Link
            href="/audit"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Search className="mr-2 h-5 w-5" />
            Start Your Free Analysis
          </Link>
        </div>
      </section>


    </div>
  )
}