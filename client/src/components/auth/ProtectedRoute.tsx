import React, { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth/context';
import { Loader2 } from 'lucide-react';
import { useLanguagePrefix } from '@/lib/languageUtils';

interface ProtectedRouteProps {
  children: ReactNode;
  requireEmailVerification?: boolean;
  requirePremium?: boolean;
  fallbackPath?: string;
  loadingComponent?: ReactNode;
}

export function ProtectedRoute({
  children,
  requireEmailVerification = false,
  requirePremium = false,
  fallbackPath,
  loadingComponent
}: ProtectedRouteProps) {
  const { isAuthenticated, firebaseUser, isPremium, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const langPrefix = useLanguagePrefix();

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {loadingComponent || (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
        )}
      </div>
    );
  }

  // Redirect to auth page if not authenticated
  if (!isAuthenticated) {
    const redirectPath = fallbackPath || `/${langPrefix}/auth`;
    setLocation(redirectPath);
    return null;
  }

  // Check email verification requirement
  if (requireEmailVerification && firebaseUser && !firebaseUser.emailVerified) {
    const redirectPath = fallbackPath || `/${langPrefix}/auth?mode=verify`;
    setLocation(redirectPath);
    return null;
  }

  // Check premium requirement
  if (requirePremium && !isPremium()) {
    const redirectPath = fallbackPath || `/${langPrefix}/premium`;
    setLocation(redirectPath);
    return null;
  }

  return <>{children}</>;
}

// Higher-order component version for easier use
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}