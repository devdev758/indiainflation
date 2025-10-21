/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

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

  // Prevent Next.js static export from failing on /robots.txt
  async headers() {
    return [
      {
        source: "/robots.txt",
        headers: [
          { key: "Content-Type", value: "text/plain" }
        ]
      }
    ];
  },

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }
};

module.exports = nextConfig;
