import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// i18n is imported in App.tsx

// Handle HMR reconnection issues
if (import.meta.hot) {  import.meta.hot.on('vite:beforeUpdate', () => {
    // Development-only HMR update handler
  });
  
  // Add a listener for vite connection status
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // When tab becomes visible again, check if we need to reload
      const viteHmrTimeoutId = setTimeout(() => {
        // If we don't get a connection event soon, reload the page
        window.location.reload();
      }, 1000);
      
      // Clear timeout if we get a connection event
      import.meta.hot?.on('vite:connect', () => {
        clearTimeout(viteHmrTimeoutId);
      });
    }
  });
}

// Apply custom styles for financial figures in the app
const style = document.createElement('style');
style.textContent = `
  .financial-figure {
    font-family: 'Roboto Mono', monospace;
  }
  
  .tooltip {
    position: relative;
    display: inline-block;
    cursor: help;
  }
  
  .tooltip .tooltip-text {
    visibility: hidden;
    width: 250px;
    background-color: #424242;
    color: #fff;
    text-align: left;
    border-radius: 6px;
    padding: 12px;
    position: absolute;
    z-index: 10;
    bottom: 125%;
    left: 50%;
    margin-left: -125px;
    opacity: 0;
    transition: opacity 0.3s;
    font-size: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .tooltip:hover .tooltip-text {
    visibility: visible;
    opacity: 1;
  }
`;
document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(<App />);
