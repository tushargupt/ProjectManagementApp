/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  typescript: {
    // This will ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // This will ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  // Maintain your existing configuration below
  experimental: {
    appDir: true
  },
  // Comment out i18n if you're using app directory
  // i18n: {
  //   locales: ["en"],
  //   defaultLocale: "en",
  // },
  transpilePackages: ["geist"],
};

export default config;
