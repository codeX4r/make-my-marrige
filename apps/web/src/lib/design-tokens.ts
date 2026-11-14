export const designTokens = {
  colors: {
    background: "#FAF8F4",
    surface: "#FFFFFF",
    primary: "#7A2E42",
    primaryHover: "#662638",
    primaryActive: "#551F2D",
    accent: "#BD9560",
    accentHover: "#A88050",
    text: "#282522",
    muted: "#77716B",
    border: "#EAE4DA",
    success: "#287A52",
    warning: "#A96816",
    danger: "#B33A36",
    info: "#356B9A",
  },
  typography: {
    ui: "Inter",
    editorial: "Playfair Display",
    devanagari: "Noto Sans Devanagari",
  },
  radii: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 22,
  },
  spacing: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
  breakpoints: {
    mobile: 360,
    mobileLarge: 390,
    tablet: 768,
    desktopSmall: 1024,
    desktop: 1280,
    wide: 1440,
  },
  accessibility: {
    target: "WCAG 2.2 AA",
    focusVisible: true,
    reducedMotion: true,
    minimumTouchTarget: 44,
  },
} as const;

export type DesignTokens = typeof designTokens;

export function getSpacing(value: number): string {
  return `${value}px`;
}

export function getColor(color: keyof typeof designTokens.colors): string {
  return designTokens.colors[color];
}

export function getSpacingScale(index: number): string {
  const scale = designTokens.spacing;
  return `${scale[Math.min(index, scale.length - 1)]}px`;
}
