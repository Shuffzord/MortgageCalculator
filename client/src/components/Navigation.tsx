import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Menu, X, Download, Upload } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

  // Link components to avoid nesting <a> inside <a>
  const NavLink = ({ href, isActive, children, isMobile = false }) => {
    const className = isMobile
      ? cn(
          "block px-4 py-2 text-base font-medium border-l-4",
          isActive
            ? "border-primary text-primary bg-primary-50"
            : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover:border-gray-300"
        )
      : cn(
          "inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-150",
          isActive
            ? "border-primary text-primary"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        );

    return (
      <Link href={href}>
        <span className={className} role="button" tabIndex={0} onClick={(e) => e.preventDefault()}>
          {children}
        </span>
      </Link>
    );
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <span className="text-base sm:text-xl md:text-2xl font-semibold text-primary cursor-pointer">
                {t('app.title')}
              </span>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex md:space-x-6">
              <NavLink href="/" isActive={location === '/'}>
                {t('navigation.home')}
              </NavLink>
              <NavLink href="/about" isActive={location === '/about'}>
                {t('navigation.about')}
              </NavLink>
              <NavLink href="/education" isActive={location === '/education'}>
                {t('navigation.education')}
              </NavLink>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="hidden md:flex md:items-center md:space-x-4">
              <Button
                variant="outline"
                onClick={onExportClick}
                className="flex items-center text-sm px-3 py-2 h-9 rounded-md"
                disabled={!isHomePage}
                title={t('export.title')}
              >
                <Download className="h-4 w-4 mr-2" />
                <span>{t('export.button')}</span>
              </Button>
              <Button
                variant="outline"
                onClick={onLoadClick}
                className="flex items-center text-sm px-3 py-2 h-9 rounded-md"
                disabled={!isHomePage}
                title={t('load.title')}
              >
                <Upload className="h-4 w-4 mr-2" />
                <span>{t('load.button')}</span>
              </Button>
              <LanguageSwitcher />
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden space-x-3">
              <Button
                variant="outline"
                onClick={onExportClick}
                className="flex items-center px-2 py-1 h-8 rounded-md"
                disabled={!isHomePage}
                title={t('export.title')}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={onLoadClick}
                className="flex items-center px-2 py-1 h-8 rounded-md"
                disabled={!isHomePage}
                title={t('load.title')}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <LanguageSwitcher />
              <Button
                variant="ghost"
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-1 ml-1 rounded-md"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">{t('navigation.menu')}</span>
                {isMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-gray-50">
          <div className="py-2 space-y-1">
            <NavLink href="/" isActive={location === '/'} isMobile>
              {t('navigation.home')}
            </NavLink>
            <NavLink href="/about" isActive={location === '/about'} isMobile>
              {t('navigation.about')}
            </NavLink>
            <NavLink href="/education" isActive={location === '/education'} isMobile>
              {t('navigation.education')}
            </NavLink>
          </div>
        </div>
      )}
    </nav>
  );
}