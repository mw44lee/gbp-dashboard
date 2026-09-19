import { useTranslation } from "react-i18next";
import type { Review } from "../types";

export function ReviewCard({
  review,
  selected,
  loading,
  onClick,
}: {
  review: Review;
  selected: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();

  return (
    <button className={`review-card ${selected ? "selected" : ""}`} onClick={onClick}>
      <div className="rhead">
        <span className="stars">{"★".repeat(review.stars)}{"☆".repeat(5 - review.stars)}</span>
        <span className="rdate">{review.author} · {review.date}</span>
      </div>
      <div className={`rtext ${loading ? "loading" : ""}`}>
        {loading ? "…" : review.displayText ?? review.originalText}
      </div>
      <span className={`sentiment ${review.sentiment}`}>
        {t(review.sentiment === "neg" ? "reviews.sentimentNeg" : "reviews.sentimentPos")}
      </span>
    </button>
  );
}
