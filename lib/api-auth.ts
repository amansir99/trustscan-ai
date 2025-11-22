import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  userId: string;
}

export function getUserId(request: NextRequest): string | null {
  return request.cookies.get('userId')?.value || null;
}

export function requireAuth(request: NextRequest): AuthenticatedUser {
  const userId = getUserId(request);
  if (!userId) {
    throw new Error('Not authenticated');
  }
  
  return { userId };
}
