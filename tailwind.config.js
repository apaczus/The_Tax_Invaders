/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  // web: klasy Tailwind muszą wygrywać z domyślnymi stylami react-native-web
  important: "html",
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#0B6E4F", dark: "#08503A", light: "#E3F4EC" },
        ink: { DEFAULT: "#13222B", soft: "#4A5A64", mute: "#8A979E" },
        paper: "#F6F4EF",
        good: "#1E8E5A",
        bad: "#C8382E",
        warn: "#C98A00",
        gold: "#F2B705",
      },
    },
  },
  plugins: [],
};
