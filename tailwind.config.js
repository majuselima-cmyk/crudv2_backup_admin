/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      colors: {
        'neon-blue': '#00f0ff',
        'dark-bg': '#0a0a0f',
        'dark-surface': '#1a1a2e',
      },
    },
  },
  plugins: [],
}


