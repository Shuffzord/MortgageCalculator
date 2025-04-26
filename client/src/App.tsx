import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import "./i18n"; // Import i18n configuration
import { useState, useEffect } from "react";
import LanguageSwitcher from "./components/LanguageSwitcher";

function Router() {
  const [selectedCurrency, setSelectedCurrency] = useState(localStorage.getItem("selectedCurrency") || "USD");

  useEffect(() => {
    localStorage.setItem("selectedCurrency", selectedCurrency);
  }, [selectedCurrency]);

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
  };

  return (
    <Switch>
      <Route path="/" >
        {() => <Home selectedCurrency={selectedCurrency} onCurrencyChange={handleCurrencyChange} />}
      </Route>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="fixed top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
