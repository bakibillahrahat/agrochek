const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    "postcss-preset-env": {
      features: { "oklch-color": true }, // Ensures oklch colors are transpiled
    },
  },
};

export default config;
