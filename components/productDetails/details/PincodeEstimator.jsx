"use client";

import React, { useState, useEffect } from "react";
import { useStoreConfig } from "@/context/StoreConfigContext";

const STORAGE_KEY = "wobcart_user_pincode";

// Metro prefixes generally have faster courier delivery in India
const METRO_PREFIXES = ["11", "40", "56", "60", "50", "70", "38", "41", "68", "69"];

function calculateDeliveryEstimate(pincode) {
  const isMetro = METRO_PREFIXES.some((prefix) => pincode.startsWith(prefix));
  const minDays = isMetro ? 2 : 4;
  const maxDays = isMetro ? 4 : 7;

  const now = new Date();
  const minDate = new Date(now);
  minDate.setDate(now.getDate() + minDays);

  const maxDate = new Date(now);
  maxDate.setDate(now.getDate() + maxDays);

  const options = { weekday: "short", day: "numeric", month: "short" };
  const minFormatted = minDate.toLocaleDateString("en-IN", options);
  const maxFormatted = maxDate.toLocaleDateString("en-IN", options);

  return `${minFormatted} – ${maxFormatted}`;
}

export default function PincodeEstimator() {
  const { checkout } = useStoreConfig();
  const [pincode, setPincode] = useState("");
  const [savedPincode, setSavedPincode] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && /^[1-9][0-9]{5}$/.test(stored)) {
        setSavedPincode(stored);
        setEstimate(calculateDeliveryEstimate(stored));
      }
    } catch (_) {}
  }, []);

  const handleCheck = (e) => {
    e?.preventDefault();
    setError("");

    const cleanPin = pincode.trim();
    if (!cleanPin) {
      setError("Please enter a 6-digit pincode");
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setError("Please enter a valid 6-digit Indian pincode");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const deliveryDates = calculateDeliveryEstimate(cleanPin);
      setEstimate(deliveryDates);
      setSavedPincode(cleanPin);
      try {
        localStorage.setItem(STORAGE_KEY, cleanPin);
      } catch (_) {}
      setLoading(false);
    }, 200);
  };

  const handleReset = () => {
    setSavedPincode(null);
    setEstimate(null);
    setPincode("");
    setError("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  };

  const isCodAvailable = checkout?.codEnabled !== false;

  return (
    <div className="wc-pincode-estimator">
      <div className="wc-pincode-header">
        <span className="wc-pincode-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Delivery & Services
        </span>
      </div>

      {savedPincode && estimate ? (
        <div className="wc-pincode-result">
          <div className="wc-delivery-info">
            <p className="wc-delivery-date">
              🚚 Expected Delivery: <strong>{estimate}</strong>
            </p>
            <p className="wc-pincode-for">
              Delivering to <strong>{savedPincode}</strong>{" "}
              <button type="button" onClick={handleReset} className="wc-pincode-change-btn">
                Change
              </button>
            </p>
          </div>
          <ul className="wc-pincode-perks">
            <li>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{isCodAvailable ? "Cash on Delivery Available" : "Prepaid Secure Delivery"}</span>
            </li>
            <li>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Standard 7-Day Return / Exchange</span>
            </li>
          </ul>
        </div>
      ) : (
        <form onSubmit={handleCheck} className="wc-pincode-form">
          <div className="wc-pincode-input-group">
            <input
              type="text"
              placeholder="Enter 6-digit Pincode"
              maxLength={6}
              value={pincode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPincode(val);
                if (error) setError("");
              }}
              className={error ? "error" : ""}
            />
            <button type="submit" className="tf-btn btn-sm" disabled={loading || pincode.length !== 6}>
              {loading ? "Checking..." : "Check"}
            </button>
          </div>
          {error && <span className="wc-pincode-error">{error}</span>}
          <span className="wc-pincode-hint">Enter your delivery pincode for estimated dates & COD check</span>
        </form>
      )}
    </div>
  );
}
