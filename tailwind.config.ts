import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#171412",
        paper: "#fbfaf4",
        line: "#e7e0d0",
        muted: "#6b6356",
      },
      fontFamily: {
        hebrew: ['"David Libre"', '"Frank Ruhl Libre"', "Times New Roman", "serif"],
      },
      keyframes: {
        solvePop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "70%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-5px)" },
          "40%, 80%": { transform: "translateX(5px)" },
        },
        confetti: {
          "0%": { transform: "translate(0,0) rotate(0deg)", opacity: "1" },
          "100%": {
            transform:
              "translate(var(--cx,0px), var(--cy,-180px)) rotate(var(--cr,360deg))",
            opacity: "0",
          },
        },
      },
      animation: {
        solvePop: "solvePop 320ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        shake: "shake 260ms ease-in-out",
        confetti: "confetti 1200ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
