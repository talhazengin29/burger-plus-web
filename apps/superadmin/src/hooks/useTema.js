import { useCallback, useState } from "react";

const ANAHTAR = "bp-superadmin-tema";

// index.html'deki başlangıç scripti sayfa boyanmadan önce doğru class'ı zaten
// uyguluyor; burada sadece React state'ini o class'a eşitliyoruz.
function baslangicKoyuMu() {
  if (typeof document === "undefined") return true;
  return document.documentElement.classList.contains("dark");
}

export function useTema() {
  const [koyu, setKoyu] = useState(baslangicKoyuMu);

  const degistir = useCallback(() => {
    setKoyu((onceki) => {
      const yeni = !onceki;
      document.documentElement.classList.toggle("dark", yeni);
      try {
        localStorage.setItem(ANAHTAR, yeni ? "dark" : "light");
      } catch {
        /* localStorage erişilemiyor (gizli sekme vb.) — sessizce geç */
      }
      return yeni;
    });
  }, []);

  return [koyu, degistir];
}
