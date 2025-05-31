import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import About from "@/pages/About";
import Education from "@/pages/Education";
import AuthPage from "@/pages/Auth";
import Profile from "@/pages/Profile";
import Terms from "@/pages/Terms";
import FirebaseDebugPage from "@/pages/FirebaseDebug";
import SubscriptionPage from "@/pages/Subscription";
import { LoanComparison, ScenarioModeling, ExportCenter } from "@/pages/premium";
import "./i18n"; // Import i18n configuration
import { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import LanguageSwitcher from "./components/LanguageSwitcher";
import SEOHead from "./components/SEOHead";
import { useTranslation } from "react-i18next";
import HomePage from "./components/HomePage";
import { validateLanguage, useLanguagePrefix } from "./lib/languageUtils";
import { AuthProvider } from "./lib/auth/context";

function Router() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  return (
    <>
      <Navigation
        onExportClick={handleExportClick}
      />
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
          {(params) =>
            validateLanguage(params.lang) ? (
              <About />
            ) : (
              <Redirect to="/en/about" />
            )
          }
        </Route>
        <Route path="/:lang/education">
          {(params) =>
            validateLanguage(params.lang) ? (
              <Education />
            ) : (
              <Redirect to="/en/education" />
            )
          }
        </Route>
        
        {/* Authentication routes */}
        <Route path="/:lang/auth">
          {(params) =>
            validateLanguage(params.lang) ? (
              <AuthPage />
            ) : (
              <Redirect to="/en/auth" />
            )
          }
        </Route>
        <Route path="/:lang/login">
          {(params) =>
            validateLanguage(params.lang) ? (
              <AuthPage initialMode="login" />
            ) : (
              <Redirect to="/en/login" />
            )
          }
        </Route>
        <Route path="/:lang/register">
          {(params) =>
            validateLanguage(params.lang) ? (
              <AuthPage initialMode="register" />
            ) : (
              <Redirect to="/en/register" />
            )
          }
        </Route>
        <Route path="/:lang/reset-password">
          {(params) =>
            validateLanguage(params.lang) ? (
              <AuthPage initialMode="reset" />
            ) : (
              <Redirect to="/en/reset-password" />
            )
          }
        </Route>
        
        {/* Profile route */}
        <Route path="/:lang/profile">
          {(params) =>
            validateLanguage(params.lang) ? (
              <Profile />
            ) : (
              <Redirect to="/en/profile" />
            )
          }
        </Route>
        
        {/* Terms route */}
        <Route path="/:lang/terms">
          {(params) =>
            validateLanguage(params.lang) ? (
              <Terms />
            ) : (
              <Redirect to="/en/terms" />
            )
          }
        </Route>
        
        {/* Premium feature routes */}
        <Route path="/:lang/premium/loan-comparison">
          {(params) =>
            validateLanguage(params.lang) ? (
              <LoanComparison />
            ) : (
              <Redirect to="/en/premium/loan-comparison" />
            )
          }
        </Route>
        <Route path="/:lang/premium/scenario-modeling">
          {(params) =>
            validateLanguage(params.lang) ? (
              <ScenarioModeling />
            ) : (
              <Redirect to="/en/premium/scenario-modeling" />
            )
          }
        </Route>
        <Route path="/:lang/premium/export-center">
          {(params) =>
            validateLanguage(params.lang) ? (
              <ExportCenter />
            ) : (
              <Redirect to="/en/premium/export-center" />
            )
          }
        </Route>
        
        {/* Subscription management routes */}
        <Route path="/:lang/subscription">
          {(params) =>
            validateLanguage(params.lang) ? (
              <SubscriptionPage />
            ) : (
              <Redirect to="/en/subscription" />
            )
          }
        </Route>
        <Route path="/:lang/billing">
          {(params) =>
            validateLanguage(params.lang) ? (
              <SubscriptionPage />
            ) : (
              <Redirect to="/en/billing" />
            )
          }
        </Route>
        
        {/* Firebase Debug route (development only) */}
        <Route path="/:lang/firebase-debug">
          {(params) =>
            validateLanguage(params.lang) ? (
              <FirebaseDebugPage />
            ) : (
              <Redirect to="/en/firebase-debug" />
            )
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
      <AuthProvider>
        <TooltipProvider>
          <SEOHead
            pageTitle={t('app.title') + ' - ' + t('app.description')}
            pageDescription={t('app.description')}
          />
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
