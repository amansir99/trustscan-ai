'use client';

import { useState, useEffect } from 'react';
import { getTrustLevel } from '@/lib/trust-calculator';
import { Card, CardContent } from './ui/card';

interface TrustScoreProps {
  score: number;
  riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW' | 'TRUSTED';
  confidence?: number;
  animated?: boolean;
  showDetails?: boolean;
  breakdown?: {
    documentationQuality: number;
    transparencyIndicators: number;
    securityDocumentation: number;
    communityEngagement: number;
    technicalImplementation: number;
  };
}

export default function TrustScore({ 
  score, 
  riskLevel, 
  confidence = 100, 
  animated = true, 
  showDetails = true,
  breakdown 
}: TrustScoreProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const [isAnimating, setIsAnimating] = useState(animated);
  
  const { level, color, description } = getTrustLevel(score);
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    if (animated) {
      setIsAnimating(true);
      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = score / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        const newScore = Math.min(score, Math.round(increment * currentStep));
        setDisplayScore(newScore);

        if (currentStep >= steps || newScore >= score) {
          clearInterval(timer);
          setDisplayScore(score);
          setIsAnimating(false);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [score, animated]);

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'TRUSTED': return 'text-blue-600 bg-blue-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 80) return '#10b981'; // green
    if (scoreValue >= 60) return '#3b82f6'; // blue
    if (scoreValue >= 40) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getGradientId = (scoreValue: number) => {
    if (scoreValue >= 80) return 'greenGradient';
    if (scoreValue >= 60) return 'blueGradient';
    if (scoreValue >= 40) return 'yellowGradient';
    return 'redGradient';
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-8">
        <div className="flex flex-col items-center gap-6">
          {/* Main Score Circle */}
          <div className="relative w-56 h-56">
            <svg className="transform -rotate-90 w-56 h-56" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
                <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
                <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#f87171" />
                </linearGradient>
              </defs>
              
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="70"
                stroke="#e5e7eb"
                strokeWidth="12"
                fill="none"
              />
              
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r="70"
                stroke={`url(#${getGradientId(displayScore)})`}
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className={`transition-all duration-300 ${isAnimating ? 'animate-pulse' : ''}`}
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.1))'
                }}
              />
            </svg>
            
            {/* Score display in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-6xl font-bold transition-all duration-300 ${
                isAnimating ? 'animate-pulse' : ''
              }`} style={{ color: getScoreColor(displayScore) }}>
                {displayScore}
              </span>
              <span className="text-gray-500 text-lg font-medium">/ 100</span>
              {confidence < 100 && (
                <span className="text-xs text-gray-400 mt-1">
                  {confidence}% confidence
                </span>
              )}
            </div>
          </div>

          {/* Risk Level Badge */}
          <div className="text-center space-y-3">
            {riskLevel && (
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getRiskLevelColor(riskLevel)}`}>
                {riskLevel === 'TRUSTED' && '🛡️'}
                {riskLevel === 'LOW' && '✅'}
                {riskLevel === 'MEDIUM' && '⚠️'}
                {riskLevel === 'HIGH' && '🚨'}
                <span className="ml-2">{riskLevel} RISK</span>
              </div>
            )}
            
            <div>
              <h3 className={`text-2xl font-bold ${color}`}>{level}</h3>
              <p className="text-gray-600 mt-1 max-w-sm">{description}</p>
            </div>
          </div>

          {/* Score Breakdown */}
          {showDetails && breakdown && (
            <div className="w-full space-y-4 mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-800 text-center">Score Breakdown</h4>
              <div className="space-y-3">
                {Object.entries(breakdown).map(([key, value]) => {
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  const percentage = Math.round(value);
                  
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{label}</span>
                        <span className="font-semibold text-gray-900">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: getScoreColor(percentage)
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}