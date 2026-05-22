import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        violet: "0 20px 70px rgba(139, 92, 246, 0.18)",
      },
      colors: {
        zivan: {
          ink: "#06050A",
          panel: "#121019",
          panel2: "#191522",
          line: "#2B2238",
          purple: "#8B5CF6",
          lavender: "#C4B5FD",
          soft: "#A78BFA",
        },
      },
    },
  },
  plugins: [],
};

export default config;
