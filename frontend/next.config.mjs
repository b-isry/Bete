/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Local MinIO public bucket — property images uploaded via /uploads/presign.
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/bete/public/**",
      },
    ],
  },
};

export default nextConfig;
