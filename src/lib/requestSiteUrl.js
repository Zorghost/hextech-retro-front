import { headers } from "next/headers";
import { getSiteUrl } from "@/lib/siteUrl";

function buildUrlFromHeaders() {
  const headerList = headers();
  const forwardedHost = headerList.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headerList.get("host");

  if (!host) {
    return null;
  }

  const proto = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";

  return `${proto}://${host}`;
}

function buildHostFromUrl(siteUrl) {
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return null;
  }
}

export function getRequestSiteUrl() {
  return buildUrlFromHeaders() || getSiteUrl();
}

export function getRequestHost() {
  const siteUrl = getRequestSiteUrl();
  return buildHostFromUrl(siteUrl);
}