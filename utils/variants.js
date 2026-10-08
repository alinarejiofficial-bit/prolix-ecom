import { PLACEHOLDER_IMAGE, resolveMediaUrl } from "@/utils/productImages";

export function getVariantOptionValue(variantOptions, optionName) {
  if (!optionName || !variantOptions) return null;
  return (
    variantOptions[optionName] ??
    variantOptions[optionName.toLowerCase()] ??
    variantOptions[optionName.charAt(0).toUpperCase() + optionName.slice(1).toLowerCase()] ??
    null
  );
}

export function variantMatchesSelections(
  variant,
  { sizeOption, selectedSize, colorOption, selectedColor, extraOptions = [], otherOptions = {} },
) {
  const variantOptions = variant?.options || {};
  let matches = true;

  if (sizeOption && selectedSize) {
    matches =
      matches && getVariantOptionValue(variantOptions, sizeOption.name) === selectedSize;
  }

  if (colorOption && selectedColor) {
    matches =
      matches && getVariantOptionValue(variantOptions, colorOption.name) === selectedColor;
  }

  for (const opt of extraOptions) {
    const selected = otherOptions[opt.name];
    if (!selected) continue;
    matches = matches && getVariantOptionValue(variantOptions, opt.name) === selected;
  }

  return matches;
}

export function findVariantsForColor(variants, colorOption, colorValue) {
  if (!colorOption || !colorValue || !variants?.length) return [];

  return variants.filter((variant) => {
    const variantColor = getVariantOptionValue(variant.options || {}, colorOption.name);
    return variantColor === colorValue;
  });
}

function findListingFallbackVariant(
  variants,
  colorOption,
  selectedColor,
  colorValues,
  sizeOption,
  selectedSize,
) {
  if (!variants.length) return null;

  const hasOptions = variants.some((variant) => variant.options && Object.keys(variant.options).length > 0);
  if (hasOptions) return null;

  let colorIndex = colorValues.indexOf(selectedColor);
  if (colorIndex < 0 && selectedColor) colorIndex = 0;

  const mediaIds = [...new Set(variants.map((variant) => variant.image_media_id).filter(Boolean))];
  const targetMediaId = mediaIds[colorIndex];

  let candidates = targetMediaId
    ? variants.filter((variant) => variant.image_media_id === targetMediaId)
    : variants.filter((_, index) => index % Math.max(colorValues.length, 1) === colorIndex);

  if (!candidates.length) {
    candidates = variants[colorIndex] ? [variants[colorIndex]] : [variants[0]];
  }

  if (sizeOption && selectedSize) {
    const sized = candidates.find(
      (variant, index) =>
        getVariantOptionValue(variant.options || {}, sizeOption.name) === selectedSize ||
        index === sizeOption.values?.indexOf(selectedSize),
    );
    if (sized) return sized;
  }

  return candidates[0] || variants[0];
}

export function findMatchingVariant(
  variants,
  { sizeOption, selectedSize, colorOption, selectedColor, colorValues = [], extraOptions = [], otherOptions = {} },
) {
  if (!variants?.length) return null;

  const exact = variants.find((variant) =>
    variantMatchesSelections(variant, {
      sizeOption,
      selectedSize,
      colorOption,
      selectedColor,
      extraOptions,
      otherOptions,
    }),
  );
  if (exact) return exact;

  if (colorOption && selectedColor) {
    const colorVariants = findVariantsForColor(variants, colorOption, selectedColor);
    if (colorVariants.length) {
      if (sizeOption && selectedSize) {
        const sized = colorVariants.find(
          (variant) => getVariantOptionValue(variant.options || {}, sizeOption.name) === selectedSize,
        );
        if (sized) return sized;
      }
      return colorVariants[0];
    }
  }

  return findListingFallbackVariant(
    variants,
    colorOption,
    selectedColor,
    colorValues,
    sizeOption,
    selectedSize,
  );
}

export function getVariantDisplayData(variant, fallback = {}) {
  if (!variant) {
    return {
      price: fallback.price ?? 0,
      oldPrice: fallback.oldPrice ?? null,
      image: fallback.image || PLACEHOLDER_IMAGE,
      orderable: false,
      stockQty: 0,
      isInStock: false,
    };
  }

  const price =
    parseFloat(variant.selling_price) ||
    parseFloat(variant.price) ||
    fallback.price ||
    0;
  const mrp =
    parseFloat(variant.mrp) ||
    parseFloat(variant.compare_at_price) ||
    fallback.oldPrice ||
    null;
  const stockQty = variant.stock_qty ?? 0;
  const isInStock = variant.is_in_stock ?? stockQty > 0;
  const prebooking = variant.prebooking_available ?? false;
  const orderable = variant.orderable ?? (isInStock || prebooking);
  const image =
    resolveMediaUrl(variant.image) ||
    fallback.image ||
    PLACEHOLDER_IMAGE;

  return {
    price,
    oldPrice: mrp && mrp > price ? mrp : null,
    image,
    orderable,
    stockQty,
    isInStock,
  };
}

export function getFirstAvailableSizeForColor(variants, colorOption, colorValue, sizeOption) {
  if (!sizeOption || !colorValue) return null;
  const colorVariants = findVariantsForColor(variants, colorOption, colorValue);
  for (const variant of colorVariants) {
    const size = getVariantOptionValue(variant.options || {}, sizeOption.name);
    if (size) return size;
  }
  return sizeOption.values?.[0] ?? null;
}

const PREBOOKING_MAX_QTY = 99;

export function getVariantQuantityLimits(variant) {
  if (!variant) {
    return {
      minQuantity: 1,
      maxQuantity: 1,
      stockQty: 0,
      isInStock: false,
      orderable: false,
      prebooking: false,
    };
  }

  const stockQty = Math.max(0, variant.stock_qty ?? 0);
  const isInStock = variant.is_in_stock ?? stockQty > 0;
  const prebooking = variant.prebooking_available ?? false;
  const orderable = variant.orderable ?? (isInStock || prebooking);
  const minQuantity = 1;

  let maxQuantity = PREBOOKING_MAX_QTY;
  if (isInStock && stockQty > 0) {
    maxQuantity = stockQty;
  } else if (!orderable) {
    maxQuantity = 0;
  }

  return {
    minQuantity,
    maxQuantity,
    stockQty,
    isInStock,
    orderable,
    prebooking,
  };
}

export function clampQuantity(quantity, limits) {
  const minQuantity = limits?.minQuantity ?? 1;
  const maxQuantity = limits?.maxQuantity ?? PREBOOKING_MAX_QTY;
  if (maxQuantity <= 0) return minQuantity;

  const parsed = parseInt(quantity, 10);
  if (isNaN(parsed) || parsed < minQuantity) return minQuantity;
  return Math.min(parsed, maxQuantity);
}
