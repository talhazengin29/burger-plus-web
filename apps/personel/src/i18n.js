import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import tr from "./locales/tr";
import en from "./locales/en";

export const DIL_ANAHTARI = "burger-plus-personel-dil";
export const DESTEKLENEN_DILLER = ["tr", "en"];

function ilkDil() {
  const kayitli = localStorage.getItem(DIL_ANAHTARI);
  if (DESTEKLENEN_DILLER.includes(kayitli)) return kayitli;
  const tarayiciDili = navigator.language?.split("-")[0];
  return DESTEKLENEN_DILLER.includes(tarayiciDili) ? tarayiciDili : "tr";
}

i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr }, en: { translation: en } },
  lng: ilkDil(),
  fallbackLng: "tr",
  supportedLngs: DESTEKLENEN_DILLER,
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

i18n.on("languageChanged", (dil) => {
  localStorage.setItem(DIL_ANAHTARI, dil);
  document.documentElement.lang = dil;
});
document.documentElement.lang = i18n.resolvedLanguage || "tr";

export default i18n;
