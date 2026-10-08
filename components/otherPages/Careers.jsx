"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { jobService } from "@/services/jobService";
import { showToast } from "@/utlis/showToast";
import { CareersPageSkeleton } from "@/components/common/SectionSkeletons";

const EMPLOYMENT_TYPES = [
  { value: "all", label: "All types" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

function formatEmploymentType(type) {
  if (!type) return "";
  const match = EMPLOYMENT_TYPES.find((item) => item.value === type);
  if (match) return match.label;
  return type.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function toPlainText(value) {
  if (!value) return "";
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPostedDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Careers() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [jobCategories, setJobCategories] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("all");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await jobService.getJobCategories();
        if (response.success && response.data) {
          setJobCategories(response.data);
        }
      } catch (error) {
        console.error("Error fetching job categories:", error);
        showToast("Failed to load job categories", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchJobs = async () => {
      setJobsLoading(true);
      try {
        const params = {
          per_page: 20,
        };

        if (selectedCategory !== "all") {
          params.category_id = selectedCategory;
        }

        if (searchTerm) {
          params.search = searchTerm;
        }

        if (selectedEmploymentType !== "all") {
          params.employment_type = selectedEmploymentType;
        }

        const response = await jobService.getJobs(params);
        if (response.success && response.data) {
          setJobs(response.data);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        showToast("Failed to load jobs", "error");
        setJobs([]);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, [selectedCategory, searchTerm, selectedEmploymentType]);

  const openApplyModal = (job) => {
    const bootstrap = require("bootstrap");
    const modalElement = document.getElementById("applyModal");

    if (modalElement) {
      modalElement.setAttribute("data-job-id", job.id);
      modalElement.setAttribute("data-job-title", job.title);
    }

    const modal = new bootstrap.Modal(modalElement, {
      keyboard: false,
    });

    const titleElement = modalElement?.querySelector("#applyModalLabel");
    if (titleElement) {
      titleElement.textContent = `Apply for ${job.title}`;
    }

    modal.show();
  };

  const totalJobsCount = jobCategories.reduce(
    (sum, cat) => sum + (cat.jobs_count || 0),
    0
  );
  const hasFilters = Boolean(searchTerm) || selectedEmploymentType !== "all";
  const emptyCopy = hasFilters
    ? "No roles match those filters."
    : selectedCategory !== "all"
      ? "No roles in this category right now."
      : "No open roles at the moment.";

  if (loading) {
    return <CareersPageSkeleton />;
  }

  return (
    <section className="section-careers">
      <div className="container">
        <div className="careers-wrap">
          <header className="careers-header">
            <p className="careers-kicker">Careers</p>
            <h1 className="careers-title">Join our team</h1>
            <p className="careers-lead">
              {totalJobsCount > 0
                ? `${totalJobsCount} open ${totalJobsCount === 1 ? "role" : "roles"} right now. Find a fit, or send us a note if nothing matches.`
                : "We're always interested in meeting great people. Nothing open right now — feel free to get in touch."}
            </p>
          </header>

          <div className="careers-toolbar">
            {jobCategories.length > 0 && (
              <div className="careers-pills" aria-label="Job categories">
                <button
                  type="button"
                  className={`careers-pill ${selectedCategory === "all" ? "is-active" : ""}`}
                  onClick={() => setSelectedCategory("all")}
                >
                  All
                  <span>{totalJobsCount}</span>
                </button>
                {jobCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={`careers-pill ${
                      selectedCategory === category.id.toString() ? "is-active" : ""
                    }`}
                    onClick={() => setSelectedCategory(category.id.toString())}
                  >
                    {category.name}
                    <span>{category.jobs_count || 0}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="careers-controls">
              <label className="careers-search">
                <span className="icon icon-search2" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search roles"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search roles"
                />
              </label>
              <select
                className="careers-select"
                value={selectedEmploymentType}
                onChange={(e) => setSelectedEmploymentType(e.target.value)}
                aria-label="Employment type"
              >
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="jobs-list" aria-live="polite">
            {jobsLoading ? (
              <div className="jobs-loading">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="job-row is-skeleton">
                    <div className="skeleton-line w-40" />
                    <div className="skeleton-line w-24" />
                    <div className="skeleton-line w-80" />
                  </div>
                ))}
              </div>
            ) : jobs.length > 0 ? (
              jobs.map((job) => {
                const description = toPlainText(job.description);
                const posted = formatPostedDate(job.created_at);
                const typeLabel = formatEmploymentType(job.employment_type);
                const meta = [typeLabel, job.category?.name, posted].filter(Boolean);

                return (
                  <article key={job.id} className="job-row">
                    <div className="job-main">
                      <div className="job-top">
                        <h2 className="job-title">{job.title}</h2>
                        <button
                          type="button"
                          className="job-apply"
                          onClick={() => openApplyModal(job)}
                        >
                          Apply
                          <span aria-hidden="true">→</span>
                        </button>
                      </div>
                      {meta.length > 0 && (
                        <p className="job-meta">
                          {meta.join(" · ")}
                        </p>
                      )}
                      {description && (
                        <p className="job-description">{description}</p>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="jobs-empty">
                <p className="jobs-empty-title">{emptyCopy}</p>
                <p>
                  Send us your details and we'll keep you in mind for future openings.
                </p>
                <Link href="/contact" className="careers-link">
                  Contact us
                </Link>
              </div>
            )}
          </div>

          {jobs.length > 0 && (
            <p className="careers-note">
              Don't see a fit?{" "}
              <Link href="/contact">Send us a note</Link>
              {" "}— we're always interested in meeting great people.
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        .section-careers {
          padding: 72px 0 96px;
          min-height: 60vh;
        }

        .careers-wrap {
          max-width: 760px;
          margin: 0 auto;
        }

        .careers-header {
          margin-bottom: 40px;
        }

        .careers-kicker {
          margin: 0 0 10px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #8a8b8f;
        }

        .careers-title {
          margin: 0 0 12px;
          font-size: 40px;
          line-height: 1.15;
          font-weight: 500;
          letter-spacing: -0.03em;
          color: var(--main, #181818);
        }

        .careers-lead {
          margin: 0;
          max-width: 34em;
          font-size: 16px;
          line-height: 1.6;
          color: #6c6d70;
        }

        .careers-toolbar {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 8px;
          padding-bottom: 20px;
          border-bottom: 1px solid #ececec;
        }

        .careers-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .careers-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border: 1px solid #e6e6e6;
          border-radius: 999px;
          background: transparent;
          color: #4a4b4f;
          font-size: 13px;
          line-height: 1;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }

        .careers-pill span {
          color: #9a9b9f;
          font-variant-numeric: tabular-nums;
        }

        .careers-pill:hover {
          border-color: #cfcfcf;
          color: var(--main, #181818);
        }

        .careers-pill.is-active {
          background: var(--main, #181818);
          border-color: var(--main, #181818);
          color: #fff;
        }

        .careers-pill.is-active span {
          color: rgba(255, 255, 255, 0.7);
        }

        .careers-controls {
          display: grid;
          grid-template-columns: 1fr 180px;
          gap: 12px;
        }

        .careers-search {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 2px;
          border-bottom: 1px solid #e6e6e6;
        }

        .careers-search :global(.icon) {
          color: #9a9b9f;
          font-size: 16px;
        }

        .careers-search input {
          width: 100%;
          border: 0;
          outline: none;
          background: transparent;
          padding: 10px 0;
          font-size: 15px;
          color: var(--main, #181818);
        }

        .careers-search input::placeholder {
          color: #b0b1b4;
        }

        .careers-select {
          width: 100%;
          border: 0;
          border-bottom: 1px solid #e6e6e6;
          border-radius: 0;
          background: transparent;
          padding: 10px 0;
          font-size: 15px;
          color: var(--main, #181818);
          cursor: pointer;
        }

        .careers-select:focus,
        .careers-search input:focus {
          outline: none;
        }

        .jobs-list {
          min-height: 180px;
        }

        .job-row {
          padding: 28px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .job-row.is-skeleton {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .job-top {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 16px;
        }

        .job-title {
          margin: 0;
          font-size: 20px;
          line-height: 1.35;
          font-weight: 500;
          letter-spacing: -0.02em;
          color: var(--main, #181818);
        }

        .job-apply {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0;
          border: 0;
          background: none;
          color: var(--main, #181818);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        .job-apply:hover {
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .job-meta {
          margin: 8px 0 0;
          font-size: 13px;
          color: #8a8b8f;
        }

        .job-description {
          margin: 10px 0 0;
          max-width: 58ch;
          font-size: 14px;
          line-height: 1.65;
          color: #6c6d70;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .jobs-empty {
          padding: 72px 0 48px;
          text-align: left;
        }

        .jobs-empty-title {
          margin: 0 0 8px;
          font-size: 18px;
          font-weight: 500;
          color: var(--main, #181818);
        }

        .jobs-empty p {
          margin: 0;
          color: #6c6d70;
          font-size: 15px;
          line-height: 1.6;
        }

        .careers-link {
          display: inline-block;
          margin-top: 18px;
          color: var(--main, #181818);
          font-size: 14px;
          font-weight: 500;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .careers-note {
          margin: 36px 0 0;
          font-size: 14px;
          line-height: 1.6;
          color: #6c6d70;
        }

        .careers-note :global(a) {
          color: var(--main, #181818);
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .skeleton-line {
          height: 12px;
          border-radius: 999px;
          background: linear-gradient(90deg, #f2f2f2 25%, #ebebeb 50%, #f2f2f2 75%);
          background-size: 200% 100%;
          animation: careers-shimmer 1.4s ease infinite;
        }

        .w-40 { width: 40%; height: 16px; }
        .w-24 { width: 24%; }
        .w-80 { width: 80%; }

        @keyframes careers-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (max-width: 767px) {
          .section-careers {
            padding: 48px 0 72px;
          }

          .careers-title {
            font-size: 32px;
          }

          .careers-controls {
            grid-template-columns: 1fr;
          }

          .job-top {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>
    </section>
  );
}
