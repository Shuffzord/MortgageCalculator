import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useRouter } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { validateLanguage, withLanguagePrefix } from '@/lib/languageUtils';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [location, setLocation] = useLocation();
  const router = useRouter();

  const changeLanguage = (lng: string) => {
    if (!validateLanguage(lng)) return;

    // Get the current path without the language prefix
    const pathParts = location.split('/');
    const currentPath = pathParts.slice(2).join('/');
    
    // Create new path with new language prefix
    const newPath = withLanguagePrefix(currentPath, lng);
    
    // Update URL and language simultaneously
    i18n.changeLanguage(lng);
    setLocation(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="icon" className="rounded-full">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => changeLanguage('en')}
          className={currentLanguage.startsWith('en') ? 'bg-muted' : ''}
          style={{ 
            color: currentLanguage.startsWith('en') ? '#1A6B72' : '#333333',
            backgroundColor: currentLanguage.startsWith('en') ? 'rgba(26, 107, 114, 0.1)' : 'transparent'
          }}
        >
          {t('language.english')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('es')}
          className={currentLanguage === 'es' ? 'bg-muted' : ''}
          style={{ 
            color: currentLanguage === 'es' ? '#1A6B72' : '#333333',
            backgroundColor: currentLanguage === 'es' ? 'rgba(26, 107, 114, 0.1)' : 'transparent'
          }}
        >
          {t('language.spanish')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('pl')}
          className={currentLanguage === 'pl' ? 'bg-muted' : ''}
          style={{ 
            color: currentLanguage === 'pl' ? '#1A6B72' : '#333333',
            backgroundColor: currentLanguage === 'pl' ? 'rgba(26, 107, 114, 0.1)' : 'transparent'
          }}
        >
          {t('language.polish')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}