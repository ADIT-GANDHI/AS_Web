/**
 * Ajab Shahar design tokens — TypeScript mirror of the CSS variables
 * declared in `app/globals.css`. Keep both in sync.
 *
 *   CSS  : `var(--ajab-pink-primary)`
 *   TS   : `tokens.color.pinkPrimary`
 *
 * Why have two surfaces?
 *   - CSS variables are the runtime source of truth (theme-able, dev-tools
 *     friendly, work in pseudo-elements and media queries).
 *   - TS constants give us autocomplete + type safety when computing
 *     layouts in components (inline `style={{}}`, Framer Motion animations,
 *     canvas/SVG drawing, Playwright tests).
 *
 * Generation strategy: this file is currently hand-maintained. To make it
 * automatic, see TOKENS_RESEARCH.md → "Sync strategies".
 */

export const tokens = {
  color: {
    // Brand pink — three closely-related shades the design uses
    pinkPrimary: '#E31E79',
    pinkCard:    '#E6287A',
    pinkRelated: '#ED1E79',

    // Ink (greyscale) scale, dark → light
    ink950: '#333333',
    ink900: '#3C3C3B',
    ink800: '#4D4D4D',
    ink700: '#4F4F4F',
    ink600: '#575756',
    ink500: '#6D6E71',
    ink400: '#6F6F72',
    ink300: '#828282',
    ink200: '#9C9B9B',
    ink100: '#B1B1B1',

    surface: '#FFFFFF',
    pageBg:  '#F8F8F8',
  },

  font: {
    serif: "'Lora', serif",
    sans:  "'Merriweather Sans', sans-serif",
  },

  fontSize: {
    display:  '34px',
    h1:       '32px',
    h2:       '30px',
    h3:       '28px',
    h4:       '26px',
    h5:       '24px',
    h6:       '22px',
    button:   '21px',
    bodyLg:   '20px',
    body:     '18px',
    bodySm:   '16px',
    caption:  '15px',
    tag:      '14px',
    micro:    '12px',
    nano:     '11px',
  },

  lineHeight: {
    tight:   1.2,
    base:    1.3,
    relaxed: 1.5,
  },

  card: {
    width:           '288px',
    minHeight:       '287px',
    thumbHeight:     '156px',
    thumbInset:      '4px',
    bodyPadX:        '16px',
    bodyPadTop:      '0px',
    bodyPadBottom:   '24px',
    titleMb:         '0px',
    subtitleMb:      '7px',
    radius:          '4px',
    shadow:          '0 4px 14px rgba(0, 0, 0, 0.10)',
  },

  grid: {
    colGap:  '88px',
    rowGap:  '53px',
    maxW:    '1140px',
  },

  page: {
    marbleW: '80vw',
    sideW:   '10vw',
    maxW:    '1320px',
    minW:    '980px',
    padX:    '40px',
  },
} as const;

export type Tokens = typeof tokens;
