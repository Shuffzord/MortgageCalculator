import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Menu, X, Download, Upload } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  onExportClick?: () => void;
  onLoadClick?: () => void;
}

export default function Navigation({ onExportClick, onLoadClick }: NavigationProps) {
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
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <a className="flex-shrink-0 flex items-center">
                <span className="text-base sm:text-xl md:text-2xl font-semibold text-primary">
                  {t('app.title')}
                </span>
              </a>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              <Link href="/">
                <a className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-150 ${
                  location === '/'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>
                  {t('navigation.home')}
                </a>
              </Link>
              <Link href="/about">
                <a className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-150 ${
                  location === '/about'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>
                  {t('navigation.about')}
                </a>
              </Link>
              <Link href="/education">
                <a className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-150 ${
                  location === '/education'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>
                  {t('navigation.education')}
                </a>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="hidden md:ml-6 md:flex md:items-center space-x-3">
              <Button
                variant="outline"
                onClick={onExportClick}
                className="flex items-center px-3 py-2 rounded-md shadow-sm"
                disabled={!isHomePage}
              >
                <Download className="mr-0 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={onLoadClick}
                className="flex items-center px-3 py-2 rounded-md shadow-sm"
                disabled={!isHomePage}
              >
                <Upload className="mr-0 h-4 w-4" />
              </Button>
              <LanguageSwitcher />
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden space-x-2">
              <Button
                variant="outline"
                onClick={onExportClick}
                className="flex items-center px-2 py-1 rounded-md shadow-sm"
                disabled={!isHomePage}
              >
                <Download className="mr-0 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={onLoadClick}
                className="flex items-center px-2 py-1 rounded-md shadow-sm"
                disabled={!isHomePage}
              >
                <Upload className="mr-0 h-4 w-4" />
              </Button>
              <LanguageSwitcher />
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 ml-2 rounded-md text-gray-500 hover:text-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors duration-150"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">{t('navigation.menu')}</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-gray-50">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/">
              <a className={`block px-4 py-2 text-base font-medium border-l-4 ${
                location === '/'
                  ? 'border-primary text-primary bg-primary-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover:border-gray-300'
              }`}>
                {t('navigation.home')}
              </a>
            </Link>
            <Link href="/about">
              <a className={`block px-4 py-2 text-base font-medium border-l-4 ${
                location === '/about'
                  ? 'border-primary text-primary bg-primary-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover:border-gray-300'
              }`}>
                {t('navigation.about')}
              </a>
            </Link>
            <Link href="/education">
              <a className={`block px-4 py-2 text-base font-medium border-l-4 ${
                location === '/education'
                  ? 'border-primary text-primary bg-primary-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover:border-gray-300'
              }`}>
                {t('navigation.education')}
              </a>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}