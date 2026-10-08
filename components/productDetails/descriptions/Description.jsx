import React from "react";

export default function Description({ product }) {
  // Get API product data
  const apiProduct = product?.apiProduct || {};
  
  const description = apiProduct.description || product?.description || "";
  const tags = apiProduct.tags || [];
  const attributes = apiProduct.attributes || {};
  const warranty = apiProduct.warranty && apiProduct.warranty !== "" ? apiProduct.warranty : null;
  const returnPolicyDays = apiProduct.return_policy_days && apiProduct.return_policy_days !== "" ? apiProduct.return_policy_days : null;

  return (
    <>
      <div className="right">
        {description && (
          <div className="mb_12">
            <div className="letter-1 text-btn-uppercase mb_12">
              Description
            </div>
            <p className="text-secondary">{description}</p>
          </div>
        )}

        {tags.length > 0 && (
          <div className="mb_12">
            <div className="letter-1 text-btn-uppercase mb_12">
              Tags
            </div>
            <div className="d-flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="badge bg-primary text-white px-3 py-2"
                  style={{ fontSize: "0.875rem" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {Object.keys(attributes).length > 0 && (
          <div className="mb_12">
            <div className="letter-1 text-btn-uppercase mb_12">
              Attributes
            </div>
            <ul className="list-text type-disc mb_12 gap-6">
              {Object.entries(attributes).map(([key, value], index) => (
                <li key={index} className="font-2">
                  <strong>{key}:</strong> {value}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="left">
        {(warranty || returnPolicyDays) && (
          <div className="letter-1 text-btn-uppercase mb_12">
            Product Information
          </div>
        )}
        <ul className="list-text type-disc mb_12 gap-6">
          {warranty && (
            <li className="font-2">
              <strong>Warranty:</strong> {warranty} {String(warranty) === "1" ? "year" : "years"}
            </li>
          )}
          {returnPolicyDays && (
            <li className="font-2">
              Return within {returnPolicyDays} {String(returnPolicyDays) === "1" ? "day" : "days"} of purchase. Duties & taxes are non-refundable.
            </li>
          )}
        </ul>
      </div>
    </>
  );
}
