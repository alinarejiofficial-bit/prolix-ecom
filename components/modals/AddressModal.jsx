"use client";
import React, { useState, useEffect } from "react";
import { addressService } from "@/services/addressService";
import { showToast } from "@/utlis/showToast";
import SearchableSelect from "@/components/common/SearchableSelect";

export default function AddressModal({ 
  isOpen, 
  onClose, 
  address = null, 
  onSuccess 
}) {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state_id: "",
    postal_code: "",
    country_id: "",
    landmark: "",
    address_type: "home",
    is_default: false,
  });

  // Initialize form when address is provided (edit mode) or modal opens
  useEffect(() => {
    if (isOpen) {
      if (address) {
        // Edit mode - populate form with address data
        setFormData({
          full_name: address.full_name || "",
          phone: address.phone || "",
          email: address.email || "",
          address_line1: address.address_line1 || "",
          address_line2: address.address_line2 || "",
          city: address.city || "",
          state_id: address.state_id || "",
          postal_code: address.postal_code || "",
          country_id: address.country_id || "",
          landmark: address.landmark || "",
          address_type: address.address_type || "home",
          is_default: address.is_default || false,
        });
        // Load states if country is selected
        if (address.country_id) {
          fetchStates(address.country_id);
        }
      } else {
        // Add mode - reset form
        setFormData({
          full_name: "",
          phone: "",
          email: "",
          address_line1: "",
          address_line2: "",
          city: "",
          state_id: "",
          postal_code: "",
          country_id: "",
          landmark: "",
          address_type: "home",
          is_default: false,
        });
        setStates([]);
      }
      setFormErrors({});
    }
  }, [isOpen, address]);

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (formData.country_id) {
      fetchStates(formData.country_id);
    } else {
      setStates([]);
      setFormData((prev) => ({ ...prev, state_id: "" }));
    }
  }, [formData.country_id]);

  const fetchCountries = async () => {
    try {
      const response = await addressService.getCountries();
      if (response.success && response.data) {
        setCountries(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  const fetchStates = async (countryId) => {
    if (!countryId) {
      setStates([]);
      return;
    }
    try {
      const response = await addressService.getStatesByCountry(countryId);
      if (response.success && response.data) {
        setStates(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
      setStates([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormErrors({});

    const payload = {
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim(),
      address_line1: formData.address_line1.trim(),
      city: formData.city.trim(),
      postal_code: formData.postal_code.trim(),
      country_id: parseInt(formData.country_id),
      address_type: formData.address_type,
      is_default: formData.is_default,
    };

    if (formData.email.trim()) {
      payload.email = formData.email.trim();
    }
    if (formData.address_line2.trim()) {
      payload.address_line2 = formData.address_line2.trim();
    }
    // State is required when states are available for the selected country
    if (states.length > 0) {
      if (!formData.state_id) {
        setLoading(false);
        setFormErrors({ state_id: ["State is required"] });
        showToast("Please select a state", "warning");
        return;
      }
      payload.state_id = parseInt(formData.state_id);
    } else if (formData.state_id) {
      // Include state_id if provided even when states list is empty (fallback)
      payload.state_id = parseInt(formData.state_id);
    }
    if (formData.landmark.trim()) {
      payload.landmark = formData.landmark.trim();
    }

    try {
      let response;
      if (address) {
        // Update existing address
        response = await addressService.updateAddress(address.uuid, payload);
      } else {
        // Create new address
        response = await addressService.createAddress(payload);
      }

      if (response.success) {
        showToast(
          address 
            ? (response.message || "Address updated successfully")
            : (response.message || "Address added successfully"),
          "success"
        );
        
        // Call onSuccess callback first
        if (onSuccess) {
          onSuccess();
        }
        
        // Properly close Bootstrap modal - backdrop cleanup handled by parent
        const bootstrap = require("bootstrap");
        const modalElement = document.getElementById("addressModal");
        if (modalElement) {
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
        }
        
        // Close modal state - cleanup will be handled by parent's useEffect
        handleClose();
      }
    } catch (error) {
      console.error("Error saving address:", error);
      if (error.statusCode === 422 && error.errors) {
        setFormErrors(error.errors);
        const firstError = Object.values(error.errors).flat()[0];
        showToast(firstError || "Validation failed", "danger");
      } else {
        showToast(
          error.message || 
          (address ? "Failed to update address" : "Failed to add address"),
          "danger"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormErrors({});
    
    // Properly close Bootstrap modal
    const bootstrap = require("bootstrap");
    const modalElement = document.getElementById("addressModal");
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        // Hide the modal - Bootstrap will trigger the 'hidden.bs.modal' event
        // which is handled in the parent component's useEffect
        modal.hide();
      }
    }
    
    // Close modal state in parent component immediately
    // The backdrop cleanup will be handled by the parent's useEffect
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal fade" 
      id="addressModal" 
      tabIndex="-1"
      aria-labelledby="addressModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="addressModalLabel">
              {address ? "Edit Address" : "Add New Address"}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              aria-label="Close"
              data-bs-dismiss="modal"
            ></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="mb-3">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.full_name ? "is-invalid" : ""}`}
                  placeholder="Full Name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.full_name && (
                  <div className="invalid-feedback">
                    {formErrors.full_name[0]}
                  </div>
                )}
              </div>

              {/* Email and Phone */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-control ${formErrors.email ? "is-invalid" : ""}`}
                    placeholder="Email (Optional)"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {formErrors.email && (
                    <div className="invalid-feedback">
                      {formErrors.email[0]}
                    </div>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Phone *</label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.phone ? "is-invalid" : ""}`}
                    placeholder="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                  {formErrors.phone && (
                    <div className="invalid-feedback">
                      {formErrors.phone[0]}
                    </div>
                  )}
                </div>
              </div>

              {/* Address Line 1 */}
              <div className="mb-3">
                <label className="form-label">Address Line 1 *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.address_line1 ? "is-invalid" : ""}`}
                  placeholder="Address Line 1"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.address_line1 && (
                  <div className="invalid-feedback">
                    {formErrors.address_line1[0]}
                  </div>
                )}
              </div>

              {/* Address Line 2 */}
              <div className="mb-3">
                <label className="form-label">Address Line 2</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.address_line2 ? "is-invalid" : ""}`}
                  placeholder="Address Line 2 (Optional)"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleInputChange}
                />
                {formErrors.address_line2 && (
                  <div className="invalid-feedback">
                    {formErrors.address_line2[0]}
                  </div>
                )}
              </div>

              {/* Country and State */}
              <div className="row">
                <div className="col-md-6">
                  <SearchableSelect
                    options={countries}
                    value={formData.country_id}
                    onChange={handleInputChange}
                    placeholder="Select Country"
                    required={true}
                    label="Country"
                    error={formErrors.country_id}
                    disabled={loading}
                    name="country_id"
                  />
                </div>
                {states.length > 0 && (
                  <div className="col-md-6">
                    <SearchableSelect
                      options={states}
                      value={formData.state_id}
                      onChange={handleInputChange}
                      placeholder="Select State"
                      required={true}
                      label="State"
                      error={formErrors.state_id}
                      disabled={loading}
                      name="state_id"
                    />
                  </div>
                )}
              </div>

              {/* City and Postal Code */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.city ? "is-invalid" : ""}`}
                    placeholder="City"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                  {formErrors.city && (
                    <div className="invalid-feedback">
                      {formErrors.city[0]}
                    </div>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Postal Code *</label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.postal_code ? "is-invalid" : ""}`}
                    placeholder="Postal Code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    required
                  />
                  {formErrors.postal_code && (
                    <div className="invalid-feedback">
                      {formErrors.postal_code[0]}
                    </div>
                  )}
                </div>
              </div>

              {/* Landmark */}
              <div className="mb-3">
                <label className="form-label">Landmark</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.landmark ? "is-invalid" : ""}`}
                  placeholder="Landmark (Optional)"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleInputChange}
                />
                {formErrors.landmark && (
                  <div className="invalid-feedback">
                    {formErrors.landmark[0]}
                  </div>
                )}
              </div>

              {/* Address Type */}
              <div className="mb-3">
                <label className="form-label">Address Type</label>
                <select
                  className="form-select"
                  name="address_type"
                  value={formData.address_type}
                  onChange={handleInputChange}
                >
                  <option value="home">Home</option>
                  <option value="office">Office</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Set as Default */}
              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="is_default"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="is_default">
                    Set as default address
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="d-flex gap-2 justify-content-end">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tf-btn btn-fill radius-4"
                  disabled={loading}
                >
                  <span className="text">
                    {loading 
                      ? (address ? "Updating..." : "Adding...") 
                      : (address ? "Update Address" : "Add Address")
                    }
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

