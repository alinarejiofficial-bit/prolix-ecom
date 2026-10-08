"use client";
import React from "react";

export default function AccountContentShell({
  title,
  subtitle,
  children,
  className = "",
}) {
  return (
    <div className="my-account-content">
      <div className={`account-content-card ${className}`.trim()}>
        {(title || subtitle) && (
          <div className="account-content-header">
            {title && <h4 className="account-content-title">{title}</h4>}
            {subtitle && (
              <p className="account-content-subtitle">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
