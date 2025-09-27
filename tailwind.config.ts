// tailwind.config.ts - CORREGIDO
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        text: {
          DEFAULT: "var(--color-text)",
          secondary: "var(--color-text-secondary)",
        },
        primary: {
          500: "var(--color-primary-500)",
          700: "var(--color-primary-700)",
        },
        secondary: {
          500: "var(--color-secondary-500)",
          700: "var(--color-secondary-700)",
        },
        success: "var(--color-success)",
        warning: "var(--color-warning)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        heading: ["var(--font-heading)"],
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        12: "var(--space-12)",
        16: "var(--space-16)",
      },
      screens: {
        // CONVERTIR a px o usar valores estándar
        'xs': '475px',      // 30rem = 480px → 475px
        'sm': '640px',      // 40rem = 640px
        'md': '768px',      // 48rem = 768px  
        'lg': '1024px',     // 64rem = 1024px
        'xl': '1280px',     // 80rem = 1280px
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
};