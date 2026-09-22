import { useTranslation } from "react-i18next";
import type { Review } from "../types";
import { ReviewCard } from "./ReviewCard";

const VIEW_LANG_OPTIONS = ["original", "en", "ko", "ja", "zh", "es", "vi", "fr", "de", "th"] as const;
const LABELS: Record<string, string> = {
  en: "English", ko: "한국어", ja: "日本語", zh: "中文", es: "Español", vi: "Tiếng Việt",
  fr: "Français", de: "Deutsch", th: "ไทย",
};

// This is the OTHER i18n concern in the app: review content arrives in
// whatever language the customer wrote it in, and country managers need to
// read it in their own language regardless of the UI's language. Switching
// this dropdown re-fetches /api/stores/:id/reviews?lang=xx, which the
// backend resolves via a cached AI translation (see routes/stores.ts).
export function ReviewList({
  reviews,
  viewLang,
  onViewLangChange,
  loading,
  selectedId,
  onSelect,
}: {
  reviews: Review[];
  viewLang: string;
  onViewLangChange: (lang: string) => void;
  loading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="sec-head" style={{ marginTop: 0 }}>
        <div className="label">{t("reviews.label")}</div>
      </div>
      <div className="reviews-toolbar">
        <label htmlFor="review-lang">{t("reviews.viewIn")}</label>
        <select id="review-lang" value={viewLang} onChange={(e) => onViewLangChange(e.target.value)}>
          <option value="original">{t("reviews.original")}</option>
          {VIEW_LANG_OPTIONS.filter((l) => l !== "original").map((l) => (
            <option key={l} value={l}>{LABELS[l]}</option>
          ))}
        </select>
      </div>
      <div className="reviews">
        {reviews.map((r) => (
          <ReviewCard
            key={r.id}
            review={r}
            selected={r.id === selectedId}
            loading={loading}
            onClick={() => onSelect(r.id)}
          />
        ))}
      </div>
    </div>
  );
}
