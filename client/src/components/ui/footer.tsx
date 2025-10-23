import { t } from 'i18next';
import React, { useState, useEffect } from 'react';

declare global {
  interface Window {
    BUILD_INFO: {
      version?: string;
      buildDate?: string;
    };
  }
}
const Footer = () => {
  const [buildInfo, setBuildInfo] = useState({
    timestamp: 'Unknown',
    version: '1.0.0',
  });

  useEffect(() => {
    // Check if the global build info is available
    if (typeof window !== 'undefined' && window.BUILD_INFO) {
      setBuildInfo((window as any).BUILD_INFO);
    }
  }, []);

  // Format the date for display
  const formatDate = (timestamp: string) => {
    if (timestamp === 'Unknown') return 'Unknown';

    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }).format(date);
    } catch (e) {
      return timestamp; // Fallback to raw timestamp if parsing fails
    }
  };

  const formattedBuildTime = formatDate(buildInfo.timestamp);

  return (
    <footer className="bg-white border-t border-gray-200 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-sm text-gray-500 text-center">
          <div>© {new Date().getFullYear()} Marvelous Mateusz Woźniak. All rights reserved.</div>
          <div className="mt-4 md:mt-2">
            <span>Version: {buildInfo.version}</span>
            <span className="mx-2">|</span>
            <span>Build: {formattedBuildTime}</span>
            <span className="mx-2">|</span>
            <span>{t('app.description')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
