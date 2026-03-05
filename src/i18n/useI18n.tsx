import React, { createContext, useContext, useState, useCallback } from 'react';
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import de from './locales/de.json';
import fr from './locales/fr.json';

export type Locale = 'es' | 'en' | 'pt' | 'de' | 'fr';

export const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'es', label: 'Espanol' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Portugues' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Francais' },
];

const translations: Record<Locale, Record<string, any>> = { en, es, pt, de, fr };

interface I18nContext {
  locale: Locale;
  t: (key: string) => any;
  setLocale: (locale: Locale) => void;
}

const I18nCtx = createContext<I18nContext | null>(null);

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(
    () => (localStorage.getItem('gw-locale') as Locale) || 'es'
  );

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('gw-locale', l);
  }, []);

  const t = useCallback(
    (key: string) => getNestedValue(translations[locale], key) ?? key,
    [locale]
  );

  return (
    <I18nCtx.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
