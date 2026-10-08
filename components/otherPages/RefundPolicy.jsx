"use client";

import { useEffect, useState } from "react";
import { useStoreConfig } from "@/context/StoreConfigContext";

const sectionIds = [
  "return-policy",
  "damages-issues",
  "exchanges",
  "refunds",
];
const sections = [
  { id: 1, text: "Return Policy", scroll: "return-policy" },
  { id: 2, text: "Damages and Issues", scroll: "damages-issues" },
  { id: 3, text: "Exchanges", scroll: "exchanges" },
  { id: 4, text: "Refunds", scroll: "refunds" },
];

export default function RefundPolicy() {
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
            <h4 className="heading">Return Policy</h4>
            <div
              className="terms-of-use-item item-scroll-target"
              id="return-policy"
            >
              <h5 className="terms-of-use-title">1. Return Policy</h5>
              <div className="terms-of-use-content">
                <p>
                  We have a 7-day return policy, which means you have 7 days
                  after receiving your item to request a return.
                </p>
                <p>
                  To be eligible for a return, to claim a return or report
                  damage, a full unboxing video without any edits or cuts is
                  required. Your item must be in the same condition that you
                  received it, unworn or unused, with tags, and in its original
                  packaging. You&apos;ll also need the receipt or proof of
                  purchase.
                </p>
                <p>
                  To start a return, you can contact us at{" "}
                  <a href={`mailto:${supportEmail}`}>
                    {supportEmail}
                  </a>
                  {supportPhone ? (
                    <>
                      . Please note that returns will need to be in contact with our
                      team through WhatsApp{" "}
                      <a href={`https://wa.me/${supportPhone}`} target="_blank" rel="noopener noreferrer">
                        {contact?.whatsapp || contact?.phone}
                      </a>
                    </>
                  ) : null}
                  .
                </p>
                <p>
                  If your return is accepted, we&apos;ll send you a return
                  shipping label, as well as instructions on how and where to
                  send your package. Items sent back to us without first
                  requesting a return will not be accepted.
                </p>
                <p>
                  You can always contact us for any return question at{" "}
                  <a href={`mailto:${supportEmail}`}>
                    {supportEmail}
                  </a>
                  .
                </p>
              </div>
            </div>
            <div
              className="terms-of-use-item item-scroll-target"
              id="damages-issues"
            >
              <h5 className="terms-of-use-title">2. Damages and Issues</h5>
              <div className="terms-of-use-content">
                <p>
                  Please inspect your order upon reception and contact us
                  immediately if the item is defective, damaged or if you
                  receive the wrong item. To claim a return or report damage, a
                  full unboxing video without any edits or cuts is required, so
                  that we can evaluate the issue and make it right.
                </p>
              </div>
            </div>
            <div
              className="terms-of-use-item item-scroll-target"
              id="exchanges"
            >
              <h5 className="terms-of-use-title">3. Exchanges</h5>
              <div className="terms-of-use-content">
                <p>
                  The fastest way to ensure you get what you want is to return
                  the item you have, and once the return is accepted, make a
                  separate purchase for the new item.
                </p>
              </div>
            </div>
            <div
              className="terms-of-use-item item-scroll-target"
              id="refunds"
            >
              <h5 className="terms-of-use-title">4. Refunds</h5>
              <div className="terms-of-use-content">
                <p>
                  We will notify you once we&apos;ve received and inspected your
                  return and let you know if the refund was approved or not. If
                  approved, you&apos;ll be automatically refunded on your
                  original payment method within 10 business days. Please
                  remember it can take some time for your bank or credit card
                  company to process and post the refund too.
                </p>
                <p>
                  If more than 15 business days have passed since we&apos;ve
                  approved your return, please contact us at{" "}
                  <a href={`mailto:${supportEmail}`}>
                    {supportEmail}
                  </a>
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
