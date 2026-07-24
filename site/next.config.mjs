/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Every page is static (no server actions, no dynamic data fetching) — an
  // export lets nginx serve plain files instead of running a Node process
  // for the marketing site in production.
  output: 'export',
  images: { unoptimized: true },
  // Emits kontakty/index.html instead of kontakty.html — lets nginx serve
  // clean directory-style paths without extension-guessing config.
  trailingSlash: true,
};

export default nextConfig;
