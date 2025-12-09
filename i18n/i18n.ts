import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import tr from "./tr.json";
import en from "./en.json";

const resources = {
  tr: { translation: tr },
  en: { translation: en },
};

// Burada AsyncStorage kullanmıyoruz! Direkt başlatıyoruz.
i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  resources,
  lng: "tr", // Varsayılan dil Türkçe olsun
  fallbackLng: "tr",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
