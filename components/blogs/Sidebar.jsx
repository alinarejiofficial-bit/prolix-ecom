"use client";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import { blogPosts6 } from "@/data/blogs";
export default function Sidebar() {
  return (
    <div className="sidebar maxw-360">
      <div className="sidebar-item sidebar-relatest-post">
        <h5 className="sidebar-heading">Relatest Post</h5>
        <div>
          {blogPosts6.slice(3, 8).map((post, i) => (
            <div
              key={i}
              className={`relatest-post-item ${
                i != 0 ? "style-row" : ""
              } hover-image `}
            >
              <div className="image">
                <Image
                  className="lazyload"
                  alt=""
                  src={post.imgSrc}
                  width={540}
                  height={360}
                />
              </div>
              <div className="content">
                <div className="meta">
                  <div className="meta-item gap-8">
                    <div className="icon">
                      <i className="icon-calendar" />
                    </div>
                    <p className="text-caption-1">{post.date}</p>
                  </div>
                  <div className="meta-item gap-8">
                    <div className="icon">
                      <i className="icon-user" />
                    </div>
                    <p className="text-caption-1">
                      by{" "}
                      <a className="link" href="#">
                        {post.author}
                      </a>
                    </p>
                  </div>
                </div>
                <h6 className="title fw-5">
                  <Link className="link" href={`/blog/${post.id}`}>
                    {post.description.split(" ").slice(0, 8).join(" ")}
                  </Link>
                </h6>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
