/** @type {import('next').NextConfig} */
function tryHostname(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.hostname;
  } catch {
    return null;
  }
}

const remoteHostnames = new Set([
  "d1geqzmavzu3y.cloudfront.net",
  // DigitalOcean Spaces (origin) and Spaces CDN
  "**.digitaloceanspaces.com",
  "**.cdn.digitaloceanspaces.com",
]);

for (const envName of [
  "NEXT_PUBLIC_GAME_THUMBNAIL_BASE_URL",
  "NEXT_PUBLIC_CATEGORY_IMAGE_BASE_URL",
  "NEXT_PUBLIC_ROM_BASE_URL",
  "NEXT_PUBLIC_IMAGE_SOURCE",
]) {
  const hostname = tryHostname(process.env[envName]);
  if (hostname) remoteHostnames.add(hostname);
}

const nextConfig = {
  images: {
    remotePatterns: Array.from(remoteHostnames).map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
};

export default nextConfig;
