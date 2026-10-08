export const BRAND_NAME = "Prolix";
export const DEFAULT_BRAND_LOGO = "/images/logo/wobcart-logo.png";
export const DEFAULT_BRAND_FAVICON = "/images/logo/prolix-favicon.png";

const LEGACY_BRAND_PATTERN = /lili/i;

export function isLegacyBrandValue(value) {
  return typeof value === "string" && LEGACY_BRAND_PATTERN.test(value);
}

export function sanitizePublicValue(value) {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text || isLegacyBrandValue(text)) return null;
  return text;
}

export function resolveBrandName(name) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed || isLegacyBrandValue(trimmed)) {
    return BRAND_NAME;
  }
  return trimmed;
}

export function resolveBrandLogo(logoUrl, companyName) {
  const url = typeof logoUrl === "string" ? logoUrl.trim() : "";
  if (url && !isLegacyBrandValue(url)) {
    return url;
  }
  if (isLegacyBrandValue(companyName)) {
    return DEFAULT_BRAND_LOGO;
  }
  return url || DEFAULT_BRAND_LOGO;
}

export function resolveBrandFavicon(faviconUrl, companyName) {
  const url = typeof faviconUrl === "string" ? faviconUrl.trim() : "";
  if (url && !isLegacyBrandValue(url)) {
    return url;
  }
  if (isLegacyBrandValue(companyName)) {
    return DEFAULT_BRAND_FAVICON;
  }
  return url || DEFAULT_BRAND_FAVICON;
}
