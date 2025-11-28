/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        confed: {
          UEFA: "#dbeafe",
          CONMEBOL: "#ffedd5",
          CONCACAF: "#fef9c3",
          CAF: "#dcfce7",
          AFC: "#fef2f2",
          OFC: "#e0f2fe",
        },
      },
    },
  },
  plugins: [],
};
