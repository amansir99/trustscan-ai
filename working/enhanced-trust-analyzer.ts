import { DeepAnalyzer } from '../lib/deep-analyzer'
import { SourceValidator } from '../lib/source-validator'
import { RealTimeMonitor } from '../lib/real-time-monitor'

interface TrustScore {
  overall: number
  reliability: number
  security: number
  performance: number
  governance: number
  evidence: string[]
  risks: string[]
  timestamp: number
}

export class EnhancedTrustAnalyzer {
  private deepAnalyzer: DeepAnalyzer
  private sourceValidator: SourceValidator
  private realTimeMonitor: RealTimeMonitor

  constructor(geminiApiKey: string) {
    this.deepAnalyzer = new DeepAnalyzer(geminiApiKey)
    this.sourceValidator = new SourceValidator()
    this.realTimeMonitor = new RealTimeMonitor()
  }

  async analyzeTrust(chainlinkAddress: string): Promise<TrustScore> {
    // Deep analysis of the Chainlink oracle
    const deepAnalysis = await this.deepAnalyzer.analyzeProtocol(chainlinkAddress, 'Chainlink Oracle')
    
    // Validate all sources and evidence (mock sources for now)
    const mockSources = ['https://chainlink.com', 'https://docs.chain.link']
    const validatedSources = await this.sourceValidator.validateSources(mockSources)
    
    // Get real-time risk alerts
    const realTimeRisks = this.realTimeMonitor.getAlerts(chainlinkAddress)

    // Calculate comprehensive trust score
    const trustScore = this.calculateTrustScore(deepAnalysis, validatedSources, realTimeRisks)
    
    return {
      ...trustScore,
      timestamp: Date.now()
    }
  }

  private calculateTrustScore(analysis: any, sources: any, risks: any): Omit<TrustScore, 'timestamp'> {
    const reliability = Math.max(0, analysis.overallScore - (risks.length * 10))
    const security = Math.max(0, analysis.security.score - (risks.filter((r: any) => r.alertType === 'security').length * 15))
    const performance = analysis.technical.score
    const governance = sources.confidence

    const overall = (reliability + security + performance + governance) / 4

    return {
      overall: Math.round(overall),
      reliability: Math.round(reliability),
      security: Math.round(security),
      performance: Math.round(performance),
      governance: Math.round(governance),
      evidence: sources.validSources.map((s: any) => s.url),
      risks: risks.map((r: any) => r.message)
    }
  }

  async startMonitoring(chainlinkAddress: string): Promise<void> {
    await this.realTimeMonitor.setupMonitoring({
      protocolName: chainlinkAddress,
      monitoringSources: ['https://chainlink.com'],
      alertThresholds: {
        securityScore: 70,
        communityActivity: 50,
        governanceChanges: true
      }
    })
  }
}