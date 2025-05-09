import React, { useState } from 'react';
import Home from '@/pages/Home';

interface HomeComponentProps {
  selectedCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
  showExportModal?: boolean;
  setShowExportModal?: React.Dispatch<React.SetStateAction<boolean>>;
  showLoadModal?: boolean;
  setShowLoadModal?: React.Dispatch<React.SetStateAction<boolean>>;
}

const HomeWrapper: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState(localStorage.getItem("selectedCurrency") || "USD");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    localStorage.setItem("selectedCurrency", currency);
  };

  return (
    <Home 
      selectedCurrency={selectedCurrency}
      onCurrencyChange={handleCurrencyChange}
      showExportModal={showExportModal}
      setShowExportModal={setShowExportModal}
      showLoadModal={showLoadModal}
      setShowLoadModal={setShowLoadModal}
    />
  );
};

export default HomeWrapper;