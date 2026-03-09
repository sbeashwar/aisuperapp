/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@mysuperapp/tailwind-config")],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};
