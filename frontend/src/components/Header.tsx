import { useTranslation } from "react-i18next";
import type { Store } from "../types";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header({ stores }: { stores: Store[] }) {
  const { t, i18n } = useTranslation();

  const totalActions = stores.reduce((sum, s) => sum + s.websiteClicks + s.directions + s.calls, 0);
  const avgRating = stores.length ? (stores.reduce((sum, s) => sum + s.rating, 0) / stores.length).toFixed(1) : "-";
  const critical = stores.filter((s) => s.status === "critical").length;
  const locale = i18n.resolvedLanguage === "ko" ? "ko-KR" : "en-US";

  return (
    <header>
      <div>
        <div className="eyebrow">{t("header.eyebrow")}</div>
        <h1>
          {t("header.titleLine1")}
          <br />
          {t("header.titleLine2")}
        </h1>
        <div className="subtitle">{t("header.subtitle")}</div>
      </div>
      <div className="header-controls">
        <LanguageSwitcher />
        <div className="stat-strip">
          <div className="stat">
            <div className="v">{stores.length}</div>
            <div className="l">{t("header.stat.stores")}</div>
          </div>
          <div className="stat">
            <div className="v">{totalActions.toLocaleString(locale)}</div>
            <div className="l">{t("header.stat.actions")}</div>
          </div>
          <div className="stat">
            <div className="v">{avgRating}</div>
            <div className="l">{t("header.stat.rating")}</div>
          </div>
          <div className="stat">
            <div className="v warn">{critical}</div>
            <div className="l">{t("header.stat.critical")}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
