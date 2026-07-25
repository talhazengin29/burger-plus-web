import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import "./TableWelcome.css";

/*
  Masa karşılama ekranı. Masadaki QR okutulunca buraya gelinir: /masa?no=3
  Masa numarasını context'e yazar (aktifMasa). Kullanıcıya iki seçenek sunar:
   - Misafir olarak devam et: tek oturumluk, puan yok, doğrudan menüye.
   - Giriş yap: daimi müşteri, puan kazanır. (Giriş şimdilik sahte.)
  Her iki durumda da masa QR'dan biliniyor; ödeme öncesi tekrar QR sorulmaz.
*/
export default function TableWelcome() {
  const git = useNavigate();
  const [params] = useSearchParams();
  const masaNo = params.get("no");
  const { setAktifMasa, setMisafir } = useApp();

  // Masa numarasını hemen kaydet
  useEffect(() => {
    if (masaNo) setAktifMasa(masaNo);
  }, [masaNo, setAktifMasa]);

  // Geçersiz QR (masa numarası yok)
  if (!masaNo) {
    return (
      <div className="ekran table-welcome">
        <div className="tw-icerik">
          <span className="tw-emoji">❓</span>
          <h1 className="tw-baslik">Geçersiz QR</h1>
          <p className="tw-alt">Masadaki QR kodu tekrar okutmayı dene.</p>
          <button className="tw-btn" onClick={() => git("/anasayfa")}>Ana Sayfaya Git</button>
        </div>
      </div>
    );
  }

  const misafirDevam = () => {
    setMisafir(true);
    git("/anasayfa");
  };

  const girisYap = () => {
    setMisafir(false); // daimi kullanıcı
    git("/anasayfa");  // giriş şimdilik sahte: doğrudan menüye
  };

  return (
    <div className="ekran table-welcome">
      <div className="tw-icerik">
        <div className="tw-masa-daire">
          <span className="tw-masa-no">{masaNo}</span>
        </div>
        <span className="tw-hosgeldin-etiket">MASA {masaNo}</span>
        <h1 className="tw-baslik">Hoş Geldin! 👋</h1>
        <p className="tw-alt">
          Nasıl devam etmek istersin? Üyeysen giriş yap, puan kazanmaya
          devam et. İlk kez geldiysen misafir olarak hemen sipariş verebilirsin.
        </p>

        <div className="tw-butonlar">
          <button className="tw-btn tw-btn--uye" onClick={girisYap}>
            Giriş Yap
            <span className="tw-btn-alt">Üyeyim, puan kazanayım</span>
          </button>
          <button className="tw-btn tw-btn--misafir" onClick={misafirDevam}>
            Misafir Olarak Devam Et
            <span className="tw-btn-alt">Üye olmadan sipariş ver</span>
          </button>
        </div>

        <p className="tw-not">Siparişin Masa {masaNo}'ye servis edilecek</p>
      </div>
    </div>
  );
}
