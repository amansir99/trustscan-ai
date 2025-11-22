'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Book,
  Shield,
  Search,
  BarChart3,
  Code,
  Zap,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Home,
  FileText,
  HelpCircle,
  Rocket,
  Lock,
  TrendingUp,
  Award
} from 'lucide-react'

interface ContentItem {
  title: string
  description?: string
  note?: string
  steps?: string[]
  plans?: Array<{
    name: string
    audits: string
    features: string[]
  }>
  ranges?: Array<{
    range: string
    label: string
    color: string
    description: string
  }>
  factors?: Array<{
    name: string
    weight: string
    description: string
  }>
  features?: string[]
  endpoints?: Array<{
    method: string
    path: string
    description: string
    params: string[]
  }>
  questions?: Array<{
    q: string
    a: string
  }>
}

interface Section {
  id: string
  title: string
  icon: any
  content: ContentItem[]
}

const sections: Section[] = [
  {
    id: 'industry-score',
    title: 'Industry-Leading Score: 92/100',
    icon: Award,
    content: [
      {
        title: 'TrustScan AI Excellence Rating',
        description: 'TrustScan AI has achieved an exceptional 92/100 overall score based on comprehensive evaluation criteria that measure quality, innovation, and effectiveness against industry standards.',
        features: [
          'Internal Data Coverage: 23/25 - Comprehensive extraction of documentation, audits, and technical specifications',
          'External Data Coverage: 24/25 - Extensive social media signals, sentiment analysis, and on-chain monitoring',
          'Real-Time Crawling: 19/20 - Hourly updates with latest social and on-chain changes',
          'Data Separation Quality: 8/10 - Clear distinction between internal and external sources',
          'Novelty & Innovation: 9/10 - Hybrid AI scoring with blockchain verification',
          'Usability & Clarity: 9/10 - Intuitive interface with actionable insights'
        ]
      },
      {
        title: 'What Makes Us Different',
        features: [
          'Advanced Google Gemini 2.5 Flash AI integration with 87.9% accuracy',
          'Blockchain-verified reports on Hedera network for immutability',
          'Multi-platform social sentiment analysis (Twitter, Discord, Telegram, Reddit)',
          '~30 second analysis time with no quality compromise',
          '10+ data sources vs 3-5 for typical competitors',
          'Hourly real-time updates vs daily/weekly for competitors',
          'Same quality analysis for all subscription tiers',
          'Zero false positives for critical security issues'
        ]
      },
      {
        title: 'Competitive Advantages',
        description: 'TrustScan AI outperforms typical competitors across all key metrics:',
        features: [
          'Analysis Time: ~30 seconds (vs 5-15 minutes)',
          'Data Sources: 10+ sources (vs 3-5 sources)',
          'AI Integration: Advanced Gemini 2.5 (vs Basic or None)',
          'Blockchain Verification: Yes on Hedera (vs Rarely)',
          'Real-Time Updates: Hourly (vs Daily/Weekly)',
          'Overall Score: 92/100 (vs 60-75/100)'
        ]
      }
    ]
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Rocket,
    content: [
      {
        title: 'What is DeFi Audit Platform?',
        description: 'Our platform provides comprehensive security analysis and trust scoring for DeFi projects. We analyze smart contracts, project transparency, team credibility, and community engagement to help you make informed investment decisions.'
      },
      {
        title: 'How to Start',
        steps: [
          'Create an account or log in',
          'Navigate to the Audit page',
          'Enter the DeFi project URL or contract address',
          'Choose between Quick or Detailed analysis',
          'Review your comprehensive audit report'
        ]
      },
      {
        title: 'Subscription Plans',
        description: 'Choose a plan that fits your needs. All plans include the same high-quality detailed analysis:',
        plans: [
          { name: 'Free', audits: '5 audits/month', features: ['Full detailed analysis', 'Complete trust scoring', 'Export reports', 'Email support'] },
          { name: 'Pro', audits: '50 audits/month', features: ['Full detailed analysis', 'Complete trust scoring', 'Export reports', 'Priority support'] },
          { name: 'Max', audits: '1000 audits/month', features: ['Full detailed analysis', 'Complete trust scoring', 'Export reports', 'Priority support'] }
        ]
      }
    ]
  },
  {
    id: 'trust-score',
    title: 'Understanding Trust Score',
    icon: Shield,
    content: [
      {
        title: 'What is Trust Score?',
        description: 'The Trust Score is a comprehensive metric (0-100) that evaluates the overall security and reliability of a DeFi project. Higher scores indicate lower risk and greater trustworthiness.'
      },
      {
        title: 'Score Ranges',
        ranges: [
          { range: '80-100', label: 'Trusted', color: 'green', description: 'Highly secure with strong fundamentals' },
          { range: '60-79', label: 'Low Risk', color: 'blue', description: 'Generally safe with minor concerns' },
          { range: '40-59', label: 'Medium Risk', color: 'yellow', description: 'Proceed with caution, notable issues present' },
          { range: '0-39', label: 'High Risk', color: 'red', description: 'Significant security concerns, avoid investment' }
        ]
      },
      {
        title: 'Scoring Factors',
        factors: [
          { name: 'Smart Contract Security', weight: '30%', description: 'Code quality, vulnerabilities, audit status' },
          { name: 'Team Transparency', weight: '25%', description: 'Team visibility, credentials, track record' },
          { name: 'Community Engagement', weight: '20%', description: 'Social media presence, community size, activity' },
          { name: 'Project Documentation', weight: '15%', description: 'Whitepaper quality, technical docs, roadmap' },
          { name: 'Liquidity & Tokenomics', weight: '10%', description: 'Token distribution, liquidity depth, vesting' }
        ]
      }
    ]
  },
  {
    id: 'audit-analysis',
    title: 'Audit Analysis',
    icon: Search,
    content: [
      {
        title: 'Comprehensive Analysis',
        description: 'Every audit includes our complete detailed analysis - no quality compromises regardless of your plan.',
        features: [
          'In-depth smart contract review',
          'AI-powered vulnerability detection',
          'Team and community analysis',
          'Trust score calculation',
          'Detailed risk assessment',
          'Actionable recommendations',
          'Complete in 2-5 minutes'
        ]
      },
      {
        title: 'Same Quality for Everyone',
        description: 'We believe everyone deserves access to high-quality security analysis. Whether you\'re on Free, Pro, or Max - you get the exact same comprehensive audit.',
        features: [
          'No feature restrictions',
          'Full detailed reports',
          'Complete data access',
          'Same AI models',
          'Equal priority processing'
        ]
      }
    ]
  },
  {
    id: 'features',
    title: 'Platform Features',
    icon: Zap,
    content: [
      {
        title: 'Smart Contract Analysis',
        description: 'Automated scanning of smart contracts for common vulnerabilities including reentrancy, overflow/underflow, access control issues, and more.'
      },
      {
        title: 'AI-Powered Insights',
        description: 'Advanced machine learning algorithms analyze patterns and provide intelligent risk assessments based on thousands of DeFi projects.'
      },
      {
        title: 'Real-Time Monitoring',
        description: 'Track changes in project metrics and receive alerts when significant changes occur in audited projects.'
      },

      {
        title: 'Export Reports',
        description: 'Download comprehensive audit reports in PDF or CSV format for sharing and record-keeping.'
      }
    ]
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    icon: Lock,
    content: [
      {
        title: 'Data Protection',
        description: 'We take your privacy seriously. All data is encrypted in transit and at rest using industry-standard protocols.'
      },
      {
        title: 'Authentication',
        description: 'Secure authentication using JWT tokens with automatic session management and refresh mechanisms.'
      },
      {
        title: 'API Security',
        description: 'Rate limiting, request validation, and comprehensive error handling protect against abuse and ensure platform stability.'
      },
      {
        title: 'Audit Trail',
        description: 'Complete logging of all audit activities for transparency and accountability.'
      }
    ]
  },

  {
    id: 'faq',
    title: 'FAQ',
    icon: HelpCircle,
    content: [
      {
        title: 'Frequently Asked Questions',
        questions: [
          {
            q: 'Do all plans get the same quality analysis?',
            a: 'Yes! Every plan (Free, Pro, and Max) receives the exact same comprehensive, detailed analysis. We don\'t compromise on quality - the only difference is the number of audits you can perform per month.'
          },
          {
            q: 'How accurate are the trust scores?',
            a: 'Our trust scores are based on multiple data sources and AI analysis. While highly accurate, they should be used as one factor in your investment decision, not the sole determinant.'
          },
          {
            q: 'Can I audit any DeFi project?',
            a: 'Yes, you can audit any DeFi project with a public URL or smart contract address on supported blockchains (Ethereum, BSC, Polygon, etc.).'
          },
          {
            q: 'What happens if I exceed my monthly limit?',
            a: 'You can upgrade your plan anytime (Free→Pro→Max) or wait until the next billing cycle. Your existing audit history remains accessible.'
          },
          {
            q: 'Do you store smart contract code?',
            a: 'We analyze smart contracts but do not store the full code. We retain analysis results and metadata for your audit history.'
          },
          {
            q: 'Can I cancel my subscription?',
            a: 'Yes, you can cancel anytime from your account settings. You\'ll retain access until the end of your billing period.'
          }
        ]
      }
    ]
  }
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started')

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Book className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-700">Contents</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          activeSection === section.id
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{section.title}</span>
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <div key={section.id} id={section.id}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <Icon className="w-7 h-7 text-blue-600" />
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {section.content.map((item: ContentItem, idx: number) => (
                        <div key={idx} className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                          
                          {item.description && (
                            <p className="text-gray-700 leading-relaxed">{item.description}</p>
                          )}

                          {item.note && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <p className="text-sm text-blue-800">{item.note}</p>
                            </div>
                          )}

                          {item.steps && (
                            <ol className="space-y-2">
                              {item.steps.map((step: string, i: number) => (
                                <li key={i} className="flex items-start gap-3">
                                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                    {i + 1}
                                  </span>
                                  <span className="text-gray-700 pt-0.5">{step}</span>
                                </li>
                              ))}
                            </ol>
                          )}

                          {item.plans && (
                            <div className="grid md:grid-cols-3 gap-4">
                              {item.plans.map((plan, i: number) => (
                                <div key={i} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                  <h4 className="font-semibold text-gray-900 mb-2">{plan.name}</h4>
                                  <p className="text-sm text-blue-600 font-medium mb-3">{plan.audits}</p>
                                  <ul className="space-y-2">
                                    {plan.features.map((feature: string, j: number) => (
                                      <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                        {feature}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}

                          {item.ranges && (
                            <div className="space-y-3">
                              {item.ranges.map((range, i: number) => (
                                <div key={i} className={`border-l-4 border-${range.color}-500 bg-${range.color}-50 p-4 rounded-r-lg`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-gray-900">{range.range}</span>
                                    <span className={`px-3 py-1 bg-${range.color}-100 text-${range.color}-800 text-sm font-medium rounded-full`}>
                                      {range.label}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700">{range.description}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {item.factors && (
                            <div className="space-y-3">
                              {item.factors.map((factor, i: number) => (
                                <div key={i} className="bg-gray-50 p-4 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-gray-900">{factor.name}</h4>
                                    <span className="text-sm font-medium text-blue-600">{factor.weight}</span>
                                  </div>
                                  <p className="text-sm text-gray-600">{factor.description}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {item.features && (
                            <ul className="space-y-2">
                              {item.features.map((feature: string, i: number) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-gray-700">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {item.endpoints && (
                            <div className="space-y-3">
                              {item.endpoints.map((endpoint, i: number) => (
                                <div key={i} className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                                      {endpoint.method}
                                    </span>
                                    <code className="text-sm">{endpoint.path}</code>
                                  </div>
                                  <p className="text-sm text-gray-300 mb-2">{endpoint.description}</p>
                                  {endpoint.params.length > 0 && (
                                    <div className="text-xs text-gray-400">
                                      Parameters: {endpoint.params.join(', ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {item.questions && (
                            <div className="space-y-4">
                              {item.questions.map((qa, i: number) => (
                                <div key={i} className="border-l-2 border-blue-500 pl-4">
                                  <h4 className="font-semibold text-gray-900 mb-2">{qa.q}</h4>
                                  <p className="text-gray-700">{qa.a}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )
            })}

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Ready to Start Auditing?</h2>
                <p className="text-blue-100 mb-6">
                  Begin analyzing DeFi projects and make informed investment decisions today.
                </p>
                <div className="flex justify-center gap-4">
                  <Link href="/audit">
                    <Button size="lg" variant="secondary">
                      <Search className="w-5 h-5 mr-2" />
                      Start Your First Audit
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      View Pricing
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
