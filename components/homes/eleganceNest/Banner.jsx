"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { bannerService } from "@/services/bannerService";
import { BannerOfferSkeleton } from "@/components/common/SectionSkeletons";
import { useStoreConfig } from "@/context/StoreConfigContext";
import CountdownTimer from "@/components/common/Countdown";

const getLinkUrl = (offerData) => {
  if (!offerData || !offerData.link_type) {
    return null;
  }

  switch (offerData.link_type) {
    case "product":
      if (offerData.product?.uuid) {
        return `/product-detail/${offerData.product.uuid}`;
      }
      return null;
    case "category":
      if (offerData.category?.id) {
        return `/products/category/${offerData.category.id}`;
      }
      if (offerData.category?.uuid) {
        return `/products/category/${offerData.category.uuid}`;
      }
      return null;
    case "custom":
      return offerData.custom_link || null;
    default:
      return null;
  }
};

const getOfferEndDate = (offerData) =>
  offerData?.end_date ||
  offerData?.ends_at ||
  offerData?.expiry_date ||
  offerData?.expires_at ||
  offerData?.valid_until ||
  offerData?.countdown_to ||
  offerData?.offer_ends_at ||
  null;

export default function Banner() {
  const { isModuleEnabled } = useStoreConfig();
  const [offerData, setOfferData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const cachedOffer = bannerService.getCachedOfferSection();
    if (cachedOffer) {
      setOfferData(cachedOffer);
      setLoading(false);
    }

    const fetchOfferSection = async () => {
      try {
        setError(null);
        const response = await bannerService.getHomeOfferSection();
        if (isMounted && response?.success && response?.data) {
          setOfferData(response.data);
        } else if (isMounted && !cachedOffer) {
          setOfferData(null);
        }
      } catch (err) {
        console.error("Error fetching home offer section:", err);
        if (isMounted) {
          setError(err.message);
          setOfferData(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOfferSection();

    return () => {
      isMounted = false;
    };
  }, []);


  if (!isModuleEnabled("marketing")) {
    return null;
  }

  if (loading) {
    return (
      <section className="home-section-spacing">
        <div className="container">
          <BannerOfferSkeleton />
        </div>
      </section>
    );
  }

  if (error || !offerData) {
    return null;
  }

  const linkUrl = getLinkUrl(offerData) || "/products";
  const hasButton = Boolean(offerData.button_text);
  const endDate = getOfferEndDate(offerData);
  const offerIsLive = endDate && !Number.isNaN(new Date(endDate).getTime()) && new Date(endDate) > new Date();
  const isExternal = offerData.link_type === "custom" && linkUrl?.startsWith("http");
  const hasBothImages = Boolean(offerData.primary_image && offerData.secondary_image);

  const formatText = (str) => {
    if (!str) return "";
    return str.trim().replace(/\b\w+/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  };

  const formatSentence = (str) => {
    if (!str) return "";
    const trimmed = str.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  };

  const buttonLabel = offerData.button_text || "Shop Collection";

  const ctaBtn = (
    isExternal ? (
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="wc-split-offer-btn"
      >
        <span>{buttonLabel}</span>
        <span className="wc-split-offer-btn-arrow">↗</span>
      </a>
    ) : (
      <Link href={linkUrl} className="wc-split-offer-btn">
        <span>{buttonLabel}</span>
        <span className="wc-split-offer-btn-arrow">↗</span>
      </Link>
    )
  );

  // If both primary and secondary images are available, render symmetric dual-image split showcase
  if (hasBothImages) {
    return (
      <section className="home-section-spacing py-2" aria-label="Special Offers">
        <div className="container">
          <div className="wc-split-offer-wrap">
            <div className="wc-split-offer-grid">
              {/* Primary Image (Left) - 100% from backend */}
              <div className="wc-split-offer-media">
                <Image
                  alt={offerData.title || "Special Offer Showcase"}
                  src={offerData.primary_image}
                  width={800}
                  height={600}
                  unoptimized
                  priority={false}
                />
              </div>

              {/* Secondary Image (Right) - 100% from backend */}
              <div className="wc-split-offer-media">
                <Image
                  alt={offerData.title || "Special Offer Collection"}
                  src={offerData.secondary_image}
                  width={800}
                  height={600}
                  unoptimized
                  priority={false}
                />
              </div>
            </div>

            {/* Central Floating Elevated Offer Card */}
            <div className="wc-split-offer-card">
              {/* Dynamic tag badge: only rendered if provided by backend API */}
              {(offerData.tag || offerData.badge || offerData.offer_text) && (
                <div className="wc-split-offer-tag">
                  <span className="wc-split-offer-tag-dot" />
                  <span>{offerData.tag || offerData.badge || offerData.offer_text}</span>
                </div>
              )}

              {offerData.title && (
                <h3 className="wc-split-offer-title">
                  {offerData.title}
                </h3>
              )}

              {offerData.sub_title && (
                <p className="wc-split-offer-desc">{offerData.sub_title}</p>
              )}

              {offerIsLive && (
                <div className="wc-split-offer-timer">
                  <CountdownTimer style={2} targetDate={endDate} />
                </div>
              )}

              {ctaBtn}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Fallback single-image layout
  const singleImage = offerData.primary_image || offerData.secondary_image;

  return (
    <section className="home-section-spacing">
      <div className="container">
        <div className="wc-offer-frame">
          {singleImage && (
            <div className="wc-offer-media">
              <Image
                alt={offerData.title || "Offer"}
                src={singleImage}
                width={1400}
                height={700}
                unoptimized
              />
            </div>
          )}
          <div className="wc-offer-copy">
            {(offerData.tag || offerData.badge || offerData.offer_text) && (
              <p className="wc-offer-kicker">{offerData.tag || offerData.badge || offerData.offer_text}</p>
            )}
            {offerData.title && <h2>{offerData.title}</h2>}
            {offerData.sub_title && <p className="wc-offer-desc">{offerData.sub_title}</p>}
            {offerIsLive && (
              <div className="wc-offer-timer">
                <CountdownTimer style={2} targetDate={endDate} />
              </div>
            )}
            {ctaBtn}
          </div>
        </div>
      </div>
    </section>
  );
}
