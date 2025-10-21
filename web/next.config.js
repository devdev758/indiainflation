/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Ignore all lint & type errors in build
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Don’t attempt to prerender robots.txt or sitemap.xml
  exportPathMap: async function () {
    return {
      "/": { page: "/" },
    };
  },

  // Redirects and rewrites
  async redirects() {
    return [
      { source: "/blog", destination: "/articles", permanent: true }
    ];
  },

  async rewrites() {
    return [
      { source: "/articles/:slug", destination: "/:slug" }
    ];
  },

  // Graceful headers for text routes
  async headers() {
    return [
      {
        source: "/robots.txt",
        headers: [{ key: "Content-Type", value: "text/plain" }],
      },
      {
        source: "/sitemap.xml",
        headers: [{ key: "Content-Type", value: "application/xml" }],
      },
    ];
  },
};

module.exports = nextConfig;
