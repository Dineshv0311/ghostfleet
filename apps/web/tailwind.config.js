/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        surface: "#101626",
        surfaceLight: "#182238",
        surfaceBorder: "#233354",
        cyanAccent: "#00f0ff",
        cyanGlow: "rgba(0, 240, 255, 0.15)",
        amberAccent: "#f59e0b",
        successAccent: "#10b981",
        dangerAccent: "#ef4444",
        purpleAccent: "#a855f7",
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
