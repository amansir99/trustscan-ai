export interface User {
  id: string;
  email: string;
  created_at: string;
  subscription_tier: 'free' | 'pro' | 'max';
  subscription_expires?: string;
  audits_this_month: number;
  last_audit_reset: string;
}

export interface TrustFactors {
  documentationQuality: number;
  transparencyIndicators: number;
  securityDocumentation: number;
  communityEngagement: number;
  technicalImplementation: number;
}

export interface ScoreAdjustment {
  factor: string;
  adjustment: number;
  reason: string;
  type: 'penalty' | 'bonus' | 'cap';
  severity?: 'minor' | 'moderate' | 'critical';
  category?: 'red_flag' | 'positive_indicator' | 'critical_cap' | 'base_calculation';
}

export interface TrustScoreResult {
  finalScore: number;           // 0-100
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'TRUSTED';
  confidence: number;           // 0-100
  breakdown: TrustFactors;
  adjustments: ScoreAdjustment[];
  baseScore: number;
  redFlags: string[];
  positiveIndicators: string[];
}

export interface AnalysisInput {
  factors: TrustFactors;
  redFlags: string[];
  positiveIndicators: string[];
  contentCompleteness: number; // 0-100, based on amount of content extracted
  extractedContentLength: number;
}

export interface AuditResult {
  id: string;
  user_id: string;
  url: string;
  trust_score: number;
  analysis_data: {
    factors: TrustFactors;
    explanations: Record<string, string>;
    recommendations: string[];
    risks: string[];
  };
  created_at: string;
  audit_type: 'basic' | 'detailed';
  hedera_transaction_id?: string;
  blockchain_status?: {
    stored: boolean;
    transactionId?: string;
    network: string;
    verifiable: boolean;
  };
}

export interface SubscriptionPlan {
  name: string;
  price: number;
  auditsPerMonth: number;
  features: string[];
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
  expires_at: string;
  virtual_transaction_id?: string;
}