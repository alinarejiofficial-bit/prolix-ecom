"use client";
import React, { useState, useMemo, useEffect } from "react";
import Slider1 from "../sliders/Slider1";
import ColorSelect from "../ColorSelect";
import SizeSelect from "../SizeSelect";
import QuantitySelect from "../QuantitySelect";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContextElement } from "@/context/Context";
import { useStoreConfig } from "@/context/StoreConfigContext";
import ProductStikyBottom from "../ProductStikyBottom";
import PincodeEstimator from "./PincodeEstimator";
import {
  mapToWobcartItem,
  openWobcartCheckout,
} from "@/utils/wobcartCheckout";
import { getColorVariantImage, PLACEHOLDER_IMAGE, resolveMediaUrl } from "@/utils/productImages";
import { getVariantQuantityLimits, clampQuantity } from "@/utils/variants";
import { BRAND_NAME, resolveBrandName } from "@/utils/brand";
import { formatInr } from "@/utils/formatPrice";

// Get YouTube video ID from URL or raw ID (supports watch, shorts, embed, youtu.be)
function getYoutubeVideoId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== "string") return null;
  const s = urlOrId.trim();
  const match = s.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  if (s.length === 11 && /^[a-zA-Z0-9_-]+$/.test(s)) return s;
  return null;
}

