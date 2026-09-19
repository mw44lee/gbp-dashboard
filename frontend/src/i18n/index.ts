import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import ko from "./locales/ko.json";

// Static UI strings (buttons, labels, section headers) only. This is a
// separate concern from review-content translation: UI language is a fixed
// per-viewer preference, review language is chosen per-review on demand and
// goes through the backend's AI provider instead of a resource bundle.
export const SUPPORTED_UI_LANGS = ["en", "ko"] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
    },
    lng: undefined,
    fallbackLng: "en",
    supportedLngs: SUPPORTED_UI_LANGS as unknown as string[],
    interpolation: { escapeValue: false },
    // Deliberately does NOT fall back to the browser/OS locale ("navigator"):
    // a manager's OS language often has nothing to do with which country's
    // stores they manage, so the app always opens in English until someone
    // explicitly picks a language (then that choice is remembered here).
    detection: {
      order: ["localStorage"],
      caches: ["localStorage"],
    },
  });

export default i18n;
