/** @type {import('next').NextConfig} */
const nextConfig = {
    // Set only by `npm run verify`, so a build check never writes into the
    // same .next the dev server is using — that collision has broken the
    // dev server twice.
    ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default nextConfig;
