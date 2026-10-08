"use client";
import React, { useState, useEffect, useRef } from "react";
import { jobService } from "@/services/jobService";
import { showToast } from "@/utlis/showToast";

export default function ApplyModal() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    resume: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [jobTitle, setJobTitle] = useState("");
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const modalElement = document.getElementById("applyModal");
    if (modalElement) {
      // Listen for when modal is shown to get job data
      modalElement.addEventListener("show.bs.modal", handleModalShow);
      modalElement.addEventListener("hidden.bs.modal", handleModalClose);
    }
    return () => {
      if (modalElement) {
        modalElement.removeEventListener("show.bs.modal", handleModalShow);
        modalElement.removeEventListener("hidden.bs.modal", handleModalClose);
      }
    };
  }, []);

  const handleModalShow = () => {
    const modalElement = document.getElementById("applyModal");
    if (modalElement) {
      const jobIdAttr = modalElement.getAttribute("data-job-id");
      const jobTitleAttr = modalElement.getAttribute("data-job-title");
      if (jobIdAttr) {
        setJobId(parseInt(jobIdAttr));
      }
      if (jobTitleAttr) {
        setJobTitle(jobTitleAttr);
      }
    }
  };

  const handleModalClose = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      resume: null,
    });
    setErrors({});
    setSuccess(false);
    setJobId(null);
    setJobTitle("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          resume: "Please upload a PDF or DOC file",
        }));
        return;
      }
      // Validate file size (max 10MB as per API)
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          resume: "File size should be less than 10MB",
        }));
        return;
      }
      setFormData((prev) => ({
        ...prev,
        resume: file,
      }));
      // Clear error
      if (errors.resume) {
        setErrors((prev) => ({
          ...prev,
          resume: "",
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    // Phone is optional per API docs
    if (!formData.resume) {
      newErrors.resume = "Resume file is required";
    }
    if (!jobId) {
      newErrors.submit = "Job information is missing. Please try again.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccess(false);
    setErrors({});

    try {
      // Create FormData for multipart/form-data request
      const formDataToSend = new FormData();
      formDataToSend.append("job_id", jobId.toString());
      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("email", formData.email.trim());
      if (formData.phone.trim()) {
        formDataToSend.append("phone", formData.phone.trim());
      }
      formDataToSend.append("resume", formData.resume);

      const response = await jobService.applyForJob(formDataToSend);

      if (response.success) {
        setSuccess(true);
        showToast("Application submitted successfully!", "success");
        
        setTimeout(() => {
          const bootstrap = require("bootstrap");
          const modal = bootstrap.Modal.getInstance(
            document.getElementById("applyModal")
          );
          if (modal) {
            modal.hide();
          }
          handleModalClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      
      // Handle validation errors
      if (error.errors && typeof error.errors === 'object') {
        const validationErrors = {};
        Object.keys(error.errors).forEach((key) => {
          // Map API field names to form field names
          let formFieldName = key;
          if (key === 'job_id') {
            formFieldName = 'submit'; // Show job_id errors as general error
          }
          
          if (Array.isArray(error.errors[key])) {
            validationErrors[formFieldName] = error.errors[key][0]; // Take first error message
          } else {
            validationErrors[formFieldName] = error.errors[key];
          }
        });
        setErrors(validationErrors);
      } else {
        setErrors({ 
          submit: error.message || "Failed to submit application. Please try again." 
        });
      }
      showToast(error.message || "Failed to submit application", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade modalCentered"
      id="applyModal"
      tabIndex="-1"
      aria-labelledby="applyModalLabel"
      aria-hidden="true"
      ref={modalRef}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="applyModalLabel">
              Apply for Position
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <span className="icon icon-close"></span>
            </button>
          </div>
          <div className="modal-body">
            {success ? (
              <div className="success-message">
                <p>Your application has been submitted successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? "is-invalid" : ""}`}
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                  />
                  {errors.name && (
                    <div className="invalid-feedback">{errors.name}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number <span className="text-muted">(Optional)</span></label>
                  <input
                    type="tel"
                    className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && (
                    <div className="invalid-feedback">{errors.phone}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="resume">Resume</label>
                  <div className="file-upload-wrapper">
                    <input
                      type="file"
                      className={`file-input ${errors.resume ? "is-invalid" : ""}`}
                      id="resume"
                      name="resume"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                    />
                    <label htmlFor="resume" className="file-upload-label">
                      <span className="upload-icon">
                        <i className="icon icon-upload"></i>
                      </span>
                      <span className="upload-text">
                        Upload Resume (PDF/DOC/DOCX, max 10MB)
                      </span>
                      {formData.resume && (
                        <span className="file-name">{formData.resume.name}</span>
                      )}
                    </label>
                    {errors.resume && (
                      <div className="invalid-feedback d-block">
                        {errors.resume}
                      </div>
                    )}
                  </div>
                </div>

                {errors.submit && (
                  <div className="alert alert-danger">{errors.submit}</div>
                )}

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Apply"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-content {
          border-radius: 12px;
          border: none;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        }

        .modal-header {
          border-bottom: 1px solid #e0e0e0;
          padding: 24px 30px;
        }

        .modal-title {
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .btn-close:hover {
          background-color: #f5f5f5;
        }

        .modal-body {
          padding: 30px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #1a1a1a;
          font-size: 14px;
        }

        .form-control {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: #007bff;
        }

        .form-control.is-invalid {
          border-color: #dc3545;
        }

        .invalid-feedback {
          display: block;
          color: #dc3545;
          font-size: 14px;
          margin-top: 4px;
        }

        .file-upload-wrapper {
          position: relative;
        }

        .file-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .file-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          border: 2px dashed #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          background-color: #fafafa;
        }

        .file-upload-label:hover {
          border-color: #007bff;
          background-color: #f0f7ff;
        }

        .upload-icon {
          font-size: 48px;
          color: #999;
          margin-bottom: 12px;
        }

        .upload-text {
          color: #666;
          font-size: 16px;
          font-weight: 500;
        }

        .file-name {
          margin-top: 8px;
          color: #007bff;
          font-size: 14px;
          font-weight: 500;
        }

        .file-input.is-invalid + .file-upload-label {
          border-color: #dc3545;
        }

        .modal-footer {
          border-top: 1px solid #e0e0e0;
          padding: 20px 30px;
          margin-top: 24px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-secondary {
          background-color: #f0f0f0;
          color: #666;
        }

        .btn-secondary:hover {
          background-color: #e0e0e0;
        }

        .btn-primary {
          background-color: #1a1a1a;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #333;
        }

        .btn-primary:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .success-message {
          text-align: center;
          padding: 40px 20px;
        }

        .success-message p {
          font-size: 18px;
          color: #28a745;
          font-weight: 500;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .alert-danger {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        @media (max-width: 768px) {
          .modal-dialog {
            margin: 20px;
          }

          .modal-header,
          .modal-body,
          .modal-footer {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}

