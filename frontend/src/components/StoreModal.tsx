import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import type { Review, StoreDetail } from "../types";
import { Funnel } from "./Funnel";
import { ProductList } from "./ProductList";
import { ReviewList } from "./ReviewList";
import { AiReplyAssistant } from "./AiReplyAssistant";

export function StoreModal({ storeId, onClose }: { storeId: number; onClose: () => void }) {
  const { t } = useTranslation();
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [viewLang, setViewLang] = useState("original");
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);

  useEffect(() => {
    api.getStore(storeId).then(setStore);
  }, [storeId]);

  useEffect(() => {
    setReviewsLoading(true);
    api
      .getReviews(storeId, viewLang === "original" ? undefined : viewLang)
      .then((data) => {
        setReviews(data);
        setReviewsLoading(false);
        setSelectedReviewId((current) => current ?? data.find((r) => r.sentiment === "neg")?.id ?? data[0]?.id ?? null);
      });
  }, [storeId, viewLang]);

  if (!store) return null;

  const selectedReview = reviews.find((r) => r.id === selectedReviewId) ?? null;
  const ratingDelta = store.rating - store.ratingPrev;

  return (
    <div className="overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>{store.name}</h2>
            <div className="region">
              {store.region} · {t("header.stat.rating")} {store.rating.toFixed(1)} (
              {t("modal.ratingVs", { prev: store.ratingPrev.toFixed(1) })}
              {" "}
              {ratingDelta >= 0 ? "+" : ""}
              {ratingDelta.toFixed(1)})
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <Funnel store={store} />
        <ProductList products={store.products} />

        <div className="panel-2col">
          <ReviewList
            reviews={reviews}
            viewLang={viewLang}
            onViewLangChange={setViewLang}
            loading={reviewsLoading}
            selectedId={selectedReviewId}
            onSelect={setSelectedReviewId}
          />
          <AiReplyAssistant review={selectedReview} />
        </div>
      </div>
    </div>
  );
}
