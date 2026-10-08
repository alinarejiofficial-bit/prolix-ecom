"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CountdownTimer from "../common/Countdown";
import { useContextElement } from "@/context/Context";
import { formatInr } from "@/utils/formatPrice";

const PLACEHOLDER_IMAGE = "/images/avatar/accessories.jpg";

export default function ProductCard1({
  product,
  gridClass = "",
  parentClass = "card-product wow fadeInUp",
  isNotImageRatio = false,
  radiusClass = "",
  hideAddToCart = false,
}) {
  const imgSrc = product.imgSrc && product.imgSrc.trim() ? product.imgSrc : PLACEHOLDER_IMAGE;
  const imgHover = product.imgHover && product.imgHover.trim() ? product.imgHover : PLACEHOLDER_IMAGE;
  const [currentImage, setCurrentImage] = useState(imgSrc);

  const {
    addToWishlist,
    removeFromWishlist,
    isAddedtoWishlist,
    setQuickViewItem,
    addProductToCart,
    isAddedToCartProducts,
    setVariantModalProduct,
  } = useContextElement();

  const hasVariants = product.hasVariants === true || (product.variants?.length > 1) || (product.options?.length > 0);
  const defaultVariant = product.defaultVariant || (product.variants?.[0]);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasVariants) {
      setVariantModalProduct(product);
      return;
    }
    if (!defaultVariant?.uuid) {
      alert("Product information is missing. Please try again.");
      return;
    }
    const productData = {
      ...product,
      id: product.uuid || product.id,
      uuid: product.uuid,
      apiProduct: product.apiProduct || product,
      variant: defaultVariant,
      selectedVariant: defaultVariant,
      product_id: product.apiProduct?.uuid || product.uuid,
      variant_id: defaultVariant.uuid,
    };
    addProductToCart(product.uuid || product.id, 1, productData, true);
  };

  useEffect(() => {
    setCurrentImage(imgSrc);
  }, [product, imgSrc]);

  // Calculate offer percentage from API data or transformed data
  const getOfferPercentage = () => {
    if (product.offer_percentage !== undefined && product.offer_percentage !== null) {
      return Math.round(product.offer_percentage);
    }
    if (product.salePercentage) {
      const percentage = typeof product.salePercentage === 'string' 
        ? parseFloat(product.salePercentage.replace('%', '')) 
        : product.salePercentage;
      return Math.round(percentage) || 0;
    }
    return 0;
  };

  const offerPercentage = getOfferPercentage();
  
  // Check if product is wishlisted
  const isWishlisted = product.is_wishlisted || isAddedtoWishlist(product.uuid || product.id, product.uuid || product.product_id);
  const productId = product.uuid || product.id;
  const isInCart = isAddedToCartProducts(productId);

  return (
    <div
      className={`${parentClass} ${gridClass} ${
        product.isOnSale ? "on-sale" : ""
      }`}
    >
      <div
        className={`card-product-wrapper ${
          isNotImageRatio ? "aspect-ratio-0" : ""
        } ${radiusClass} `}
      >
        <Link href={`/product-detail/${product.uuid || product.id}`} className="product-img">
          <Image
            className="lazyload img-product"
            src={currentImage}
            alt={product.title}
            width={600}
            height={800}
            onError={() => setCurrentImage(PLACEHOLDER_IMAGE)}
          />

          <Image
            className="lazyload img-hover"
            src={imgHover}
            alt={product.title}
            width={600}
            height={800}
            onError={(e) => {
              e.target.src = PLACEHOLDER_IMAGE;
            }}
          />
        </Link>
        {/* Offer badge on product image - compact top left micro tag */}
        {offerPercentage > 0 && (
          <div className="product-offer-badge">
            <span className="product-offer-badge-text">-{offerPercentage}%</span>
          </div>
        )}
        {/* Offer percentage marquee banner hidden */}
        {false && offerPercentage > 15 && (
          <div className="marquee-product bg-main">
            <div className="marquee-wrapper">
              <div className="initial-child-container">
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    Hot Sale {offerPercentage}% OFF
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    Hot Sale {offerPercentage}% OFF
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    Hot Sale {offerPercentage}% OFF
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    Hot Sale {offerPercentage}% OFF
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    Hot Sale {offerPercentage}% OFF
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
              </div>
            </div>
            <div className="marquee-wrapper">
              <div className="initial-child-container">
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    Hot Sale {offerPercentage}% OFF
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    Hot Sale {offerPercentage}% OFF
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    Hot Sale {offerPercentage}% OFF
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    Hot Sale {offerPercentage}% OFF
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    Hot Sale {offerPercentage}% OFF
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Offer percentage badge hidden */}
        {false && product.isOnSale && (
          <div className="on-sale-wrap">
            <span className="on-sale-item">-{product.salePercentage}</span>
          </div>
        )}
        {product.countdown && (
          <div className="variant-wrap countdown-wrap">
            <div className="variant-box">
              <div
                className="js-countdown"
                data-timer={product.countdown}
                data-labels="D :,H :,M :,S"
              >
                <CountdownTimer />
              </div>
            </div>
          </div>
        )}
        {/* Offer percentage badge hidden */}
        {false && product.oldPrice && offerPercentage > 0 ? (
          <div className="on-sale-wrap">
            <span className="on-sale-item">-{offerPercentage}%</span>
          </div>
        ) : (
          ""
        )}
        <div className="list-product-btn">
          <a
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isWishlisted) {
                // Remove from wishlist using product UUID
                removeFromWishlist(
                  product.uuid || product.id, 
                  null, // wishlistItemUuid - not needed when using product UUID
                  product.uuid || product.product_id // productUuid for the API endpoint
                );
              } else {
                // Add to wishlist
                addToWishlist(product.uuid || product.id, product.uuid || product.product_id);
              }
            }}
            className={`box-icon wishlist btn-icon-action ${isWishlisted ? 'wishlisted' : ''}`}
            style={isWishlisted ? { color: '#dc3545' } : {}}
          >
            <span className="icon icon-heart" style={isWishlisted ? { color: '#dc3545' } : {}} />
            <span className="tooltip">
              {isWishlisted
                ? "Remove from Wishlist"
                : "Add to Wishlist"}
            </span>
          </a>
          <a
            href="#quickView"
            onClick={() => setQuickViewItem(product)}
            data-bs-toggle="modal"
            className="box-icon quickview tf-btn-loading"
          >
            <span className="icon icon-eye" />
            <span className="tooltip">Quick View</span>
          </a>
        </div>

        {/* Desktop Luxury Slide-Up Add to Bag Action (Hover only, desktop only) */}
        {!hideAddToCart && (
          <div className="wc-product-slideup-action d-none d-md-flex">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`wc-slideup-add-btn${isInCart ? " is-added" : ""}`}
              aria-label={isInCart ? "Already in cart" : "Add to bag"}
            >
              {isInCart ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Added</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span>Add to Bag</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      <div className="card-product-info">
        <Link href={`/product-detail/${product.uuid || product.id}`} className="title link">
          {product.title}
        </Link>
        <div className="price wc-product-price-wrap">
          <span className="offer-price">
            {typeof product.price === "number" ? formatInr(product.price) : "₹0"}
          </span>
          {product.oldPrice != null && typeof product.price === "number" && product.oldPrice > product.price && (
            <span className="old-price">{formatInr(product.oldPrice)}</span>
          )}
        </div>
        {product.colors && (
          <ul className="list-color-product">
            {product.colors.map((color, index) => (
              <li
                key={index}
                className={`list-color-item color-swatch ${
                  currentImage == color.imgSrc ? "active" : ""
                } ${color.bgColor == "bg-white" ? "line" : ""}`}
                onMouseOver={() => setCurrentImage(color.imgSrc)}
              >
                <span className={`swatch-value ${color.bgColor}`} />
                <Image
                  className="lazyload"
                  src={color.imgSrc}
                  alt="color variant"
                  width={600}
                  height={800}
                />
              </li>
            ))}
          </ul>
        )}
        {/* Mobile Clean Add to Cart Action (Below price, never blocking photo) */}
        {!hideAddToCart && (
          <div className="wc-product-mobile-action d-md-none">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`wc-mobile-add-btn${isInCart ? " is-added" : ""}`}
              aria-label={isInCart ? "Already in cart" : "Add to cart"}
            >
              {isInCart ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Added</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
