import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import About from "@/pages/About";
import Education from "@/pages/Education";
import "./i18n"; // Import i18n configuration
import { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import LanguageSwitcher from "./components/LanguageSwitcher";
import SEOHead from "./components/SEOHead";
import { useTranslation } from "react-i18next";
import HomePage from "./components/HomePage";

function Router() {
  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/">
          <HomePage />
        </Route>
        <Route path="/about">
          <About />
        </Route>
        <Route path="/education">
          <Education />
        </Route>
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  const { t } = useTranslation();
  
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
