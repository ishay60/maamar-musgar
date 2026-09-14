/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // The events API reads data/historical-events.json at runtime; make sure it ships.
    outputFileTracingIncludes: { "/api/admin/events": ["./data/**"] },
  },
};

export default nextConfig;
