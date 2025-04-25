import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
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