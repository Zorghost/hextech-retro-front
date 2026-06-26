export function safeJsonLdStringify(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function normalizeMetaText(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function trimMetaText(value, maxLength = 160) {
  const normalized = normalizeMetaText(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const sliced = normalized.slice(0, Math.max(0, maxLength - 1)).replace(/\s+\S*$/, "").trim();
  return `${sliced || normalized.slice(0, maxLength - 1).trim()}…`;
}

export function buildMetaDescription(primary, supplements = [], fallback = "") {
  const normalizedPrimary = normalizeMetaText(primary);
  const normalizedFallback = normalizeMetaText(fallback);
  const normalizedSupplements = Array.isArray(supplements)
    ? supplements.map((value) => normalizeMetaText(value)).filter(Boolean)
    : [];

  let composed = normalizedPrimary;

  if (composed.length < 150) {
    for (const supplement of normalizedSupplements) {
      composed = composed ? `${composed} ${supplement}` : supplement;

      if (composed.length >= 150) {
        break;
      }
    }
  }

  if (composed.length < 150 && normalizedFallback && normalizedFallback !== composed) {
    composed = composed ? `${composed} ${normalizedFallback}` : normalizedFallback;
  }

  return trimMetaText(composed || normalizedFallback || normalizedPrimary);
}

export function buildBreadcrumbJsonLd(items, siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.href, siteUrl).href,
    })),
  };
}
