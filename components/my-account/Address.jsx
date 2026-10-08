"use client";
import React, { useState, useEffect } from "react";
import { addressService } from "@/services/addressService";
import { showToast } from "@/utlis/showToast";
import { useContextElement } from "@/context/Context";
import AddressModal from "@/components/modals/AddressModal";
import { AddressListSkeleton } from "@/components/common/SectionSkeletons";

export default function Address() {
  const { isAuthenticated, openAuthModal } = useContextElement();
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingAddressId, setDeletingAddressId] = useState(null);

  // Fetch addresses
  const fetchAddresses = async () => {
    if (!isAuthenticated) {
      setLoadingAddresses(false);
      return;
    }

    try {
      setLoadingAddresses(true);
      const response = await addressService.getAddresses();
      if (response.success && response.data) {
        setAddresses(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      if (error.statusCode === 401) {
        openAuthModal();
      } else {
        showToast(error.message || "Failed to load addresses", "danger");
      }
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Load addresses on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  // Handle modal open for add
  const handleAddAddress = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    setEditingAddress(null);
    setShowModal(true);
  };

  // Handle modal open for edit
  const handleEditAddress = (address) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    setEditingAddress(address);
    setShowModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    const bootstrap = require("bootstrap");
    const modalElement = document.getElementById("addressModal");
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    setShowModal(false);
    setEditingAddress(null);
  };

  // Handle address save success
  const handleAddressSaved = () => {
    fetchAddresses();
  };

  // Handle delete address
  const handleDeleteAddress = async (addressUuid) => {
    if (!window.confirm("Are you sure you want to delete this address?")) {
      return;
    }

    try {
      setDeletingAddressId(addressUuid);
      const response = await addressService.deleteAddress(addressUuid);
      if (response.success) {
        showToast(response.message || "Address deleted successfully", "success");
        fetchAddresses();
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      if (error.statusCode === 401) {
        openAuthModal();
      } else {
        showToast(error.message || "Failed to delete address", "danger");
      }
    } finally {
      setDeletingAddressId(null);
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    const parts = [];
    if (address.address_line1) parts.push(address.address_line1);
    if (address.address_line2) parts.push(address.address_line2);
    if (address.city) parts.push(address.city);
    if (address.state?.name) parts.push(address.state.name);
    if (address.postal_code) parts.push(address.postal_code);
    if (address.country?.name) parts.push(address.country.name);
    return parts.join(", ");
  };

  // Get address type badge class
  const getAddressTypeClass = (type) => {
    switch (type) {
      case "home":
        return "badge bg-primary";
      case "office":
        return "badge bg-info";
      default:
        return "badge bg-secondary";
    }
  };

  // Capitalize first letter
  const capitalize = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Control modal with Bootstrap
  useEffect(() => {
    if (!showModal) return;

    const bootstrap = require("bootstrap");
    const modalElement = document.getElementById("addressModal");
    if (!modalElement) return;

    let modal = bootstrap.Modal.getInstance(modalElement);
    if (!modal) {
      modal = new bootstrap.Modal(modalElement, {
        backdrop: true,
        keyboard: true,
        focus: true,
      });
    }
    
    modal.show();

    // Handle modal close events
    const handleHidden = () => {
      handleCloseModal();
    };

    modalElement.addEventListener("hidden.bs.modal", handleHidden);

    // Cleanup
    return () => {
      modalElement.removeEventListener("hidden.bs.modal", handleHidden);
      if (modal) {
        modal.dispose();
      }
    };
  }, [showModal]);

  return (
    <div className="my-account-content">
      <div className="account-address">
        {/* Header with Add Button */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="title mb-0">Shipping Address</h5>
          <button
            className="tf-btn btn-fill radius-4"
            onClick={handleAddAddress}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span>
            <span className="text">Add new address</span>
          </button>
            </div>

        {/* Addresses Grid */}
        {loadingAddresses ? (
          <AddressListSkeleton />
        ) : addresses.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-3">
              <i className="icon-location" style={{ fontSize: "48px", color: "#ccc" }}></i>
            </div>
            <p className="text-muted">No addresses found. Add your first address above.</p>
            </div>
        ) : (
          <div className="row g-4">
            {addresses.map((address) => (
              <div key={address.uuid || address.id} className="col-md-6">
                <div
                  className="card h-100"
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    transition: "box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div className="card-body position-relative" style={{ padding: "20px" }}>
                    {/* Address Type Badge */}
                    <div className="position-absolute top-0 end-0" style={{ padding: "15px" }}>
                      <span className={getAddressTypeClass(address.address_type)}>
                        {capitalize(address.address_type || "home")}
                      </span>
                      {address.is_default && (
                        <span className="badge bg-success ms-2">Default</span>
                      )}
                    </div>

                    {/* Address Content */}
                    <div className="mb-3" style={{ paddingTop: "10px" }}>
                      <h6 className="mb-2" style={{ fontWeight: "600", fontSize: "16px" }}>
                        {address.full_name}
                      </h6>
                      
                      <div className="text-muted" style={{ fontSize: "14px", lineHeight: "1.6" }}>
                        <p className="mb-1" style={{ margin: "0" }}>
                          {formatAddress(address)}
                        </p>
                        {address.landmark && (
                          <p className="mb-1" style={{ margin: "0" }}>
                            <strong>Landmark:</strong> {address.landmark}
                          </p>
                        )}
                        {address.phone && (
                          <p className="mb-0" style={{ margin: "0" }}>
                            <strong>Phone:</strong> {address.phone}
                          </p>
                        )}
                        {address.email && (
                          <p className="mb-0" style={{ margin: "0" }}>
                            <strong>Email:</strong> {address.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2 mt-3 pt-3 border-top">
                      <button
                        className="btn btn-sm btn-outline-primary flex-fill"
                        onClick={() => handleEditAddress(address)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        <i className="icon-edit" style={{ fontSize: "14px" }}></i>
                        <span>Edit</span>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger flex-fill"
                        onClick={() => handleDeleteAddress(address.uuid)}
                        disabled={deletingAddressId === address.uuid}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        {deletingAddressId === address.uuid ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <i className="icon-trash" style={{ fontSize: "14px" }}></i>
                            <span>Delete</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={showModal}
        onClose={handleCloseModal}
        address={editingAddress}
        onSuccess={handleAddressSaved}
      />
    </div>
  );
}
