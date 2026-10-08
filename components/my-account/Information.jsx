"use client";
import React, { useState, useEffect } from "react";
import { useContextElement } from "@/context/Context";
import { authService } from "@/services/authService";
import AccountContentShell from "@/components/my-account/AccountContentShell";
import { AccountFormSkeleton } from "@/components/common/SectionSkeletons";

export default function Information() {
  const { user, isAuthenticated, updateUser } = useContextElement();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchUserProfile = async () => {
    if (!isAuthenticated) return;

    try {
      setProfileLoading(true);
      const response = await authService.getProfile();
      const userData = response.data.user;

      setFormData({
        fullName: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
      });
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setError("Failed to load profile data");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await authService.updateProfile(
        formData.fullName.trim(),
        formData.email,
        formData.phone
      );

      if (response.success && response.data.user) {
        const updatedUserData = response.data.user;
        updateUser(updatedUserData);
        setSuccess(response.message || "Profile updated successfully!");

        setFormData({
          fullName: updatedUserData.name || "",
          email: updatedUserData.email || "",
          phone: updatedUserData.phone || "",
        });
      }
    } catch (error) {
      if (error.errors) {
        const errorMessages = [];
        Object.keys(error.errors).forEach((field) => {
          error.errors[field].forEach((msg) => {
            errorMessages.push(
              `${field.charAt(0).toUpperCase() + field.slice(1)}: ${msg}`
            );
          });
        });
        setError(
          errorMessages.join(", ") || error.message || "Failed to update profile"
        );
      } else {
        setError(error.message || "Failed to update profile");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserProfile();
    }
  }, [isAuthenticated, user]);

  if (profileLoading) {
    return (
      <AccountContentShell title="Account Details" className="account-details">
        <AccountFormSkeleton />
      </AccountContentShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <AccountContentShell title="Account Details" className="account-details">
        <div className="account-alert account-alert-error">
          <strong>Access Denied</strong>
          <span>Please log in to view your account information.</span>
        </div>
      </AccountContentShell>
    );
  }

  return (
    <AccountContentShell
      title="Account Details"
      subtitle="Update your personal information and contact details."
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

      <form onSubmit={handleSubmit} className="form-account-details">
        <div className="account-info">
          <div className="account-form-field mb_20">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              aria-required="true"
              required
            />
          </div>
          <div className="account-form-field mb_20">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              aria-required="true"
              required
            />
          </div>
          <div className="account-form-field mb_20">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              placeholder="e.g. +91 98765 43210"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              aria-required="true"
              required
            />
          </div>
        </div>
        <div className="button-submit">
          <button className="tf-btn btn-fill" type="submit" disabled={loading}>
            <span className="text text-button">
              {loading ? "Saving..." : "Save Changes"}
            </span>
          </button>
        </div>
      </form>
    </AccountContentShell>
  );
}
