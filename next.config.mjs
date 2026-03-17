/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // Only proxy /studio to local Studio in development (live pe localhost nahi hota)
    if (process.env.NODE_ENV === "development") {
      return [
        { source: "/studio", destination: "http://localhost:3333/studio" },
        { source: "/studio/:path*", destination: "http://localhost:3333/studio/:path*" },
      ];
    }
    return [];
  },
};

export default nextConfig;
