"use client";
import React, { useState, useEffect, useRef } from "react";

export default function SearchableSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "Select...",
  required = false,
  label = "",
  error = null,
  disabled = false,
  name = "select",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter((option) =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange({
      target: {
        name: name,
        value: option.id.toString(),
      },
    });
    setIsOpen(false);
    setSearchTerm("");
  };

  const selectedOption = options.find((opt) => opt.id.toString() === value);

  return (
    <div className="mb-3">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div ref={dropdownRef} className="position-relative">
        <button
          type="button"
          className={`form-select ${error ? "is-invalid" : ""} ${disabled ? "disabled" : ""}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          style={{
            cursor: disabled ? "not-allowed" : "pointer",
            textAlign: "left",
            backgroundColor: disabled ? "#e9ecef" : "#fff",
          }}
        >
          {selectedOption ? selectedOption.name : placeholder}
        </button>
        
        {isOpen && (
          <div
            className="position-absolute w-100"
            style={{
              top: "100%",
              left: 0,
              zIndex: 1050,
              marginTop: "4px",
              backgroundColor: "#fff",
              border: "1px solid #ced4da",
              borderRadius: "0.375rem",
              boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
              maxHeight: "300px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Search Input */}
            <div style={{ padding: "8px", borderBottom: "1px solid #dee2e6" }}>
              <input
                ref={inputRef}
                type="text"
                className="form-control form-control-sm"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  e.stopPropagation();
                  setSearchTerm(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{ fontSize: "14px" }}
              />
            </div>

            {/* Options List */}
            <div
              style={{
                maxHeight: "240px",
                overflowY: "auto",
                padding: "4px 0",
              }}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontSize: "14px",
                      backgroundColor:
                        selectedOption?.id === option.id
                          ? "#f8f9fa"
                          : "transparent",
                      color:
                        selectedOption?.id === option.id ? "#0d6efd" : "#212529",
                      fontWeight:
                        selectedOption?.id === option.id ? "600" : "400",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedOption?.id !== option.id) {
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedOption?.id !== option.id) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    {option.name}
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "12px",
                    textAlign: "center",
                    color: "#6c757d",
                    fontSize: "14px",
                  }}
                >
                  No results found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="invalid-feedback" style={{ display: "block" }}>
          {Array.isArray(error) ? error[0] : error}
        </div>
      )}
    </div>
  );
}

