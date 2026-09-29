/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // School portal palette
        navy: {
          50: "#eef2f7",
          100: "#d4dce8",
          200: "#a9b9d1",
          300: "#7e96ba",
          400: "#5373a3",
          500: "#2d5088",
          600: "#1a2744",
          700: "#142038",
          800: "#0f1a2e",
          900: "#0a1628",
          950: "#060e1a",
        },
        gold: {
          50: "#fdf8e8",
          100: "#f9edc5",
          200: "#f3db8a",
          300: "#edc84f",
          400: "#d4a017",
          500: "#c9a227",
          600: "#a07e1e",
          700: "#785e17",
          800: "#503f0f",
          900: "#282008",
        },
      },
    },
  },
  plugins: [],
};
