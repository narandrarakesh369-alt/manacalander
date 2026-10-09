/**
 * MANA CALENDAR 2027 — DESIGN SYSTEM TOKENS
 * Single source of truth for color palettes, spacing, typography, and elevations.
 */

export const DESIGN_TOKENS = {
  colors: {
    // Primary
    primary: '#1677F2',
    primaryDark: '#0F63D8',
    primaryLight: '#EAF3FF',
    primarySelected: '#EAF3FF',

    // Surfaces & Backgrounds
    background: '#F8FAFC',
    cardBackground: '#FFFFFF',
    pureWhite: '#FFFFFF',

    // Typography
    textMain: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    textVeryMuted: '#94A3B8',

    // Borders
    border: '#E2E8F0',
    borderSoft: '#EEF2F7',

    // Status & Feedback
    success: '#16A34A',
    successBg: '#ECFDF3',
    warning: '#F59E0B',
    warningBg: '#FFF7E6',
    error: '#EF4444',
    errorBg: '#FEF2F2',

    // Cultural & Thematic Accents
    festivalRed: '#EF4444',
    teluguAccent: '#F97316',
    panchangamYellow: '#F59E0B',
    panchangamPurple: '#7C3AED',
    weatherBlue: '#0EA5E9',

    // Backward compatibility aliases
    text: '#0F172A',
    secondaryText: '#475569',
    muted: '#64748B',
    danger: '#EF4444',
  },
  typography: {
    fontFamily: 'Inter, "Noto Sans Telugu", sans-serif',
    fontSans: 'Inter, "Noto Sans Telugu", sans-serif',
    fontTelugu: '"Noto Sans Telugu", Inter, sans-serif',
    sizes: {
      pageTitle: '26px', // 24-28px
      sectionTitle: '19px', // 18-20px
      cardTitle: '16px', // 15-17px
      body: '14px', // 14-15px
      smallMeta: '12px', // 12-13px
      calendarDate: '15px', // 14-16px
      temperature: '34px', // 30-36px
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  radius: {
    control: '10px', // Small controls
    button: '11px', // 10-12px
    card: '16px', // 14-18px
    featureCard: '20px', // 18-20px
    bottomSheet: '24px', // 24px top corners
    pill: '9999px', // tabs, filters, status, selected states
    subtle: '10px',
    modal: '20px',
  },
  shadows: {
    card: '0 2px 8px rgba(15, 23, 42, 0.05)',
    elevated: '0 4px 16px rgba(15, 23, 42, 0.07)',
    subtle: '0 2px 8px rgba(15, 23, 42, 0.05)',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    base: '16px',
    card: '20px',
    section: '24px',
    major: '32px',
  },
} as const;
