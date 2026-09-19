import { useTranslation } from "react-i18next";
import type { Store } from "../types";

export function StoreBoard({ stores, onSelect }: { stores: Store[]; onSelect: (id: number) => void }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === "ko" ? "ko-KR" : "en-US";

  return (
    <div className="board">
      <div className="board-row head">
        <span></span>
        <span>{t("board.head.store")}</span>
        <span className="hide-sm">{t("board.head.actions")}</span>
        <span className="hide-sm">{t("board.head.visits")}</span>
        <span>{t("board.head.rating")}</span>
        <span className="hide-sm">{t("board.head.image")}</span>
        <span>{t("board.head.status")}</span>
      </div>
      {stores.map((s) => {
        const totalActions = s.websiteClicks + s.directions + s.calls;
        const ratingDelta = s.rating - s.ratingPrev;
        const trendClass = ratingDelta > 0 ? "up" : ratingDelta < 0 ? "down" : "";
        const trendSign = ratingDelta > 0 ? "▲" : ratingDelta < 0 ? "▼" : "—";

        return (
          <button key={s.id} className="board-row" onClick={() => onSelect(s.id)}>
            <span className={`dot ${s.status}`}></span>
            <span className="store-cell">
              <div className="name">{s.name}</div>
              <div className="region">{s.region}</div>
            </span>
            <span className="metric hide-sm">{totalActions.toLocaleString(locale)}</span>
            <span className="metric hide-sm">{s.visitEst.toLocaleString(locale)}</span>
            <span className="rating">
              {s.rating.toFixed(1)}
              <span className={`trend ${trendClass}`}>
                {trendSign}
                {ratingDelta !== 0 ? Math.abs(ratingDelta).toFixed(1) : ""}
              </span>
            </span>
            <span className="metric hide-sm">{t("board.daysAgo", { count: s.imgAgeDays })}</span>
            <span className={`status-chip ${s.status}`}>{t(`status.${s.status}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
