/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Lint runs as its own CI step; don't let ESLint warnings fail the
  // production build (e.g. inside the Docker image build).
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
