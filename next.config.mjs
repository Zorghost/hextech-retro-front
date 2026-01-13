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
    const isDev = process.env.NODE_ENV !== "production";

    // Note: Next.js injects inline scripts for some features; we allow 'unsafe-inline'
    // to avoid breaking runtime without adding nonces everywhere.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      [
        "script-src",
        "'self'",
        "'unsafe-inline'",
        isDev ? "'unsafe-eval'" : null,
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://cdn.emulatorjs.org",
        "https://*.disqus.com",
        "https://*.disquscdn.com",
      ]
        .filter(Boolean)
        .join(" "),
      [
        "style-src",
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
      ].join(" "),
      [
        "font-src",
        "'self'",
        "data:",
        "https://fonts.gstatic.com",
      ].join(" "),
      [
        "img-src",
        "'self'",
        "data:",
        "blob:",
        "https:",
      ].join(" "),
      [
        "connect-src",
        "'self'",
        "https://www.google-analytics.com",
        "https://region1.google-analytics.com",
        "https://www.googletagmanager.com",
        "https://cdn.emulatorjs.org",
        "https://*.disqus.com",
        "https://*.disquscdn.com",
      ].join(" "),
      [
        "frame-src",
        "'self'",
        "https://*.disqus.com",
        "https://*.disquscdn.com",
      ].join(" "),
      "upgrade-insecure-requests",
    ]
      .filter(Boolean)
      .join("; ");

    const securityHeaders = [
      { key: "Content-Security-Policy", value: csp },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];

    // Only meaningful over HTTPS.
    if (!isDev) {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
