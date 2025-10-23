import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Menu, X, DatabaseBackup } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { useLanguagePrefix, withLanguagePrefix } from '@/lib/languageUtils';

interface NavigationProps {
  onExportClick?: () => void;
}

export default function Navigation({ onExportClick }: NavigationProps) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Get current path and language prefix
  const [location] = useLocation();
  const langPrefix = useLanguagePrefix();

  // Check if we're on the home page (considering language prefix)
  const isHomePage = location === `/${langPrefix}/`;

  return (
    <nav className="bg-[#1e293b] text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14">
          {/* Logo and app name */}
          <div className="flex items-center space-x-8">
            <Link href={`/${langPrefix}/`}>
              <div className="flex items-center cursor-pointer" title={t('app.title') + ' - Home'}>
                <img
                  src={new URL('/images/logo.png', import.meta.url).href}
                  alt={t('app.title') + ' Logo'}
                  className="h-32 w-32" // Match the actual favicon size of 32x32px
                />
                <span className="ml-2 text-xl font-bold">{t('app.title')}</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex">
              <Link href={`/${langPrefix}/`}>
                <div
                  className={`px-5 py-3 font-medium cursor-pointer text-sm ${
                    location === `/${langPrefix}/`
                      ? 'bg-[#0f172a] text-white rounded-t'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {t('navigation.home')}
                </div>
              </Link>
              <Link href={`/${langPrefix}/about`}>
                <div
                  className={`px-5 py-3 font-medium cursor-pointer text-sm ${
                    location === `/${langPrefix}/about`
                      ? 'bg-[#0f172a] text-white rounded-t'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {t('navigation.about')}
                </div>
              </Link>
              <Link href={`/${langPrefix}/education`}>
                <div
                  className={`px-5 py-3 font-medium cursor-pointer text-sm ${
                    location === `/${langPrefix}/education`
                      ? 'bg-[#0f172a] text-white rounded-t'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {t('navigation.education')}
                </div>
              </Link>
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
              <div
                className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                  location === `/${langPrefix}/`
                    ? 'bg-[#1e293b] text-white'
                    : 'text-gray-300 hover:bg-[#1e293b] hover:text-white'
                }`}
              >
                {t('navigation.home')}
              </div>
            </Link>
            <Link href={`/${langPrefix}/about`}>
              <div
                className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                  location === `/${langPrefix}/about`
                    ? 'bg-[#1e293b] text-white'
                    : 'text-gray-300 hover:bg-[#1e293b] hover:text-white'
                }`}
              >
                {t('navigation.about')}
              </div>
            </Link>
            <Link href={`/${langPrefix}/education`}>
              <div
                className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                  location === `/${langPrefix}/education`
                    ? 'bg-[#1e293b] text-white'
                    : 'text-gray-300 hover:bg-[#1e293b] hover:text-white'
                }`}
              >
                {t('navigation.education')}
              </div>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
