/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone output for Azure App Service (only in CI — symlinks fail on Windows)
  ...(process.env.STANDALONE === "true" ? { output: "standalone" } : {}),
  transpilePackages: [
    "@mysuperapp/ui",
    "@mysuperapp/core",
    "@mysuperapp/database",
  ],
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Exclude problematic packages from client bundle
    serverComponentsExternalPackages: ["@libsql/client", "libsql"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't include these packages in client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
