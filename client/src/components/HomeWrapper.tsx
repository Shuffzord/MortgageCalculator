import React, { useState } from 'react';
import HomeComponent from '@/pages/home';

const HomeWrapper: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState(localStorage.getItem("selectedCurrency") || "USD");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    localStorage.setItem("selectedCurrency", currency);
  };

  return (
    <HomeComponent
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