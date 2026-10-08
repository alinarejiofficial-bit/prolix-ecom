"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { authService } from "@/services/authService";
import { useContextElement } from "@/context/Context";
import { useStoreConfig } from "@/context/StoreConfigContext";

const OTP_RESEND_SECONDS = 60;

function formatResendCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `Resend in ${m}:${s < 10 ? "0" : ""}${s}`;
}

function getAuthCopy({ step, useOTP, hasPassword }) {
  if (step === 2) {
    const otpMode = useOTP || !hasPassword;
    return {
      title: otpMode ? "Enter the code" : "Welcome back",
      subtitle: otpMode
        ? "We sent a one-time code to your email."
        : "Enter your password to continue.",
    };
  }
  if (step === 3) {
    return {
      title: "Check your email",
      subtitle: "Enter the 6-digit code we sent to verify your address.",
    };
  }
  if (step === 4) {
    return {
      title: "Create your account",
      subtitle: "Add your name and a password to finish signing up.",
    };
  }
  if (step === 5) {
    return {
      title: "Set a password",
      subtitle: "Optional. You can skip this and keep using email codes.",
    };
  }
  return {
    title: "Sign in",
    subtitle: "Use your email to sign in or create an account.",
  };
}

export default function AuthModal({ isOpen, onClose, asPage = false }) {
  const { login } = useContextElement();
  const { auth: storeAuth } = useStoreConfig();
  const effectiveGoogleClientId = storeAuth?.googleClientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const isGoogleLoginEnabled = Boolean(storeAuth?.googleLoginEnabled && effectiveGoogleClientId);
  const [step, setStep] = useState(1); // 1: email, 2: password/OTP, 3: verify OTP (new users), 4: complete profile, 5: optional set password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [passwordType, setPasswordType] = useState("password");
  const [confirmPasswordType, setConfirmPasswordType] = useState("password");
  const [useOTP, setUseOTP] = useState(false);
  
  // New state for API integration
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userStatus, setUserStatus] = useState(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [pendingAuth, setPendingAuth] = useState(null);
  const googleSignInButtonRef = useRef(null);
  const googleSignInInitialized = useRef(false);

  useEffect(() => {
    if (otpResendCooldown <= 0) return undefined;
    const timer = setTimeout(() => {
      setOtpResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [otpResendCooldown]);

  const startOtpResendCooldown = () => {
    setOtpResendCooldown(OTP_RESEND_SECONDS);
  };

  const togglePassword = () => {
    setPasswordType((prevType) =>
      prevType === "password" ? "text" : "password"
    );
  };

  const toggleConfirmPassword = () => {
    setConfirmPasswordType((prevType) =>
      prevType === "password" ? "text" : "password"
    );
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await authService.enterEmail(email);
      
      // Handle special app_data wrapper format for enter-email endpoint
      const data = response.app_data?.data || response.data;
      
      if (data.is_new_user === true || data.exists === false) {
        // New user - OTP is automatically sent, go to verification step
        setUserStatus("new");
        setHasPassword(false);
        setOtpSent(true);
        startOtpResendCooldown();
        setStep(3); // Go to OTP verification step
      } else {
        setUserStatus("existing");
        const userHasPassword = data.has_password || false;
        setHasPassword(userHasPassword);

        if (!userHasPassword) {
          setUseOTP(true);
          await authService.requestEmailOTP(email);
          setOtpSent(true);
          startOtpResendCooldown();
          setStep(2);
        } else {
          setUseOTP(false);
          setStep(2);
        }
      }
    } catch (error) {
      // Handle validation errors
      if (error.errors && Object.keys(error.errors).length > 0) {
        const firstError = Object.values(error.errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(error.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      if (useOTP) {
        // Verify OTP for existing users (verify-email-otp handles both new and existing users)
        const response = await authService.verifyEmailOTP(email, password);
        
        // Check if response contains verification_token (new user) or user data (existing user)
        if (response.data.verification_token) {
          // This shouldn't happen for existing users, but handle it
          setError("Please complete your registration first.");
        } else if (response.data.user && response.data.access_token) {
          finishExistingUserLogin(response.data.user, response.data.access_token);
        } else {
          setError("Unexpected response from server. Please try again.");
        }
      } else {
        // Login with password
        const response = await authService.loginWithPassword(email, password);
        if (response.data.user && response.data.access_token) {
          login(response.data.user, response.data.access_token);
          onClose();
        } else {
          setError("Unexpected response from server. Please try again.");
        }
      }
    } catch (error) {
      // Handle validation errors
      if (error.errors && Object.keys(error.errors).length > 0) {
        const firstError = Object.values(error.errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(error.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!name || !password) {
      setError("Please fill in all required fields");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await authService.completeProfile(
        verificationToken,
        email,
        name,
        password,
        confirmPassword
      );
      if (response.data.user && response.data.access_token) {
        login(response.data.user, response.data.access_token);
        onClose();
      } else {
        setError("Unexpected response from server. Please try again.");
      }
    } catch (error) {
      // Handle validation errors
      if (error.errors && Object.keys(error.errors).length > 0) {
        const firstError = Object.values(error.errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(error.message || "Profile completion failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await authService.requestEmailOTP(email);
      setOtpSent(true);
      setSuccess("We've sent a code to your email.");
      startOtpResendCooldown();
    } catch (error) {
      // Handle rate limiting and validation errors
      if (error.statusCode === 429) {
        setError("Please wait before requesting another OTP");
      } else if (error.errors && Object.keys(error.errors).length > 0) {
        const firstError = Object.values(error.errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(error.message || "Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    if (!password) return;
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      // For new users, verifyEmailOTP returns verification_token
      // For existing users, it would return user data (but we handle existing users in step 2)
      const response = await authService.verifyEmailOTP(email, password);
      
      // Check if response contains verification_token (new user) or user data (existing user)
      if (response.data.verification_token) {
        // New user - store verification token and go to profile completion
        setVerificationToken(response.data.verification_token);
        // Clear password fields before moving to profile completion step
        setPassword("");
        setConfirmPassword("");
        setStep(4); // Go to profile completion step
      } else if (response.data.user && response.data.access_token) {
        finishExistingUserLogin(response.data.user, response.data.access_token);
      } else {
        setError("Unexpected response from server. Please try again.");
      }
    } catch (error) {
      // Handle validation errors
      if (error.errors && Object.keys(error.errors).length > 0) {
        const firstError = Object.values(error.errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(error.message || "OTP verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpResendCooldown > 0) return;

    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await authService.resendEmailOTP(email);
      setSuccess("A new code is on its way.");
      startOtpResendCooldown();
    } catch (error) {
      // Handle rate limiting and validation errors
      if (error.statusCode === 429) {
        setError("Please wait before requesting another OTP");
      } else if (error.errors && Object.keys(error.errors).length > 0) {
        const firstError = Object.values(error.errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(error.message || "Failed to resend OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const finishExistingUserLogin = (user, accessToken) => {
    authService.storeAuthData({ user, access_token: accessToken });
    login(user, accessToken);

    if (user?.can_set_password) {
      setPendingAuth({ user, access_token: accessToken });
      setPassword("");
      setConfirmPassword("");
      setStep(5);
      setSuccess("You're signed in. Set a password for faster login next time, or skip.");
      return;
    }

    onClose();
  };

  const handleSetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await authService.setPassword(password, confirmPassword);
      if (response.data?.user) {
        login(response.data.user, pendingAuth?.access_token || localStorage.getItem("access_token"));
      }
      onClose();
    } catch (error) {
      if (error.errors && Object.keys(error.errors).length > 0) {
        const firstError = Object.values(error.errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(error.message || "Failed to set password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleSignInCallback = useCallback(async (response) => {
    if (!response.credential) {
      setError("Google sign-in failed. Please try again.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Use the ID token method (recommended - more secure)
      const apiResponse = await authService.googleSignIn(response.credential);
      
      if (apiResponse.data.user && apiResponse.data.access_token) {
        login(apiResponse.data.user, apiResponse.data.access_token);
        onClose();
      } else {
        setError("Unexpected response from server. Please try again.");
      }
    } catch (error) {
      // Handle validation errors
      if (error.errors && Object.keys(error.errors).length > 0) {
        const firstError = Object.values(error.errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(error.message || "Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [login, onClose]);

  // Initialize Google Sign-In
  useEffect(() => {
    if (!isOpen || step !== 1 || !isGoogleLoginEnabled || !effectiveGoogleClientId) return;

    // Reset initialization flag when modal opens
    googleSignInInitialized.current = false;

    let retryCount = 0;
    const maxRetries = 50; // Maximum 5 seconds (50 * 100ms)
    let retryTimeoutId = null;

    // Load Google Identity Services script
    const loadGoogleScript = () => {
      if (window.google && window.google.accounts) {
        attemptInitialize();
        return;
      }

      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.addEventListener('load', attemptInitialize);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        attemptInitialize();
      };
      script.onerror = () => {
        console.error('Failed to load Google Sign-In script');
      };
      document.head.appendChild(script);
    };

    const attemptInitialize = () => {
      if (retryCount >= maxRetries) {
        return;
      }

      if (!window.google || !window.google.accounts) {
        retryCount++;
        retryTimeoutId = setTimeout(attemptInitialize, 100);
        return;
      }

      if (!googleSignInButtonRef.current) {
        retryCount++;
        retryTimeoutId = setTimeout(attemptInitialize, 100);
        return;
      }

      try {
        if (googleSignInInitialized.current) return;

        if (googleSignInButtonRef.current.innerHTML.trim() !== '') {
          googleSignInButtonRef.current.innerHTML = '';
        }

        window.google.accounts.id.initialize({
          client_id: effectiveGoogleClientId,
          callback: handleGoogleSignInCallback,
        });

        window.google.accounts.id.renderButton(
          googleSignInButtonRef.current,
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            locale: 'en',
          }
        );

        googleSignInInitialized.current = true;
      } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          retryTimeoutId = setTimeout(attemptInitialize, 500);
        }
      }
    };

    // Start the initialization process
    // Use requestAnimationFrame to ensure DOM is ready and reduce flickering
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        loadGoogleScript();
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
    };
  }, [isOpen, step, handleGoogleSignInCallback]); // Also depend on step to re-initialize when returning to step 1

  const handleGoogleSignIn = () => {
    // Trigger Google Sign-In button click programmatically
    if (googleSignInButtonRef.current) {
      const button = googleSignInButtonRef.current.querySelector('div[role="button"]');
      if (button) {
        button.click();
      }
    }
  };

  const resetForm = () => {
    // Batch all state updates together to prevent multiple re-renders
    setStep(1);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setUseOTP(false);
    setLoading(false);
    setError("");
    setSuccess("");
    setUserStatus(null);
    setHasPassword(false);
    setVerificationToken("");
    setOtpSent(false);
    setOtpResendCooldown(0);
    setPendingAuth(null);
    // Reset Google Sign-In initialization when modal closes
    googleSignInInitialized.current = false;
  };

  const goBackToEmail = () => {
    setStep(1);
    setPassword("");
    setConfirmPassword("");
    setName("");
    setUseOTP(false);
    setLoading(false);
    setError("");
    setSuccess("");
    setUserStatus(null);
    setHasPassword(false);
    setVerificationToken("");
    setOtpSent(false);
    setOtpResendCooldown(0);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();

      if (asPage) return undefined;

      const originalStyle = window.getComputedStyle(document.body).overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalStyle;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }

    if (googleSignInButtonRef.current) {
      googleSignInButtonRef.current.innerHTML = "";
    }
    googleSignInInitialized.current = false;
  }, [isOpen, asPage]);

  if (!isOpen) return null;

  const { title: authTitle, subtitle: authSubtitle } = getAuthCopy({
    step,
    useOTP,
    hasPassword,
  });

  const renderIdentity = (allowChange = true) => (
    <div className="auth-identity">
      <span>{email}</span>
      {allowChange && (
        <button type="button" className="auth-text-btn" onClick={goBackToEmail}>
          Change
        </button>
      )}
    </div>
  );

  return (
    <div
      className={asPage ? "auth-page-wrap" : "auth-modal-overlay"}
      onClick={asPage ? undefined : onClose}
    >
      <div
        className={`auth-modal-container${asPage ? " auth-page-card" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {!asPage && <div className="auth-modal-drag-handle" />}
        <div className="auth-modal-header">
          <div className="auth-header-copy">
            <h4>{authTitle}</h4>
            {authSubtitle && <p>{authSubtitle}</p>}
          </div>
          {!asPage && (
            <button className="auth-modal-close" onClick={onClose} aria-label="Close">
              <i className="icon-close" />
            </button>
          )}
        </div>

        <div className="auth-modal-body">
          {error && (
            <div className="auth-error-message" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-success-message" role="status">
              {success}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="auth-form">
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="auth-email">
                  Email
                </label>
                <div className="auth-input-container">
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="email-input"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-button-group">
                <button className="auth-btn auth-btn-primary" type="submit" disabled={loading}>
                  {loading ? "Checking..." : "Continue"}
                </button>
              </div>

              {isGoogleLoginEnabled && (
                <div className="auth-button-group">
                  <div className="auth-divider">
                    <span>or</span>
                  </div>
                  <div ref={googleSignInButtonRef} className="google-sign-in-container" />
                </div>
              )}
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handlePasswordSubmit} className="auth-form">
              <div className="auth-form-group">
                {renderIdentity()}

                {!hasPassword || useOTP ? (
                  <div className="auth-input-container">
                    <label className="auth-label" htmlFor="auth-otp">
                      One-time code
                    </label>
                    <input
                      id="auth-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="6-digit code"
                      value={password}
                      onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="otp-input"
                      required
                      maxLength="6"
                    />
                    <div className="otp-resend">
                      Didn't get it?
                      <button
                        type="button"
                        className="auth-text-btn"
                        onClick={handleResendOTP}
                        disabled={loading || otpResendCooldown > 0}
                      >
                        {otpResendCooldown > 0 ? formatResendCountdown(otpResendCooldown) : "Resend"}
                      </button>
                    </div>
                    {hasPassword ? (
                      <div className="auth-toggle-option">
                        <button
                          type="button"
                          className="auth-text-btn"
                          onClick={() => {
                            setUseOTP(false);
                            setSuccess("");
                          }}
                        >
                          Use password instead
                        </button>
                      </div>
                    ) : (
                      <p className="auth-hint">
                        This account doesn't have a password yet. Use the email code, or sign in with Google.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="auth-input-container">
                    <label className="auth-label" htmlFor="auth-password">
                      Password
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        id="auth-password"
                        type={passwordType}
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="password-input"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={togglePassword}
                        aria-label={passwordType === "text" ? "Hide password" : "Show password"}
                      >
                        <i className={`icon-eye-${passwordType === "text" ? "show" : "hide"}-line`} />
                      </button>
                    </div>
                    <div className="auth-toggle-option">
                      <button
                        type="button"
                        className="auth-text-btn"
                        onClick={async () => {
                          setUseOTP(true);
                          setError("");
                          setSuccess("");
                          try {
                            setLoading(true);
                            await authService.requestEmailOTP(email);
                            setSuccess("We've sent a code to your email.");
                            startOtpResendCooldown();
                          } catch (error) {
                            if (error.statusCode === 429) {
                              setError("Please wait before requesting another code");
                            } else if (error.errors && Object.keys(error.errors).length > 0) {
                              const firstError = Object.values(error.errors)[0];
                              setError(Array.isArray(firstError) ? firstError[0] : firstError);
                            } else {
                              setError(error.message || "Failed to send code. Please try again.");
                            }
                            setUseOTP(false);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                      >
                        {loading ? "Sending code..." : "Sign in with email code"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="auth-button-group">
                <button className="auth-btn auth-btn-primary" type="submit" disabled={loading}>
                  {loading ? "Signing in..." : "Continue"}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleOTPVerification} className="auth-form">
              <div className="auth-progress" aria-hidden="true">
                <span className="is-active">Verify</span>
                <span>Profile</span>
              </div>
              <div className="auth-form-group">
                {renderIdentity()}
                <div className="auth-input-container">
                  <label className="auth-label" htmlFor="auth-verify-otp">
                    One-time code
                  </label>
                  <input
                    id="auth-verify-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    value={password}
                    onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="otp-input"
                    required
                    maxLength="6"
                  />
                  <div className="otp-resend">
                    Didn't get it?
                    <button
                      type="button"
                      className="auth-text-btn"
                      onClick={handleResendOTP}
                      disabled={loading || otpResendCooldown > 0}
                    >
                      {otpResendCooldown > 0 ? formatResendCountdown(otpResendCooldown) : "Resend"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="auth-button-group">
                <button className="auth-btn auth-btn-primary" type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify"}
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={handleProfileSubmit} className="auth-form">
              <div className="auth-progress" aria-hidden="true">
                <span className="is-done">Verify</span>
                <span className="is-active">Profile</span>
              </div>
              <div className="auth-form-group">
                {renderIdentity()}
                <div className="auth-input-container">
                  <label className="auth-label" htmlFor="auth-name">
                    Full name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="name-input"
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="auth-input-container">
                  <label className="auth-label" htmlFor="auth-create-password">
                    Password
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="auth-create-password"
                      type={passwordType}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="password-input"
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={togglePassword}
                      aria-label={passwordType === "text" ? "Hide password" : "Show password"}
                    >
                      <i className={`icon-eye-${passwordType === "text" ? "show" : "hide"}-line`} />
                    </button>
                  </div>
                </div>
                <div className="auth-input-container">
                  <label className="auth-label" htmlFor="auth-confirm-password">
                    Confirm password
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="auth-confirm-password"
                      type={confirmPasswordType}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="password-input"
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={toggleConfirmPassword}
                      aria-label={confirmPasswordType === "text" ? "Hide password" : "Show password"}
                    >
                      <i className={`icon-eye-${confirmPasswordType === "text" ? "show" : "hide"}-line`} />
                    </button>
                  </div>
                </div>
                {password !== confirmPassword && confirmPassword && (
                  <p className="auth-inline-error">Passwords do not match</p>
                )}
              </div>
              <div className="auth-button-group">
                <button className="auth-btn auth-btn-primary" type="submit" disabled={loading}>
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </div>
            </form>
          )}

          {step === 5 && (
            <form onSubmit={handleSetPasswordSubmit} className="auth-form">
              <div className="auth-form-group">
                {renderIdentity(false)}
                <div className="auth-input-container">
                  <label className="auth-label" htmlFor="auth-new-password">
                    New password
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="auth-new-password"
                      type={passwordType}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="password-input"
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={togglePassword}
                      aria-label={passwordType === "text" ? "Hide password" : "Show password"}
                    >
                      <i className={`icon-eye-${passwordType === "text" ? "show" : "hide"}-line`} />
                    </button>
                  </div>
                </div>
                <div className="auth-input-container">
                  <label className="auth-label" htmlFor="auth-confirm-optional">
                    Confirm password
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="auth-confirm-optional"
                      type={confirmPasswordType}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="password-input"
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={toggleConfirmPassword}
                      aria-label={confirmPasswordType === "text" ? "Hide password" : "Show password"}
                    >
                      <i className={`icon-eye-${confirmPasswordType === "text" ? "show" : "hide"}-line`} />
                    </button>
                  </div>
                </div>
                {password !== confirmPassword && confirmPassword && (
                  <p className="auth-inline-error">Passwords do not match</p>
                )}
              </div>
              <div className="auth-button-group">
                <button className="auth-btn auth-btn-primary" type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save password"}
                </button>
              </div>
              <div className="auth-button-group">
                <button
                  type="button"
                  className="auth-text-btn auth-skip"
                  onClick={onClose}
                  disabled={loading}
                >
                  Skip for now
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .auth-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
          overscroll-behavior: contain;
        }

        .auth-page-wrap {
          position: relative;
          display: flex;
          justify-content: center;
          padding: 32px 16px 72px;
          background: transparent;
          z-index: 1;
        }

        .auth-page-card {
          box-shadow: none;
          border: 1px solid var(--line, #e9e9e9);
          animation: none;
          max-height: none;
        }

        .auth-modal-container {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 16px 40px rgba(24, 24, 24, 0.12);
          width: 100%;
          max-width: 420px;
          max-height: 90vh;
          overflow-y: auto;
          overflow-x: hidden;
          position: relative;
          animation: slideUp 0.3s ease-out;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }

        .auth-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 28px 28px 20px;
          border-bottom: 1px solid var(--line, #e9e9e9);
        }

        .auth-header-copy {
          min-width: 0;
        }

        .auth-header-copy h4 {
          margin: 0;
          font-size: 22px;
          font-weight: 600;
          line-height: 1.3;
          letter-spacing: -0.02em;
          color: var(--main, #181818);
        }

        .auth-header-copy p {
          margin: 8px 0 0;
          font-size: 14px;
          line-height: 1.5;
          color: #6c6d70;
        }

        .auth-modal-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #8a8b8f;
          padding: 4px;
          border-radius: 4px;
          line-height: 1;
        }

        .auth-modal-close:hover {
          color: var(--main, #181818);
          background-color: #f5f5f5;
        }

        .auth-modal-body {
          padding: 24px 28px 28px;
        }

        .auth-form-group {
          margin-bottom: 20px;
        }

        .auth-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--main, #181818);
          margin-bottom: 8px;
          letter-spacing: 0.02em;
        }

        .auth-input-container {
          margin-bottom: 16px;
        }

        .auth-identity {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
          color: var(--main, #181818);
          word-break: break-all;
        }

        .auth-progress {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #b0b1b4;
        }

        .auth-progress span.is-active {
          color: var(--main, #181818);
        }

        .auth-progress span.is-done {
          color: #8a8b8f;
        }

        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .auth-input-container input,
        .password-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid var(--line, #e9e9e9);
          border-radius: 10px;
          font-size: 15px;
          color: var(--main, #181818);
          background: #fff;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }

        .password-input {
          padding-right: 44px;
        }

        .auth-input-container input:focus,
        .password-input:focus {
          outline: none;
          border-color: var(--primary, #181818);
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #8a8b8f;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          padding: 0;
        }

        .otp-input {
          text-align: center;
          letter-spacing: 0.35em;
          font-size: 20px;
          font-weight: 500;
        }

        .otp-resend,
        .auth-toggle-option,
        .auth-hint,
        .auth-inline-error {
          margin-top: 10px;
          font-size: 13px;
          color: #6c6d70;
        }

        .auth-inline-error {
          color: #c92a2a;
          margin-bottom: 0;
        }

        .auth-hint {
          margin-bottom: 0;
          line-height: 1.5;
        }

        .auth-text-btn {
          background: none;
          border: none;
          padding: 0;
          margin-left: 6px;
          color: var(--main, #181818);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .auth-text-btn:disabled {
          color: #b0b1b4;
          cursor: not-allowed;
          text-decoration: none;
        }

        .auth-skip {
          display: block;
          width: 100%;
          margin: 0;
          text-align: center;
          font-size: 14px;
        }

        .auth-button-group {
          margin-bottom: 12px;
        }

        .auth-btn {
          width: 100%;
          padding: 14px 24px;
          border: none;
          border-radius: 99px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .auth-btn-primary {
          background: var(--primary, #181818);
          color: #fff;
        }

        .auth-btn-primary:hover:not(:disabled) {
          background: #333;
        }

        .auth-btn-primary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .google-sign-in-container {
          width: 100%;
          display: flex;
          justify-content: center;
          min-height: 40px;
        }

        .google-sign-in-container > div,
        .google-sign-in-container iframe {
          width: 100% !important;
        }

        .auth-divider {
          text-align: center;
          margin: 8px 0 16px;
          position: relative;
        }

        .auth-divider::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--line, #e9e9e9);
        }

        .auth-divider span {
          position: relative;
          background: #fff;
          padding: 0 12px;
          color: #8a8b8f;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .auth-error-message,
        .auth-success-message {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .auth-error-message {
          background: rgba(240, 62, 62, 0.08);
          color: #c92a2a;
          border: 1px solid rgba(240, 62, 62, 0.2);
        }

        .auth-success-message {
          background: rgba(61, 171, 37, 0.08);
          color: #2d8a1c;
          border: 1px solid rgba(61, 171, 37, 0.2);
        }

        .auth-modal-drag-handle {
          display: none;
        }

        @media (max-width: 768px) {
          .auth-modal-overlay {
            align-items: flex-end;
            padding: 0;
          }

          .auth-modal-drag-handle {
            display: block;
            width: 40px;
            height: 4px;
            background: #e0e0e0;
            border-radius: 2px;
            margin: 12px auto 0;
          }

          .auth-modal-container {
            border-radius: 20px 20px 0 0;
            max-width: 100%;
            max-height: calc(90vh - env(safe-area-inset-bottom));
            animation: slideUpMobile 0.3s cubic-bezier(0.32, 0.72, 0, 1);
          }

          .auth-modal-header {
            padding: 16px 20px 16px;
            position: sticky;
            top: 0;
            background: #fff;
            z-index: 1;
          }

          .auth-modal-body {
            padding: 20px 20px calc(20px + env(safe-area-inset-bottom));
          }

          .auth-header-copy h4 {
            font-size: 20px;
          }
        }

        @keyframes slideUpMobile {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
