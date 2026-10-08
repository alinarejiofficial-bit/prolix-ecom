"use client";
import React from "react";
import Image from "next/image";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { BRAND_NAME } from "@/utils/brand";

export default function About() {
  const { branding } = useStoreConfig();
  const companyName = branding?.companyName || BRAND_NAME;

  return (
    <section className="flat-spacing about-us-main">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <div className="about-us-features wow fadeInLeft">
              <Image
                className="lazyload"
                data-src="/images/banner/about-us.jpg"
                alt={`${companyName} story`}
                src="/images/banner/about-us.jpg"
                width={930}
                height={618}
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="about-us-content">
              <h3 className="title wow fadeInUp">
                {companyName} – A modern online shopping experience
              </h3>
              <div className="wow fadeInUp">
                <p>
                  Welcome to {companyName}, a clean and flexible storefront for
                  quality products, everyday essentials, and curated collections.
                  Our mission is to make online shopping simple: browse, buy, and
                  get reliable support from a storefront that stays in sync with
                  Prolix Admin and Prolix Cloud features.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
