export function getSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_SITE_URL,
    process.env.SITE_URL,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_WEBSITE_URL,
    process.env.NEXT_PUBLIC_WEBSITE_URL,
    // Common deployment-provided vars
    process.env.VERCEL_URL,
    process.env.CF_PAGES_URL,
    process.env.APP_URL,
    process.env.DIGITALOCEAN_APP_URL,
  ].filter(Boolean);

  for (const value of candidates) {
    try {
      return new URL(value).origin;
    } catch {
      // Some platforms provide just a hostname (no protocol).
      try {
        return new URL(`https://${value}`).origin;
      } catch {
        // keep trying
      }
    }
  }

  // Safe dev fallback; in production you should set NEXT_PUBLIC_SITE_URL.
  return "http://localhost:3000";
}
