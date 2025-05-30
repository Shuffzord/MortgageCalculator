import React from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AuthButtonProps {
  onLoginClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  className?: string;
}

export function AuthButton({
  onLoginClick,
  variant = 'default',
  size = 'default',
  showIcon = true,
  className
}: AuthButtonProps) {
  const { t } = useTranslation();
  const { isAuthenticated, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isAuthenticated) {
    return (
      <Button
        onClick={handleLogout}
        variant={variant}
        size={size}
        disabled={isLoading}
        className={cn(className)}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && showIcon && <LogOut className="mr-2 h-4 w-4" />}
        {size !== 'icon' && t('auth.logout', 'Sign Out')}
      </Button>
    );
  }

  return (
    <Button
      onClick={onLoginClick}
      variant={variant}
      size={size}
      className={cn(className)}
    >
      {showIcon && <LogIn className="mr-2 h-4 w-4" />}
      {size !== 'icon' && t('auth.login.title', 'Sign In')}
    </Button>
  );
}