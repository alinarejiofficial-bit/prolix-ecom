"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import ToolbarBottom from "../headers/ToolbarBottom";
import ScrollTop from "../common/ScrollTop";
import BrandLogo from "@/components/common/BrandLogo";
import { footerLinks } from "@/data/footerLinks";
import { footerContactColumns } from "@/data/footerContact";
import { footerSocialLinks } from "@/data/footerSocial";
import { contactService } from "@/services/contactService";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { BRAND_NAME, sanitizePublicValue } from "@/utils/brand";

const CONTACT_ICONS = {
  phone: "icon-phone",
  email: "icon-mail",
  address: "icon-map-pin",
};

function socialHref(key, value) {
  if (key === "whatsapp" && !/^https?:\/\//i.test(value)) {
    const digits = value.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : null;
  }
  return value;
}

function contactHref(type, value) {
  if (type === "phone") return `tel:${value.replace(/\s+/g, "")}`;
  if (type === "email") return `mailto:${value}`;
  return null;
}

export default function Footer1({
  border = true,
  dark = false,
  hasPaddingBottom = false,
}) {
  const { branding, contact: storeContact, social: storeSocial, checkout: storeCheckout, isModuleEnabled } = useStoreConfig();
  const [contactInfo, setContactInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const footerContact = {
    email: sanitizePublicValue(storeContact?.email) || sanitizePublicValue(contactInfo?.contact_details?.email),
    phone: sanitizePublicValue(storeContact?.phone) || sanitizePublicValue(contactInfo?.contact_details?.phone),
    address: sanitizePublicValue(storeContact?.address) || sanitizePublicValue(contactInfo?.contact_details?.address),
  };
  const activeSocialLinks = footerSocialLinks
    .map((social) => {
      const configured =
        sanitizePublicValue(storeSocial?.[social.key]) ||
        sanitizePublicValue(contactInfo?.social_media?.[social.key]);
      return { ...social, href: configured && socialHref(social.key, configured) };
    })
    .filter((social) => social.href);
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await contactService.getContactInfo();
        if (response.success && response.data) {
          setContactInfo(response.data);
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContactInfo();
  }, []);
  useEffect(() => {
    const headings = document.querySelectorAll(".footer-heading-mobile");

    const toggleOpen = (event) => {
      const parent = event.target.closest(".footer-col-block");
      const content = parent.querySelector(".tf-collapse-content");

      if (parent.classList.contains("open")) {
        parent.classList.remove("open");
        content.style.height = "0px";
      } else {
        parent.classList.add("open");
        content.style.height = content.scrollHeight + 10 + "px";
      }
    };

    headings.forEach((heading) => {
      heading.addEventListener("click", toggleOpen);
    });

    // Clean up event listeners when the component unmounts
    return () => {
      headings.forEach((heading) => {
        heading.removeEventListener("click", toggleOpen);
      });
    };
  }, []); // Empty dependency array means this will run only once on mount
  return (
    <>
      <footer
        id="footer"
        className={`footer ${hasPaddingBottom ? "has-pb" : ""}`}
      >
        <div className={`footer-wrap ${!border ? "border-0" : ""}`}>
          <div className="footer-body">
            <div className="container">
              <div className="row">
                <div className="col-lg-2">
                  <div className="footer-infor">
                    <div className="footer-brand">
                      <div className="footer-logo">
                        <Link href={`/`}>
                          <BrandLogo width={260} height={80} maxHeight="80px" />
                        </Link>
                      </div>
                      {activeSocialLinks.length > 0 && (
                        <ul className="tf-social-icon footer-social">
                          {activeSocialLinks.map((social) => (
                            <li key={social.key}>
                              <a
                                href={social.href}
                                className={social.className}
                                aria-label={social.label}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <i className={`icon ${social.icon}`} />
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {footerContact.address && (
                      <div className="footer-address">
                        <p>{footerContact.address}</p>
                      </div>
                    )}
                    <ul className="footer-info">
                      {footerContact.email && (
                        <li>
                          <i className="icon-mail" />
                          <a href={`mailto:${footerContact.email}`}>
                            {footerContact.email}
                          </a>
                        </li>
                      )}
                      {footerContact.phone && (
                        <li>
                          <i className="icon-phone" />
                          <a href={`tel:${footerContact.phone}`}>
                            {footerContact.phone}
                          </a>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="footer-menu">
                    {footerLinks.map((section, sectionIndex) => (
                      <div className="footer-col-block" key={sectionIndex}>
                        <div className="footer-heading text-button footer-heading-mobile">
                          {section.heading}
                        </div>
                        <div className="tf-collapse-content">
                          <ul className="footer-menu-list">
                            {section.items
                              .filter((item) => {
                                if (item.href === "/blog" && !isModuleEnabled("content")) return false;
                                if (item.href === "/careers" && !isModuleEnabled("careers")) return false;
                                if (item.href === "/tailoring" && !isModuleEnabled("tailoring")) return false;
                                return true;
                              })
                              .map((item, itemIndex) => (
                                <li className="text-caption-1" key={itemIndex}>
                                  {item.isLink ? (
                                    <Link
                                      href={item.href}
                                      className="footer-menu_item"
                                    >
                                      {item.label}
                                    </Link>
                                  ) : (
                                    <a
                                      href={item.href}
                                      className="footer-menu_item"
                                    >
                                      {item.label}
                                    </a>
                                  )}
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {footerContactColumns.map((column) => (
                  <div className="col-md-6 col-lg-3" key={column.heading}>
                    <div className="footer-col-block">
                      <div className="footer-heading text-button footer-heading-mobile">
                        {column.heading}
                      </div>
                      <div className="tf-collapse-content">
                        <ul className="footer-info footer-contact-list">
                          {column.items.map((item) => {
                            const href = contactHref(item.type, item.value);
                            return (
                              <li key={item.value} className={`text-caption-1 contact-${item.type}`}>
                                <i className={CONTACT_ICONS[item.type]} />
                                {href ? <a href={href}>{item.value}</a> : <span>{item.value}</span>}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="container">
              <div className="row">
                <div className="col-12">
                  <div className="footer-bottom-wrap">
                    <div className="left">
                      <p className="text-caption-1">
                        ©{new Date().getFullYear()} {branding?.companyName || BRAND_NAME}. All Rights Reserved.
                      </p>
                    </div>
                    <div className="tf-payment">
                      <p className="text-caption-1">
                        {storeCheckout?.razorpayEnabled ? "Payment secured by:" : "100% Secure Checkout"}
                      </p>
                      {storeCheckout?.razorpayEnabled && (
                        <Image
                          alt="Razorpay"
                          src="/images/logo/razorpay.png"
                          width={150}
                          height={50}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <ScrollTop hasPaddingBottom={hasPaddingBottom} />
      <ToolbarBottom />
    </>
  );
}
