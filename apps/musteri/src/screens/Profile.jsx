import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  IconEdit, IconUser, IconReceipt, IconHelp, IconLogout, IconChevron, IconQr, IconGift,
} from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import SayfaSarici from "../components/SayfaSarici";
import UyeOl from "./UyeOl";
import "./Profile.css";

const menuSatirlari = [
  { ad: "Kişisel Bilgiler", Ikon: IconUser, yol: "/profil-duzenle" },
  { ad: "Hediyelerim", Ikon: IconGift, yol: "/hediyelerim" },
  { ad: "Sipariş Geçmişi", Ikon: IconReceipt, yol: "/siparislerim" },
  { ad: "Yardım & Destek", Ikon: IconHelp, yol: null },
];

export default function Profile() {
  const { misafir, adminMi, kullanici, cikisYap, avatar } = useApp();
  const git = useNavigate();
  const [yardimAcik, setYardimAcik] = useState(false);

  // Misafir profil bölümüne giremez — üyeliğe davet ekranı göster
  if (misafir) {
    return (
      <UyeOl
        baslik="Hesabını Oluştur"
        aciklama="Profil üyelere özel. Üye ol, siparişlerini ve puanlarını tek yerden yönet."
      />
    );
  }

  return (
    <div className="ekran profile">
      <OrtakHeader />
      <SayfaSarici>

      <div className="profile-govde">
        {/* Avatar bloğu */}
        <div className="profil-avatar-blok">
          <div className="profil-avatar-wrap">
            {avatar ? <img className="profil-avatar" src={avatar} alt="Profil" /> : <div className="profil-avatar profil-avatar-harf">{kullanici ? kullanici.ad.charAt(0).toUpperCase() : "?"}</div>}
            <button className="profil-duzenle" aria-label="Düzenle" onClick={() => git("/profil-duzenle")}><IconEdit /></button>
          </div>
          <h2 className="profil-ad">
            {kullanici ? `${kullanici.ad} ${kullanici.soyad}` : "Misafir"}
          </h2>
          <p className="profil-uyelik">
            {kullanici ? kullanici.email : "Giriş yapmadınız"}
          </p>
        </div>

        {/* İşletme bölümü — SADECE ADMIN görür */}
        {adminMi && (
          <>
            <div className="profil-isletme-baslik">İşletme</div>
            <button className="profil-menu isletme-satir" onClick={() => git("/qr-uret")}>
              <span className="profil-menu-ikon-daire isletme-ikon"><IconQr /></span>
              <div className="isletme-metin">
                <span className="profil-menu-ad">Masa QR Kodları</span>
                <span className="isletme-alt">Masalar için QR üret ve yazdır</span>
              </div>
              <IconChevron className="profil-menu-ok" />
            </button>
          </>
        )}

        {/* Menü satırları */}
        <div className="profil-menu">
          {menuSatirlari.map(({ ad, Ikon, yol }) => (
            <button
              key={ad}
              className="profil-menu-satir"
              onClick={() => yol ? git(yol) : setYardimAcik(true)}
            >
              <span className="profil-menu-ikon-daire"><Ikon /></span>
              <span className="profil-menu-ad">{ad}</span>
              <IconChevron className="profil-menu-ok" />
            </button>
          ))}
        </div>

        {/* Çıkış */}
        <button className="cikis-btn" onClick={() => { cikisYap(); git("/"); }}>
          <IconLogout className="cikis-ikon" />
          Çıkış Yap
        </button>
        {yardimAcik && <div className="destek-perde" onClick={() => setYardimAcik(false)}><section className="destek-modal" onClick={(e) => e.stopPropagation()}><span>BURGER PLUS DESTEK</span><h3>Nasıl yardımcı olabiliriz?</h3><p>Siparişin, kampanyalar veya hesabınla ilgili desteğe ihtiyaç duyarsan ekibimize ulaşabilirsin. Sipariş numaranı ve masa bilgini paylaşman çözümü hızlandırır.</p><p className="destek-not">Destek saatleri: Her gün 10:00 – 23:00</p><a href="mailto:destek@burgerplus.com">destek@burgerplus.com</a><button onClick={() => setYardimAcik(false)}>Kapat</button></section></div>}
      </div>
      </SayfaSarici>
    </div>
  );
}
