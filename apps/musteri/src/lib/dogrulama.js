const GORUNMEZ_KARAKTERLER = /[\u200B-\u200D\u2060\uFEFF]/g;
const EMAIL_DESENI = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ISIM_DESENI = /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u;

export function guvenliMetin(deger, enFazla = 300) {
  return [...String(deger ?? "")]
    .filter((karakter) => karakter.codePointAt(0) >= 32 && karakter.codePointAt(0) !== 127)
    .join("")
    .replace(GORUNMEZ_KARAKTERLER, "")
    .slice(0, enFazla);
}

export function temizMetin(deger, enFazla = 300) {
  return guvenliMetin(deger, enFazla).replace(/\s+/g, " ").trim();
}

export function emailTemizle(deger) {
  return temizMetin(deger, 254).toLowerCase();
}

export function telefonTemizle(deger) {
  const ham = guvenliMetin(deger, 20).replace(/[^\d+]/g, "");
  return ham.startsWith("+") ? `+${ham.slice(1).replace(/\+/g, "")}` : ham.replace(/\+/g, "");
}

export function davetKoduTemizle(deger) {
  return guvenliMetin(deger, 8).toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "");
}

export function tcKimlikGecerli(deger) {
  const tc = String(deger ?? "");
  return /^[1-9]\d{10}$/.test(tc) && !/^(\d)\1{10}$/.test(tc);
}

export const kurallar = {
  ad(deger, etiket = "Ad") {
    const temiz = temizMetin(deger, 60);
    if (!temiz) return `${etiket} zorunludur.`;
    if (temiz.length < 2) return `${etiket} en az 2 karakter olmalıdır.`;
    if (!ISIM_DESENI.test(temiz)) return `${etiket} yalnızca harf, boşluk, kesme ve tire içerebilir.`;
    return "";
  },
  email(deger) {
    const temiz = emailTemizle(deger);
    if (!temiz) return "E-posta zorunludur.";
    if (!EMAIL_DESENI.test(temiz)) return "Geçerli bir e-posta adresi gir.";
    return "";
  },
  telefon(deger, zorunlu = true) {
    const temiz = telefonTemizle(deger);
    if (!temiz) return zorunlu ? "Telefon numarası zorunludur." : "";
    const rakamlar = temiz.replace(/\D/g, "");
    if (!/^(?:90)?5\d{9}$/.test(rakamlar)) return "Telefonu 05XXXXXXXXX veya +905XXXXXXXXX biçiminde gir.";
    return "";
  },
  girisSifresi(deger) {
    if (!String(deger ?? "")) return "Şifre zorunludur.";
    if (String(deger).length > 72) return "Şifre en fazla 72 karakter olabilir.";
    return "";
  },
  yeniSifre(deger) {
    const sifre = String(deger ?? "");
    if (!sifre) return "Şifre zorunludur.";
    if (sifre.length < 6) return "Şifre en az 6 karakter olmalıdır.";
    if (sifre.length > 72) return "Şifre en fazla 72 karakter olabilir.";
    if (/[\r\n\t]/.test(sifre)) return "Şifre satır sonu veya sekme içeremez.";
    return "";
  },
  tcKimlik(deger) {
    if (!String(deger ?? "")) return "T.C. kimlik numarası zorunludur.";
    if (!tcKimlikGecerli(deger)) return "Geçerli bir T.C. kimlik numarası gir.";
    return "";
  },
  adres(deger) {
    const temiz = temizMetin(deger, 300);
    if (!temiz) return "Adres zorunludur.";
    if (temiz.length < 10) return "Adres en az 10 karakter olmalıdır.";
    return "";
  },
  il(deger) {
    return kurallar.ad(deger, "İl");
  },
  postaKodu(deger) {
    const temiz = String(deger ?? "").trim();
    if (!temiz) return "";
    return /^\d{5}$/.test(temiz) ? "" : "Posta kodu 5 rakam olmalıdır.";
  },
  davetKodu(deger) {
    const temiz = String(deger ?? "").trim().toUpperCase();
    if (!temiz) return "";
    return /^[A-HJ-NP-Z2-9]{8}$/.test(temiz) ? "" : "Davet kodu 8 karakter olmalıdır.";
  },
};

export function formuDogrula(veri, sema) {
  return Object.entries(sema).reduce((hatalar, [alan, kural]) => {
    const mesaj = kural(veri[alan], veri);
    if (mesaj) hatalar[alan] = mesaj;
    return hatalar;
  }, {});
}

export function ilkHata(hatalar) {
  return Object.values(hatalar)[0] || "";
}
