/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          950: '#05070d',
          900: '#0b0f19',
          850: '#101625',
          800: '#161d31',
          700: '#232d4b',
          600: '#344169',
        },
        lunar: {
          surface: '#1c2230',
          crater: '#141824',
          highland: '#c8d1e0',
          dust: '#8e9aaf',
        },
        solar: {
          gold: '#f59e0b',
          glow: '#fbbf24',
          amber: '#d97706',
          pale: '#fef3c7',
        },
        comm: {
          cyan: '#06b6d4',
          glow: '#38bdf8',
          deep: '#0284c7',
          pale: '#e0f2fe',
        },
        both: {
          emerald: '#10b981',
          glow: '#34d399',
          dark: '#047857',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

