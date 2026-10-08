"use client";

import { useEffect, useState } from "react";
import { useStoreConfig } from "@/context/StoreConfigContext";

const sectionIds = ["delivery", "prebooking", "contact"];
const sections = [
  { id: 1, text: "Delivery", scroll: "delivery" },
  { id: 2, text: "Prebooking", scroll: "prebooking" },
  { id: 3, text: "Contact & Support", scroll: "contact" },
];

export default function ShippingPolicy() {
  const [activeSection, setActiveSection] = useState(sectionIds[0]);
  const { contact } = useStoreConfig();
  const supportEmail = contact?.email || "support@wobcart.com";
  const supportPhone = (contact?.whatsapp || contact?.phone || "").replace(/\D/g, "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-50% 0px",
      }
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sectionIds]);

  const handleClick = (id) => {
    document
      .getElementById(id)
      .scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section className="flat-spacing">
      <div className="container">
        <div className="terms-of-use-wrap">
          <div className="left sticky-top">
            {sections.map(({ id, text, scroll }) => (
              <h6
                key={id}
                onClick={() => handleClick(scroll)}
                className={`btn-scroll-target ${
                  activeSection == scroll ? "active" : ""
                }`}
              >
                {id}. {text}
              </h6>
            ))}
          </div>
          <div className="right">
            <h4 className="heading">Shipping Policy</h4>
            <div
              className="terms-of-use-item item-scroll-target"
              id="delivery"
            >
              <h5 className="terms-of-use-title">1. Delivery</h5>
              <div className="terms-of-use-content">
                <p>
                  All ready stock items from our store are delivered pan India
                  within 1–12 working days.
                </p>
                <p>
                  Please bear with us if your order is a couple of days late.
                </p>
              </div>
            </div>
            <div
              className="terms-of-use-item item-scroll-target"
              id="prebooking"
            >
              <h5 className="terms-of-use-title">2. Prebooking</h5>
              <div className="terms-of-use-content">
                <p>
                  Items that are already sold out due to huge demand can be
                  restocked as per the market requirement. Such items need to be
                  manufactured and transported; hence it might take 15–20 working
                  days to dispatch. Prebooking is available for such items.
                </p>
              </div>
            </div>
            <div
              className="terms-of-use-item item-scroll-target"
              id="contact"
            >
              <h5 className="terms-of-use-title">3. Contact & Support</h5>
              <div className="terms-of-use-content">
                <p>
                  For any questions or help, reach out to us at{" "}
                  <a href={`mailto:${supportEmail}`}>
                    {supportEmail}
                  </a>
                  {supportPhone ? (
                    <>
                      {" "}or WhatsApp{" "}
                      <a href={`https://wa.me/${supportPhone}`} target="_blank" rel="noopener noreferrer">
                        {contact?.whatsapp || contact?.phone}
                      </a>
                    </>
                  ) : null}
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
