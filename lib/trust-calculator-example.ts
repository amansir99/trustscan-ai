import { TrustScoreCalculator, AnalysisInput } from './trust-calculator';

// Example usage of the TrustScoreCalculator
export function demonstrateTrustScoreCalculation() {
  const calculator = new TrustScoreCalculator();

  // Example 1: High-quality DeFi project
  const highQualityProject: AnalysisInput = {
    factors: {
      documentationQuality: 90,
      transparencyIndicators: 85,
      securityDocumentation: 88,
      communityEngagement: 80,
      technicalImplementation: 92
    },
    redFlags: [],
    positiveIndicators: [
      'multiple audits',
      'established team',
      'open source',
      'active development'
    ],
    contentCompleteness: 95,
    extractedContentLength: 4500
  };

  // Example 2: Suspicious project with red flags
  const suspiciousProject: AnalysisInput = {
    factors: {
      documentationQuality: 40,
      transparencyIndicators: 25,
      securityDocumentation: 15,
      communityEngagement: 30,
      technicalImplementation: 35
    },
    redFlags: [
      'anonymous team',
      'no audit reports',
      'unrealistic promises',
      'limited documentation'
    ],
    positiveIndicators: [],
    contentCompleteness: 45,
    extractedContentLength: 800
  };

  // Example 3: Medium-risk project
  const mediumRiskProject: AnalysisInput = {
    factors: {
      documentationQuality: 65,
      transparencyIndicators: 60,
      securityDocumentation: 55,
      communityEngagement: 70,
      technicalImplementation: 68
    },
    redFlags: [
      'new project',
      'small community'
    ],
    positiveIndicators: [
      'team identified',
      'documentation available'
    ],
    contentCompleteness: 75,
    extractedContentLength: 2200
  };

  console.log('=== Trust Score Calculation Examples ===\n');

  // Calculate and display results
  const results = [
    { name: 'High Quality Project', analysis: highQualityProject },
    { name: 'Suspicious Project', analysis: suspiciousProject },
    { name: 'Medium Risk Project', analysis: mediumRiskProject }
  ];

  results.forEach(({ name, analysis }) => {
    const result = calculator.calculateTrustScore(analysis);
    
    console.log(`${name}:`);
    console.log(`  Final Score: ${result.finalScore}/100`);
    console.log(`  Risk Level: ${result.riskLevel}`);
    console.log(`  Confidence: ${result.confidence}%`);
    console.log(`  Base Score: ${result.baseScore}`);
    console.log(`  Adjustments: ${result.adjustments.length}`);
    
    if (result.adjustments.length > 0) {
      console.log('  Score Adjustments:');
      result.adjustments.forEach(adj => {
        console.log(`    - ${adj.reason}: ${adj.adjustment > 0 ? '+' : ''}${adj.adjustment}`);
      });
    }
    
    console.log(`  Red Flags: ${result.redFlags.length}`);
    console.log(`  Positive Indicators: ${result.positiveIndicators.length}`);
    console.log('');
  });

  return results.map(({ analysis }) => calculator.calculateTrustScore(analysis));
}

// Export for use in other parts of the application
export { TrustScoreCalculator };
export type { AnalysisInput, TrustScoreResult, ScoreAdjustment } from './trust-calculator';