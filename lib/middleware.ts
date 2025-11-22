import { NextRequest, NextResponse } from 'next/server';
import { UsageTracker } from './usage-tracker';
import { getUserById } from './database';
import { getAuditLimit } from './auth';

export async function authMiddleware(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const dbUser = await getUserById(userId);
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    subscription_tier: dbUser.subscription_tier || 'free',
    auditsThisMonth: dbUser.audits_this_month || 0,
    auditLimit: getAuditLimit(dbUser.subscription_tier || 'free')
  };
}

export function requireAuth(handler: Function) {
  return async (request: NextRequest) => {
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }
    
    // Add user to request context
    (request as any).user = authResult;
    return handler(request);
  };
}

export function requireSubscription(tier: 'free' | 'pro' | 'max') {
  return function(handler: Function) {
    return async (request: NextRequest) => {
      const authResult = await authMiddleware(request);
      
      if (authResult instanceof NextResponse) {
        return authResult;
      }
      
      const tierLevels = { free: 0, pro: 1, max: 2 };
      const userLevel = tierLevels[authResult.subscription_tier as keyof typeof tierLevels] || 0;
      const requiredLevel = tierLevels[tier];
      
      if (userLevel < requiredLevel) {
        return NextResponse.json({ 
          error: 'Subscription upgrade required',
          required_tier: tier,
          current_tier: authResult.subscription_tier
        }, { status: 403 });
      }
      
      (request as any).user = authResult;
      return handler(request);
    };
  };
}

export function requireAuditLimit(handler: Function) {
  return async (request: NextRequest) => {
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // Check if user can perform audit
    const canAudit = await UsageTracker.canUserAudit(authResult.id);
    if (!canAudit.allowed) {
      return NextResponse.json({ 
        error: canAudit.reason,
        stats: canAudit.stats,
        upgradeRequired: true
      }, { status: 429 }); // Too Many Requests
    }
    
    // Add user and stats to request context
    (request as any).user = authResult;
    (request as any).usageStats = canAudit.stats;
    return handler(request);
  };
}

export function withUsageTracking(action: string) {
  return function(handler: Function) {
    return async (request: NextRequest) => {
      const authResult = await authMiddleware(request);
      
      if (authResult instanceof NextResponse) {
        return authResult;
      }
      
      // Execute the handler first
      const response = await handler(request);
      
      // Track usage after successful execution
      if (response.status >= 200 && response.status < 300) {
        try {
          await UsageTracker.trackUsage(authResult.id, action, {
            path: request.nextUrl.pathname,
            method: request.method,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Failed to track usage:', error);
          // Don't fail the request if usage tracking fails
        }
      }
      
      return response;
    };
  };
}

export function withAuditTracking(handler: Function) {
  return async (request: NextRequest) => {
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // Check audit limits before processing
    const canAudit = await UsageTracker.canUserAudit(authResult.id);
    if (!canAudit.allowed) {
      return NextResponse.json({ 
        error: canAudit.reason,
        stats: canAudit.stats,
        upgradeRequired: true
      }, { status: 429 });
    }
    
    // Add user and stats to request context
    (request as any).user = authResult;
    (request as any).usageStats = canAudit.stats;
    
    // Execute the handler
    const response = await handler(request);
    
    // Track audit usage after successful execution
    if (response.status >= 200 && response.status < 300) {
      try {
        const responseData = await response.clone().json();
        const auditId = responseData.auditId || responseData.id;
        
        if (auditId) {
          await UsageTracker.trackAuditUsage(authResult.id, auditId);
        }
      } catch (error) {
        console.error('Failed to track audit usage:', error);
        // Don't fail the request if usage tracking fails
      }
    }
    
    return response;
  };
}