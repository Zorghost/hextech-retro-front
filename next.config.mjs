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

const assetVersion =
  process.env.NEXT_PUBLIC_ASSET_VERSION ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  null;

const nextConfig = {
  env: assetVersion ? { NEXT_PUBLIC_ASSET_VERSION: assetVersion } : {},
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    deviceSizes: [360, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 256, 384],
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

    /** @type {import('next').Header[]} */
    const longCacheHeaders = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ];

    return [
      {
        source: "/_next/static/:path*",
        headers: [...baseHeaders, ...longCacheHeaders],
      },
      {
        source: "/icons/:path*",
        headers: [...baseHeaders, ...longCacheHeaders],
      },
      {
        source: "/category/:path*",
        headers: [...baseHeaders, ...longCacheHeaders],
      },
      {
        source: "/game/:path*",
        headers: [...baseHeaders, ...longCacheHeaders],
      },
      {
        source: "/page/:path*",
        headers: [...baseHeaders, ...longCacheHeaders],
      },
      {
        source: "/slide/:path*",
        headers: [...baseHeaders, ...longCacheHeaders],
      },
      {
        source: "/favicon.ico",
        headers: [...baseHeaders, ...longCacheHeaders],
      },
      {
        source: "/(.*)",
        headers: baseHeaders,
      },
    ];
  },
};

export default nextConfig;
