export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Disclaimer & Audit Limitations</h1>
        <p className="text-gray-600 mb-8">Last updated: November 15, 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8">
            <p className="text-blue-800 font-semibold mb-2">🛡️ Our Commitment to You</p>
            <p className="text-blue-700 leading-relaxed">
              TrustScan AI is designed to empower you with intelligent security analysis for DeFi projects. 
              We're here to support your research journey by providing AI-powered insights, but we believe in 
              transparency about what our audits can and cannot do. This helps you make informed decisions with 
              confidence.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. What We Provide</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              TrustScan AI is your research companion, offering AI-powered security analysis and trust scoring 
              to help you understand DeFi projects better. Our service provides:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>✅ Comprehensive security analysis of smart contracts and project documentation</li>
              <li>✅ Trust scores based on multiple security and transparency factors</li>
              <li>✅ Detailed reports highlighting potential risks and positive indicators</li>
              <li>✅ AI-powered insights to support your research process</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              <strong>Important:</strong> We provide analytical tools for your research, not financial advice. 
              Our analysis is designed to inform your decision-making process, but investment decisions should 
              always be yours, ideally made in consultation with qualified financial professionals.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Understanding Our Audit Limitations</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We believe in transparency. While our AI-powered audits are comprehensive, it's important to 
              understand their scope and limitations so you can use them effectively:
            </p>
            
            <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-lg mb-4">
              <p className="text-amber-900 font-semibold mb-3">🔍 Scope of Analysis</p>
              <ul className="list-disc list-inside text-amber-800 space-y-2 ml-4">
                <li><strong>Automated Analysis:</strong> Our audits use AI to analyze publicly available information, 
                smart contracts, documentation, and online presence. While powerful, automated analysis may not 
                catch everything a manual security audit would identify.</li>
                <li><strong>Point-in-Time Assessment:</strong> Each audit reflects the project's state at the time 
                of analysis. DeFi projects evolve rapidly—code updates, team changes, and new features can affect 
                security after our audit.</li>
                <li><strong>Public Information Only:</strong> We analyze what's publicly accessible. Private code, 
                internal processes, or undisclosed information cannot be evaluated in our audits.</li>
              </ul>
            </div>

            <div className="bg-purple-50 border-l-4 border-purple-400 p-5 rounded-r-lg mb-4">
              <p className="text-purple-900 font-semibold mb-3">🤖 AI Technology Considerations</p>
              <ul className="list-disc list-inside text-purple-800 space-y-2 ml-4">
                <li><strong>AI Capabilities:</strong> Our AI models are trained on extensive security patterns and 
                best practices, but like all AI systems, they may occasionally produce false positives or miss 
                subtle vulnerabilities.</li>
                <li><strong>Evolving Threats:</strong> New attack vectors and exploit techniques emerge constantly. 
                Our AI is regularly updated, but zero-day vulnerabilities may not be detected immediately.</li>
                <li><strong>Context Limitations:</strong> AI excels at pattern recognition but may not fully 
                understand complex business logic or unique project-specific contexts.</li>
              </ul>
            </div>

            <div className="bg-green-50 border-l-4 border-green-400 p-5 rounded-r-lg">
              <p className="text-green-900 font-semibold mb-3">✨ What This Means for You</p>
              <ul className="list-disc list-inside text-green-800 space-y-2 ml-4">
                <li><strong>Use as a Starting Point:</strong> Our audits are excellent for initial due diligence 
                and identifying red flags, but should be part of a broader research strategy.</li>
                <li><strong>Complement with Other Research:</strong> Combine our analysis with community feedback, 
                professional audits, team verification, and your own investigation.</li>
                <li><strong>Stay Updated:</strong> Re-audit projects periodically, especially before making new 
                investments or after major project updates.</li>
                <li><strong>Trust Scores are Indicators:</strong> A high trust score indicates positive security 
                signals, but it's not a guarantee of safety. Similarly, a lower score doesn't necessarily mean 
                a project is malicious—it may just need more transparency.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. DeFi Risk Awareness</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We want you to succeed in the DeFi space. Understanding risks is the first step to managing them 
              effectively. Here's what you should be aware of:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Smart Contract Risks:</strong> Even audited contracts can have vulnerabilities. Bugs or 
              exploits can potentially result in loss of funds.</li>
              <li><strong>Market Volatility:</strong> Cryptocurrency prices can change rapidly. This is normal in 
              DeFi but requires careful risk management.</li>
              <li><strong>Regulatory Evolution:</strong> Crypto regulations are developing worldwide. Stay informed 
              about laws in your jurisdiction.</li>
              <li><strong>Project Changes:</strong> Teams, tokenomics, and smart contracts can change. Regular 
              monitoring is important.</li>
              <li><strong>Liquidity Considerations:</strong> Some tokens may have limited liquidity, affecting your 
              ability to enter or exit positions.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              <strong>Our Recommendation:</strong> Start small, diversify your research sources, never invest more 
              than you can afford to lose, and build your knowledge gradually. The DeFi community is supportive—
              don't hesitate to ask questions and learn from others.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Service Transparency</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We strive for excellence, but we also believe in being upfront about our service limitations:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Best Effort Analysis:</strong> We work hard to provide accurate, comprehensive analysis, 
              but we cannot guarantee 100% accuracy or completeness in every audit.</li>
              <li><strong>Continuous Improvement:</strong> We're constantly improving our AI models and analysis 
              techniques based on user feedback and emerging security research.</li>
              <li><strong>Service Availability:</strong> While we aim for 99.9% uptime, occasional maintenance or 
              technical issues may occur. We'll communicate any planned downtime in advance.</li>
              <li><strong>Data Security:</strong> We implement industry-standard security measures to protect your 
              data, though no system can be 100% secure.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              If you encounter any issues or have concerns about our analysis, please reach out—we're here to help 
              and continuously improve our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Third-Party Projects & Content</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              TrustScan AI analyzes third-party DeFi projects and may reference external websites, documentation, 
              and smart contracts. Here's what you should know:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Independent Analysis:</strong> Our audits are independent assessments. We don't have 
              partnerships with or receive compensation from the projects we analyze.</li>
              <li><strong>No Endorsements:</strong> Analyzing a project doesn't mean we endorse it. Even projects 
              with high trust scores should be researched independently.</li>
              <li><strong>External Links:</strong> We may provide links to project websites, documentation, or 
              social media for your convenience. Always verify URLs and be cautious of phishing attempts.</li>
              <li><strong>Third-Party Actions:</strong> We're not responsible for the actions, decisions, or 
              security practices of the projects we analyze.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              <strong>Safety Tip:</strong> Always double-check URLs, verify contract addresses on multiple sources, 
              and be wary of projects that pressure you to invest quickly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Liability & Responsibility</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We're committed to providing valuable analysis, but it's important to understand the boundaries 
              of our responsibility:
            </p>
            <div className="bg-gray-50 border border-gray-200 p-5 rounded-lg">
              <p className="text-gray-700 mb-3">
                To the maximum extent permitted by law, TrustScan AI and its team are not liable for:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Investment decisions or financial outcomes based on our analysis</li>
                <li>Losses resulting from project vulnerabilities, exploits, or failures</li>
                <li>Errors, omissions, or inaccuracies in our automated analysis</li>
                <li>Service interruptions, technical issues, or data loss</li>
                <li>Actions taken by third-party projects or individuals</li>
                <li>Changes to projects after our audit was conducted</li>
              </ul>
              <p className="text-gray-700 mt-4">
                <strong>Why This Matters:</strong> This limitation protects our ability to provide affordable, 
                accessible security analysis to the entire DeFi community. Professional manual audits can cost 
                $10,000-$50,000+ per project—we're democratizing access to security insights while being 
                transparent about the nature of automated analysis.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Empowering Your Research Journey</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We're here to support you, but the best decisions come from informed, independent research. 
              Here's how to make the most of TrustScan AI:
            </p>
            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-5 rounded-r-lg">
              <p className="text-indigo-900 font-semibold mb-3">📚 Best Practices for Using Our Audits</p>
              <ul className="list-disc list-inside text-indigo-800 space-y-2 ml-4">
                <li><strong>Layer Your Research:</strong> Use our audits as one layer in your research stack. 
                Combine with community sentiment, professional audits, team background checks, and technical analysis.</li>
                <li><strong>Verify Key Findings:</strong> If our audit highlights specific concerns, investigate 
                them further through official project channels or community discussions.</li>
                <li><strong>Stay Current:</strong> Bookmark projects you're interested in and re-audit them 
                periodically, especially before making investment decisions.</li>
                <li><strong>Understand the Metrics:</strong> Take time to understand what our trust scores measure 
                and how different factors contribute to the overall rating.</li>
                <li><strong>Seek Professional Advice:</strong> For significant investments, consider consulting 
                with financial advisors, tax professionals, or legal counsel familiar with cryptocurrency.</li>
                <li><strong>Secure Your Assets:</strong> Always use strong passwords, enable two-factor authentication, 
                and never share your private keys or seed phrases.</li>
                <li><strong>Know Your Jurisdiction:</strong> Understand and comply with cryptocurrency regulations 
                in your location.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Regulatory Awareness</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Cryptocurrency regulations are evolving globally. Staying compliant protects you and supports 
              the growth of the DeFi ecosystem:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Know Your Local Laws:</strong> Cryptocurrency regulations vary significantly by country 
              and region. Research what's legal in your jurisdiction.</li>
              <li><strong>Tax Obligations:</strong> Most jurisdictions require reporting cryptocurrency gains and 
              losses. Keep good records and consult with tax professionals.</li>
              <li><strong>KYC/AML Requirements:</strong> Many platforms require identity verification. This is 
              normal and helps protect the ecosystem from fraud.</li>
              <li><strong>Accreditation:</strong> Some investment opportunities may have accreditation requirements. 
              Understand what applies to you.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              <strong>Helpful Resources:</strong> Consider consulting with legal professionals familiar with 
              cryptocurrency in your jurisdiction, especially for significant investments or if you're unsure 
              about compliance requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Keeping Audits Current</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              The DeFi space moves fast, and so do the projects within it. Here's what you should know:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Snapshot in Time:</strong> Each audit captures the project's state at a specific moment. 
              Think of it as a photograph, not a live video feed.</li>
              <li><strong>Positive Changes:</strong> Projects often improve over time—adding audits, increasing 
              transparency, or enhancing security. Re-auditing can reveal these improvements.</li>
              <li><strong>Monitor Updates:</strong> Follow project announcements for smart contract upgrades, 
              tokenomics changes, or team updates that might affect security.</li>
              <li><strong>Community Signals:</strong> Active, engaged communities often indicate healthy projects. 
              Combine our technical analysis with community sentiment.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              <strong>Pro Tip:</strong> Set reminders to re-audit projects every 30-60 days, or immediately after 
              major updates. Our platform makes it easy to track changes over time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Your Agreement</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              By using TrustScan AI, you're joining a community of informed researchers. You acknowledge that:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>✅ You've read and understood this disclaimer and our audit limitations</li>
              <li>✅ You'll use our analysis as part of a comprehensive research strategy</li>
              <li>✅ You understand the risks inherent in DeFi and cryptocurrency investments</li>
              <li>✅ You'll make independent decisions and seek professional advice when needed</li>
              <li>✅ You'll conduct your own due diligence beyond our automated analysis</li>
              <li>✅ You won't hold TrustScan AI liable for investment outcomes or losses</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              We're committed to supporting your success in DeFi through transparent, intelligent analysis. 
              Together, we can build a safer, more informed crypto ecosystem.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. We're Here to Help</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Questions about our audits, limitations, or how to use TrustScan AI effectively? We'd love to hear 
              from you:
            </p>
            <div className="bg-gray-50 border border-gray-200 p-5 rounded-lg">
              <p className="text-gray-700 mb-2">
                📧 Email us at{' '}
                <a href="mailto:amanmaurya55785@gmail.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                  amanmaurya55785@gmail.com
                </a>
              </p>
              <p className="text-gray-600 text-sm mt-3">
                We typically respond within 24-48 hours. Your feedback helps us improve our service and better 
                support the DeFi community.
              </p>
            </div>
          </section>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-r-lg mt-8">
            <p className="text-blue-900 font-semibold mb-3 text-lg">💡 Final Thoughts</p>
            <p className="text-blue-800 leading-relaxed mb-3">
              TrustScan AI is built to empower you with knowledge and insights. While we can't eliminate all risks 
              in DeFi, we can help you understand them better and make more informed decisions.
            </p>
            <p className="text-blue-800 leading-relaxed">
              <strong>Remember:</strong> Start small, learn continuously, diversify your research, and never invest 
              more than you can afford to lose. The DeFi journey is exciting—let's navigate it together with 
              intelligence and caution. Always do your own research (DYOR) and consult with qualified professionals 
              for significant investment decisions. 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
