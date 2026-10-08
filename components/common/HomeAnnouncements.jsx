"use client";
import React, { useEffect, useState } from "react";
import { bannerService } from "@/services/bannerService";
import { AnnouncementsSkeleton } from "@/components/common/SectionSkeletons";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useStoreConfig } from "@/context/StoreConfigContext";

export default function HomeAnnouncements({ parentClass = "wc-marquee-section" }) {
  const { isModuleEnabled } = useStoreConfig();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.1, rootMargin: "50px" });

  useEffect(() => {
    let isMounted = true;

    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const response = await bannerService.getHomeAnnouncements();
        if (isMounted && response?.success && Array.isArray(response?.data)) {
          const validAnnouncements = response.data
            .filter(
              (item) =>
                item &&
                typeof item.message === "string" &&
                item.message.trim().length > 0
            )
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
          setAnnouncements(validAnnouncements);
        }
      } catch (error) {
        console.error("Error fetching home announcements:", error);
        if (isMounted) setAnnouncements([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnnouncements();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isModuleEnabled("marketing")) {
    return null;
  }

  // Show skeleton loader while loading
  if (loading) {
    return (
      <section ref={sectionRef} className={parentClass}>
        <AnnouncementsSkeleton />
      </section>
    );
  }

  // Don't render anything if no announcements exist in backend
  if (announcements.length === 0) {
    return null;
  }

  const handleCopyCode = (e, code) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(code);
      localStorage.setItem("wobcart_pending_coupon", code);
      const { showToast } = require("@/utlis/showToast");
      showToast(`Coupon "${code}" copied! It will be applied at checkout.`, "success");
    } catch (_) {}
  };

  const renderMessageContent = (announcement) => {
    const message = announcement?.message;
    if (!message) return null;
    const match = message.match(/(?:code|use code|voucher|coupon)[:\s]+([A-Z0-9_-]{3,15})/i);
    if (match && match[1]) {
      const code = match[1].toUpperCase();
      const parts = message.split(new RegExp(`(${match[1]})`, "i"));
      return (
        <span className="d-inline-flex align-items-center">
          {parts.map((part, pIdx) =>
            part.toUpperCase() === code ? (
              <button
                key={pIdx}
                type="button"
                onClick={(e) => handleCopyCode(e, code)}
                className="wc-marquee-chip"
                title="Click to copy coupon code"
              >
                <span>{code}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            ) : (
              <span key={pIdx}>{part}</span>
            )
          )}
        </span>
      );
    }
    return <span>{message}</span>;
  };

  // Render a set of announcements for one track purely from real backend data
  const renderTrackItems = (trackKey) => {
    // 6 to 8 total items per track easily spans 3000px+ (more than enough for any 4K screen)
    // without excessively inflating the track width
    const repeatTimes = Math.max(3, Math.ceil(8 / announcements.length));
    const items = [];

    for (let r = 0; r < repeatTimes; r++) {
      announcements.forEach((announcement, idx) => {
        const linkUrl = announcement.link || announcement.url;
        items.push(
          <div key={`${trackKey}-${r}-${idx}`} className="wc-marquee-item">
            {linkUrl ? (
              <a href={linkUrl} className="wc-marquee-link">
                {renderMessageContent(announcement)}
              </a>
            ) : (
              renderMessageContent(announcement)
            )}
            <span className="wc-marquee-icon" aria-hidden="true">
              ⚡
            </span>
          </div>
        );
      });
    }

    return items;
  };

  // Relaxed, slow editorial speed (~30-38px/second) so users can comfortably read each announcement
  const marqueeDuration = `${Math.max(110, announcements.length * 36)}s`;

  return (
    <section ref={sectionRef} className={parentClass} aria-label="Store Announcements">
      <div className="container">
        <div className="wc-marquee-pill-wrapper">
          <div className="wc-marquee-container">
            <div
              className="wc-marquee-track"
              style={{ animationDuration: marqueeDuration }}
            >
              {renderTrackItems("track-1")}
            </div>
            <div
              className="wc-marquee-track"
              style={{ animationDuration: marqueeDuration }}
              aria-hidden="true"
            >
              {renderTrackItems("track-2")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

