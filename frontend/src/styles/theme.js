/**
 * Design tokens del sistema SmartClass RFID.
 * Basados en Material Design 3 — paleta definida en el boceto.
 * Fuente de verdad para todos los estilos: si cambias un color, cambia en toda la app.
 */

export const theme = {
  colors: {
    // Primarios
    primary: '#000666',
    primaryContainer: '#1a237e',
    onPrimaryContainer: '#8690ee',
    primaryFixed: '#e0e0ff',
    primaryFixedDim: '#bdc2ff',
    inversePrimary: '#bdc2ff',
    onPrimary: '#ffffff',

    // Secundarios
    secondary: '#006b5e',
    secondaryContainer: '#94f0df',
    secondaryFixed: '#97f3e2',
    secondaryFixedDim: '#7ad7c6',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#006f62',

    // Superficies
    surface: '#fbf8ff',
    surfaceBright: '#fbf8ff',
    surfaceDim: '#dbd9e1',
    surfaceContainer: '#efecf5',
    surfaceContainerLow: '#f5f2fb',
    surfaceContainerHigh: '#eae7ef',
    surfaceContainerHighest: '#e4e1ea',
    surfaceContainerLowest: '#ffffff',
    surfaceVariant: '#e4e1ea',
    surfaceTint: '#4c56af',
    inverseSurface: '#303036',
    inverseOnSurface: '#f2eff8',

    // Texto
    onSurface: '#1b1b21',
    onSurfaceVariant: '#454652',
    onBackground: '#1b1b21',
    background: '#fbf8ff',

    // Bordes
    outline: '#767683',
    outlineVariant: '#c6c5d4',

    // Estado de error
    error: '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#93000a',
  },

  fonts: {
    /**
     * "Playfair Display" para titulares: carácter académico y elegante.
     * "Plus Jakarta Sans" para cuerpo: moderno, legible, técnico.
     */
    headline: '"Playfair Display", Georgia, serif',
    body: '"Plus Jakarta Sans", system-ui, sans-serif',
    label: '"Plus Jakarta Sans", system-ui, sans-serif',
  },

  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
  },

  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  radii: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    '4xl': '3rem',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
    xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    '2xl': '0 25px 50px -12px rgba(0,0,0,0.25)',
  },

  transitions: {
    fast: '150ms ease',
    base: '250ms ease',
    slow: '400ms ease',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  spacing: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
  },
};

export default theme;