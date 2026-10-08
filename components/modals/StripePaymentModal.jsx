"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { cartService } from "@/services/cartService";
import { showToast } from "@/utlis/showToast";

// Stripe Payment Form Component
function StripePaymentForm({ 
  clientSecret, 
  publishableKey, 
  onSuccess, 
  onError,
  amount,
  currency = "inr"
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [hasAttemptedPayment, setHasAttemptedPayment] = useState(false);

  useEffect(() => {
    if (!stripe || hasAttemptedPayment) {
      return;
    }

    const clientSecretParam = clientSecret;

    if (!clientSecretParam) {
      setMessage("Missing client secret");
      return;
    }

    // Only check payment intent status if payment has been attempted
    // Don't show error on initial load - "requires_payment_method" is the normal initial state
    stripe.retrievePaymentIntent(clientSecretParam).then(({ paymentIntent }) => {
      // Only show messages for non-initial states
      if (paymentIntent.status === "succeeded") {
        setMessage("Payment succeeded!");
      } else if (paymentIntent.status === "processing") {
        setMessage("Your payment is processing.");
      }
      // Don't show error for "requires_payment_method" on initial load
      // This is the normal state before payment is attempted
    }).catch((error) => {
      console.error("Error retrieving payment intent:", error);
      // Don't show error on initial load
    });
  }, [stripe, clientSecret, hasAttemptedPayment]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);
    setHasAttemptedPayment(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: "if_required",
      });

      if (error) {
        // Show specific error message from Stripe
        setMessage(error.message || "Your payment was not successful, please try again.");
        setIsProcessing(false);
        if (onError) {
          onError(error);
        }
      } else if (paymentIntent) {
        // Check payment intent status
        if (paymentIntent.status === "succeeded") {
          setMessage("Payment succeeded!");
          if (onSuccess) {
            onSuccess(paymentIntent);
          }
        } else if (paymentIntent.status === "processing") {
          setMessage("Your payment is processing.");
          setIsProcessing(false);
        } else if (paymentIntent.status === "requires_payment_method") {
          setMessage("Your payment was not successful, please try again.");
          setIsProcessing(false);
        } else if (paymentIntent.status === "requires_action") {
          // Payment requires additional action (e.g., 3D Secure)
          setMessage("Please complete the authentication to continue.");
          setIsProcessing(false);
        } else {
          setMessage(`Payment status: ${paymentIntent.status}. Please try again.`);
          setIsProcessing(false);
        }
      } else {
        setMessage("Unexpected payment status. Please try again.");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setMessage(err.message || "An error occurred during payment. Please try again.");
      setIsProcessing(false);
      setHasAttemptedPayment(true);
      if (onError) {
        onError(err);
      }
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement
        id="payment-element"
        options={{
          layout: "tabs",
        }}
      />
      {message && (
        <div
          id="payment-message"
          className={`mt-3 p-3 rounded ${
            message.includes("succeeded")
              ? "bg-success text-white"
              : message.includes("error") || 
                message.includes("not successful") || 
                message.includes("failed") ||
                message.includes("try again")
              ? "bg-danger text-white"
              : message.includes("processing") || message.includes("authentication")
              ? "bg-info text-white"
              : "bg-warning text-dark"
          }`}
          style={{ fontSize: "14px", fontWeight: "500" }}
        >
          {message}
        </div>
      )}
      <button
        disabled={isProcessing || !stripe || !elements}
        id="submit"
        className="tf-btn btn-fill w-100 mt-4"
        style={{
          padding: "14px 24px",
          fontSize: "16px",
          fontWeight: "600",
          borderRadius: "4px",
          opacity: isProcessing || !stripe || !elements ? 0.6 : 1,
          cursor: isProcessing || !stripe || !elements ? "not-allowed" : "pointer",
        }}
      >
        <span id="button-text">
          {isProcessing ? "Processing..." : `Pay ₹${(amount / 100).toFixed(2)}`}
        </span>
      </button>
    </form>
  );
}

// Main Stripe Payment Modal Component
export default function StripePaymentModal({
  isOpen,
  onClose,
  paymentData,
  onPaymentSuccess,
}) {
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [options, setOptions] = useState(null);

  // Handle body scroll lock when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && paymentData) {
      // Initialize Stripe with publishable key
      if (paymentData.publishable_key) {
        // loadStripe returns a Promise, so we set it directly (Elements component handles the Promise)
        const stripePromise = loadStripe(paymentData.publishable_key);
        setStripePromise(stripePromise);

        // Set client secret and options
        if (paymentData.client_secret) {
          setClientSecret(paymentData.client_secret);
          setOptions({
            clientSecret: paymentData.client_secret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#0570de",
                colorBackground: "#ffffff",
                colorText: "#30313d",
                borderRadius: "8px",
              },
            },
          });
        }
      }
    } else {
      // Reset when modal closes
      setStripePromise(null);
      setClientSecret(null);
      setOptions(null);
    }
  }, [isOpen, paymentData]);

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Verify payment with backend
      const verifyResponse = await cartService.verifyStripePayment(
        paymentIntent.id,
        paymentData.transaction_uuid
      );

      if (verifyResponse.success) {
        showToast("Payment successful! Order placed.", "success");
        if (onPaymentSuccess) {
          onPaymentSuccess(verifyResponse);
        }
        onClose();
      } else {
        showToast("Payment verification failed", "danger");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      showToast(
        error.message || "Failed to verify payment. Please contact support.",
        "danger"
      );
    }
  };

  const handleError = (error) => {
    console.error("Stripe payment error:", error);
    showToast(error.message || "Payment failed. Please try again.", "danger");
  };

  if (!isOpen || !paymentData) {
    return null;
  }

  return (
    <>
      {/* Modal Backdrop */}
      {isOpen && (
        <div
          className="modal-backdrop show"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1040,
          }}
          onClick={onClose}
        />
      )}

      {/* Modal */}
      <div
        className="modal show"
        style={{
          display: isOpen ? "block" : "none",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1050,
          overflow: "auto",
        }}
        tabIndex="-1"
      >
        <div
          className="modal-dialog modal-dialog-centered modal-lg"
          style={{ margin: "auto", maxWidth: "600px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content" style={{ borderRadius: "8px" }}>
            <div className="modal-header" style={{ borderBottom: "1px solid #e0e0e0" }}>
              <h5 className="modal-title" style={{ fontWeight: "600" }}>
                Complete Payment
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              />
            </div>
            <div className="modal-body" style={{ padding: "24px" }}>
              {stripePromise && options && clientSecret ? (
                <Elements stripe={stripePromise} options={options}>
                  <StripePaymentForm
                    clientSecret={clientSecret}
                    publishableKey={paymentData.publishable_key}
                    onSuccess={handlePaymentSuccess}
                    onError={handleError}
                    amount={paymentData.amount || 0}
                    currency={paymentData.currency || "inr"}
                  />
                </Elements>
              ) : (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading payment form...</span>
                  </div>
                  <p className="mt-3 text-muted">Initializing payment...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

