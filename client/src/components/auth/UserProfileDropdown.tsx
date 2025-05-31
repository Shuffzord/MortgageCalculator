import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import {
  User,
  Settings,
  LogOut,
  Crown,
  Shield,
  Mail,
  MailCheck,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguagePrefix } from '@/lib/languageUtils';

interface UserProfileDropdownProps {
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onVerificationClick?: () => void;
  onSubscriptionClick?: () => void;
}

export function UserProfileDropdown({
  onProfileClick,
  onSettingsClick,
  onVerificationClick,
  onSubscriptionClick
}: UserProfileDropdownProps) {
  const { t } = useTranslation();
  const { user, firebaseUser, logout, isPremium } = useAuth();
  const langPrefix = useLanguagePrefix();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const displayName = user?.displayName || firebaseUser?.displayName;
  const email = user?.email || firebaseUser?.email;
  const photoURL = user?.photoURL || firebaseUser?.photoURL;
  const isEmailVerified = firebaseUser?.emailVerified;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={photoURL || undefined} alt={displayName || email || 'User'} />
            <AvatarFallback className="text-xs">
              {getInitials(displayName || undefined, email || undefined)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium leading-none">
                {displayName || t('auth.profile.noName', 'User')}
              </p>
              {isPremium() && (
                <Badge variant="secondary" className="text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  {t('auth.profile.premium', 'Premium')}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <p className="text-xs leading-none text-muted-foreground">
                {email}
              </p>
              {isEmailVerified ? (
                <div title={t('auth.profile.verified', 'Email verified')}>
                  <MailCheck className="h-3 w-3 text-green-600" />
                </div>
              ) : (
                <div title={t('auth.profile.unverified', 'Email not verified')}>
                  <Mail className="h-3 w-3 text-amber-600" />
                </div>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onProfileClick}>
          <User className="mr-2 h-4 w-4" />
          <span>{t('auth.profile.profile', 'Profile')}</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onSettingsClick}>
          <Settings className="mr-2 h-4 w-4" />
          <span>{t('auth.profile.settings', 'Settings')}</span>
        </DropdownMenuItem>

        {!isEmailVerified && (
          <DropdownMenuItem onClick={onVerificationClick}>
            <Mail className="mr-2 h-4 w-4" />
            <span>{t('auth.profile.verifyEmail', 'Verify Email')}</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        
        {isPremium() ? (
          <DropdownMenuItem onClick={onSubscriptionClick}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>{t('auth.profile.manageSubscription', 'Manage Subscription')}</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onSubscriptionClick}>
            <Crown className="mr-2 h-4 w-4" />
            <span>{t('auth.profile.upgradeToPremium', 'Upgrade to Premium')}</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('auth.logout', 'Sign Out')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}