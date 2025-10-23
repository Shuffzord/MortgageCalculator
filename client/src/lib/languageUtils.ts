import { useLocation } from 'wouter';

export const SUPPORTED_LANGUAGES = ['en', 'es', 'pl'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const validateLanguage = (lang: string): lang is SupportedLanguage =>
  SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);

export const useLanguagePrefix = () => {
  const [location] = useLocation();
  const langPrefix = location.split('/')[1];
  return validateLanguage(langPrefix) ? langPrefix : 'en';
};

export const withLanguagePrefix = (path: string, lang: string) => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `/${validateLanguage(lang) ? lang : 'en'}/${cleanPath}`;
};
