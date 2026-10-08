"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useContextElement } from "@/context/Context";
import {
  mapToWobcartItem,
  openWobcartCheckout,
} from "@/utils/wobcartCheckout";
import { formatInr } from "@/utils/formatPrice";

export default function ProductsCards6({ product, hideAddToCart = false }) {
  const [currentImage, setCurrentImage] = useState(product.imgSrc);

  const {
    setQuickAddItem,
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

  const handleBuyNow = async (e) => {
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

    try {
      await openWobcartCheckout(
        [mapToWobcartItem(defaultVariant.uuid, 1)],
        { express: true },
      );
    } catch (error) {
      alert(error.message || "Unable to open checkout");
    }
  };

  useEffect(() => {
    setCurrentImage(product.imgSrc);
  }, [product]);
  
  // Check if product is wishlisted
  const isWishlisted = product.is_wishlisted || isAddedtoWishlist(product.uuid || product.id);
  const offerPercentage = product.offer_percentage != null
    ? Math.round(product.offer_percentage)
    : (product.salePercentage ? Math.round(parseFloat(String(product.salePercentage).replace('%', '')) || 0) : 0);
  
  return (
    <div
      className="card-product style-list"
      data-availability="In stock"
      data-brand="gucci"
    >
      <div className="card-product-wrapper">
        <Link href={`/product-detail/${product.id}`} className="product-img">
          <Image
            className="lazyload img-product"
            src={currentImage}
            alt={product.title}
            width={600}
            height={800}
          />
          <Image
            className="lazyload img-hover"
            src={product.imgHover}
            alt={product.title}
            width={600}
            height={800}
          />
        </Link>
        {/* Offer percentage badge hidden */}
        {false && product.isOnSale && (
          <div className="on-sale-wrap">
            <span className="on-sale-item">-25%</span>
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
        <p className="description text-secondary text-line-clamp-2">
          The garments labelled as Committed are products that have been
          produced using sustainable fibres or processes, reducing their
          environmental impact.
        </p>
        <div className="variant-wrap-list">
          {product.colors && (
            <ul className="list-color-product">
              {product.colors.map((color, index) => (
                <li
                  key={index}
                  className={`list-color-item color-swatch ${
                    currentImage == color.imgSrc ? "active" : ""
                  } `}
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
          {product.sizes && (
            <div className="size-box list-product-btn">
              <span className="size-item box-icon">S</span>
              <span className="size-item box-icon">M</span>
              <span className="size-item box-icon">L</span>
              <span className="size-item box-icon">XL</span>
              <span className="size-item box-icon disable">XXL</span>
            </div>
          )}
          <div className="list-product-btn d-flex flex-wrap gap-2 align-items-center">
            {!hideAddToCart && (
              <>
                <a
                  href="#"
                  onClick={handleAddToCart}
                  className="btn-main-product"
                >
                  {isAddedToCartProducts(product.uuid || product.id)
                    ? "Already Added"
                    : "Add to cart"}
                </a>
                <a
                  href="#"
                  onClick={handleBuyNow}
                  className="btn-style-3 text-btn-uppercase"
                >
                  Buy now
                </a>
              </>
            )}
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
        </div>
      </div>
    </div>
  );
}
