import { useEffect, useState } from "react";
import { useTema } from "../context/TemaContext";
import BurgerPlusLogosu from "./BurgerPlusLogosu";

export default function MarkaLogosu({ className = "", alt = "" }) {
  const { logoUrl, isletmeAdi, isletmeSlug } = useTema();
  const [logoHatasi, setLogoHatasi] = useState(false);
  const burgerPlusMu = isletmeSlug === "burger-plus";
  const gosterilecekLogo = logoUrl || (burgerPlusMu ? "burger-plus-varsayilan" : "");

  useEffect(() => setLogoHatasi(false), [gosterilecekLogo]);

  if (!logoUrl && burgerPlusMu) {
    return <BurgerPlusLogosu className={`${className} marka-logo-yuklu marka-logo-varsayilan`.trim()} alt={alt || isletmeAdi} />;
  }

  if (gosterilecekLogo && !logoHatasi) {
    return <img className={`${className} marka-logo-yuklu marka-logo-ozel`.trim()} src={gosterilecekLogo} alt={alt || isletmeAdi} onError={() => setLogoHatasi(true)} />;
  }
  return <span className={`${className} marka-logo-metin`.trim()}>{isletmeAdi}</span>;
}
