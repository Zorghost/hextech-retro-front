export function safeJsonLdStringify(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
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
