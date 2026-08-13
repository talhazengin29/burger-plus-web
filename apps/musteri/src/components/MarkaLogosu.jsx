import { useEffect, useState } from "react";
import { useTema } from "../context/TemaContext";
import BurgerPlusLogosu from "./BurgerPlusLogosu";

const kirpilmisLogoOnbellegi = new Map();

function saydamKenarlariKirp(logoUrl) {
  if (kirpilmisLogoOnbellegi.has(logoUrl)) return kirpilmisLogoOnbellegi.get(logoUrl);

  const islem = new Promise((resolve) => {
    const gorsel = new Image();
    gorsel.crossOrigin = "anonymous";
    gorsel.onload = () => {
      try {
        const tuval = document.createElement("canvas");
        tuval.width = gorsel.naturalWidth;
        tuval.height = gorsel.naturalHeight;
        const baglam = tuval.getContext("2d", { willReadFrequently: true });
        baglam.drawImage(gorsel, 0, 0);
        const pikseller = baglam.getImageData(0, 0, tuval.width, tuval.height).data;
        let sol = tuval.width;
        let sag = -1;
        let ust = tuval.height;
        let alt = -1;

        for (let y = 0; y < tuval.height; y += 1) {
          for (let x = 0; x < tuval.width; x += 1) {
            if (pikseller[(y * tuval.width + x) * 4 + 3] <= 10) continue;
            sol = Math.min(sol, x);
            sag = Math.max(sag, x);
            ust = Math.min(ust, y);
            alt = Math.max(alt, y);
          }
        }

        if (sag < sol || alt < ust) return resolve(logoUrl);

        const pay = Math.max(2, Math.round(Math.max(sag - sol, alt - ust) * 0.015));
        sol = Math.max(0, sol - pay);
        sag = Math.min(tuval.width - 1, sag + pay);
        ust = Math.max(0, ust - pay);
        alt = Math.min(tuval.height - 1, alt + pay);

        const sonuc = document.createElement("canvas");
        sonuc.width = sag - sol + 1;
        sonuc.height = alt - ust + 1;
        sonuc.getContext("2d").drawImage(
          gorsel,
          sol,
          ust,
          sonuc.width,
          sonuc.height,
          0,
          0,
          sonuc.width,
          sonuc.height,
        );
        resolve(sonuc.toDataURL("image/webp", 0.96));
      } catch {
        resolve(logoUrl);
      }
    };
    gorsel.onerror = () => resolve(logoUrl);
    gorsel.src = logoUrl;
  });

  kirpilmisLogoOnbellegi.set(logoUrl, islem);
  return islem;
}

export default function MarkaLogosu({ className = "", alt = "", saydamBosluklariKirp = false }) {
  const { logoUrl, isletmeAdi, isletmeSlug } = useTema();
  const [logoHatasi, setLogoHatasi] = useState(false);
  const [islenmisLogoUrl, setIslenmisLogoUrl] = useState(logoUrl);
  const burgerPlusMu = isletmeSlug === "burger-plus";
  const gosterilecekLogo = logoUrl || (burgerPlusMu ? "burger-plus-varsayilan" : "");

  useEffect(() => setLogoHatasi(false), [gosterilecekLogo]);
  useEffect(() => {
    let etkin = true;
    setIslenmisLogoUrl(logoUrl);
    if (!saydamBosluklariKirp || !logoUrl) return () => { etkin = false; };

    saydamKenarlariKirp(logoUrl).then((sonuc) => {
      if (etkin) setIslenmisLogoUrl(sonuc);
    });
    return () => { etkin = false; };
  }, [logoUrl, saydamBosluklariKirp]);

  if (!logoUrl && burgerPlusMu) {
    return <BurgerPlusLogosu className={`${className} marka-logo-yuklu marka-logo-varsayilan`.trim()} alt={alt || isletmeAdi} />;
  }

  if (gosterilecekLogo && !logoHatasi) {
    return <img className={`${className} marka-logo-yuklu marka-logo-ozel`.trim()} src={islenmisLogoUrl || gosterilecekLogo} alt={alt || isletmeAdi} onError={() => setLogoHatasi(true)} />;
  }
  return <span className={`${className} marka-logo-metin`.trim()}>{isletmeAdi}</span>;
}
