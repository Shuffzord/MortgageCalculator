import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { validateLanguage, withLanguagePrefix, useLanguagePrefix, SUPPORTED_LANGUAGES } from '@/lib/languageUtils';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [location, setLocation] = useLocation();
  const currentUrlLangPrefix = useLanguagePrefix(); // Gets the language prefix from the current URL path

  const changeLanguage = (lng: string) => {
    if (!validateLanguage(lng)) return;

    // Get the current path without the language prefix
   // Determine the base path (path without any language prefix)
    let basePath = location;
    if (currentUrlLangPrefix && basePath.startsWith(`/${currentUrlLangPrefix}`)) {
      basePath = basePath.substring(`/${currentUrlLangPrefix}`.length);
    }

    // Ensure basePath starts with a slash if it's not empty, or is "/" for root
    if (basePath === "" || basePath === "/") {
      basePath = "/";
    } else if (!basePath.startsWith("/")) {
      basePath = `/${basePath}`;
    }

    // `withLanguagePrefix` expects the path *after* the language segment.
    // e.g., for "/en/about", it expects "about". For "/en/", it expects "".
    const innerPath = basePath === "/" ? "" : basePath.substring(1);

    // Create new path with new language prefix
    const newPath = withLanguagePrefix(innerPath, lng);
    
    // Update URL and language simultaneously
    i18n.changeLanguage(lng);
    setLocation(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="px-2 sm:px-3"> {/* Adjusted padding */}
          <Globe className="h-4 w-4 sm:mr-2" /> {/* Margin right on larger screens */}
          <span className="hidden sm:inline text-xs font-medium">{currentLanguage.toUpperCase()}</span>
          <span className="sr-only">{t('navigation.languageSwitcher', 'Change language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isCurrent = currentLanguage === lang;
          return (
            <DropdownMenuItem
              key={lang}
              onClick={() => changeLanguage(lang)}
              className={
                isCurrent
                ? 'bg-primary/10 text-primary font-semibold focus:bg-primary/20 focus:text-primary' // Selected item style
                : 'text-foreground hover:bg-primary/5 hover:text-primary focus:bg-primary/10 focus:text-primary' // Non-selected item style - updated text color on hover/focus
              }
              aria-current={isCurrent ? 'page' : undefined}
            >
              {t(`language.${lang}`)} {/* Assumes keys like language.en, language.es, etc. */}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}