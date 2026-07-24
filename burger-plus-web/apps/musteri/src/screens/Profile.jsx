import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  IconEdit, IconUser, IconReceipt, IconHelp, IconLogout, IconChevron, IconMoon, IconQr,
} from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import SayfaSarici from "../components/SayfaSarici";
import UyeOl from "./UyeOl";
import "./Profile.css";

const menuSatirlari = [
  { ad: "Kişisel Bilgiler", Ikon: IconUser, yol: "/profil-duzenle" },
  { ad: "Sipariş Geçmişi", Ikon: IconReceipt, yol: "/siparislerim" },
  { ad: "Yardım & Destek", Ikon: IconHelp, yol: null },
];

export default function Profile() {
  const { puan, karanlik, temaDegistir, misafir, adminMi, kullanici, cikisYap } = useApp();
  const git = useNavigate();

  // Misafir profil bölümüne giremez — üyeliğe davet ekranı göster
  if (misafir) {
    return (
      <UyeOl
        baslik="Hesabını Oluştur"
        aciklama="Profil üyelere özel. Üye ol, siparişlerini ve puanlarını tek yerden yönet."
      />
    );
  }

  // Profil ekranı tasarımda 1000'lik ara hedef gösteriyor
  const araHedef = 1000;
  const gosterilenPuan = Math.min(puan, araHedef);
  const yuzde = (gosterilenPuan / araHedef) * 100;

  return (
    <div className="ekran profile">
      <OrtakHeader />
      <SayfaSarici>

      <div className="profile-govde">
        {/* Avatar bloğu */}
        <div className="profil-avatar-blok">
          <div className="profil-avatar-wrap">
            <div className="profil-avatar profil-avatar-harf">
              {kullanici ? kullanici.ad.charAt(0).toUpperCase() : "?"}
            </div>
            <button className="profil-duzenle" aria-label="Düzenle" onClick={() => git("/profil-duzenle")}><IconEdit /></button>
          </div>
          <h2 className="profil-ad">
            {kullanici ? `${kullanici.ad} ${kullanici.soyad}` : "Misafir"}
          </h2>
          <p className="profil-uyelik">
            {kullanici ? kullanici.email : "Giriş yapmadınız"}
          </p>
        </div>

        {/* Puan çubuğu */}
        <section className="profil-puan-kart">
          <div className="profil-puan-ust">
            <span className="profil-puan-etiket">Burger Puanı</span>
            <span className="profil-puan-deger">{gosterilenPuan} / {araHedef} Puan</span>
          </div>
          <div className="ilerleme-ray">
            <div className="ilerleme-dolgu" style={{ width: `${yuzde}%` }} />
          </div>
          <p className="profil-puan-not">Bir sonraki ücretsiz menüye çok yakınsın!</p>
        </section>

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
          {/* Karanlık tema — anahtarlı satır */}
          <div className="profil-menu-satir">
            <span className="profil-menu-ikon-daire"><IconMoon /></span>
            <span className="profil-menu-ad">Karanlık Tema</span>
            <button
              className={"tema-anahtar" + (karanlik ? " tema-anahtar--acik" : "")}
              onClick={temaDegistir}
              role="switch"
              aria-checked={karanlik}
              aria-label="Karanlık tema"
            >
              <span className="tema-anahtar-top" />
            </button>
          </div>

          {menuSatirlari.map(({ ad, Ikon, yol }) => (
            <button
              key={ad}
              className="profil-menu-satir"
              onClick={() => yol && git(yol)}
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
      </div>
      </SayfaSarici>
    </div>
  );
}
