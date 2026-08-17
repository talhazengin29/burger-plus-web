import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { useApp } from "../context/AppContext";
import { usePerde } from "../hooks/usePerde";
import { useDil } from "../context/DilContext";
import DilSecici from "../components/DilSecici";
import "./TableWelcome.css";

/*
  Masa karşılama ekranı. Masadaki QR okutulunca /masa?no=3#token=... açılır.
  Masa numarasını context'e yazar (aktifMasa). Kullanıcıya iki seçenek sunar:
   - Misafir olarak devam et: tek oturumluk, puan yok, doğrudan menüye.
   - Giriş yap: daimi müşteri, puan kazanır. (Giriş şimdilik sahte.)
  Her iki durumda da masa QR'dan biliniyor; ödeme öncesi tekrar QR sorulmaz.
*/
export default function TableWelcome() {
  const git = useIsletmeNavigate();
  const [params] = useSearchParams();
  const masaNo = params.get("no");
  const qrMasaTokeni = new URLSearchParams(window.location.hash.slice(1)).get("token") || params.get("token");
  const { aktifMasa, aktifMasaTokeni, setAktifMasa, setMisafir } = useApp();
  const masaToken = qrMasaTokeni || (String(aktifMasa) === String(masaNo) ? aktifMasaTokeni : null);
  const { perdeIleGit } = usePerde();
  const { t } = useDil();

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
        <DilSecici className="tw-dil-secici" />
        <div className="tw-icerik">
          <span className="tw-emoji">❓</span>
          <h1 className="tw-baslik">{t("table.invalid", "Geçersiz QR")}</h1>
          <p className="tw-alt">{t("table.invalidHelp", "Masadaki QR kodu tekrar okutmayı dene.")}</p>
          <button className="tw-btn" onClick={() => git("/anasayfa")}>{t("table.home", "Ana Sayfaya Git")}</button>
        </div>
      </div>
    );
  }

  const misafirDevam = () => {
    setMisafir(true);
    perdeIleGit(() => git("/anasayfa"), "normal", `Masa ${masaNo}`);
  };

  const girisYap = () => {
    setMisafir(false); // daimi kullanıcı
    perdeIleGit(() => git("/anasayfa"), "normal", `Masa ${masaNo}`);
  };

  return (
    <div className="ekran table-welcome">
      <DilSecici className="tw-dil-secici" />
      <div className="tw-icerik">
        <div className="tw-masa-daire">
          <span className="tw-masa-no">{masaNo}</span>
        </div>
        <span className="tw-hosgeldin-etiket">{t("table.label", `MASA ${masaNo}`, { table: masaNo })}</span>
        <h1 className="tw-baslik">{t("table.welcome", "Hoş Geldin! 👋")}</h1>
        <p className="tw-alt">
          {t("table.help", "Nasıl devam etmek istersin? Üyeysen giriş yap, puan kazanmaya devam et. İlk kez geldiysen misafir olarak hemen sipariş verebilirsin.")}
        </p>

        <div className="tw-butonlar">
          <button className="tw-btn tw-btn--uye" onClick={girisYap}>
            {t("table.signIn", "Giriş Yap")}
            <span className="tw-btn-alt">{t("table.signInSub", "Üyeyim, puan kazanayım")}</span>
          </button>
          <button className="tw-btn tw-btn--misafir" onClick={misafirDevam}>
            {t("table.guest", "Misafir Olarak Devam Et")}
            <span className="tw-btn-alt">{t("table.guestSub", "Üye olmadan sipariş ver")}</span>
          </button>
        </div>

        <p className="tw-not">{t("table.note", `Siparişin Masa ${masaNo}'ye servis edilecek`, { table: masaNo })}</p>
      </div>
    </div>
  );
}
