import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import tr from "./tr.json";
import en from "./en.json";
import de from "./de.json"; // <-- 1. IMPORT EKLE

const resources = {
  tr: { translation: tr },
  en: { translation: en },
  de: { translation: de }, // <-- 2. BURAYA EKLE
};

i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  resources,
  lng: "tr",
  fallbackLng: "tr",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
