function stripTrailingSlash(value) {
  return value?.endsWith("/") ? value.slice(0, -1) : value;
}

function joinUrl(base, path) {
  const normalizedBase = stripTrailingSlash(base);
  const normalizedPath = path?.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function getAssetVersion() {
  const raw = process.env.NEXT_PUBLIC_ASSET_VERSION;
  const value = typeof raw === "string" ? raw.trim() : "";
  return value.length > 0 ? value : null;
}

function withAssetVersion(url) {
  const version = getAssetVersion();
  if (!version) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

export function getPublicAssetUrl(path) {
  const base = process.env.NEXT_PUBLIC_PUBLIC_ASSET_BASE_URL;
  const url = base ? joinUrl(base, path) : path;
  return withAssetVersion(url);
}

export function getRomUrl(filename) {
  const base = process.env.NEXT_PUBLIC_ROM_BASE_URL;
  if (base) return withAssetVersion(joinUrl(base, encodeURIComponent(filename)));
  return withAssetVersion(`/${encodeURIComponent(filename)}`);
}

// Same as getRomUrl, but allows passing a base URL at runtime (e.g. from a Server Component).
export function getRomUrlWithBase(filename, base) {
  if (base) return withAssetVersion(joinUrl(base, encodeURIComponent(filename)));
  return withAssetVersion(`/${encodeURIComponent(filename)}`);
}

export function getGameThumbnailUrl(filename) {
  const imageSource = (process.env.NEXT_PUBLIC_IMAGE_SOURCE ?? "").toLowerCase();
  if (imageSource === "proxy") return `/api/assets/thumbnail/${encodeURIComponent(filename)}`;
  const base = process.env.NEXT_PUBLIC_GAME_THUMBNAIL_BASE_URL;
  if (base) return withAssetVersion(joinUrl(base, encodeURIComponent(filename)));
  return withAssetVersion(`/game/${encodeURIComponent(filename)}`);
}

export function getCategoryImageUrl(filename) {
  const imageSource = (process.env.NEXT_PUBLIC_IMAGE_SOURCE ?? "").toLowerCase();
  if (imageSource === "proxy") return `/api/assets/category/${encodeURIComponent(filename)}`;
  const base = process.env.NEXT_PUBLIC_CATEGORY_IMAGE_BASE_URL;
  if (base) return withAssetVersion(joinUrl(base, encodeURIComponent(filename)));
  return withAssetVersion(`/category/${encodeURIComponent(filename)}`);
}
