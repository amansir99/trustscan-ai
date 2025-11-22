// This file is deprecated - use lib/useAuth.ts instead
// Keeping this file to avoid import errors, but it's not used

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function useAuth() {
  throw new Error('Use useAuth from lib/useAuth.ts instead')
}