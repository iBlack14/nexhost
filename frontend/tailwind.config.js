/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nx: {
          bg: '#0a0c10',
          bg2: '#111318',
          bg3: '#181c23',
          border: 'rgba(255, 255, 255, 0.07)',
          border2: 'rgba(255, 255, 255, 0.13)',
          muted: '#6b7280',
          accent: '#3b82f6',
          accent2: '#06b6d4',
        },
      },
      borderRadius: {
        nx: '12px',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
