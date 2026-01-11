function stripTrailingSlash(value) {
  return value?.endsWith("/") ? value.slice(0, -1) : value;
}

function joinUrl(base, path) {
  const normalizedBase = stripTrailingSlash(base);
  const normalizedPath = path?.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function getRomUrl(filename) {
  const base = process.env.NEXT_PUBLIC_ROM_BASE_URL;
  if (base) return joinUrl(base, encodeURIComponent(filename));
  return `/${encodeURIComponent(filename)}`;
}

// Same as getRomUrl, but allows passing a base URL at runtime (e.g. from a Server Component).
export function getRomUrlWithBase(filename, base) {
  if (base) return joinUrl(base, encodeURIComponent(filename));
  return `/${encodeURIComponent(filename)}`;
}

export function getGameThumbnailUrl(filename) {
  const base = process.env.NEXT_PUBLIC_GAME_THUMBNAIL_BASE_URL;
  if (base) return joinUrl(base, encodeURIComponent(filename));
  return `/game/${encodeURIComponent(filename)}`;
}

export function getCategoryImageUrl(filename) {
  const base = process.env.NEXT_PUBLIC_CATEGORY_IMAGE_BASE_URL;
  if (base) return joinUrl(base, encodeURIComponent(filename));
  return `/category/${encodeURIComponent(filename)}`;
}
