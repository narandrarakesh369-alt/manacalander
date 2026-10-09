/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./apps/**/*.{js,ts,jsx,tsx}",
    "./packages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1677F2',
          dark: '#0F63D8',
          light: '#EAF3FF',
          selected: '#EAF3FF',
          50: '#F0F7FF',
          100: '#EAF3FF',
          500: '#1677F2',
          600: '#0F63D8',
          700: '#0B4A9C',
        },
        slate: {
          background: '#F8FAFC',
          text: '#0F172A',
          secondary: '#475569',
          muted: '#64748B',
          veryMuted: '#94A3B8',
          border: '#E2E8F0',
          borderSoft: '#EEF2F7',
        },
        feedback: {
          success: '#16A34A',
          successBg: '#ECFDF3',
          warning: '#F59E0B',
          warningBg: '#FFF7E6',
          error: '#EF4444',
          errorBg: '#FEF2F2',
        },
        accent: {
          festival: '#EF4444',
          telugu: '#F97316',
          panchangamYellow: '#F59E0B',
          panchangamPurple: '#7C3AED',
          weatherBlue: '#0EA5E9',
        },
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans Telugu"', 'system-ui', '-apple-system', 'sans-serif'],
        telugu: ['"Noto Sans Telugu"', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'control': '10px',
        'button': '11px',
        'card': '16px',
        'feature': '20px',
        'sheet': '24px',
        'subtle': '10px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(15, 23, 42, 0.05)',
        'elevated': '0 4px 16px rgba(15, 23, 42, 0.07)',
        'subtle': '0 2px 8px rgba(15, 23, 42, 0.05)',
        'dropdown': '0 4px 16px rgba(15, 23, 42, 0.07)',
      },
    },
  },
  plugins: [],
};
