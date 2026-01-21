/**
 * Yoga Platform Design System
 * 
 * A calming, wellness-focused theme inspired by yoga philosophy
 * featuring earth tones, sage greens, and sunset golds.
 */

export const yogaTheme = {
  colors: {
    // Earth Tones - Grounding & Stability
    earth: {
      50: '#F9F7F4',
      100: '#F0EBE3',
      200: '#E3D5C1',
      300: '#C9B79C',
      400: '#A89476',
      500: '#8B7355', // Primary earth brown
      600: '#6F5B44',
      700: '#564435',
      800: '#3E2F26',
      900: '#2B1F18',
    },
    
    // Sage - Balance & Harmony
    sage: {
      50: '#F5F8F7',
      100: '#E8F0ED',
      200: '#D1E1DC',
      300: '#B4CDCA',
      400: '#9DB5B2', // Secondary sage green
      500: '#7A9B96',
      600: '#5F7D79',
      700: '#4A5F5C',
      800: '#374541',
      900: '#252E2B',
    },
    
    // Sunset - Energy & Vitality
    sunset: {
      50: '#FDF8F3',
      100: '#F9EFE5',
      200: '#F1DCCA',
      300: '#E5C5A6',
      400: '#D4A574', // Accent sunset gold
      500: '#B88850',
      600: '#9A6D3C',
      700: '#7A552F',
      800: '#5A3F22',
      900: '#3D2A17',
    },
    
    // Lavender - Peace & Tranquility
    lavender: {
      50: '#F7F5F9',
      100: '#EDE8F2',
      200: '#D9CEE3',
      300: '#C0AED1',
      400: '#A38EBD',
      500: '#8570A4',
      600: '#6B5A85',
      700: '#524668',
      800: '#3B334B',
      900: '#282232',
    },
    
    // Sky - Clarity & Openness
    sky: {
      50: '#F0F7FA',
      100: '#E0EFF5',
      200: '#C1DFEB',
      300: '#9BCBDD',
      400: '#6FB2CC',
      500: '#4A93B3',
      600: '#3A7693',
      700: '#2D5C73',
      800: '#214354',
      900: '#172E39',
    },
  },
  
  typography: {
    fonts: {
      display: '"Cormorant Garamond", serif',
      heading: '"Quicksand", sans-serif',
      body: '"Inter", system-ui, -apple-system, sans-serif',
    },
    sizes: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
    },
  },
  
  spacing: {
    breathe: '1.5rem',  // 24px - comfortable breathing room
    flow: '2rem',       // 32px - natural flow between sections
    ground: '3rem',     // 48px - grounding space
  },
  
  radius: {
    soft: '0.75rem',    // 12px
    card: '1rem',       // 16px
    gentle: '1.25rem',  // 20px
    pillow: '1.5rem',   // 24px
  },
  
  shadows: {
    soft: '0 4px 20px rgba(43, 31, 24, 0.06)',
    card: '0 8px 30px rgba(43, 31, 24, 0.08)',
    float: '0 12px 40px rgba(43, 31, 24, 0.1)',
    glow: '0 0 20px rgba(212, 165, 116, 0.2)',
  },
  
  transitions: {
    breath: '300ms ease-out',
    flow: '500ms ease-in-out',
    gentle: '200ms ease-out',
  },
} as const;

export type YogaTheme = typeof yogaTheme;
