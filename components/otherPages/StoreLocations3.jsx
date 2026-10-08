"use client";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { contactService } from "@/services/contactService";
import { showToast } from "@/utlis/showToast";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { sanitizePublicValue } from "@/utils/brand";

function formatWhatsapp(value) {
  const text = sanitizePublicValue(value);
  if (!text) return null;
  const digits = text.replace(/\D/g, "");
  if (/^https?:\/\//i.test(text) || /wa\.me|whatsapp/i.test(text)) {
    const href = text.startsWith("http") ? text : `https://${text.replace(/^\/\//, "")}`;
    return { href, label: digits ? `+${digits}` : text };
  }
  return {
    href: `https://wa.me/${digits || text.replace(/^\+/, "")}`,
    label: text.startsWith("+") ? text : `+${text}`,
  };
}

export default function StoreLocations3() {
  const formRef = useRef();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [contactInfo, setContactInfo] = useState(null);
  const { isModuleEnabled, contact: storeContact, social: storeSocial } = useStoreConfig();
  
  // Controlled strictly by the "Contact Messages" toggle in Admin Panel > Customers
  const canSubmitContact = isModuleEnabled("contact_messages");

  useEffect(() => {
    let isMounted = true;
    const fetchContactInfo = async () => {
      try {
        const response = await contactService.getContactInfo();
        if (isMounted && response?.success && response?.data) {
          setContactInfo(response.data);
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
      }
    };

    fetchContactInfo();
    return () => {
      isMounted = false;
    };
  }, []);

  const details = useMemo(() => {
    const phone =
      sanitizePublicValue(storeContact?.phone) ||
      sanitizePublicValue(contactInfo?.contact_details?.phone);
    const email =
      sanitizePublicValue(storeContact?.email) ||
      sanitizePublicValue(contactInfo?.contact_details?.email);
    const address =
      sanitizePublicValue(storeContact?.address) ||
      sanitizePublicValue(contactInfo?.contact_details?.address);
    const whatsapp = formatWhatsapp(
      storeContact?.whatsapp ||
        storeSocial?.whatsapp ||
        contactInfo?.contact_details?.whatsapp ||
        contactInfo?.social_media?.whatsapp,
    );
    return { phone, email, address, whatsapp };
  }, [storeContact, storeSocial, contactInfo]);

  const hasDetails = Boolean(
    details.phone || details.email || details.address || details.whatsapp,
  );

  const sendMail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData(formRef.current);
    const data = {
      name: formData.get("name")?.trim() || "",
      email: formData.get("email")?.trim() || "",
      phone: formData.get("phone")?.trim() || "",
      message: formData.get("message")?.trim() || "",
    };

    try {
      const response = await contactService.submitContact(data);

      if (response?.success) {
        showToast(
          response.message ||
            "Thank you for contacting us! We will get back to you soon.",
          "success",
        );
        if (formRef.current) formRef.current.reset();
      } else {
        showToast(response?.message || "Failed to send message.", "error");
      }
    } catch (error) {
      if (error.statusCode === 422 && error.errors) {
        setErrors(error.errors);
        const errorMessages = Object.values(error.errors).flat().join(", ");
        showToast(
          errorMessages || "Validation failed. Please check your input.",
          "error",
        );
      } else {
        showToast(
          error.message || "Something went wrong. Please try again.",
          "error",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flat-spacing wc-contact">
      <div className="container">
        <div className="wc-section-head">
          <h2>Get in touch</h2>
          <p>
            {canSubmitContact
              ? "Send a message or reach us using the details below"
              : "Reach us using the contact details below"}
          </p>
        </div>
        <div className={`wc-contact-grid ${canSubmitContact ? "" : "is-info-only"}`}>
          <div className="wc-contact-details">
            <h3>Information</h3>
            {details.phone && (
              <div className="wc-contact-row">
                <span>Phone</span>
                <a href={`tel:${details.phone}`}>{details.phone}</a>
              </div>
            )}
            {details.whatsapp && (
              <div className="wc-contact-row">
                <span>WhatsApp</span>
                <a
                  href={details.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {details.whatsapp.label}
                </a>
              </div>
            )}
            {details.email && (
              <div className="wc-contact-row">
                <span>Email</span>
                <a href={`mailto:${details.email}`}>{details.email}</a>
              </div>
            )}
            {details.address && (
              <div className="wc-contact-row">
                <span>Address</span>
                <p>{details.address}</p>
              </div>
            )}
            {!hasDetails && (
              <p className="text-secondary mb_0">
                Store contact details have not been published yet.
              </p>
            )}
          </div>

          {canSubmitContact ? (
            <form
              onSubmit={sendMail}
              ref={formRef}
              id="contactform"
              className="wc-contact-form"
            >
              <fieldset>
                <input
                  className={errors.name ? "error" : ""}
                  type="text"
                  placeholder="Your name*"
                  name="name"
                  id="name"
                  required
                  maxLength={255}
                />
                {errors.name && (
                  <div className="error-message">
                    {Array.isArray(errors.name) ? errors.name[0] : errors.name}
                  </div>
                )}
              </fieldset>
              <fieldset>
                <input
                  className={errors.email ? "error" : ""}
                  type="email"
                  placeholder="Your email*"
                  name="email"
                  id="email"
                  required
                  maxLength={255}
                />
                {errors.email && (
                  <div className="error-message">
                    {Array.isArray(errors.email) ? errors.email[0] : errors.email}
                  </div>
                )}
              </fieldset>
              <fieldset>
                <input
                  type="tel"
                  placeholder="Phone number (optional)"
                  name="phone"
                  id="phone"
                  maxLength={30}
                />
              </fieldset>
              <fieldset>
                <textarea
                  name="message"
                  id="message"
                  rows={5}
                  placeholder="Your message*"
                  required
                  minLength={10}
                  className={errors.message ? "error" : ""}
                />
                {errors.message && (
                  <div className="error-message">
                    {Array.isArray(errors.message)
                      ? errors.message[0]
                      : errors.message}
                  </div>
                )}
              </fieldset>
              <button className="tf-btn btn-fill" type="submit" disabled={loading}>
                <span className="text text-button">
                  {loading ? "Sending..." : "Send message"}
                </span>
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
}
