import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "sm": "640px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px",
        "2xl": "1400px",
        "mobile": "640px",
      },
    },
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Main colors
        primary: {
          DEFAULT: "#1A6B72", // Deep blue-green
          foreground: "#FFFFFF", // White
        },
        secondary: {
          DEFAULT: "#E8A87C", // Warm accent color
          foreground: "#111111", // Dark text
        },
        background: "#F8F9FA", // Light neutral background
        foreground: "#333333", // Dark gray text
        
        // Component colors
        card: {
          DEFAULT: "#FFFFFF", // White card background
          foreground: "#333333", // Dark gray text
        },
        popover: {
          DEFAULT: "#FFFFFF", // White popover background
          foreground: "#333333", // Dark gray text
        },
        
        // Status colors
        success: {
          DEFAULT: "#2E8B57", // Muted green
          foreground: "#FFFFFF", // White text
        },
        warning: {
          DEFAULT: "#F5B041", // Soft amber
          foreground: "#111111", // Dark text
        },
        info: {
          DEFAULT: "#3498DB", // Calm blue
          foreground: "#FFFFFF", // White text
        },
        destructive: {
          DEFAULT: "#C0392B", // Subdued red
          foreground: "#FFFFFF", // White text
        },
        
        // UI element colors
        muted: {
          DEFAULT: "#F5F5F5", 
          foreground: "#737373",
        },
        accent: {
          DEFAULT: "#3498DB", // Same as info blue
          foreground: "#FFFFFF", // White text
        },
        border: "#E5E7EB",
        input: "#E5E7EB",
        ring: "#1A6B72", // Same as primary
        
        // Chart colors
        chart: {
          principal: "#1A6B72", // Primary - blue-green
          interest: "#E8A87C", // Secondary - warm accent
          balance: "#3498DB", // Info - calm blue
          payment: "#2E8B57", // Success - muted green
          overpayment: "#F5B041", // Warning - soft amber
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-in-out",
        "fade-out": "fade-out 0.3s ease-in-out",
      },
      spacing: {
        '8': '8px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '40': '40px',
        '48': '48px',
        '56': '56px',
        '64': '64px',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
