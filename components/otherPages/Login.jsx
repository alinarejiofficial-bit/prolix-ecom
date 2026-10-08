"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function Login() {
  const [step, setStep] = useState(1); // 1: email, 2: password/OTP, 3: complete profile
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [passwordType, setPasswordType] = useState("password");
  const [confirmPasswordType, setConfirmPasswordType] = useState("password");
  const [useOTP, setUseOTP] = useState(false);

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

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setStep(2);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (useOTP) {
      // Handle OTP verification here
      setStep(3);
    } else if (password) {
      // Handle password login here
      // For now, go to complete profile step
      setStep(3);
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (password === confirmPassword && name) {
      // Handle profile completion here
      console.log("Profile completed:", { name, email, password });
    }
  };

  const handleGoogleSignIn = () => {
    // Handle Google sign-in here
    console.log("Google sign-in clicked");
  };

  return (
    <section className="flat-spacing">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8 col-sm-10">
            <div className="login-card" style={{
              background: '#fff',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              padding: '40px',
              margin: '20px 0'
            }}>
              <div className="heading text-center mb-4">
                <h4>Sign In / Sign Up</h4>
              </div>

            {/* Step 1: Email Entry */}
            {step === 1 && (
              <form onSubmit={handleEmailSubmit} className="form-login">
                <div className="wrap">
                  <fieldset className="">
                    <input
                      className=""
                      type="email"
                      placeholder="Enter your email address*"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      tabIndex={2}
                      aria-required="true"
                      required
                    />
                  </fieldset>
                </div>
                <div className="button-submit text-end">
                  <button className="tf-btn btn-fill" type="submit" style={{ width: 'auto', padding: '12px 24px' }}>
                    <span className="text text-button">Continue</span>
                  </button>
                </div>
                <div className="divider text-center my-3" style={{ position: 'relative' }}>
                  <span style={{ 
                    background: '#fff', 
                    padding: '0 15px', 
                    color: '#666',
                    fontSize: '14px'
                  }}>or</span>
                  <hr style={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: 0, 
                    right: 0, 
                    margin: 0,
                    border: 'none',
                    borderTop: '1px solid #e0e0e0',
                    zIndex: -1
                  }} />
                </div>
                <div className="button-submit">
                  <button 
                    className="tf-btn btn-outline d-flex align-items-center justify-content-center" 
                    type="button"
                    onClick={handleGoogleSignIn}
                    style={{ width: '100%' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text text-button">Sign in with Google</span>
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Password/OTP Entry */}
            {step === 2 && (
              <form onSubmit={handlePasswordSubmit} className="form-login">
                <div className="wrap">
                  <div className="email-display mb-3 text-center">
                    <p className="mb-0">Signing in as: <strong>{email}</strong></p>
                  </div>
                  
                  {!useOTP ? (
                    <fieldset className="position-relative password-item">
                      <input
                        className="input-password"
                        type={passwordType}
                        placeholder="Enter password*"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        tabIndex={2}
                        aria-required="true"
                        required
                        style={{ paddingRight: '45px' }}
                      />
                      <span
                        className={`toggle-password ${
                          !(passwordType === "text") ? "unshow" : ""
                        }`}
                        onClick={togglePassword}
                        style={{
                          position: 'absolute',
                          right: '15px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          cursor: 'pointer',
                          zIndex: 10
                        }}
                      >
                        <i
                          className={`icon-eye-${
                            !(passwordType === "text") ? "hide" : "show"
                          }-line`}
                          style={{ fontSize: '18px', color: '#666' }}
                        />
                      </span>
                    </fieldset>
                  ) : (
                    <fieldset className="">
                      <input
                        className=""
                        type="text"
                        placeholder="Enter OTP sent to your email*"
                        name="otp"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        tabIndex={2}
                        aria-required="true"
                        required
                        style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '16px' }}
                      />
                      <div className="text-center mt-2">
                        <small className="text-muted">
                          Didn't receive OTP? 
                          <button 
                            type="button" 
                            className="btn btn-link p-0 ms-1 text-primary"
                            style={{ textDecoration: 'none', fontSize: 'inherit' }}
                          >
                            Resend
                          </button>
                        </small>
                      </div>
                    </fieldset>
                  )}
                  
                  <div className="otp-option mt-3 text-center">
                    <button
                      type="button"
                      className="btn btn-link text-primary p-0"
                      onClick={() => setUseOTP(!useOTP)}
                      style={{ textDecoration: 'none' }}
                    >
                      {useOTP ? "Use Password Instead" : "Sign in with OTP"}
                    </button>
                  </div>
                </div>
                <div className="button-submit text-end">
                  <button className="tf-btn btn-fill" type="submit" style={{ width: 'auto', padding: '12px 24px' }}>
                    <span className="text text-button">Continue</span>
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Complete Profile */}
            {step === 3 && (
              <form onSubmit={handleProfileSubmit} className="form-login">
                <div className="wrap">
                  <div className="email-display mb-4 text-center">
                    <p className="mb-0">Complete your profile for: <strong>{email}</strong></p>
                  </div>
                  
                  <fieldset className="mb-3">
                    <input
                      className=""
                      type="text"
                      placeholder="Enter your full name*"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      tabIndex={2}
                      aria-required="true"
                      required
                    />
                  </fieldset>
                  
                  <fieldset className="position-relative password-item mb-3">
                    <input
                      className="input-password"
                      type={passwordType}
                      placeholder="Enter Password*"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      tabIndex={2}
                      aria-required="true"
                      required
                      style={{ paddingRight: '50px' }}
                    />
                    <span
                      className={`toggle-password ${
                        !(passwordType === "text") ? "unshow" : ""
                      }`}
                      onClick={togglePassword}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: 'pointer',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px'
                      }}
                    >
                      <i
                        className={`icon-eye-${
                          !(passwordType === "text") ? "hide" : "show"
                        }-line`}
                        style={{ fontSize: '16px', color: '#666' }}
                      />
                    </span>
                  </fieldset>
                  
                  <fieldset className="position-relative password-item mb-3">
                    <input
                      className="input-password"
                      type={confirmPasswordType}
                      placeholder="Confirm Password*"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      tabIndex={2}
                      aria-required="true"
                      required
                      style={{ paddingRight: '50px' }}
                    />
                    <span
                      className={`toggle-password ${
                        !(confirmPasswordType === "text") ? "unshow" : ""
                      }`}
                      onClick={toggleConfirmPassword}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: 'pointer',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px'
                      }}
                    >
                      <i
                        className={`icon-eye-${
                          !(confirmPasswordType === "text") ? "hide" : "show"
                        }-line`}
                        style={{ fontSize: '16px', color: '#666' }}
                      />
                    </span>
                  </fieldset>
                  
                  {password !== confirmPassword && confirmPassword && (
                    <div className="text-center mb-3">
                      <p className="text-danger small mb-0">Passwords do not match</p>
                    </div>
                  )}
                  
                  <div className="password-requirements mb-3">
                    <small className="text-muted">
                      Password must be at least 8 characters long
                    </small>
                  </div>
                </div>
                <div className="button-submit text-end">
                  <button className="tf-btn btn-fill" type="submit" style={{ width: 'auto', padding: '12px 24px' }}>
                    <span className="text text-button">Complete Profile</span>
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
