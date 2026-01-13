export function safeJsonLdStringify(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
