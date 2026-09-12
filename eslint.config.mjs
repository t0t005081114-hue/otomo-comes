import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "playwright-report/**",
      "test-results/**",
      "supabase/.temp/**",
    ],
  },
];

export default eslintConfig;
