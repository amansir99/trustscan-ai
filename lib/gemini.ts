import { GoogleGenerativeAI } from '@google/generative-ai';
import { TrustFactors } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const ANALYSIS_PROMPT = `
Analyze this DeFi project website content and rate each factor (0-100):

1. Documentation Quality: Completeness, clarity, technical depth
2. Transparency: Team info, tokenomics, roadmap clarity  
3. Security: Audit reports, security practices mentioned
4. Community: Social links, communication quality
5. Technical: Code quality indicators, GitHub activity

Content: {websiteContent}

Return JSON with scores and explanations in this exact format:
{
  "factors": {
    "documentationQuality": 0-100,
    "transparencyIndicators": 0-100,
    "securityDocumentation": 0-100,
    "communityEngagement": 0-100,
    "technicalImplementation": 0-100
  },
  "explanations": {
    "documentationQuality": "explanation",
    "transparencyIndicators": "explanation",
    "securityDocumentation": "explanation", 
    "communityEngagement": "explanation",
    "technicalImplementation": "explanation"
  },
  "recommendations": ["rec1", "rec2"],
  "risks": ["risk1", "risk2"]
}
`;

export async function analyzeWebsiteContent(content: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = ANALYSIS_PROMPT.replace('{websiteContent}', content);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Gemini analysis error:', error);
    throw new Error('Failed to analyze content');
  }
}