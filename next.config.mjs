/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  typedRoutes: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
