import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Education from "@/pages/Education";
import "./i18n"; // Import i18n configuration
import { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import LanguageSwitcher from "./components/LanguageSwitcher";

function Router() {
  const [selectedCurrency, setSelectedCurrency] = useState(localStorage.getItem("selectedCurrency") || "USD");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  useEffect(() => {
    localStorage.setItem("selectedCurrency", selectedCurrency);
  }, [selectedCurrency]);

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
  };

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const handleLoadClick = () => {
    setShowLoadModal(true);
  };

  return (
    <>
      <Navigation
        onExportClick={handleExportClick}
        onLoadClick={handleLoadClick}
      />
      <Switch>
        <Route path="/">
          {() => (
            <Home
              selectedCurrency={selectedCurrency}
              onCurrencyChange={handleCurrencyChange}
              showExportModal={showExportModal}
              setShowExportModal={setShowExportModal}
              showLoadModal={showLoadModal}
              setShowLoadModal={setShowLoadModal}
            />
          )}
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
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
