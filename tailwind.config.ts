import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#000000",
        surface: "#111111",
        "surface-raised": "#1A1A1A",
        border: "#222222",
        "border-visible": "#333333",
        "text-disabled": "#666666",
        "text-secondary": "#999999",
        "text-primary": "#E8E8E8",
        "text-display": "#FFFFFF",
        accent: "#D71921",
        "accent-subtle": "rgba(215,25,33,0.15)",
        success: "#4A9E5C",
        warning: "#D4A843",
        interactive: "#5B9BF6",
      },
      fontFamily: {
        display: ['"Space Mono"', "monospace"],
        body: ['"Space Grotesk"', "system-ui", "sans-serif"],
        data: ['"Space Mono"', "monospace"],
      },
      maxWidth: {
        xs: "20rem",   // 320px
        sm: "24rem",   // 384px
        md: "28rem",   // 448px
        lg: "32rem",   // 512px
        xl: "36rem",   // 576px
        "2xl": "42rem", // 672px
        "3xl": "48rem", // 768px
        "4xl": "56rem", // 896px
      },
      fontSize: {
        "display-xl": ["72px", { lineHeight: "1", letterSpacing: "-0.03em" }],
        "display-lg": ["48px", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-md": ["36px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        heading: ["24px", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        subheading: ["18px", { lineHeight: "1.3", letterSpacing: "0" }],
        body: ["16px", { lineHeight: "1.5", letterSpacing: "0" }],
        "body-sm": ["14px", { lineHeight: "1.5", letterSpacing: "0.01em" }],
        caption: ["12px", { lineHeight: "1.4", letterSpacing: "0.04em" }],
        label: ["11px", { lineHeight: "1.2", letterSpacing: "0.08em" }],
      },
    },
  },
  plugins: [],
};

export default config;