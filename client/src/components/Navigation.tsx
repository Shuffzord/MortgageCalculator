import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Menu, X, DatabaseBackup } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  onExportClick?: () => void;
}

export default function Navigation({ onExportClick }: NavigationProps) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Get current path to highlight active link
  const [location] = useLocation();
  
  // Check if we're on the home page
  const isHomePage = location === '/';

  return (
    <nav className="bg-[#1e293b] text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14">
          {/* Logo and app name */}
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <svg className="h-6 w-6 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.5 8.5c0 2.5-1.5 4-3.5 5.5s-3.5 3-3.5 5.5V20h10v-1c0-2.5-1.5-4-3.5-5.5s-3.5-3-3.5-5.5V7c0-1 .5-1.5 1-2s1-1 1-2c0-1.5-2-3-4-3S5 1.5 5 3c0 1 .5 1.5 1 2s1 1 1 2v1.5"/>
                </svg>
                <span className="ml-2 text-xl font-bold">{t('app.title')}</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex">
              <Link href="/">
                <div className={`px-5 py-3 font-medium cursor-pointer text-sm ${location === '/' 
                  ? 'bg-[#0f172a] text-white rounded-t' 
                  : 'text-gray-300 hover:text-white'}`}>
                  {t('navigation.home')}
                </div>
              </Link>
              <Link href="/about">
                <div className={`px-5 py-3 font-medium cursor-pointer text-sm ${location === '/about' 
                  ? 'bg-[#0f172a] text-white rounded-t' 
                  : 'text-gray-300 hover:text-white'}`}>
                  {t('navigation.about')}
                </div>
              </Link>
              <Link href="/education">
                <div className={`px-5 py-3 font-medium cursor-pointer text-sm ${location === '/education' 
                  ? 'bg-[#0f172a] text-white rounded-t' 
                  : 'text-gray-300 hover:text-white'}`}>
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
            <Link href="/">
              <div className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                location === '/'
                  ? 'bg-[#1e293b] text-white'
                  : 'text-gray-300 hover:bg-[#1e293b] hover:text-white'
              }`}>
                {t('navigation.home')}
              </div>
            </Link>
            <Link href="/about">
              <div className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                location === '/about'
                  ? 'bg-[#1e293b] text-white'
                  : 'text-gray-300 hover:bg-[#1e293b] hover:text-white'
              }`}>
                {t('navigation.about')}
              </div>
            </Link>
            <Link href="/education">
              <div className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                location === '/education'
                  ? 'bg-[#1e293b] text-white'
                  : 'text-gray-300 hover:bg-[#1e293b] hover:text-white'
              }`}>
                {t('navigation.education')}
              </div>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}