import { useTranslation } from "react-i18next";
import type { Store } from "../types";

export function AlertFeed({ stores }: { stores: Store[] }) {
  const { t } = useTranslation();
  const rows = stores.flatMap((s) => s.issues.map((issue) => ({ store: s.name, ...issue })));

  if (rows.length === 0) {
    return (
      <div className="alerts">
        <div className="alert-row none">
          <span className="msg">{t("alerts.none")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts">
      {rows.map((r, i) => (
        <div key={i} className={`alert-row ${r.level === "critical" ? "" : "warn"}`}>
          <span className="store-name">{r.store}</span>
          <span className="msg">{r.message}</span>
          <span className="time">{t("alerts.notified")}</span>
        </div>
      ))}
    </div>
  );
}
