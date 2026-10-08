"use client";

import { iconboxItems } from "@/data/features";

export default function Features({ parentClass = "flat-spacing" }) {
  return (
    <section className={parentClass}>
      <div className="container">
        <div className="row g-3 g-md-4">
          {iconboxItems.map((item) => (
            <div key={item.id} className="col-12 col-md-4">
              <div className="tf-icon-box">
                <div className="icon-box">
                  <span className={`icon ${item.icon}`} />
                </div>
                <div className="content text-center">
                  <h6>{item.title}</h6>
                  <p className="text-secondary">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
