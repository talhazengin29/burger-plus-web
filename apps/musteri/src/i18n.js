import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import tr from "./locales/tr";
import en from "./locales/en";

const DIL_ANAHTARI = "burger-plus-musteri-dil";
const desteklenenDiller = ["tr", "en"];
const kayitliDil = localStorage.getItem(DIL_ANAHTARI);
const tarayiciDili = navigator.language?.split("-")[0];
const ilkDil = desteklenenDiller.includes(kayitliDil) ? kayitliDil : desteklenenDiller.includes(tarayiciDili) ? tarayiciDili : "tr";

i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr }, en: { translation: en } },
  lng: ilkDil,
  fallbackLng: "tr",
  supportedLngs: desteklenenDiller,
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

i18n.on("languageChanged", (dil) => {
  localStorage.setItem(DIL_ANAHTARI, dil);
  document.documentElement.lang = dil;
});
document.documentElement.lang = i18n.resolvedLanguage || "tr";

export default i18n;
