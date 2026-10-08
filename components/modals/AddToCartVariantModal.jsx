"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useContextElement } from "@/context/Context";
import {
  mapToWobcartItem,
  openWobcartCheckout,
} from "@/utils/wobcartCheckout";
import ColorSelect from "@/components/productDetails/ColorSelect";
import SizeSelect from "@/components/productDetails/SizeSelect";
import QuantitySelect from "@/components/productDetails/QuantitySelect";
import { getColorVariantImage, PLACEHOLDER_IMAGE, resolveMediaUrl } from "@/utils/productImages";
import {
  findMatchingVariant,
  getFirstAvailableSizeForColor,
  getVariantDisplayData,
  getVariantQuantityLimits,
  clampQuantity,
} from "@/utils/variants";
import { productService } from "@/services/productService";
import { useStoreConfig } from "@/context/StoreConfigContext";

export default function AddToCartVariantModal() {
  const modalRef = useRef(null);
  const { isModuleEnabled, checkout } = useStoreConfig();
  const { variantModalProduct, setVariantModalProduct, addProductToCart } = useContextElement();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [activeColor, setActiveColor] = useState("");
  const [otherOptions, setOtherOptions] = useState({});
  const [adding, setAdding] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [detailedProduct, setDetailedProduct] = useState(null);

  const baseProduct = variantModalProduct?.apiProduct || variantModalProduct;
  const apiProduct = detailedProduct || baseProduct;
  const productUuid = variantModalProduct?.uuid || variantModalProduct?.id || null;

  const options = useMemo(() => apiProduct?.options || [], [apiProduct]);
  const variants = useMemo(() => apiProduct?.variants || [], [apiProduct]);

  const sizeOption = useMemo(
    () => options.find((opt) => opt.name.toLowerCase() === "size"),
    [options],
  );
  const colorOption = useMemo(
    () =>
      options.find(
        (opt) => opt.name.toLowerCase() === "color" || opt.name.toLowerCase() === "colour",
      ),
    [options],
  );
  const extraOptions = useMemo(
    () => options.filter((opt) => opt !== sizeOption && opt !== colorOption),
    [options, sizeOption, colorOption],
  );

  const sizeValues = useMemo(() => sizeOption?.values || [], [sizeOption]);
  const colorValues = useMemo(() => colorOption?.values || [], [colorOption]);

  const selectionInitKey = useMemo(() => {
    if (!productUuid) return null;
    return `${productUuid}:${detailedProduct ? "detail" : "list"}:${variants.length}`;
  }, [productUuid, detailedProduct, variants.length]);

  const selectionInitRef = useRef(null);

  useEffect(() => {
    const el = document.getElementById("addToCartVariantModal");
    if (!el) return;
    const bootstrap = require("bootstrap");
    const modal = bootstrap.Modal.getOrCreateInstance(el, { backdrop: true, keyboard: true });
    if (variantModalProduct) {
      modal.show();
    } else {
      modal.hide();
    }
    const onHidden = () => {
      setVariantModalProduct(null);
      setDetailedProduct(null);
      selectionInitRef.current = null;
    };
    el.addEventListener("hidden.bs.modal", onHidden);
    return () => el.removeEventListener("hidden.bs.modal", onHidden);
  }, [variantModalProduct, setVariantModalProduct]);

  useEffect(() => {
    if (!variantModalProduct?.uuid && !variantModalProduct?.id) {
      setDetailedProduct(null);
      selectionInitRef.current = null;
      return;
    }

    const productUuid = variantModalProduct.uuid || variantModalProduct.id;
    let cancelled = false;

    async function loadProductDetails() {
      setLoadingProduct(true);
      try {
        const response = await productService.getProductByUuid(productUuid);
        if (!cancelled && response.success && response.data) {
          setDetailedProduct(response.data);
        }
      } catch (error) {
        console.error("Failed to load product variants:", error);
        if (!cancelled) setDetailedProduct(null);
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    }

    loadProductDetails();

    return () => {
      cancelled = true;
    };
  }, [variantModalProduct]);

  useEffect(() => {
    if (!selectionInitKey || !variants.length) return;
    if (selectionInitRef.current === selectionInitKey) return;
    selectionInitRef.current = selectionInitKey;

    const first = variants[0];
    const opts = first?.options || {};

    const initialSize =
      opts[sizeOption?.name] ||
      opts[sizeOption?.name?.toLowerCase()] ||
      (sizeValues[0] ?? "");
    const initialColor =
      opts[colorOption?.name] ||
      opts[colorOption?.name?.toLowerCase()] ||
      (colorValues[0] ?? "");

    setSelectedSize(initialSize);
    setSelectedColor(initialColor);
    setActiveColor(initialColor?.toLowerCase() || "gray");

    const initialOther = {};
    extraOptions.forEach((opt) => {
      const val = opts[opt.name] || opts[opt.name?.toLowerCase()];
      initialOther[opt.name] = val || (opt.values?.length ? opt.values[0] : "");
    });
    setOtherOptions(initialOther);
    setQuantity(1);
  }, [selectionInitKey, variants, sizeOption, colorOption, extraOptions, sizeValues, colorValues]);

  const currentVariant = useMemo(
    () =>
      findMatchingVariant(variants, {
        sizeOption,
        selectedSize,
        colorOption,
        selectedColor,
        colorValues,
        extraOptions,
        otherOptions,
      }),
    [
      variants,
      selectedSize,
      selectedColor,
      otherOptions,
      sizeOption,
      colorOption,
      colorValues,
      extraOptions,
    ],
  );

  const currentProductData = useMemo(
    () =>
      getVariantDisplayData(currentVariant, {
        price: variantModalProduct?.price ?? 0,
        oldPrice: variantModalProduct?.oldPrice ?? null,
        image:
          resolveMediaUrl(currentVariant?.image) ||
          variantModalProduct?.imgSrc ||
          PLACEHOLDER_IMAGE,
      }),
    [currentVariant, variantModalProduct],
  );

  const quantityLimits = useMemo(
    () => getVariantQuantityLimits(currentVariant),
    [currentVariant],
  );

  const variantKey =
    currentVariant?.uuid || `${selectedColor}-${selectedSize}-${JSON.stringify(otherOptions)}`;

  useEffect(() => {
    if (!currentVariant) return;
    setQuantity((current) => clampQuantity(current, quantityLimits));
  }, [variantKey, quantityLimits.maxQuantity, currentVariant]);

  const getVariantImageForColor = (colorValue, colorIndex) =>
    getColorVariantImage(apiProduct, colorOption, colorValue, colorIndex);

  const handleColorChange = (color) => {
    setSelectedColor(color);
    setActiveColor(color?.toLowerCase() || "gray");

    if (!sizeOption || !selectedSize) return;

    const matchWithCurrentSize = findMatchingVariant(variants, {
      sizeOption,
      selectedSize,
      colorOption,
      selectedColor: color,
      colorValues,
      extraOptions,
      otherOptions,
    });

    if (!matchWithCurrentSize) {
      const nextSize = getFirstAvailableSizeForColor(variants, colorOption, color, sizeOption);
      if (nextSize) setSelectedSize(nextSize);
    }
  };

  const closeModal = () => {
    setVariantModalProduct(null);
    setDetailedProduct(null);
    setAdding(false);
  };

  const buildProductData = () => ({
    ...variantModalProduct,
    id: variantModalProduct?.id || variantModalProduct?.uuid,
    uuid: variantModalProduct?.uuid,
    price: currentProductData.price,
    oldPrice: currentProductData.oldPrice,
    variant: currentVariant,
    selectedVariant: currentVariant,
    selectedSize,
    selectedColor,
    apiProduct,
    product_id: apiProduct?.uuid,
    variant_id: currentVariant?.uuid,
    variant_uuid: currentVariant?.uuid,
    name: variantModalProduct?.title || apiProduct?.name,
    title: variantModalProduct?.title || apiProduct?.name,
    imgSrc: currentProductData.image,
  });

  const handleAddToCart = async () => {
    if (!currentVariant?.uuid) {
      alert("Please select options.");
      return;
    }
    if (!currentProductData.orderable) {
      alert("This variant is not available for order.");
      return;
    }
    const orderQty = clampQuantity(quantity, quantityLimits);
    if (orderQty !== quantity) setQuantity(orderQty);

    setAdding(true);
    try {
      const productData = buildProductData();
      await addProductToCart(variantModalProduct.uuid, orderQty, productData, true);
      closeModal();
    } catch (e) {
      // Error already handled in Context
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!currentVariant?.uuid) {
      alert("Please select options.");
      return;
    }
    if (!currentProductData.orderable) {
      alert("This variant is not available for order.");
      return;
    }
    const orderQty = clampQuantity(quantity, quantityLimits);
    if (orderQty !== quantity) setQuantity(orderQty);

    setAdding(true);
    try {
      closeModal();
      if (isModuleEnabled("wobcart_checkout") && checkout?.wobcartCheckoutEnabled) {
        await openWobcartCheckout(
          [
            mapToWobcartItem(
              currentVariant.uuid,
              orderQty,
              currentVariant.prebooking_available && !currentVariant.is_in_stock,
            ),
          ],
          { express: true },
        );
      } else {
        const productData = buildProductData();
        await addProductToCart(variantModalProduct.uuid, orderQty, productData, false);
        window.location.href = "/cart";
      }
    } catch (e) {
      alert(e.message || "Unable to open checkout");
    } finally {
      setAdding(false);
    }
  };

  const previewKey = currentVariant?.uuid || `${selectedColor}-${selectedSize}`;

  return (
    <div
      ref={modalRef}
      className="modal fade"
      id="addToCartVariantModal"
      tabIndex={-1}
      aria-labelledby="addToCartVariantModalLabel"
      aria-hidden="true"
      data-bs-backdrop="static"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title" id="addToCartVariantModalLabel">
              Select options
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              data-bs-dismiss="modal"
              onClick={() => setVariantModalProduct(null)}
            />
          </div>
          <div className="modal-body">
            {!variantModalProduct ? (
              <p className="text-muted small mb-0">No product selected.</p>
            ) : (
              <>
                <div className="d-flex gap-3 mb-3">
                  <div
                    className="flex-shrink-0 position-relative"
                    style={{ width: 90, height: 110 }}
                  >
                    <Image
                      key={previewKey}
                      src={currentProductData.image || PLACEHOLDER_IMAGE}
                      alt={variantModalProduct.title}
                      fill
                      className="object-fit-cover rounded"
                      unoptimized
                    />
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <h6 className="text-title mb-1 text-break">{variantModalProduct.title}</h6>
                    <div className="tf-product-info-price">
                      {loadingProduct ? (
                        <span className="text-muted small">Loading options...</span>
                      ) : (
                        <>
                          <span className="price-on-sale font-2">
                            ₹{currentProductData.price.toFixed(2)}
                          </span>
                          {currentProductData.oldPrice && (
                            <span className="compare-at-price font-2 ms-1 text-muted text-decoration-line-through">
                              ₹{currentProductData.oldPrice.toFixed(2)}
                            </span>
                          )}
                          {quantity > 1 && (
                            <div className="text-muted small mt-1">
                              Total: ₹{(currentProductData.price * quantity).toFixed(2)} for {quantity}{" "}
                              items
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="tf-product-info-choose-option">
                  {colorOption && colorValues.length > 0 && (
                    <ColorSelect
                      setActiveColor={handleColorChange}
                      activeColor={selectedColor}
                      colorOptions={colorValues.map((color, index) => ({
                        id: `modal-values-${color.toLowerCase().replace(/\s+/g, "-")}`,
                        value: color,
                        color: color.toLowerCase().replace(/\s+/g, "-"),
                        image: getVariantImageForColor(color, index),
                      }))}
                    />
                  )}

                  {sizeOption && sizeValues.length > 0 && (
                    <SizeSelect
                      selectedSize={selectedSize}
                      setSelectedSize={setSelectedSize}
                      sizeOptions={sizeValues.map((size) => ({
                        id: `modal-values-${size.toLowerCase()}`,
                        value: size,
                        disabled: false,
                      }))}
                      variants={variants}
                      sizeOptionName={sizeOption.name}
                    />
                  )}

                  {extraOptions.map((opt) => (
                    <div key={opt.name} className="variant-picker-item mb-3">
                      <label className="form-label small text-uppercase text-secondary mb-1">
                        {opt.name}
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={otherOptions[opt.name] ?? ""}
                        onChange={(e) =>
                          setOtherOptions((prev) => ({
                            ...prev,
                            [opt.name]: e.target.value,
                          }))
                        }
                      >
                        {(opt.values || []).map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}

                  <div className="tf-product-info-quantity">
                    <div className="title mb_12">Quantity:</div>
                    <QuantitySelect
                      quantity={quantity}
                      setQuantity={setQuantity}
                      minQuantity={quantityLimits.minQuantity}
                      maxQuantity={quantityLimits.maxQuantity}
                    />
                    {quantityLimits.isInStock && quantityLimits.stockQty > 0 && (
                      <p className="text-muted small mb-0 mt-2">
                        {quantityLimits.stockQty} in stock
                      </p>
                    )}
                    {!quantityLimits.isInStock && quantityLimits.prebooking && (
                      <p className="text-muted small mb-0 mt-2">Pre-order available</p>
                    )}
                  </div>
                </div>

                <div className="modal-footer border-0 flex-column gap-2 pt-0 px-0 pb-0">
                  <button
                    type="button"
                    className="btn-main-product w-100 text-uppercase fw-6 py-3 rounded-pill border"
                    onClick={handleAddToCart}
                    disabled={adding || loadingProduct || !currentProductData.orderable}
                  >
                    {adding ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        />
                        Adding...
                      </>
                    ) : (
                      "Add to cart"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-style-3 w-100 text-uppercase fw-6 py-3"
                    onClick={handleBuyNow}
                    disabled={adding || loadingProduct || !currentProductData.orderable}
                  >
                    Buy now
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
