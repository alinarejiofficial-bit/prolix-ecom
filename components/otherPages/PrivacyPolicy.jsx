"use client";

import { useEffect, useState } from "react";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { BRAND_NAME } from "@/utils/brand";

const sectionIds = [
  "information-collection",
  "information-use",
  "data-protection",
  "cookies",
  "third-party",
];
const sections = [
  { id: 1, text: "Information Collection", scroll: "information-collection" },
  { id: 2, text: "Information Use", scroll: "information-use" },
  { id: 3, text: "Data Protection", scroll: "data-protection" },
  { id: 4, text: "Cookies", scroll: "cookies" },
  { id: 5, text: "Third-Party Services", scroll: "third-party" },
];

export default function PrivacyPolicy() {
  const { branding } = useStoreConfig();
  const companyName = branding?.companyName || BRAND_NAME;
  const [activeSection, setActiveSection] = useState(sectionIds[0]);

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
            <h4 className="heading">Privacy Policy</h4>
            <div
              className="terms-of-use-item item-scroll-target"
              id="information-collection"
            >
              <h5 className="terms-of-use-title">1. Information Collection</h5>
              <div className="terms-of-use-content">
                <p>
                  At {companyName}, we are committed to protecting your privacy.
                  This Privacy Policy explains how we collect, use, disclose, and
                  safeguard your information when you visit our website or make a
                  purchase.
                </p>
                <p>
                  We collect information that you provide directly to us, such as
                  when you create an account, make a purchase, subscribe to our
                  newsletter, or contact us for support. This may include your
                  name, email address, shipping address, phone number, payment
                  information, and any other information you choose to provide.
                </p>
                <p>
                  We also automatically collect certain information about your
                  device when you visit our website, including your IP address,
                  browser type, operating system, access times, and the pages you
                  have viewed directly before and after accessing our website.
                </p>
              </div>
            </div>
            <div
              className="terms-of-use-item item-scroll-target"
              id="information-use"
            >
              <h5 className="terms-of-use-title">2. Information Use</h5>
              <div className="terms-of-use-content">
                <p>
                  We use the information we collect to process your transactions,
                  manage your account, and provide you with customer support. We
                  also use this information to send you marketing communications,
                  personalize your shopping experience, and improve our website
                  and services.
                </p>
                <p>
                  Your information helps us to better understand your needs and
                  preferences, allowing us to tailor our products and services to
                  better serve you. We may also use your information to detect,
                  prevent, and address technical issues, fraud, or other illegal
                  activities.
                </p>
                <p>
                  We respect your privacy choices and will only use your
                  information for the purposes described in this policy or as
                  otherwise disclosed to you at the time of collection.
                </p>
              </div>
            </div>
            <div
              className="terms-of-use-item item-scroll-target"
              id="data-protection"
            >
              <h5 className="terms-of-use-title">3. Data Protection</h5>
              <div className="terms-of-use-content">
                <p>
                  We implement appropriate technical and organizational security
                  measures to protect your personal information against
                  unauthorized access, alteration, disclosure, or destruction.
                  This includes using secure servers, encryption, and regular
                  security assessments.
                </p>
                <p>
                  However, no method of transmission over the Internet or
                  electronic storage is 100% secure. While we strive to use
                  commercially acceptable means to protect your personal
                  information, we cannot guarantee its absolute security.
                </p>
                <p>
                  You are responsible for maintaining the confidentiality of your
                  account credentials and for all activities that occur under
                  your account. Please notify us immediately if you suspect any
                  unauthorized use of your account.
                </p>
              </div>
            </div>
            <div
              className="terms-of-use-item item-scroll-target"
              id="cookies"
            >
              <h5 className="terms-of-use-title">4. Cookies</h5>
              <div className="terms-of-use-content">
                <p>
                  We use cookies and similar tracking technologies to track
                  activity on our website and hold certain information. Cookies
                  are files with a small amount of data which may include an
                  anonymous unique identifier.
                </p>
                <p>
                  You can instruct your browser to refuse all cookies or to
                  indicate when a cookie is being sent. However, if you do not
                  accept cookies, you may not be able to use some portions of our
                  website.
                </p>
                <p>
                  We use both session cookies, which expire when you close your
                  browser, and persistent cookies, which stay on your device until
                  you delete them or they expire. These cookies help us provide
                  you with a better experience on our website.
                </p>
              </div>
            </div>
            <div
              className="terms-of-use-item item-scroll-target"
              id="third-party"
            >
              <h5 className="terms-of-use-title">5. Third-Party Services</h5>
              <div className="terms-of-use-content">
                <p>
                  We may share your information with third-party service providers
                  who perform services on our behalf, such as payment processing,
                  shipping, data analysis, email delivery, and hosting services.
                  These third parties are required to maintain the confidentiality
                  of your information.
                </p>
                <p>
                  We may also share your information to comply with legal
                  obligations, respond to legal requests, protect our rights and
                  property, or prevent fraud or other illegal activities.
                </p>
                <p>
                  Our website may contain links to third-party websites. We are
                  not responsible for the privacy practices of these external
                  sites. We encourage you to review the privacy policies of any
                  third-party sites you visit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

