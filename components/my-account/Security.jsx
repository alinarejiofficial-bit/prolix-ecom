"use client";
import React, { useState } from "react";
import { useContextElement } from "@/context/Context";
import AccountContentShell from "@/components/my-account/AccountContentShell";
import { AccountFormSkeleton } from "@/components/common/SectionSkeletons";

export default function Security() {
  const { isAuthenticated, authLoading } = useContextElement();
  const [passwordType, setPasswordType] = useState("password");
  const [confirmPasswordType, setConfirmPasswordType] = useState("password");
  const [newPasswordType, setNewPasswordType] = useState("password");

  const [formData, setFormData] = useState({
    password: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const toggleNewPassword = () => {
    setNewPasswordType((prevType) =>
      prevType === "password" ? "text" : "password"
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (formData.newPassword !== formData.confirmPassword) {
        setError("New password and confirm password do not match");
        setLoading(false);
        return;
      }

      if (formData.newPassword.length < 8) {
        setError("New password must be at least 8 characters long");
        setLoading(false);
        return;
      }

      setSuccess("Password changed successfully!");

      setFormData({
        password: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setError(error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <AccountContentShell title="Security" className="account-details">
        <AccountFormSkeleton />
      </AccountContentShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <AccountContentShell title="Security" className="account-details">
        <div className="account-alert account-alert-error">
          <strong>Access Denied</strong>
          <span>Please log in to view your security settings.</span>
        </div>
      </AccountContentShell>
    );
  }

  return (
    <AccountContentShell
      title="Security"
      subtitle="Keep your account safe by updating your password regularly."
      className="account-details"
    >
      {success && (
        <div className="account-alert account-alert-success" role="status">
          <i className="icon-check-circle" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="account-alert account-alert-error" role="alert">
          <i className="icon-alert-circle" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="form-account-details form-has-password"
      >
        <div className="account-password">
          <div className="account-form-field mb_20">
            <label htmlFor="currentPassword">Current Password</label>
            <fieldset className="position-relative password-item mb-0">
              <input
                id="currentPassword"
                className="input-password"
                type={passwordType}
                placeholder="Enter current password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                aria-required="true"
                required
              />
              <span
                className={`toggle-password ${
                  !(passwordType === "text") ? "unshow" : ""
                }`}
                onClick={togglePassword}
              >
                <i
                  className={`icon-eye-${
                    !(passwordType === "text") ? "hide" : "show"
                  }-line`}
                />
              </span>
            </fieldset>
          </div>
          <div className="account-form-field mb_20">
            <label htmlFor="newPassword">New Password</label>
            <fieldset className="position-relative password-item mb-0">
              <input
                id="newPassword"
                className="input-password"
                type={newPasswordType}
                placeholder="At least 8 characters"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                aria-required="true"
                required
              />
              <span
                className={`toggle-password ${
                  !(newPasswordType === "text") ? "unshow" : ""
                }`}
                onClick={toggleNewPassword}
              >
                <i
                  className={`icon-eye-${
                    !(newPasswordType === "text") ? "hide" : "show"
                  }-line`}
                />
              </span>
            </fieldset>
          </div>
          <div className="account-form-field">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <fieldset className="position-relative password-item mb-0">
              <input
                id="confirmPassword"
                className="input-password"
                type={confirmPasswordType}
                placeholder="Re-enter new password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                aria-required="true"
                required
              />
              <span
                className={`toggle-password ${
                  !(confirmPasswordType === "text") ? "unshow" : ""
                }`}
                onClick={toggleConfirmPassword}
              >
                <i
                  className={`icon-eye-${
                    !(confirmPasswordType === "text") ? "hide" : "show"
                  }-line`}
                />
              </span>
            </fieldset>
          </div>
        </div>
        <div className="button-submit">
          <button className="tf-btn btn-fill" type="submit" disabled={loading}>
            <span className="text text-button">
              {loading ? "Updating..." : "Update Password"}
            </span>
          </button>
        </div>
      </form>
    </AccountContentShell>
  );
}
