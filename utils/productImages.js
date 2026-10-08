export const PLACEHOLDER_IMAGE = "/images/avatar/accessories.jpg";

export function resolveMediaUrl(media) {
  if (!media) return null;
  if (typeof media === "string") {
    const trimmed = media.trim();
    return trimmed || null;
  }
  return media.url || media.file_url || null;
}

function getVariantOptionValue(variantOptions, optionName) {
  if (!optionName || !variantOptions) return null;
  return (
    variantOptions[optionName] ??
    variantOptions[optionName.toLowerCase()] ??
    variantOptions[optionName.charAt(0).toUpperCase() + optionName.slice(1).toLowerCase()] ??
    null
  );
}

function findVariantsForColor(variants, colorOption, colorValue) {
  if (!colorOption || !colorValue || !variants?.length) return [];

  return variants.filter((variant) => {
    const variantColor = getVariantOptionValue(variant.options || {}, colorOption.name);
    return variantColor === colorValue;
  });
}

function resolveListingVariantImage(apiProduct, colorIndex) {
  const thumbnail = resolveMediaUrl(apiProduct?.thumbnail);
  const gallery = (apiProduct?.images || []).map(resolveMediaUrl).filter(Boolean);
  const variants = apiProduct?.variants || [];

  const mediaIds = [...new Set(variants.map((v) => v.image_media_id).filter(Boolean))];
  const mediaId = mediaIds[colorIndex];

  if (mediaId) {
    if (apiProduct?.thumbnail?.id === mediaId) return thumbnail;
    if (gallery[colorIndex]) return gallery[colorIndex];
  }

  if (gallery[colorIndex]) return gallery[colorIndex];

  return thumbnail || gallery[0] || null;
}

export function getColorVariantImage(apiProduct, colorOption, colorValue, colorIndex = 0) {
  const variants = apiProduct?.variants || [];
  const matchingVariants = findVariantsForColor(variants, colorOption, colorValue);

  for (const variant of matchingVariants) {
    const variantImage = resolveMediaUrl(variant.image);
    if (variantImage) return variantImage;
  }

  const gallery = (apiProduct?.images || []).map(resolveMediaUrl).filter(Boolean);
  if (gallery[colorIndex]) return gallery[colorIndex];

  const listingImage = resolveListingVariantImage(apiProduct, colorIndex);
  if (listingImage) return listingImage;

  return resolveMediaUrl(apiProduct?.thumbnail) || gallery[0] || PLACEHOLDER_IMAGE;
}
