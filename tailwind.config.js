/** @type {import('tailwindcss').Config} */
const { colors: defatColours } = require("tailwindcss/defaultTheme");
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ...defatColours,
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        main: "rgb(var(--color-main) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-secondary": "rgb(var(--color-accent-secondary) / <alpha-value>)",
        error: "rgb(var(--color-error) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(0deg, rgba(254, 137, 31, 1) 0%, rgba(254, 182, 35, 1) 100%)",
      },
      fontFamily: {
        display: "var(--heading-font)",
        sans: "var(--body-font)",
      }
    },

  },
  plugins: [],
};
