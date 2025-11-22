/**
 * Example usage of the AIAnalysisService
 * This file demonstrates how to use the new AI analysis service
 */

import { AIAnalysisService, ExtractedContent, AnalysisResult } from './ai-analyzer';

// Example function showing how to use the AI analyzer
export async function analyzeProjectExample(url: string): Promise<AnalysisResult> {
  // Create the AI analysis service
  const aiAnalyzer = new AIAnalysisService();

  // Mock extracted content (in real implementation, this would come from the scraper)
  const mockExtractedContent: ExtractedContent = {
    url: url,
    title: 'Example DeFi Project',
    description: 'A comprehensive DeFi protocol for yield farming',
    mainContent: `
      Welcome to our DeFi protocol. We provide secure yield farming opportunities
      with transparent tokenomics and a dedicated team. Our smart contracts have
      been audited by leading security firms.
    `,
    documentation: [
      'API Documentation: Complete guide for developers',
      'User Guide: Step-by-step instructions for users',
      'Whitepaper: Technical specifications and protocol design'
    ],
    teamInfo: `
      John Doe - CEO: Former blockchain engineer at major tech company
      Jane Smith - CTO: PhD in Computer Science, 10 years crypto experience
      Bob Johnson - Security Lead: Former auditor at top security firm
    `,
    tokenomics: `
      Total Supply: 100,000,000 tokens
      Distribution: 40% community, 30% team (4-year vesting), 20% treasury, 10% advisors
      Governance: Token holders vote on protocol changes
    `,
    securityInfo: `
      Audited by: CertiK, ConsenSys Diligence
      Bug Bounty: $100,000 program active
      Multisig: 3/5 multisig for treasury operations
      Timelock: 48-hour timelock on critical changes
    `,
    socialLinks: [
      'https://twitter.com/example_defi',
      'https://discord.gg/example',
      'https://t.me/example_defi'
    ],
    codeRepositories: [
      'https://github.com/example/defi-protocol',
      'https://github.com/example/frontend'
    ],
    extractedAt: new Date()
  };

  try {
    // Analyze the content using AI
    const analysisResult = await aiAnalyzer.analyzeContent(mockExtractedContent);
    
    console.log('Analysis completed successfully:');
    console.log('Trust Factors:', analysisResult.factors);
    console.log('Red Flags:', analysisResult.redFlags);
    console.log('Positive Indicators:', analysisResult.positiveIndicators);
    
    return analysisResult;
    
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}

// Example of how to handle the analysis result
export function processAnalysisResult(result: AnalysisResult): void {
  console.log('\n=== ANALYSIS RESULTS ===');
  
  // Display factor scores
  console.log('\nTrust Factor Scores:');
  Object.entries(result.factors).forEach(([factor, score]) => {
    console.log(`  ${factor}: ${score}/100`);
  });
  
  // Display explanations
  console.log('\nExplanations:');
  Object.entries(result.explanations).forEach(([factor, explanation]) => {
    console.log(`  ${factor}: ${explanation}`);
  });
  
  // Display recommendations
  if (result.recommendations.length > 0) {
    console.log('\nRecommendations:');
    result.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  // Display risks
  if (result.risks.length > 0) {
    console.log('\nIdentified Risks:');
    result.risks.forEach((risk, index) => {
      console.log(`  ${index + 1}. ${risk}`);
    });
  }
  
  // Display red flags (critical)
  if (result.redFlags.length > 0) {
    console.log('\n🚨 RED FLAGS:');
    result.redFlags.forEach((flag, index) => {
      console.log(`  ${index + 1}. ${flag}`);
    });
  }
  
  // Display positive indicators
  if (result.positiveIndicators.length > 0) {
    console.log('\n✅ POSITIVE INDICATORS:');
    result.positiveIndicators.forEach((indicator, index) => {
      console.log(`  ${index + 1}. ${indicator}`);
    });
  }
}

// Example usage (commented out to avoid execution)
/*
async function runExample() {
  try {
    const result = await analyzeProjectExample('https://example-defi.com');
    processAnalysisResult(result);
  } catch (error) {
    console.error('Example failed:', error);
  }
}
*/