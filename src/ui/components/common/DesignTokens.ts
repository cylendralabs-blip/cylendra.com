/**
 * Design System Tokens
 * 
 * Centralized design tokens for consistent styling across the application
 * Colors, typography, spacing, shadows, etc.
 * 
 * Phase 10: UI/UX Improvement - Task 11
 */

/**
 * Color Palette
 */
export const colors = {
  // Primary colors (AI Neon Blue)
  primary: {
    50: '#e6f9ff',
    100: '#ccf3ff',
    200: '#99e7ff',
    300: '#66dbff',
    400: '#33cfff',
    500: '#00d9ff',
    600: '#00b8d9',
    700: '#0097b3',
    800: '#00768c',
    900: '#005566',
    DEFAULT: '#00d9ff',
  },

  // Accent colors (Purple)
  accent: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    DEFAULT: '#8b5cf6',
  },

  // Semantic colors
  success: {
    light: '#10b981',
    DEFAULT: '#059669',
    dark: '#047857',
  },

  error: {
    light: '#ef4444',
    DEFAULT: '#dc2626',
    dark: '#b91c1c',
  },

  warning: {
    light: '#f59e0b',
    DEFAULT: '#d97706',
    dark: '#b45309',
  },

  info: {
    light: '#3b82f6',
    DEFAULT: '#2563eb',
    dark: '#1d4ed8',
  },
} as const;

/**
 * Typography Scale
 */
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'monospace'],
  },

  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

/**
 * Spacing Scale
 */
export const spacing = {
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

/**
 * Border Radius
 */
export const borderRadius = {
  none: '0px',
  sm: '0.125rem',  // 2px
  DEFAULT: '0.25rem',  // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const;

/**
 * Shadows
 */
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} as const;

/**
 * Z-Index Scale
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

/**
 * Animation Durations
 */
export const animation = {
  duration: {
    fast: '150ms',
    DEFAULT: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

/**
 * Breakpoints (for responsive design)
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Component-Specific Tokens
 */
export const components = {
  // Card
  card: {
    padding: spacing[6],
    borderRadius: borderRadius.lg,
    shadow: shadows.md,
  },

  // Button
  button: {
    padding: {
      sm: `${spacing[2]} ${spacing[4]}`,
      md: `${spacing[3]} ${spacing[6]}`,
      lg: `${spacing[4]} ${spacing[8]}`,
    },
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },

  // Input
  input: {
    padding: `${spacing[3]} ${spacing[4]}`,
    borderRadius: borderRadius.md,
    borderWidth: '1px',
    fontSize: typography.fontSize.base,
  },

  // Table
  table: {
    cellPadding: spacing[4],
    headerFontWeight: typography.fontWeight.semibold,
    rowBorder: '1px solid',
  },

  // Badge
  badge: {
    padding: `${spacing[1]} ${spacing[2]}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
} as const;

/**
 * Chart Colors (for data visualization)
 */
export const chartColors = {
  // Primary gradient
  primary: ['#00d9ff', '#0097b3'],
  
  // Success gradient (green)
  success: ['#10b981', '#047857'],
  
  // Error gradient (red)
  error: ['#ef4444', '#b91c1c'],
  
  // Warning gradient (orange)
  warning: ['#f59e0b', '#b45309'],
  
  // Multi-series colors
  series: [
    '#00d9ff',  // Primary blue
    '#8b5cf6',  // Accent purple
    '#10b981',  // Success green
    '#f59e0b',  // Warning orange
    '#ef4444',  // Error red
    '#3b82f6',  // Info blue
    '#ec4899',  // Pink
    '#14b8a6',  // Teal
  ],
} as const;

/**
 * Trading-Specific Colors
 */
export const tradingColors = {
  // Price movement
  bullish: '#10b981',  // Green
  bearish: '#ef4444',  // Red
  neutral: '#6b7280',  // Gray

  // Position status
  profit: '#10b981',
  loss: '#ef4444',
  breakEven: '#6b7280',

  // Order types
  buy: '#10b981',
  sell: '#ef4444',
  limit: '#3b82f6',
  market: '#8b5cf6',
} as const;

/**
 * Helper function to get color value
 */
export function getColor(colorPath: string): string {
  const parts = colorPath.split('.');
  let value: any = colors;
  
  for (const part of parts) {
    value = value[part];
    if (!value) return '';
  }
  
  return typeof value === 'string' ? value : '';
}

/**
 * Helper function to get spacing value
 */
export function getSpacing(size: keyof typeof spacing): string {
  return spacing[size];
}

/**
 * Helper function to get shadow value
 */
export function getShadow(size: keyof typeof shadows): string {
  return shadows[size];
}

/**
 * Design Token Export
 */
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
  animation,
  breakpoints,
  components,
  chartColors,
  tradingColors,
  helpers: {
    getColor,
    getSpacing,
    getShadow,
  },
} as const;

export default designTokens;

