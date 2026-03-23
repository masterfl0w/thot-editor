import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{js,jsx,ts,tsx}'],
  exclude: [],
  theme: {
    extend: {
      tokens: {
        colors: {
          sand: {
            50:  { value: '#f5f3ee' },
            100: { value: '#ede9e3' },
            200: { value: '#e0dbd3' },
            300: { value: '#c8c3ba' },
            400: { value: '#888780' },
            500: { value: '#5f5e5a' },
            600: { value: '#4d4d4a' },
            700: { value: '#3d3d3a' },
            800: { value: '#2c2c2a' },
            900: { value: '#1a1a18' },
          },
          violet: {
            DEFAULT: { value: '#6c6cff' },
            soft:    { value: 'rgba(108,108,255,0.07)' },
          },
          danger: { value: '#c0392b' },
          dangerDark: { value: '#e57373' },
          amber: { value: '#f59e0b' },
          green: { value: '#22c57a' },
        },
        radii: {
          sm:   { value: '5px' },
          md:   { value: '6px' },
          lg:   { value: '9px' },
          xl:   { value: '12px' },
          pill: { value: '20px' },
        },
        shadows: {
          panel: { value: '0 4px 18px rgba(0,0,0,0.13)' },
          tooltip: { value: '0 3px 12px rgba(0,0,0,0.1)' },
        },
        fontSizes: {
          xs:  { value: '10px' },
          sm:  { value: '11px' },
          md:  { value: '12px' },
          lg:  { value: '13px' },
        },
      },
    },
  },
  globalCss: {
    '*': { boxSizing: 'border-box', margin: 0, padding: 0 },
    body: {
      fontFamily: "system-ui, -apple-system, sans-serif",
      background: '#f5f3ee',
      color: '#1a1a18',
    },
    '@media (prefers-color-scheme: dark)': {
      body: { background: '#1a1a18', color: '#f5f3ee' },
    },
  },
  outdir: 'styled-system',
})
