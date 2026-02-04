import { createTheme } from '@mui/material/styles';

/**
 * underwritRE Design System
 * 
 * This file is the single source of truth for all design tokens.
 * Every color, font size, spacing unit, and component style flows from here.
 * 
 * DO NOT hardcode colors or sizes elsewhere in the app.
 * Import these tokens instead.
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

/**
 * Brand Colors
 * Derived from the logo: Navy (#173D65) and Blue (#4B90D8)
 */
export const colors = {
  // Primary brand colors (from logo)
  navy: '#173D65',        // Nav, page headers, structural chrome
  blue: '#4B90D8',        // Buttons, links, interactive elements, focus states
  
  // Derived shades (calculated from brand blue)
  blueDark: '#2D6FB5',    // Hover state for blue buttons
  blueLight: '#7AB4E8',   // Secondary interactive elements, progress indicators
  blueTint: '#EBF3FD',    // Selected rows, active card backgrounds, light highlights
  
  // Neutrals (true greys, no blue contamination)
  grey: {
    900: '#111827',       // Primary text
    700: '#374151',       // Secondary text (labels, metadata)
    600: '#6B7280',       // Tertiary text (captions, helper text)
    400: '#9CA3AF',       // Disabled text, placeholders
    300: '#E5E7EB',       // Borders, dividers
    100: '#F9FAFB',       // Alternating rows, light surface
    50:  '#F3F4F6',       // Section backgrounds, calculated cell backgrounds
  },
  
  // Semantic colors
  error: '#DC2626',       // Error text, error borders
  errorBg: '#FEF2F2',     // Error cell background
  success: '#059669',     // Success states (used sparingly)
  successBg: '#D1FAE5',   // Success backgrounds
  
  // Pure utility
  white: '#FFFFFF',
  black: '#000000',
} as const;

/**
 * Input State Tokens
 * 
 * These solve the core UX problem: making editable vs calculated cells visually distinct.
 * Apply these to all form inputs and table cells.
 */
export const inputStates = {
  editable: {
    background: colors.white,
    border: colors.grey[300],
    borderFocus: colors.blue,
    text: colors.grey[900],
  },
  calculated: {
    background: colors.grey[50],
    border: 'none',
    text: colors.grey[600],
  },
  error: {
    background: colors.errorBg,
    border: colors.error,
    text: colors.error,
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

/**
 * Typography Scale
 * 
 * Inter is loaded via Google Fonts (see index.html).
 * Weights: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
 */
export const typography = {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  
  // Font sizes (in rem)
  fontSize: {
    xs: '0.75rem',      // 12px - captions, fine print
    sm: '0.875rem',     // 14px - table cells, secondary text
    base: '1rem',       // 16px - body text
    lg: '1.125rem',     // 18px - emphasized body
    xl: '1.25rem',      // 20px - section headers
    '2xl': '1.5rem',    // 24px - page headers
    '3xl': '1.875rem',  // 30px - major headers
  },
  
  // Font weights
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================

/**
 * Spacing Scale
 * Base unit: 8px (0.5rem)
 * 
 * Use these for padding, margins, gaps.
 * MUI's spacing function multiplies these by 8px: spacing(1) = 8px
 */
export const spacing = {
  xs: 0.5,   // 4px
  sm: 1,     // 8px
  md: 2,     // 16px
  lg: 3,     // 24px
  xl: 4,     // 32px
  '2xl': 6,  // 48px
  '3xl': 8,  // 64px
} as const;

// ============================================================================
// MUI THEME
// ============================================================================

/**
 * MUI Theme Configuration
 * 
 * This theme is applied globally via ThemeProvider in App.tsx.
 * All MUI components inherit these settings automatically.
 */
export const theme = createTheme({
  palette: {
    primary: {
      main: colors.blue,
      dark: colors.blueDark,
      light: colors.blueLight,
      contrastText: colors.white,
    },
    secondary: {
      main: colors.navy,
      contrastText: colors.white,
    },
    error: {
      main: colors.error,
      light: colors.errorBg,
    },
    success: {
      main: colors.success,
      light: colors.successBg,
    },
    text: {
      primary: colors.grey[900],
      secondary: colors.grey[700],
      disabled: colors.grey[400],
    },
    divider: colors.grey[300],
    background: {
      default: colors.white,
      paper: colors.white,
    },
    grey: colors.grey,
  },
  
  typography: {
    fontFamily: typography.fontFamily,
    fontSize: 14, // Base font size in px (MUI default is 14)
    
    h1: {
        fontSize: typography.fontSize['3xl'],
        fontWeight: 700, // Keep as bold
        lineHeight: typography.lineHeight.tight,
        color: colors.grey[900],
    },
    h2: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: 700, // Changed from 600
        lineHeight: typography.lineHeight.tight,
        color: colors.grey[900],
    },
    h3: {
        fontSize: typography.fontSize.xl,
        fontWeight: 700, // Changed from 600
        lineHeight: typography.lineHeight.tight,
        color: colors.grey[900],
    },
    h4: {
        fontSize: typography.fontSize.lg,
        fontWeight: 600, // Keep as semibold
        lineHeight: typography.lineHeight.normal,
        color: colors.grey[900],
    },
    h5: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.normal,
        color: colors.grey[900],
    },
    h6: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.normal,
        color: colors.grey[900],
    },
    body1: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.regular,
      lineHeight: typography.lineHeight.normal,
      color: colors.grey[900],
    },
    body2: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.regular,
      lineHeight: typography.lineHeight.normal,
      color: colors.grey[700],
    },
    caption: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.regular,
      lineHeight: typography.lineHeight.normal,
      color: colors.grey[600],
    },
    button: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      textTransform: 'none', // Disable uppercase transformation
      lineHeight: typography.lineHeight.normal,
    },
  },
  
  spacing: 8, // Base spacing unit (MUI default)
  
  shape: {
    borderRadius: 8, // Consistent border radius across the app
  },
  
  components: {
    // Button overrides
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
          fontWeight: typography.fontWeight.semibold,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    
    // Card overrides
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
    
    // Paper overrides
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
        elevation2: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
        elevation3: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      },
    },
    
    // TextField overrides (for editable inputs)
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: inputStates.editable.background,
            '& fieldset': {
              borderColor: inputStates.editable.border,
              borderWidth: '1.5px',
            },
            '&:hover fieldset': {
              borderColor: colors.grey[600],
            },
            '&.Mui-focused fieldset': {
              borderColor: inputStates.editable.borderFocus,
              borderWidth: '2px',
            },
          },
        },
      },
    },
    
    // DataGrid overrides (for tables)
    // DataGrid overrides (for tables)
    
  },
});

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Utility function to generate consistent box shadows
 */
export const shadows = {
  xs: '0 1px 2px rgba(0,0,0,0.05)',
  sm: '0 1px 3px rgba(0,0,0,0.1)',
  md: '0 4px 6px rgba(0,0,0,0.1)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
  xl: '0 20px 25px rgba(0,0,0,0.1)',
} as const;

/**
 * Utility function for consistent focus rings
 */
export const focusRing = {
  outline: `2px solid ${colors.blue}`,
  outlineOffset: '2px',
} as const;