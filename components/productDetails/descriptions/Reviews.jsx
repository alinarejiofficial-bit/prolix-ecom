"use client";
import React, { useState } from "react";
import Image from "next/image";
import ReviewSorting from "./ReviewSorting";

export default function Reviews() {
  const [allReviews] = useState([]);
  const [displayedCount, setDisplayedCount] = useState(3); // Show 3 reviews initially
  const [sortBy, setSortBy] = useState("most-recent");

  // Get reviews to display based on displayedCount
  const displayedReviews = allReviews.slice(0, displayedCount);
  const hasMore = displayedCount < allReviews.length;

  // Calculate rating statistics from all reviews
  const ratingStats = {
    total: allReviews.length,
    average: (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1),
    5: allReviews.filter(r => r.rating === 5).length,
    4: allReviews.filter(r => r.rating === 4).length,
    3: allReviews.filter(r => r.rating === 3).length,
    2: allReviews.filter(r => r.rating === 2).length,
    1: allReviews.filter(r => r.rating === 1).length,
  };

  const loadMore = () => {
    setDisplayedCount(prev => Math.min(prev + 3, allReviews.length));
  };

  const getRatingPercentage = (count) => {
    return ratingStats.total > 0 ? (count / ratingStats.total) * 100 : 0;
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className={`icon icon-star ${i < rating ? "active" : ""}`}
      />
    ));
  };

  return (
    <>
      <div className="tab-reviews-heading">
        <div className="top">
          <div className="text-center">
            <div className="number title-display">{ratingStats.average}</div>
            <div className="list-star">
              {renderStars(Math.round(parseFloat(ratingStats.average)))}
            </div>
            <p>({ratingStats.total} Ratings)</p>
          </div>
          <div className="rating-score">
            <div className="item">
              <div className="number-1 text-caption-1">5</div>
              <i className="icon icon-star" />
              <div className="line-bg">
                <div style={{ width: `${getRatingPercentage(ratingStats[5])}%` }} />
              </div>
              <div className="number-2 text-caption-1">{ratingStats[5]}</div>
            </div>
            <div className="item">
              <div className="number-1 text-caption-1">4</div>
              <i className="icon icon-star" />
              <div className="line-bg">
                <div style={{ width: `${getRatingPercentage(ratingStats[4])}%` }} />
              </div>
              <div className="number-2 text-caption-1">{ratingStats[4]}</div>
            </div>
            <div className="item">
              <div className="number-1 text-caption-1">3</div>
              <i className="icon icon-star" />
              <div className="line-bg">
                <div style={{ width: `${getRatingPercentage(ratingStats[3])}%` }} />
              </div>
              <div className="number-2 text-caption-1">{ratingStats[3]}</div>
            </div>
            <div className="item">
              <div className="number-1 text-caption-1">2</div>
              <i className="icon icon-star" />
              <div className="line-bg">
                <div style={{ width: `${getRatingPercentage(ratingStats[2])}%` }} />
              </div>
              <div className="number-2 text-caption-1">{ratingStats[2]}</div>
            </div>
            <div className="item">
              <div className="number-1 text-caption-1">1</div>
              <i className="icon icon-star" />
              <div className="line-bg">
                <div style={{ width: `${getRatingPercentage(ratingStats[1])}%` }} />
              </div>
              <div className="number-2 text-caption-1">{ratingStats[1]}</div>
            </div>
          </div>
        </div>
        <div>
          <div className="btn-style-4 text-btn-uppercase letter-1 btn-comment-review btn-cancel-review">
            Cancel Review
          </div>
        </div>
      </div>
      <div className="reply-comment style-1 cancel-review-wrap">
        <div className="d-flex mb_24 gap-20 align-items-center justify-content-between flex-wrap">
          <h4 className="">{allReviews.length} Comments</h4>
          <div className="d-flex align-items-center gap-12">
            <div className="text-caption-1">Sort by:</div>
            <ReviewSorting />
          </div>
        </div>
        <div className="reply-comment-wrap">
          {displayedReviews.map((review) => (
            <div key={review.id} className="reply-comment-item">
              <div className="user">
                <div className="image">
                  <Image
                    alt={review.user.name}
                    src={review.user.avatar}
                    width={120}
                    height={120}
                  />
                </div>
                <div>
                  <h6>
                    <a href="#" className="link">
                      {review.title}
                    </a>
                  </h6>
                  <div className="day text-secondary-2 text-caption-1">
                    {review.date} &nbsp;&nbsp;&nbsp;-
                  </div>
                  <div className="list-star mt-2">
                    {renderStars(review.rating)}
                  </div>
                </div>
              </div>
              <p className="text-secondary">{review.comment}</p>
              {review.images && review.images.length > 0 && (
                <div className="review-images mt-3 d-flex gap-2 flex-wrap">
                  {review.images.map((img, index) => (
                    <div key={index} className="review-image-item" style={{ position: "relative", width: "120px", height: "120px" }}>
                      <Image
                        alt={`Review image ${index + 1}`}
                        src={img}
                        fill
                        style={{ objectFit: "cover", borderRadius: "8px" }}
                        sizes="120px"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {hasMore && (
          <div className="text-center mt-4 mb-4">
            <button
              className="btn-style-4 text-btn-uppercase letter-1"
              onClick={loadMore}
              type="button"
            >
              Load More
            </button>
          </div>
        )}
      </div>
      <form
        className="form-write-review write-review-wrap"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="heading">
          <h4>Write a review:</h4>
          <div className="list-rating-check">
            <input type="radio" id="star5" name="rate" defaultValue={5} />
            <label htmlFor="star5" title="text" />
            <input type="radio" id="star4" name="rate" defaultValue={4} />
            <label htmlFor="star4" title="text" />
            <input type="radio" id="star3" name="rate" defaultValue={3} />
            <label htmlFor="star3" title="text" />
            <input type="radio" id="star2" name="rate" defaultValue={2} />
            <label htmlFor="star2" title="text" />
            <input type="radio" id="star1" name="rate" defaultValue={1} />
            <label htmlFor="star1" title="text" />
          </div>
        </div>
        <div className="mb_32">
          <div className="mb_8">Review Title</div>
          <fieldset className="mb_20">
            <input
              className=""
              type="text"
              placeholder="Give your review a title"
              name="text"
              tabIndex={2}
              defaultValue=""
              aria-required="true"
              required
            />
          </fieldset>
          <div className="mb_8">Review</div>
          <fieldset className="d-flex mb_20">
            <textarea
              className=""
              rows={4}
              placeholder="Write your comment here"
              tabIndex={2}
              aria-required="true"
              required
              defaultValue={""}
            />
          </fieldset>
          <div className="cols mb_20">
            <fieldset className="">
              <input
                className=""
                type="text"
                placeholder="You Name (Public)"
                name="text"
                tabIndex={2}
                defaultValue=""
                aria-required="true"
                required
              />
            </fieldset>
            <fieldset className="">
              <input
                className=""
                type="email"
                placeholder="Your email (private)"
                name="email"
                tabIndex={2}
                defaultValue=""
                aria-required="true"
                required
              />
            </fieldset>
          </div>
          <div className="d-flex align-items-center check-save">
            <input
              type="checkbox"
              name="availability"
              className="tf-check"
              id="check1"
            />
            <label className="text-secondary text-caption-1" htmlFor="check1">
              Save my name, email, and website in this browser for the next time
              I comment.
            </label>
          </div>
        </div>
        <div className="button-submit">
          <button className="text-btn-uppercase" type="submit">
            Submit Reviews
          </button>
        </div>
      </form>
    </>
  );
}
