/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    appDir: true
  },
  async redirects() {
    return [
      {
        source: "/blog",
        destination: "/articles",
        permanent: true
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: "/articles/:slug",
        destination: "/:slug"
      }
    ];
  }
};

module.exports = nextConfig;
