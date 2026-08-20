import { useEffect } from "react";
import { useDil } from "../dil/DilContext";
import { useSearchParams } from "react-router-dom";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { useApp } from "../context/AppContext";
import { usePerde } from "../hooks/usePerde";
import "./TableWelcome.css";

/*
  Masa karşılama ekranı. Masadaki QR okutulunca /masa?no=3#token=... açılır.
  Masa numarasını context'e yazar (aktifMasa). Kullanıcıya iki seçenek sunar:
   - Misafir olarak devam et: tek oturumluk, puan yok, doğrudan menüye.
   - Giriş yap: daimi müşteri, puan kazanır. (Giriş şimdilik sahte.)
  Her iki durumda da masa QR'dan biliniyor; ödeme öncesi tekrar QR sorulmaz.
*/
export default function TableWelcome() {
  const { t } = useDil();
  const git = useIsletmeNavigate();
  const [params] = useSearchParams();
  const masaNo = params.get("no");
  const qrMasaTokeni = new URLSearchParams(window.location.hash.slice(1)).get("token") || params.get("token");
  const { aktifMasa, aktifMasaTokeni, setAktifMasa, setMisafir } = useApp();
  const masaToken = qrMasaTokeni || (String(aktifMasa) === String(masaNo) ? aktifMasaTokeni : null);
  const { perdeIleGit } = usePerde();

  // Masa numarasını hemen kaydet
  useEffect(() => {
    if (masaNo && masaToken) {
      setAktifMasa(masaNo, masaToken);
      if (qrMasaTokeni) {
        const temizUrl = new URL(window.location.href);
        temizUrl.searchParams.delete("token");
        temizUrl.hash = "";
        window.history.replaceState({}, "", temizUrl);
      }
    }
  }, [masaNo, masaToken, qrMasaTokeni, setAktifMasa]);

  // Geçersiz QR (masa numarası yok)
  if (!masaNo || !masaToken) {
    return (
      <div className="ekran table-welcome">
        <div className="tw-icerik">
          <span className="tw-emoji">❓</span>
          <h1 className="tw-baslik">{t("welcome.invalidQr")}</h1>
          <p className="tw-alt">{t("welcome.invalidQrHelp")}</p>
          <button className="tw-btn" onClick={() => git("/anasayfa")}>{t("welcome.goHome")}</button>
        </div>
      </div>
    );
  }

  const misafirDevam = () => {
    setMisafir(true);
    perdeIleGit(() => git("/anasayfa"), "normal", t("common.table", { number: masaNo }));
  };

  const girisYap = () => {
    setMisafir(false); // daimi kullanıcı
    perdeIleGit(() => git("/anasayfa"), "normal", t("common.table", { number: masaNo }));
  };

  return (
    <div className="ekran table-welcome">
      <div className="tw-icerik">
        <div className="tw-masa-daire">
          <span className="tw-masa-no">{masaNo}</span>
        </div>
        <span className="tw-hosgeldin-etiket">{t("welcome.tableLabel", { number: masaNo })}</span>
        <h1 className="tw-baslik">{t("welcome.title")}</h1>
        <p className="tw-alt">{t("welcome.intro")}</p>

        <div className="tw-butonlar">
          <button className="tw-btn tw-btn--uye" onClick={girisYap}>
            {t("welcome.signIn")}
            <span className="tw-btn-alt">{t("welcome.memberHint")}</span>
          </button>
          <button className="tw-btn tw-btn--misafir" onClick={misafirDevam}>
            {t("welcome.guest")}
            <span className="tw-btn-alt">{t("welcome.guestHint")}</span>
          </button>
        </div>

        <p className="tw-not">{t("welcome.serviceNote", { number: masaNo })}</p>
      </div>
    </div>
  );
}
