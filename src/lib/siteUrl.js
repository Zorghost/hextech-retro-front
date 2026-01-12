export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_WEBSITE_URL ||
    process.env.NEXT_PUBLIC_WEBSITE_URL;

  const fallback = "https://mywebsite.com";

  if (!raw) return fallback;

  try {
    return new URL(raw).origin;
  } catch {
    return fallback;
  }
}