export default function Details1({ product }) {
  const router = useRouter();
  const { isModuleEnabled, branding } = useStoreConfig();
  // Get API product data
  const apiProduct = product?.apiProduct || product;
  const options = apiProduct?.options || [];
  const variants = apiProduct?.variants || [];
  const returnPolicyDays = apiProduct?.return_policy_days && apiProduct.return_policy_days !== "" ? apiProduct.return_policy_days : null;

  // Find option names (Size, Color/Colour, etc.)
  const sizeOption = options.find(opt => opt.name.toLowerCase() === 'size');
  const colorOption = options.find(opt => opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour');

  // Get available values for each option
  const sizeValues = sizeOption?.values || [];
  const colorValues = colorOption?.values || [];

  // Initialize selected options from first variant or defaults
  const firstVariant = variants.length > 0 ? variants[0] : null;
  const initialSize = firstVariant?.options?.Size || firstVariant?.options?.size || (sizeValues.length > 0 ? sizeValues[0] : "");
  const initialColor = firstVariant?.options?.Colour || firstVariant?.options?.Color || firstVariant?.options?.color || (colorValues.length > 0 ? colorValues[0] : "");

  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [activeColor, setActiveColor] = useState(initialColor?.toLowerCase() || "gray");
  const [quantity, setQuantity] = useState(1);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // YouTube video ID from product youtube_video_url (only when API provides a URL)
  const youtubeVideoId = useMemo(() => {
    const urlOrId = apiProduct?.youtube_video_url;
    return getYoutubeVideoId(urlOrId);
  }, [apiProduct?.youtube_video_url]);

  // Find current variant based on selected options
  const currentVariant = useMemo(() => {
    if (!variants.length) return null;

    // Find variant that matches all selected options
    return variants.find(variant => {
      const variantOptions = variant.options || {};
      let matches = true;

      if (sizeOption && selectedSize) {
        const variantSize = variantOptions[sizeOption.name] || variantOptions[sizeOption.name.toLowerCase()];
        matches = matches && (variantSize === selectedSize);
      }

      if (colorOption && selectedColor) {
        const variantColor = variantOptions[colorOption.name] || variantOptions[colorOption.name.toLowerCase()];
        matches = matches && (variantColor === selectedColor);
      }

      return matches;
    }) || variants[0]; // Fallback to first variant if no match
  }, [variants, selectedSize, selectedColor, sizeOption, colorOption]);

  // Get current product data (price, image, name) from selected variant
  const currentProductData = useMemo(() => {
    if (currentVariant) {
      const price = parseFloat(currentVariant.price) || parseFloat(currentVariant.selling_price) || parseFloat(apiProduct?.selling_price) || 0;
      const compareAt = parseFloat(currentVariant.compare_at_price) || parseFloat(currentVariant.mrp);
      const sellingPrice = parseFloat(currentVariant.selling_price) || price;
      const mrp = parseFloat(currentVariant.mrp) || compareAt;
      const oldPrice = (compareAt > price ? compareAt : null) ?? (mrp > sellingPrice ? mrp : (parseFloat(apiProduct?.mrp) > parseFloat(apiProduct?.selling_price) ? parseFloat(apiProduct?.mrp) : null));
      const stockQty = currentVariant.stock_qty ?? 0;
      const isInStock = currentVariant.is_in_stock ?? (stockQty > 0);
      const prebookingAvailable = isModuleEnabled("prebooking_deposits") && (currentVariant.prebooking_available ?? false);
      const orderable = currentVariant.orderable ?? (isInStock || prebookingAvailable);
      return {
        price,
        oldPrice,
        image: resolveMediaUrl(currentVariant.image) || resolveMediaUrl(apiProduct?.thumbnail) || resolveMediaUrl(apiProduct?.images?.[0]) || PLACEHOLDER_IMAGE,
        name: currentVariant.name || apiProduct?.name,
        sku: currentVariant.sku || "",
        stockQty,
        isInStock,
        prebookingAvailable,
        orderable,
        offerPercentage: currentVariant.offer_percentage || apiProduct?.offer_percentage || null,
      };
    }

    // Fallback to product data
    return {
      price: product?.price || 0,
      oldPrice: product?.oldPrice || null,
      image: (product?.imgSrc || resolveMediaUrl(apiProduct?.thumbnail) || resolveMediaUrl(apiProduct?.images?.[0])) || PLACEHOLDER_IMAGE,
      name: product?.name || product?.title,
      sku: "",
      stockQty: 0,
      isInStock: false,
      prebookingAvailable: false,
      orderable: false,
      offerPercentage: apiProduct?.offer_percentage || null,
    };
  }, [currentVariant, apiProduct, product]);

  const quantityLimits = useMemo(
    () => getVariantQuantityLimits(currentVariant),
    [currentVariant],
  );

  useEffect(() => {
    if (!currentVariant) return;
    setQuantity((current) => clampQuantity(current, quantityLimits));
  }, [currentVariant?.uuid, quantityLimits.maxQuantity, currentVariant]);

  // Get images for slider (variant image + product images)
  const productImages = useMemo(() => {
    const images = [];
    const colorValue = selectedColor?.toLowerCase().replace(/\s+/g, '-') || 'gray';

    // Priority: variant image first, then product images, then thumbnail
    // Add variant image first if available (this will be the main image)
    const variantImageUrl = resolveMediaUrl(currentVariant?.image);
    if (variantImageUrl) {
      images.push({
        id: 1,
        color: colorValue,
        src: variantImageUrl,
        alt: currentProductData.name || '',
        width: 600,
        height: 800,
      });
    }

    // Add product images (but skip if it's the same as variant image)
    if (apiProduct?.images && apiProduct.images.length > 0) {
      apiProduct.images.forEach((img) => {
        const imageUrl = resolveMediaUrl(img);
        if (imageUrl && !images.find((i) => i.src === imageUrl)) {
          images.push({
            id: images.length + 1,
            color: colorValue,
            src: imageUrl,
            alt: currentProductData.name || "",
            width: 600,
            height: 800,
          });
        }
      });
    }

    // Fallback to thumbnail if no images yet
    const thumbnailUrl = resolveMediaUrl(apiProduct?.thumbnail);
    if (images.length === 0 && thumbnailUrl) {
      images.push({
        id: 1,
        color: colorValue,
        src: thumbnailUrl,
        alt: currentProductData.name || '',
        width: 600,
        height: 800,
      });
    }

    // Ensure at least placeholder when no images
    if (images.length === 0) {
      images.push({
        id: 1,
        color: colorValue,
        src: PLACEHOLDER_IMAGE,
        alt: currentProductData.name || 'Product',
        width: 600,
        height: 800,
      });
    }

    return images;
  }, [currentVariant, apiProduct, selectedColor, currentProductData.name]);

  // Get the main image URL (first image from productImages or variant image)
  const mainImageUrl = useMemo(() => {
    const url = currentProductData.image || (productImages.length > 0 ? productImages[0].src : '');
    return (url && url.trim()) ? url : PLACEHOLDER_IMAGE;
  }, [currentProductData.image, productImages]);

  const {
    addProductToCart,
    isAddedToCartProducts,
    addToWishlist,
    isAddedtoWishlist,
    cartProducts,
    updateQuantity,
  } = useContextElement();

  // Handle size change
  const handleSizeChange = (size) => {
    setSelectedSize(size);
  };

  // Handle color change
  const handleColorChange = (color) => {
    setSelectedColor(color);
    setActiveColor(color?.toLowerCase() || "gray");
  };

  // Get variant image for each color value
  const getVariantImageForColor = (colorValue, colorIndex) =>
    getColorVariantImage(apiProduct, colorOption, colorValue, colorIndex);

  return (
    <section className="flat-spacing wc-pdp">
      <div className="tf-main-product section-image-zoom">
        <div className="container">
          <div className="row">
            {/* Product default */}
            <div className="col-md-6">
              <div className="tf-product-media-wrap sticky-top">
                <button
                  type="button"
                  className={`product-wishlist-float ${
                    isAddedtoWishlist(product.id || product.uuid) ? "wishlisted" : ""
                  }`}
                  onClick={() => addToWishlist(product.id || product.uuid)}
                  aria-label={
                    isAddedtoWishlist(product.id || product.uuid)
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                  }
                  title={
                    isAddedtoWishlist(product.id || product.uuid)
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                  }
                >
                  <span className="icon icon-heart" />
                </button>
                <Slider1
                  key={`${currentVariant?.uuid || 'default'}-${selectedColor}-${selectedSize}`}
                  setActiveColor={setActiveColor}
                  activeColor={activeColor}
                  firstItem={mainImageUrl}
                  slideItems={productImages}
                />
              </div>
            </div>
            {/* /Product default */}
            {/* tf-product-info-list */}
            <div className="col-md-6">
              <div className="tf-product-info-wrap position-relative mw-100p-hidden ">
                <div className="tf-zoom-main" />
                <div className="tf-product-info-list other-image-zoom">
                  <div className="tf-product-info-heading">
                    <div className="tf-product-info-name">
                      <div className="text text-caption-1">
                        {apiProduct?.category?.name || "Product"}
                      </div>
                      <h3 className="name">{currentProductData.name || product?.title || product?.name}</h3>
                      <div className="sub">
                        {isModuleEnabled("product_reviews") && (
                          <div className="tf-product-info-rate">
                            <div className="list-star">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <i
                                  key={star}
                                  className={`icon icon-star ${star <= Math.round(apiProduct?.rating || product?.rating || 0)
                                    ? "active"
                                    : ""
                                    }`}
                                />
                              ))}
                            </div>
                            <div className="text text-caption-1">
                              ({apiProduct?.ratings_summary?.total || 0} reviews)
                            </div>
                          </div>
                        )}
                        {(currentProductData.stockQty > 0 || (currentProductData.prebookingAvailable && !currentProductData.isInStock)) && (
                          <div className="tf-product-info-sold">
                            <i className="icon icon-lightning" />
                            <div className="text text-caption-1">
                              {currentProductData.stockQty > 0
                                ? "In Stock"
                                : "Prebooking available"}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="tf-product-info-desc">
                      <div className="tf-product-info-price">
                        <h5 className="price-on-sale font-2">
                          {formatInr(currentProductData.price)}
                        </h5>
                        {currentProductData.oldPrice ? (
                          <>
                            <div className="compare-at-price font-2">
                              {formatInr(currentProductData.oldPrice)}
                            </div>
                            {/* Offer percentage badge hidden */}
                            {false && (
                              <div className="badges-on-sale text-btn-uppercase">
                                {currentProductData.offerPercentage
                                  ? `-${currentProductData.offerPercentage}%`
                                  : `-${Math.round(((currentProductData.oldPrice - currentProductData.price) / currentProductData.oldPrice) * 100)}%`}
                              </div>
                            )}
                          </>
                        ) : (
                          ""
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="tf-product-info-choose-option">
                    {/* Product video - above variants, only when youtube_video_url is set */}
                    {youtubeVideoId && (
                      <div className="tf-product-info-video mb_20">
                        <div className="title mb_12">Product video</div>
                        <button
                          type="button"
                          className="tf-product-video-play btn p-0 border-0 bg-transparent position-relative overflow-hidden rounded"
                          style={{ maxWidth: 280 }}
                          onClick={() => setVideoModalOpen(true)}
                          aria-label="Play product video"
                        >
                          <img
                            src={`https://img.youtube.com/vi/${youtubeVideoId}/mqdefault.jpg`}
                            alt="Product video thumbnail"
                            className="w-100 h-auto d-block"
                            style={{ aspectRatio: "16/9" }}
                          />
                          <span
                            className="position-absolute top-50 start-50 translate-middle d-flex align-items-center justify-content-center rounded-circle bg-dark bg-opacity-75 text-white"
                            style={{ width: 64, height: 64 }}
                          >
                            <svg
                              width="28"
                              height="28"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="flex-shrink-0"
                              style={{ marginLeft: "4px" }}
                              aria-hidden
                            >
                              <path d="M8 5v14l11-7L8 5z" />
                            </svg>
                          </span>
                        </button>
                      </div>
                    )}
                    {colorOption && colorValues.length > 0 && (
                      <ColorSelect
                        setActiveColor={handleColorChange}
                        activeColor={selectedColor}
                        colorOptions={colorValues.map((color, index) => ({
                          id: `values-${color.toLowerCase().replace(/\s+/g, '-')}`,
                          value: color,
                          color: color.toLowerCase().replace(/\s+/g, '-'),
                          image: getVariantImageForColor(color, index),
                        }))}
                      />
                    )}
                    {sizeOption && sizeValues.length > 0 && (
                      <SizeSelect
                        selectedSize={selectedSize}
                        setSelectedSize={handleSizeChange}
                        sizeOptions={sizeValues.map((size, index) => ({
                          id: `values-${size.toLowerCase()}`,
                          value: size,
                          disabled: false,
                        }))}
                        variants={variants}
                        sizeOptionName={sizeOption.name}
                      />
                    )}
                    <div className="tf-product-info-quantity">
                      <div className="title mb_12">Quantity:</div>
                      <QuantitySelect
                        quantity={
                          isAddedToCartProducts(product.id || product.uuid)
                            ? cartProducts.filter(
                              (elm) => (elm.id == product.id || elm.id == product.uuid)
                            )[0]?.quantity || 1
                            : quantity
                        }
                        setQuantity={(qty) => {
                          const productId = product.id || product.uuid;
                          if (isAddedToCartProducts(productId)) {
                            updateQuantity(productId, qty);
                          } else {
                            setQuantity(qty);
                          }
                        }}
                        maxQuantity={quantityLimits.maxQuantity}
                        minQuantity={quantityLimits.minQuantity}
                      />
                    </div>
                    <div>
                      <div className="tf-product-info-by-btn mb_10 product-cta-stack">
                        <a
                          onClick={async () => {
                            if (!currentProductData.orderable) return;

                            // Ensure we have a variant before proceeding
                            if (!currentVariant || !currentVariant.uuid) {
                              alert("Please select a variant before adding to cart");
                              return;
                            }

                            const productToAdd = {
                              ...product,
                              id: product.id || product.uuid,
                              uuid: product.uuid || product.id,
                              price: currentProductData.price,
                              variant: currentVariant,
                              selectedVariant: currentVariant,
                              selectedSize,
                              selectedColor,
                              apiProduct: apiProduct,
                              product_id: apiProduct?.uuid,
                              variant_id: currentVariant.uuid,
                            };
                            try {
                              const orderQty = clampQuantity(quantity, quantityLimits);
                              await addProductToCart(
                                productToAdd.id || productToAdd.uuid,
                                orderQty,
                                productToAdd,
                              );
                            } catch (error) {
                              // Error is already handled in Context
                            }
                          }}
                          className="btn-style-2 fw-6 btn-add-to-cart"
                          style={{
                            cursor: currentProductData.orderable ? 'pointer' : 'not-allowed',
                            opacity: currentProductData.orderable ? 1 : 0.6
                          }}
                        >
                          <span>
                            {!currentProductData.orderable
                              ? "Out of Stock"
                              : isAddedToCartProducts(product.id || product.uuid)
                                ? "Already Added"
                                : currentProductData.prebookingAvailable && !currentProductData.isInStock
                                  ? "Prebook — add to cart"
                                  : "Add to cart"}
                          </span>
                          {currentProductData.orderable && (
                            <span className="tf-qty-price total-price">
                              {formatInr(
                                isAddedToCartProducts(product.id || product.uuid)
                                  ? currentProductData.price *
                                    (cartProducts.filter(
                                      (elm) => elm.id == product.id || elm.id == product.uuid,
                                    )[0]?.quantity || 1)
                                  : currentProductData.price * quantity,
                              )}
                            </span>
                          )}
                        </a>
                        <a
                          onClick={async (e) => {
                            e.preventDefault();
                            if (!currentProductData.orderable) return;

                            if (!currentVariant || !currentVariant.uuid) {
                              alert("Please select a variant before buying");
                              return;
                            }

                            try {
                              const orderQty = clampQuantity(quantity, quantityLimits);
                              if (isModuleEnabled("wobcart_checkout")) {
                                await openWobcartCheckout(
                                  [
                                    mapToWobcartItem(
                                      currentVariant.uuid,
                                      orderQty,
                                      currentProductData.prebookingAvailable &&
                                        !currentProductData.isInStock,
                                    ),
                                  ],
                                  { express: true },
                                );
                              } else {
                                const productToAdd = {
                                  ...product,
                                  id: product.id || product.uuid,
                                  uuid: product.uuid || product.id,
                                  price: currentProductData.price,
                                  variant: currentVariant,
                                  selectedVariant: currentVariant,
                                  selectedSize,
                                  selectedColor,
                                  apiProduct: apiProduct,
                                  product_id: apiProduct?.uuid,
                                  variant_id: currentVariant.uuid,
                                };
                                await addProductToCart(
                                  productToAdd.id || productToAdd.uuid,
                                  orderQty,
                                  productToAdd,
                                  false,
                                );
                                router.push("/checkout");
                              }
                            } catch (error) {
                              alert(error.message || "Unable to open checkout");
                            }
                          }}
                          href="#"
                          className="btn-style-3"
                          style={{
                            cursor: currentProductData.orderable ? 'pointer' : 'not-allowed',
                            opacity: currentProductData.orderable ? 1 : 0.6
                          }}
                        >
                          {currentProductData.orderable && !currentProductData.isInStock && currentProductData.prebookingAvailable
                            ? "Prebook now"
                            : "Buy it now"}
                        </a>
                      </div>
                    </div>
                    <PincodeEstimator />
                    <div className="tf-product-info-help">
                      <div className="tf-product-info-time">
                        <div className="icon">
                          <i className="icon-timer" />
                        </div>
                        <p className="text-caption-1">
                          Express Delivery:&nbsp;&nbsp;<span>1-5 days</span>
                        </p>
                      </div>
                      {returnPolicyDays && (
                        <div className="tf-product-info-return">
                          <div className="icon">
                            <i className="icon-arrowClockwise" />
                          </div>
                          <p className="text-caption-1">
                            Return within <span>{returnPolicyDays} {String(returnPolicyDays) === "1" ? "day" : "days"}</span> of purchase. Duties
                            &amp; taxes are non-refundable.
                          </p>
                        </div>
                      )}
                    </div>
                    <ul className="tf-product-info-sku">
                      <li>
                        <p className="text-caption-1">SKU:</p>
                        <p className="text-caption-1 text-1">{currentProductData.sku || "N/A"}</p>
                      </li>
                      {apiProduct?.business && (
                        <li>
                          <p className="text-caption-1">Vendor:</p>
                          <p className="text-caption-1 text-1">
                            {resolveBrandName(apiProduct.business.name) || branding?.companyName || BRAND_NAME}
                          </p>
                        </li>
                      )}
                      <li>
                        <p className="text-caption-1">Available:</p>
                        <p className="text-caption-1 text-1">
                          {currentProductData.stockQty > 0
                            ? "In Stock"
                            : currentProductData.prebookingAvailable
                              ? "Prebooking available"
                              : "Out of Stock"}
                        </p>
                      </li>
                      {apiProduct?.category && (
                        <li>
                          <p className="text-caption-1">Categories:</p>
                          <p className="text-caption-1">
                            <a href="#" className="text-1 link">
                              {apiProduct.category.name}
                            </a>
                          </p>
                        </li>
                      )}
                    </ul>
                    <div className="tf-product-info-guranteed">
                      <div className="text-title">Guaranteed safe checkout:</div>
                      <div className="tf-payment">
                        <Image
                          alt="Razorpay"
                          src="/images/logo/razorpay.png"
                          width={150}
                          height={50}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /tf-product-info-list */}
          </div>
        </div>
      </div>
      {/* YouTube video modal - only when product has youtube_video_url */}
      {videoModalOpen && youtubeVideoId && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ zIndex: 1060, background: "rgba(0,0,0,0.75)" }}
          onClick={() => setVideoModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Product video"
        >
          <div
            className="position-relative bg-black rounded overflow-hidden shadow"
            style={{ maxWidth: 900, width: "100%", aspectRatio: "16/9" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="position-absolute top-0 end-0 m-2 btn btn-light btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center"
              style={{ width: 36, height: 36, zIndex: 2 }}
              onClick={() => setVideoModalOpen(false)}
              aria-label="Close video"
            >
              <i className="icon icon-close" />
            </button>
            <iframe
              title="Product video"
              src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1`}
              className="w-100 h-100 border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
      <ProductStikyBottom />
    </section>
  );
}
