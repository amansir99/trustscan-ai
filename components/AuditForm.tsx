'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { isValidUrl } from '@/utils/helpers';
import { useAuth } from '@/lib/useAuth';
import { LoadingState, ErrorDisplay } from './LoadingStates';
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Globe, 
  Shield,
  Zap,
  Crown,
  Info
} from 'lucide-react';

interface AuditFormProps {
  onSubmit: (url: string) => void;
  loading?: boolean;
  currentStage?: string;
  progress?: number;
  error?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

interface UserLimits {
  remaining: number;
  total: number;
  resetDate: string;
}

export default function AuditForm({ 
  onSubmit, 
  loading, 
  currentStage,
  progress,
  error,
  onRetry,
  onCancel
}: AuditFormProps) {
  const [url, setUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const auditLimit = user.subscription_tier === 'free' ? 10 : 
                        user.subscription_tier === 'pro' ? 100 : 
                        user.subscription_tier === 'max' ? 999999 : 10;
      
      setUserLimits({
        remaining: auditLimit === 999999 ? 999999 : Math.max(0, auditLimit - user.auditsThisMonth),
        total: auditLimit,
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()
      });
    }
  }, [user]);

  const validateUrl = async (inputUrl: string) => {
    if (!inputUrl.trim()) {
      setValidationState('idle');
      setFormError('');
      return;
    }

    setValidationState('validating');
    setFormError('');

    // Basic URL format validation only - accept all valid URLs
    if (!isValidUrl(inputUrl)) {
      setValidationState('invalid');
      setFormError('Please enter a valid URL (must include http:// or https://)');
      return;
    }

    // All valid URLs are accepted - no accessibility pre-check
    // The scraper has robust fallback mechanisms to handle any website
    setValidationState('valid');
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    // Debounce validation
    const timeoutId = setTimeout(() => validateUrl(newUrl), 500);
    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!url.trim()) {
      setFormError('Please enter a URL');
      return;
    }

    if (!isValidUrl(url)) {
      setFormError('Please enter a valid URL');
      return;
    }

    if (userLimits && userLimits.total !== 999999 && userLimits.remaining <= 0) {
      setFormError('You have reached your monthly audit limit. Please upgrade your subscription to continue.');
      return;
    }

    onSubmit(url);
  };

  const getValidationIcon = () => {
    switch (validationState) {
      case 'validating':
        return <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />;
      case 'valid':
        return <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>;
      case 'invalid':
        return <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">✗</div>;
      default:
        return null;
    }
  };

  const canSubmit = !loading && validationState === 'valid' && userLimits && (userLimits.total === 999999 || userLimits.remaining > 0);

  // Show loading state during analysis
  if (loading) {
    return (
      <LoadingState
        isLoading={loading}
        currentStage={currentStage}
        progress={progress}
        error={error}
        onRetry={onRetry}
        onCancel={onCancel}
        estimatedTime={90}
      />
    );
  }

  // Show error state if there's an error and not loading
  if (error && !loading) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <ErrorDisplay
          error={error}
          onRetry={onRetry}
          onCancel={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* User Limits Display */}
      {userLimits && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Monthly Audit Usage
              </span>
              <div className="flex items-center gap-2">
                {user?.subscription_tier === 'free' && <Zap className="w-4 h-4 text-gray-500" />}
                {user?.subscription_tier === 'pro' && <Crown className="w-4 h-4 text-blue-500" />}
                {user?.subscription_tier === 'max' && <Crown className="w-4 h-4 text-purple-500" />}
                <span className="text-sm font-normal text-gray-600">
                  {user?.subscription_tier?.toUpperCase()} Plan
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Usage</span>
                  <span className={`text-sm font-semibold ${
                    userLimits.remaining > 5 ? 'text-green-600' : 
                    userLimits.remaining > 0 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {userLimits.total === 999999 
                      ? `${userLimits.total - userLimits.remaining} / Unlimited`
                      : `${userLimits.total - userLimits.remaining} / ${userLimits.total}`
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      userLimits.remaining > 5 ? 'bg-green-500' : 
                      userLimits.remaining > 0 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: userLimits.total === 999999 
                        ? '100%' 
                        : `${Math.max(5, ((userLimits.total - userLimits.remaining) / userLimits.total) * 100)}%` 
                    }}
                  />
                </div>
              </div>
              
              <div className="text-center sm:text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {userLimits.total === 999999 ? 'Unlimited' : userLimits.remaining}
                </div>
                <div className="text-sm text-gray-600">
                  {userLimits.total === 999999 ? 'audits' : 'remaining'}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
              <span>Resets on {userLimits.resetDate}</span>
              {userLimits.remaining <= 2 && userLimits.remaining > 0 && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <AlertCircle className="w-3 h-3" />
                  <span>Running low on audits</span>
                </div>
              )}
            </div>
            
            {userLimits.remaining === 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700 font-medium">Monthly Limit Reached</p>
                    <p className="text-xs text-red-600 mt-1">
                      Upgrade to Pro for unlimited audits or wait until next month.
                    </p>
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={() => window.location.href = '/pricing'}
                    >
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Audit Form */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Analyze DeFi Project
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Get a comprehensive trust score and security analysis in 30-90 seconds
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL Input with Validation */}
            <div className="space-y-3">
              <label htmlFor="url" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Project URL
                <Info className="w-4 h-4 text-gray-400" />
              </label>
              <div className="relative">
                <Input
                  id="url"
                  type="text"
                  placeholder="https://example-defi-project.com"
                  value={url}
                  onChange={handleUrlChange}
                  disabled={loading}
                  className={`text-base sm:text-lg pr-12 py-3 transition-all duration-200 ${
                    validationState === 'valid' ? 'border-green-300 focus:border-green-500 bg-green-50/30' :
                    validationState === 'invalid' ? 'border-red-300 focus:border-red-500 bg-red-50/30' :
                    'border-gray-300 hover:border-gray-400'
                  }`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {getValidationIcon()}
                </div>
              </div>
              
              {/* Validation Messages */}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{formError}</span>
                  </p>
                </div>
              )}
              
              {validationState === 'valid' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    URL looks good! Ready to analyze.
                  </p>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 flex items-start gap-2">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>
                    Enter the main website URL of the DeFi project. We'll analyze documentation, 
                    team information, tokenomics, and security practices.
                  </span>
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="space-y-4">
              <Button 
                type="submit" 
                disabled={!canSubmit}
                className={`w-full py-4 sm:py-6 text-base sm:text-lg font-semibold transition-all duration-300 ${
                  canSubmit 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing Project...</span>
                  </div>
                ) : userLimits?.remaining === 0 ? (
                  <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>Upgrade Required</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    <span>Start Trust Analysis</span>
                  </div>
                )}
              </Button>

              {/* Status Messages */}
              {!canSubmit && !loading && (
                <div className="text-center">
                  {validationState === 'idle' && (
                    <p className="text-sm text-gray-500">Enter a URL to begin analysis</p>
                  )}
                  {validationState === 'validating' && (
                    <p className="text-sm text-blue-600 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validating URL...
                    </p>
                  )}
                  {validationState === 'invalid' && (
                    <p className="text-sm text-red-600">Please fix the URL to continue</p>
                  )}
                  {userLimits?.remaining === 0 && (
                    <p className="text-sm text-red-600">Monthly limit reached - upgrade to continue</p>
                  )}
                </div>
              )}
            </div>

            {/* Help Text */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-700 font-medium">
                  What happens during analysis?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Content extraction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>AI analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Trust scoring</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 pt-2">
                  Analysis typically takes 30-90 seconds. We scan documentation, 
                  team information, and security practices to generate your trust score.
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}