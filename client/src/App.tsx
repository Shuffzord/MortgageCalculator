import { Switch, Route, Redirect, useLocation } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import About from '@/pages/About';
import Education from '@/pages/Education';
import './i18n'; // Import i18n configuration
import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import LanguageSwitcher from './components/LanguageSwitcher';
import SEOHead from './components/SEOHead';
import { useTranslation } from 'react-i18next';
import HomePage from './components/HomePage';
import { validateLanguage, useLanguagePrefix } from './lib/languageUtils';

function Router() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  return (
    <>
      <Navigation onExportClick={handleExportClick} />
      <Switch>
        {/* Root redirect */}
        <Route path="/">
          <Redirect to="/en/" />
        </Route>

        {/* Language-prefixed routes */}
        <Route path="/:lang/">
          {(params) =>
            validateLanguage(params.lang) ? (
              <HomePage
                showExportModal={showExportModal}
                setShowExportModal={setShowExportModal}
                showLoadModal={showLoadModal}
                setShowLoadModal={setShowLoadModal}
              />
            ) : (
              <Redirect to="/en/" />
            )
          }
        </Route>
        <Route path="/:lang/about">
          {(params) => (validateLanguage(params.lang) ? <About /> : <Redirect to="/en/about" />)}
        </Route>
        <Route path="/:lang/education">
          {(params) =>
            validateLanguage(params.lang) ? <Education /> : <Redirect to="/en/education" />
          }
        </Route>
        {/* Fallback to 404 with language context */}
        <Route>
          {() => {
            const langPrefix = useLanguagePrefix();
            return <NotFound />;
          }}
        </Route>
      </Switch>
    </>
  );
}

function App() {
  const { t, i18n } = useTranslation();
  const [location] = useLocation();

  // Handle initial language detection from URL and sync
  useEffect(() => {
    const pathLang = location.split('/')[1];
    if (validateLanguage(pathLang) && pathLang !== i18n.language) {
      i18n.changeLanguage(pathLang);
    }
  }, [location, i18n]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SEOHead
          pageTitle={t('app.title') + ' - ' + t('app.description')}
          pageDescription={t('app.description')}
        />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
