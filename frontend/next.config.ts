import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Security Headers ──────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },

  // ── Image Optimization ────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "**" },
    ],
    loader: "custom",
    loaderFile: "./src/lib/cloudinary-loader.ts",
  },

  // ── Server External Packages (Next.js 15+) ───────────────
  serverExternalPackages: ["mongoose", "bcryptjs", "nodemailer"],

  // ── Turbopack config (suppresses webpack/turbopack mismatch warning) ──
  turbopack: {},

  // ── Build Output ─────────────────────────────────────────
  output: "standalone",
  compress: true,

  // ── TypeScript & ESLint (moved to turbopack era) ─────────
  typescript: {
    ignoreBuildErrors: true,
  },
  // ── Dev Indicators (Next.js 16) ─────────────────────────────
  devIndicators: false as any,

};

export default nextConfig;
