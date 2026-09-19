import { useTranslation } from "react-i18next";
import { SUPPORTED_UI_LANGS } from "../i18n";

const LABELS: Record<string, string> = { en: "English", ko: "한국어" };

// Switches the *UI chrome* language (labels, buttons, headings) — every
// country manager can pick their own. This is unrelated to per-review
// translation, which is handled by ReviewLanguageSwitcher against the AI
// provider instead of this i18next resource bundle.
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <div className="lang-switcher">
      <label htmlFor="ui-lang">{t("language")}</label>
      <select
        id="ui-lang"
        value={i18n.resolvedLanguage}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
      >
        {SUPPORTED_UI_LANGS.map((lng) => (
          <option key={lng} value={lng}>
            {LABELS[lng] ?? lng}
          </option>
        ))}
      </select>
    </div>
  );
}
