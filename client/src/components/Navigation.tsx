import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Menu, X, DatabaseBackup, Crown, BarChart3, TrendingUp, Download } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { useLanguagePrefix, withLanguagePrefix } from '@/lib/languageUtils';
import { useAuth } from '@/lib/auth/context';
import { UserProfileDropdown, AuthButton } from '@/components/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

interface NavigationProps {
  onExportClick?: () => void;
  onAuthClick?: () => void;
}

export default function Navigation({ onExportClick, onAuthClick }: NavigationProps) {
  const { t } = useTranslation();
  const { isAuthenticated, isPremium } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Get current path and language prefix
  const [location, setLocation] = useLocation();
  const langPrefix = useLanguagePrefix();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleAuthClick = () => {
    if (onAuthClick) {
      onAuthClick();
    } else {
      // Default behavior - navigate to auth page
      setLocation(`/${langPrefix}/auth`);
    }
  };
  
  // Check if we're on the home page (considering language prefix)
  const isHomePage = location === `/${langPrefix}/`;

  return (
    <nav className="bg-[#1e293b] text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14">
          {/* Logo and app name */}
          <div className="flex items-center space-x-8">
            <Link href={`/${langPrefix}/`}>
              <div className="flex items-center cursor-pointer" title={t('app.title') + " - Home"}>
                <img 
                  src={new URL('/images/logo.png', import.meta.url).href}
                  alt={t('app.title') + " Logo"}
                  className="h-32 w-32" // Match the actual favicon size of 32x32px
                />
                <span className="ml-2 text-xl font-bold">{t('app.title')}</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex">
              <Link href={`/${langPrefix}/`}>
                <div className={`px-5 py-3 font-medium cursor-pointer text-sm ${location === `/${langPrefix}/`
                  ? 'bg-[#0f172a] text-white rounded-t'
                  : 'text-gray-300 hover:text-white'}`}>
                  {t('navigation.home')}
                </div>
              </Link>
              <Link href={`/${langPrefix}/about`}>
                <div className={`px-5 py-3 font-medium cursor-pointer text-sm ${location === `/${langPrefix}/about`
                  ? 'bg-[#0f172a] text-white rounded-t'
                  : 'text-gray-300 hover:text-white'}`}>
                  {t('navigation.about')}
                </div>
              </Link>
              <Link href={`/${langPrefix}/education`}>
                <div className={`px-5 py-3 font-medium cursor-pointer text-sm ${location === `/${langPrefix}/education`
                  ? 'bg-[#0f172a] text-white rounded-t'
                  : 'text-gray-300 hover:text-white'}`}>
                  {t('navigation.education')}
                </div>
              </Link>
              
              {/* Premium Features Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className={`px-5 py-3 font-medium cursor-pointer text-sm flex items-center gap-1 ${
                    location.includes('/premium/')
                      ? 'bg-[#0f172a] text-white rounded-t'
                      : 'text-gray-300 hover:text-white'
                  }`}>
                    <Crown className="h-4 w-4" />
                    Premium
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Premium Features</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/${langPrefix}/premium/loan-comparison`}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Loan Comparison</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/${langPrefix}/premium/scenario-modeling`}>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      <span>Scenario Modeling</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/${langPrefix}/premium/export-center`}>
                      <Download className="mr-2 h-4 w-4" />
                      <span>Export Center</span>
                    </Link>
                  </DropdownMenuItem>
                  {!isPremium() && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/${langPrefix}/subscription`}>
                          <Crown className="mr-2 h-4 w-4" />
                          <span>Upgrade to Premium</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="ml-auto flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={onExportClick}
              className="text-gray-300 hover:text-white"
              disabled={!isHomePage}
              title={t('navigation.dataTransfer')}
            >
              <DatabaseBackup className="h-4 w-4" />
            </Button>
            <LanguageSwitcher />
            
            {/* Authentication */}
            <div className="hidden md:flex items-center space-x-2">
              {isAuthenticated ? (
                <UserProfileDropdown
                  onProfileClick={() => setLocation(`/${langPrefix}/profile`)}
                  onSettingsClick={() => setLocation(`/${langPrefix}/profile`)}
                  onVerificationClick={() => setLocation(`/${langPrefix}/auth?mode=verify`)}
                  onSubscriptionClick={() => setLocation(`/${langPrefix}/subscription`)}
                />
              ) : (
                <AuthButton
                  onLoginClick={handleAuthClick}
                  variant="ghost"
                  className="text-gray-300 hover:text-white"
                />
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="text-gray-300 hover:text-white p-1"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">{t('navigation.menu')}</span>
                {isMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#0f172a]">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href={`/${langPrefix}/`}>
              <div className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                location === `/${langPrefix}/`
                  ? 'bg-[#1e293b] text-white'
                  : 'text-gray-300 hover:bg-[#1e293b] hover:text-white'
              }`}>
                {t('navigation.home')}
              </div>
            </Link>
            <Link href={`/${langPrefix}/about`}>
              <div className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                location === `/${langPrefix}/about`
                  ? 'bg-[#1e293b] text-white'
                  : 'text-gray-300 hover:bg-[#1e293b] hover:text-white'
              }`}>
                {t('navigation.about')}
              </div>
            </Link>
            <Link href={`/${langPrefix}/education`}>
              <div className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                location === `/${langPrefix}/education`
                  ? 'bg-[#1e293b] text-white'
                  : 'text-gray-300 hover:bg-[#1e293b] hover:text-white'
              }`}>
                {t('navigation.education')}
              </div>
            </Link>
            
            {/* Premium Features Section */}
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Premium Features
              </div>
              <Link href={`/${langPrefix}/premium/loan-comparison`}>
                <div className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                  location === `/${langPrefix}/premium/loan-comparison`
                    ? 'bg-[#1e293b] text-white'
                    : 'text-gray-300 hover:bg-[#1e293b] hover:text-white'
                }`}>
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Loan Comparison
                  </div>
                </div>
              </Link>
              <Link href={`/${langPrefix}/premium/scenario-modeling`}>
                <div className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                  location === `/${langPrefix}/premium/scenario-modeling`
                    ? 'bg-[#1e293b] text-white'
                    : 'text-gray-300 hover:bg-[#1e293b] hover:text-white'
                }`}>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Scenario Modeling
                  </div>
                </div>
              </Link>
              <Link href={`/${langPrefix}/premium/export-center`}>
                <div className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                  location === `/${langPrefix}/premium/export-center`
                    ? 'bg-[#1e293b] text-white'
                    : 'text-gray-300 hover:bg-[#1e293b] hover:text-white'
                }`}>
                  <div className="flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Export Center
                  </div>
                </div>
              </Link>
              {!isPremium() && (
                <Link href={`/${langPrefix}/subscription`}>
                  <div className="block px-3 py-2 rounded-md text-base font-medium cursor-pointer text-yellow-300 hover:bg-[#1e293b] hover:text-yellow-200">
                    <div className="flex items-center">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to Premium
                    </div>
                  </div>
                </Link>
              )}
            </div>
            
            {/* Mobile Authentication */}
            <div className="border-t border-gray-700 pt-2 mt-2">
              {isAuthenticated ? (
                <>
                  <Link href={`/${langPrefix}/profile`}>
                    <div className="block px-3 py-2 rounded-md text-base font-medium cursor-pointer text-gray-300 hover:bg-[#1e293b] hover:text-white">
                      {t('auth.profile.profile', 'Profile')}
                    </div>
                  </Link>
                  <Link href={`/${langPrefix}/subscription`}>
                    <div className="block px-3 py-2 rounded-md text-base font-medium cursor-pointer text-gray-300 hover:bg-[#1e293b] hover:text-white">
                      <div className="flex items-center">
                        {isPremium() ? (
                          <>
                            <Crown className="h-4 w-4 mr-2" />
                            Manage Subscription
                          </>
                        ) : (
                          <>
                            <Crown className="h-4 w-4 mr-2" />
                            Upgrade to Premium
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="px-3 py-2">
                    <AuthButton
                      variant="ghost"
                      className="w-full justify-start text-gray-300 hover:text-white"
                    />
                  </div>
                </>
              ) : (
                <div className="px-3 py-2">
                  <AuthButton
                    onLoginClick={handleAuthClick}
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}