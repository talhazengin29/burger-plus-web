import { useEffect, useState } from "react";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import QRCode from "qrcode";
import { useApp } from "../context/AppContext";
import {
  IconEdit, IconUser, IconReceipt, IconHelp, IconLogout, IconChevron, IconQr, IconGift, IconWallet,
} from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import SayfaSarici from "../components/SayfaSarici";
import UyeOl from "./UyeOl";
import { davetOzetiniGetir, ikiFaktorKurulumBaslat, ikiFaktorKurulumOnayla, ikiFaktorKapat } from "../lib/authApi";
import "./Profile.css";

const menuSatirlari = [
  { ad: "Cüzdanım", Ikon: IconWallet, yol: "/cuzdanim" },
  { ad: "Kişisel Bilgiler", Ikon: IconUser, yol: "/profil-duzenle" },
  { ad: "Hediyelerim", Ikon: IconGift, yol: "/hediyelerim" },
  { ad: "Sipariş Geçmişi", Ikon: IconReceipt, yol: "/siparislerim" },
  { ad: "Yardım & Destek", Ikon: IconHelp, yol: null },
];

export default function Profile() {
  const { misafir, adminMi, kullanici, cikisYap, avatar, kullaniciyiYenile } = useApp();
  const git = useIsletmeNavigate();
  const [yardimAcik, setYardimAcik] = useState(false);
  const [davetOzeti, setDavetOzeti] = useState(null);
  const [davetKopyalandi, setDavetKopyalandi] = useState(false);
  const [ikiFaktorModal, setIkiFaktorModal] = useState(false);
  const [ikiFaktorAdim, setIkiFaktorAdim] = useState("baslangic");
  const [ikiFaktorSifre, setIkiFaktorSifre] = useState("");
  const [ikiFaktorKod, setIkiFaktorKod] = useState("");
  const [ikiFaktorKurulum, setIkiFaktorKurulum] = useState(null);
  const [kurtarmaKodlari, setKurtarmaKodlari] = useState([]);
  const [ikiFaktorHata, setIkiFaktorHata] = useState("");
  const [ikiFaktorYukleniyor, setIkiFaktorYukleniyor] = useState(false);

  useEffect(() => {
    if (!kullanici?.id) return;
    let iptal = false;
    davetOzetiniGetir().then((ozet) => { if (!iptal) setDavetOzeti(ozet); }).catch(() => {});
    return () => { iptal = true; };
  }, [kullanici?.id]);

  const davetKodunuKopyala = async () => {
    const kod = davetOzeti?.davetKodu || kullanici?.davetKodu;
    if (!kod) return;
    try {
      await navigator.clipboard.writeText(kod);
      setDavetKopyalandi(true);
      setTimeout(() => setDavetKopyalandi(false), 1800);
    } catch {
      setDavetKopyalandi(false);
    }
  };

  const ikiFaktorPenceresiniAc = () => {
    setIkiFaktorAdim(kullanici?.ikiFaktorAktif ? "kapat" : "baslangic");
    setIkiFaktorSifre(""); setIkiFaktorKod(""); setIkiFaktorKurulum(null);
    setKurtarmaKodlari([]); setIkiFaktorHata(""); setIkiFaktorModal(true);
  };

  const ikiFaktorKurulumuBaslat = async () => {
    setIkiFaktorYukleniyor(true); setIkiFaktorHata("");
    try {
      const sonuc = await ikiFaktorKurulumBaslat(ikiFaktorSifre);
      const qrDataUrl = await QRCode.toDataURL(sonuc.otpauthUri, { width: 260, margin: 1, errorCorrectionLevel: "M" });
      setIkiFaktorKurulum({ ...sonuc, qrDataUrl });
      setIkiFaktorSifre(""); setIkiFaktorAdim("dogrula");
    } catch (e) { setIkiFaktorHata(e.message); }
    finally { setIkiFaktorYukleniyor(false); }
  };

  const ikiFaktorKurulumunuOnayla = async () => {
    setIkiFaktorYukleniyor(true); setIkiFaktorHata("");
    try {
      const sonuc = await ikiFaktorKurulumOnayla(ikiFaktorKod);
      setKurtarmaKodlari(sonuc.kurtarmaKodlari || []);
      setIkiFaktorKod(""); setIkiFaktorAdim("kurtarma");
      await kullaniciyiYenile();
    } catch (e) { setIkiFaktorHata(e.message); }
    finally { setIkiFaktorYukleniyor(false); }
  };

  const ikiFaktoruKapat = async () => {
    setIkiFaktorYukleniyor(true); setIkiFaktorHata("");
    try {
      await ikiFaktorKapat(ikiFaktorSifre, ikiFaktorKod);
      await kullaniciyiYenile();
      setIkiFaktorModal(false);
    } catch (e) { setIkiFaktorHata(e.message); }
    finally { setIkiFaktorYukleniyor(false); }
  };

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

        {kullanici && (
          <section className="profil-davet-kart">
            <div className="profil-davet-ust">
              <div><span>Davet kodun</span><strong>{davetOzeti?.davetKodu || kullanici.davetKodu || "—"}</strong></div>
              <button type="button" onClick={davetKodunuKopyala} disabled={!davetOzeti?.davetKodu && !kullanici.davetKodu}>{davetKopyalandi ? "Kopyalandı" : "Kopyala"}</button>
            </div>
            <p>Kodunla kayıt olan arkadaşlarının her alışverişinden %5 puan kazanırsın.</p>
            <div className="profil-davet-ozet">
              <span><b>{davetOzeti?.davetEdilenSayisi ?? 0}</b>Davet edilen</span>
              <span><b>{davetOzeti?.odulluSiparisSayisi ?? 0}</b>Ödüllü sipariş</span>
              <span><b>{davetOzeti?.kazanilanPuan ?? 0}</b>Kazanılan puan</span>
            </div>
          </section>
        )}

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
          <button className="profil-menu-satir" onClick={ikiFaktorPenceresiniAc}>
            <span className="profil-menu-ikon-daire profil-2fa-ikon" aria-hidden="true">🛡️</span>
            <span className="profil-menu-ad">İki Adımlı Doğrulama<small className="profil-2fa-durum">{kullanici?.ikiFaktorAktif ? "Aktif" : "Kapalı"}</small></span>
            <IconChevron className="profil-menu-ok" />
          </button>
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
        {ikiFaktorModal && (
          <div className="destek-perde" onClick={() => ikiFaktorAdim !== "kurtarma" && setIkiFaktorModal(false)}>
            <section className="destek-modal iki-faktor-modal" onClick={(e) => e.stopPropagation()}>
              <span>HESAP GÜVENLİĞİ</span>
              <h3>İki Adımlı Doğrulama</h3>
              {ikiFaktorAdim === "baslangic" && <><p>Google Authenticator, Microsoft Authenticator veya Authy ile girişlerini koru. Devam etmek için mevcut şifreni doğrula.</p><label>Mevcut şifre<input type="password" value={ikiFaktorSifre} onChange={(e) => setIkiFaktorSifre(e.target.value.slice(0, 72))} autoComplete="current-password" /></label><button className="iki-faktor-ana-btn" onClick={ikiFaktorKurulumuBaslat} disabled={!ikiFaktorSifre || ikiFaktorYukleniyor}>Kurulumu Başlat</button></>}
              {ikiFaktorAdim === "dogrula" && <><p>QR kodunu authenticator uygulamanla okut, ardından oluşan 6 haneli kodu gir.</p><img className="iki-faktor-qr" src={ikiFaktorKurulum?.qrDataUrl} alt="Authenticator kurulum QR kodu" /><code className="iki-faktor-secret">{ikiFaktorKurulum?.secret}</code><label>6 haneli kod<input inputMode="numeric" autoComplete="one-time-code" value={ikiFaktorKod} onChange={(e) => setIkiFaktorKod(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" /></label><button className="iki-faktor-ana-btn" onClick={ikiFaktorKurulumunuOnayla} disabled={ikiFaktorKod.length !== 6 || ikiFaktorYukleniyor}>Etkinleştir</button></>}
              {ikiFaktorAdim === "kurtarma" && <><p><b>Bu kodları şimdi güvenli bir yere kaydet.</b> Her kod yalnızca bir kez kullanılabilir ve bu ekrandan ayrıldıktan sonra tekrar gösterilmez.</p><div className="iki-faktor-kodlar">{kurtarmaKodlari.map((kod) => <code key={kod}>{kod}</code>)}</div><button className="iki-faktor-ana-btn" onClick={async () => { await navigator.clipboard.writeText(kurtarmaKodlari.join("\n")).catch(() => {}); }}>Kodları Kopyala</button><button onClick={() => setIkiFaktorModal(false)}>Kaydettim, Bitir</button></>}
              {ikiFaktorAdim === "kapat" && <><p>İki adımlı doğrulamayı kapatmak için mevcut şifreni ve authenticator kodunu doğrula.</p><label>Mevcut şifre<input type="password" value={ikiFaktorSifre} onChange={(e) => setIkiFaktorSifre(e.target.value.slice(0, 72))} autoComplete="current-password" /></label><label>Doğrulama veya kurtarma kodu<input value={ikiFaktorKod} onChange={(e) => setIkiFaktorKod(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 11))} autoComplete="one-time-code" /></label><button className="iki-faktor-tehlike-btn" onClick={ikiFaktoruKapat} disabled={!ikiFaktorSifre || !ikiFaktorKod || ikiFaktorYukleniyor}>İki Adımlı Doğrulamayı Kapat</button></>}
              {ikiFaktorHata && <p className="iki-faktor-hata">{ikiFaktorHata}</p>}
              {ikiFaktorAdim !== "kurtarma" && <button onClick={() => setIkiFaktorModal(false)}>Vazgeç</button>}
            </section>
          </div>
        )}
      </div>
      </SayfaSarici>
    </div>
  );
}
