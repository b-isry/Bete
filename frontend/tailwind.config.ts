import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    borderRadius: {
      none: "0px",
      sm: "0px",
      DEFAULT: "0px",
      md: "0px",
      lg: "0px",
      xl: "0px",
      "2xl": "0px",
      "3xl": "0px",
      full: "0px",
    },
    extend: {
      colors: {
        background: "#fbf9f5",
        surface: "#fbf9f5",
        "surface-variant": "#e4e2de",
        primary: "#012d1d",
        "primary-container": "#1b4332",
        secondary: "#795919",
        "secondary-container": "#fdd185",
        tertiary: "#22262b",
        "on-surface": "#1b1c1a",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "serif"],
        body: ["var(--font-body)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
