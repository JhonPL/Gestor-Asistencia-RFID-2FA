import { createGlobalStyle } from 'styled-components';
import theme from './theme';

/**
 * Estilos globales: reset CSS, importación de fuentes y variables base.
 * Se monta una sola vez en el árbol de la aplicación.
 */
const GlobalStyles = createGlobalStyle`
  /* ── Google Fonts ── */
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

  /* ── Reset ── */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    scroll-behavior: smooth;
    -webkit-text-size-adjust: 100%;
  }

  body {
    font-family: ${theme.fonts.body};
    font-size: ${theme.fontSizes.base};
    color: ${theme.colors.onSurface};
    background-color: ${theme.colors.surface};
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ── Selección de texto ── */
  ::selection {
    background-color: ${theme.colors.primaryContainer};
    color: white;
  }

  /* ── Tipografía base ── */
  h1, h2, h3, h4, h5, h6 {
    font-family: ${theme.fonts.headline};
    line-height: 1.2;
    font-weight: ${theme.fontWeights.bold};
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  img {
    max-width: 100%;
    display: block;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: ${theme.fonts.body};
  }

  /* ── Material Symbols ── */
  .material-symbols-outlined {
    font-family: 'Material Symbols Outlined';
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    user-select: none;
  }
`;

export default GlobalStyles;