import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  poweredByHeader: false,
  // Шрифты для картинок Open Graph читаются с диска во время запроса
  outputFileTracingIncludes: { "/**/opengraph-image": ["./assets/fonts/*"] },
  async headers() {
    return [
      {
        source: "/(admin|result)/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
