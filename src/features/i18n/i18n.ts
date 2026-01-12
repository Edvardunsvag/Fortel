import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./locales/en.json";
import nbTranslations from "./locales/nb.json";

const getInitialLanguage = (): string => {
  // Try to get from localStorage
  const saved = localStorage.getItem("fortedle_language");
  if (saved === "en" || saved === "nb") {
    return saved;
  }
  // Try to detect from browser
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("nb") || browserLang.startsWith("no")) {
    return "nb";
  }
  // Default to English
  return "en";
};

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslations,
    },
    nb: {
      translation: nbTranslations,
    },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
