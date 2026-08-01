import type { Config } from "tailwindcss";
import type { PluginAPI } from "tailwindcss/types/config";

/**
 * Canonical Heritage Editorial tokens for the Bete frontend.
 * Source of truth: stitch_bete_premium_property_discovery/heritage_editorial/DESIGN.md
 * (YAML frontmatter hex values — verified against painted usage across stitch screens).
 *
 * Do not diverge screen-local Tailwind CDN configs (e.g. seller_workspace /
 * property_detail rounded radii or alternate primary hexes) from this file.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Strictly sharp shapes — overrides Tailwind defaults. `full` kept for
    // avatars, status dots, and intentionally circular controls only.
    borderRadius: {
      none: "0px",
      sm: "0px",
      DEFAULT: "0px",
      md: "0px",
      lg: "0px",
      xl: "0px",
      "2xl": "0px",
      "3xl": "0px",
      full: "9999px",
    },
    extend: {
      colors: {
        // Surfaces
        background: "#fbf9f5",
        "on-background": "#1b1c1a",
        surface: "#fbf9f5",
        "surface-dim": "#dbdad6",
        "surface-bright": "#fbf9f5",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f5f3ef",
        "surface-container": "#efeeea",
        "surface-container-high": "#eae8e4",
        "surface-container-highest": "#e4e2de",
        "surface-variant": "#e4e2de",
        "surface-tint": "#3f6653",
        "on-surface": "#1b1c1a",
        "on-surface-variant": "#414844",
        "inverse-surface": "#30312e",
        "inverse-on-surface": "#f2f0ec",

        // Outline
        outline: "#717973",
        "outline-variant": "#c1c8c2",

        // Primary
        primary: "#012d1d",
        "on-primary": "#ffffff",
        "primary-container": "#1b4332",
        "on-primary-container": "#86af99",
        "inverse-primary": "#a5d0b9",
        "primary-fixed": "#c1ecd4",
        "primary-fixed-dim": "#a5d0b9",
        "on-primary-fixed": "#002114",
        "on-primary-fixed-variant": "#274e3d",

        // Secondary
        secondary: "#795919",
        "on-secondary": "#ffffff",
        "secondary-container": "#fdd185",
        "on-secondary-container": "#785818",
        "secondary-fixed": "#ffdea9",
        "secondary-fixed-dim": "#ebc076",
        "on-secondary-fixed": "#271900",
        "on-secondary-fixed-variant": "#5e4100",

        // Tertiary
        tertiary: "#22262b",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#383c41",
        "on-tertiary-container": "#a3a6ad",
        "tertiary-fixed": "#e0e2e9",
        "tertiary-fixed-dim": "#c3c7cd",
        "on-tertiary-fixed": "#181c21",
        "on-tertiary-fixed-variant": "#43474d",

        // Error
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "serif"],
        body: ["var(--font-body)", "serif"],
        "body-serif": ["var(--font-body)", "serif"],
        display: ["var(--font-serif)", "serif"],
        headline: ["var(--font-serif)", "serif"],
        label: ["var(--font-sans)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      // Sizes only — family pairing is applied by the plugin utilities below
      // so `text-display-lg` etc. always carry the correct font-family.
      fontSize: {
        "display-lg": [
          "64px",
          { lineHeight: "72px", letterSpacing: "-0.02em", fontWeight: "400" },
        ],
        "display-lg-mobile": [
          "40px",
          { lineHeight: "48px", letterSpacing: "-0.01em", fontWeight: "400" },
        ],
        "headline-md": ["32px", { lineHeight: "40px", fontWeight: "400" }],
        "headline-sm": ["24px", { lineHeight: "32px", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "32px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "28px", fontWeight: "400" }],
        "label-md": [
          "14px",
          { lineHeight: "20px", letterSpacing: "0.05em", fontWeight: "500" },
        ],
        "label-sm": [
          "12px",
          { lineHeight: "16px", letterSpacing: "0.03em", fontWeight: "600" },
        ],
      },
      spacing: {
        base: "8px",
        "container-max": "1280px",
        gutter: "24px",
        "margin-desktop": "64px",
        "margin-mobile": "20px",
      },
      maxWidth: {
        "container-max": "1280px",
      },
      boxShadow: {
        editorial: "0px 4px 20px rgba(27, 67, 50, 0.05)",
      },
    },
  },
  plugins: [
    ({ addUtilities }: PluginAPI) => {
      addUtilities({
        ".text-display-lg": {
          fontFamily: "var(--font-serif), serif",
          fontSize: "64px",
          lineHeight: "72px",
          letterSpacing: "-0.02em",
          fontWeight: "400",
        },
        ".text-display-lg-mobile": {
          fontFamily: "var(--font-serif), serif",
          fontSize: "40px",
          lineHeight: "48px",
          letterSpacing: "-0.01em",
          fontWeight: "400",
        },
        ".text-headline-md": {
          fontFamily: "var(--font-serif), serif",
          fontSize: "32px",
          lineHeight: "40px",
          fontWeight: "400",
        },
        ".text-headline-sm": {
          fontFamily: "var(--font-serif), serif",
          fontSize: "24px",
          lineHeight: "32px",
          fontWeight: "400",
        },
        ".text-body-lg": {
          fontFamily: "var(--font-body), serif",
          fontSize: "18px",
          lineHeight: "32px",
          fontWeight: "400",
        },
        ".text-body-md": {
          fontFamily: "var(--font-body), serif",
          fontSize: "16px",
          lineHeight: "28px",
          fontWeight: "400",
        },
        ".text-label-md": {
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: "14px",
          lineHeight: "20px",
          letterSpacing: "0.05em",
          fontWeight: "500",
        },
        ".text-label-sm": {
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: "12px",
          lineHeight: "16px",
          letterSpacing: "0.03em",
          fontWeight: "600",
        },
      });
    },
  ],
};

export default config;
