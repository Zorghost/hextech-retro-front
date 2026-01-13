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
  async headers() {
    const isProd = process.env.NODE_ENV === "production";

    /** @type {import('next').Header[]} */
    const baseHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
      },
      isProd
        ? {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          }
        : null,
    ].filter(Boolean);

    return [
      {
        source: "/(.*)",
        headers: baseHeaders,
      },
    ];
  },
};

export default nextConfig;
