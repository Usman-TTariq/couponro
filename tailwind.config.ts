import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Force palette classes into CSS so they always apply
    { pattern: /(bg|text|border|ring|from|to|placeholder)-((lobster|almond|rebecca|soft-cyan|space)(\/[0-9]+)?)/ },
    "hover:text-lobster",
  ],
  theme: {
    extend: {
      colors: {
        lobster: "#DB5461",
        almond: "#FFD9CE",
        rebecca: "#593C8F",
        "soft-cyan": "#8EF9F3",
        space: "#171738",
      },
    },
  },
  plugins: [],
} satisfies Config;
