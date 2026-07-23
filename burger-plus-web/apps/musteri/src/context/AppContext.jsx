/* ==========================================================================
   Uygulama geneli paylaşılan state: puan, tema ve sepet + ödeme.
   Ödeme yapıldığında puan burada artar. Puan oranı mockData'da (PUAN_ORANI_TL).
   ========================================================================== */

import { createContext, useContext, useState, useEffect } from "react";
import { puanHesapla } from "../data/mockData";
import { socket } from "../lib/socket";
import { beniGetir, tokeniSil, puaniGuncelle, profilGuncelle } from "../lib/authApi";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [puan, setPuan] = useState(0);

  // --- Giriş yapmış kullanıcı (auth) ---
  // null ise misafir/giriş yapılmamış. Doluysa gerçek hesap.
  const [kullanici, setKullanici] = useState(null);
  const [authYuklendi, setAuthYuklendi] = useState(false);
  const adminMi = kullanici?.rol === "admin";

  // Açılışta token varsa kullanıcıyı geri getir (oturum korunur)
  useEffect(() => {
    beniGetir().then((k) => {
      if (k) {
        setKullanici(k);
        setPuan(k.puan || 0);
      }
      setAuthYuklendi(true);
    });
  }, []);

  // Giriş/kayıt başarılı olunca çağrılır
  const girisiTamamla = (k) => {
    setKullanici(k);
    setPuan(k.puan || 0);
    sessionStorage.removeItem("bp_misafir"); // giriş yapan misafir değildir
  };
  // Çıkış
  const cikisYap = () => {
    tokeniSil();
    setKullanici(null);
    setPuan(0);
    // Siparişler/damga kişiye özel — çıkışta temizle ki hesaplar karışmasın
    localStorage.removeItem("bp_siparislerim");
    setSiparislerim([]);
  };

  // Profil güncelle (email + telefon). Başarılıysa kullanıcı state'ini tazeler.
  const profiliGuncelle = async (email, telefon) => {
    const sonuc = await profilGuncelle(email, telefon);
    if (sonuc.kullanici) setKullanici(sonuc.kullanici);
    return sonuc; // {kullanici} veya {hata}
  };

  // Karanlık tema — tüm ekranlara <html data-tema="karanlik"> ile yansır
  const [karanlik, setKaranlik] = useState(false);
  useEffect(() => {
    document.documentElement.setAttribute("data-tema", karanlik ? "karanlik" : "aydinlik");
  }, [karanlik]);
  const temaDegistir = () => setKaranlik((v) => !v);

  // --- Sepet ---
  // Al götür (masasız) için YEREL sepet.
  const [sepet, setSepet] = useState([]);

  // Aktif masa: QR ile karşılama ekranından gelince set edilir.
  // null ise al götür; dolu ise masaya servis. Sipariş tipini bu belirler.
  // sessionStorage'a yazılır → sayfa yenilenince (F5) korunur.
  const [aktifMasa, setAktifMasaState] = useState(
    () => sessionStorage.getItem("bp_aktifMasa") || null
  );
  const setAktifMasa = (deger) => {
    if (deger) sessionStorage.setItem("bp_aktifMasa", deger);
    else sessionStorage.removeItem("bp_aktifMasa");
    setAktifMasaState(deger);
  };

  // Misafir oturumu: QR'dan "Misafir olarak devam et" ile gelince true olur.
  // sessionStorage'a yazılır → sayfa yenilenince korunur.
  // ÖNEMLİ: Giriş yapmış kullanıcı ASLA misafir değildir (kullanici doluysa misafir=false).
  const [misafirState, setMisafirState] = useState(
    () => sessionStorage.getItem("bp_misafir") === "1"
  );
  const misafir = kullanici ? false : misafirState;
  const setMisafir = (deger) => {
    if (deger) sessionStorage.setItem("bp_misafir", "1");
    else sessionStorage.removeItem("bp_misafir");
    setMisafirState(deger);
  };

  // --- Masa özeti (canlı) ---
  // Masadaki HERKESİN siparişi. Backend'den canlı gelir.
  // Masa numarası localStorage'da tutulur → sekme/tarayıcı kapansa bile
  // masaya bağlanmaya devam eder, sipariş durumu (hazırlanıyor→hazır) güncellenir.
  const [ozetMasaNo, setOzetMasaNo] = useState(
    () => localStorage.getItem("bp_ozetMasa") || sessionStorage.getItem("bp_ozetMasa") || null
  );
  const [masaOzeti, setMasaOzeti] = useState({ kalemler: [], toplam: 0 });

  // Masadaki siparişlerin canlı durumu (mutfak güncelledikçe değişir).
  // Tüm kalemler "hazir" ise → hazır; biri hazırlanıyorsa → hazırlanıyor; yoksa → yeni.
  const masaDurumu = (() => {
    const k = masaOzeti.kalemler || [];
    if (k.length === 0) return null;
    if (k.every((x) => x.durum === "hazir")) return "hazir";
    if (k.some((x) => x.durum === "hazirlaniyor")) return "hazirlaniyor";
    return "yeni";
  })();

  // aktifMasa set edilince özet masasını da güncelle (kalıcı)
  useEffect(() => {
    if (aktifMasa) {
      setOzetMasaNo(aktifMasa);
      localStorage.setItem("bp_ozetMasa", aktifMasa);
    }
  }, [aktifMasa]);

  // Özet masasına bağlan, canlı güncellemeleri dinle
  useEffect(() => {
    if (!ozetMasaNo) {
      setMasaOzeti({ kalemler: [], toplam: 0 });
      return;
    }
    socket.emit("masaya-katil", ozetMasaNo);
    const dinleyici = (veri) => {
      if (String(veri.masaNo) === String(ozetMasaNo)) setMasaOzeti(veri);
    };
    socket.on("masa-guncellendi", dinleyici);
    return () => socket.off("masa-guncellendi", dinleyici);
  }, [ozetMasaNo]);

  // --- Sepet (tamamen yerel/kişisel) ---
  // Ortak masa sepeti YOK. Herkes kendi sepetini oluşturur, kendi öder.
  // Backend'e gönderim ödeme anında olur (aşağıda odemeyiTamamla).
  const sepeteEkle = (urun) => {
    setSepet((onceki) => {
      const mevcut = onceki.find((s) => s.id === urun.id);
      if (mevcut) {
        return onceki.map((s) =>
          s.id === urun.id ? { ...s, adet: s.adet + 1 } : s
        );
      }
      return [...onceki, { ...urun, adet: 1 }];
    });
  };

  const adetArtir = (id) =>
    setSepet((o) => o.map((s) => (s.id === id ? { ...s, adet: s.adet + 1 } : s)));

  const adetAzalt = (id) =>
    setSepet((o) =>
      o
        .map((s) => (s.id === id ? { ...s, adet: s.adet - 1 } : s))
        .filter((s) => s.adet > 0)
    );

  const sepettenCikar = (id) => setSepet((o) => o.filter((s) => s.id !== id));

  const sepetiBosalt = () => setSepet([]);

  const aktifSepet = sepet;
  const sepetToplam = sepet.reduce((t, s) => t + s.fiyat * s.adet, 0);
  const sepetAdet = sepet.reduce((t, s) => t + s.adet, 0);

  // --- Ödeme ---
  // Son ödemenin özeti (onay ekranı bunu gösterir)
  const [sonOdeme, setSonOdeme] = useState(null);

  // --- Siparişlerim (kalıcı liste) ---
  // Her ödeme buraya bir sipariş ekler. sessionStorage'da tutulur (kapanınca gitmez).
  // --- Siparişlerim (kalıcı liste) ---
  // localStorage'da tutulur → tarayıcı kapansa bile korunur (sadakat damgası için önemli).
  const [siparislerim, setSiparislerim] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bp_siparislerim") || "[]");
    } catch {
      return [];
    }
  });
  const siparisEkle = (siparis) => {
    setSiparislerim((o) => {
      const yeni = [siparis, ...o];
      localStorage.setItem("bp_siparislerim", JSON.stringify(yeni));
      return yeni;
    });
  };

  // Masa kapatıldığında o masanın siparişlerini "tamamlandı" işaretle.
  // Böylece aktif sipariş ekranından düşer, geçmişte "ödeme tamamlandı" kalır.
  const masaSiparisleriniTamamla = (masaNo) => {
    setSiparislerim((o) => {
      const yeni = o.map((s) =>
        s.tip === "masa" && String(s.masaNo) === String(masaNo)
          ? { ...s, tamamlandi: true, kapanmaTarihi: new Date().toISOString() }
          : s
      );
      localStorage.setItem("bp_siparislerim", JSON.stringify(yeni));
      return yeni;
    });
  };

  // --- Burger damga sayacı (5 al 1 bedava) ---
  // Siparişlerden toplam burger adedini sayar. Her 5'te bir hediye kazanılır,
  // sayaç 0'dan tekrar başlar (kalan = toplam % 5).
  const DAMGA_HEDEF = 5;
  const toplamBurger = siparislerim.reduce((toplam, s) => {
    const burgerAdet = (s.urunler || [])
      .filter((u) => u.kategori === "Burgerler")
      .reduce((t, u) => t + (u.adet || 0), 0);
    return toplam + burgerAdet;
  }, 0);
  const burgerDamga = toplamBurger % DAMGA_HEDEF;
  const kazanilanHediye = Math.floor(toplamBurger / DAMGA_HEDEF);

  // Masa kapatıldı bildirimini dinle (salon personeli kapatınca gelir).
  // O masanın siparişleri "tamamlandı" olur, masa bağlantısı temizlenir.
  useEffect(() => {
    const kapandi = ({ masaNo }) => {
      masaSiparisleriniTamamla(masaNo);
      // Bu masaya bağlıysak bağlantıyı bırak (yeni müşteri temiz başlasın)
      if (String(masaNo) === String(ozetMasaNo)) {
        setOzetMasaNo(null);
        localStorage.removeItem("bp_ozetMasa");
        setMasaOzeti({ kalemler: [], toplam: 0 });
      }
    };
    socket.on("masa-kapandi", kapandi);
    return () => socket.off("masa-kapandi", kapandi);
  }, [ozetMasaNo]);

  // Ödemeyi tamamlar: (misafir değilse) puanı artırır, siparişi mutfağa gönderir,
  // Siparişlerim'e kalıcı ekler, sepeti boşaltır.
  // tutar: bu ödemede gerçekten ödenen miktar (bölüşmede kişi payı olabilir).
  // yontem: "tam" | "esit" | "urun". masaNo: masaya servis ise masa no; al götürde null.
  const odemeyiTamamla = (tutar, yontem = "tam", masaNo = null) => {
    const kazanilan = misafir ? 0 : puanHesapla(tutar);
    if (kazanilan > 0) {
      const yeniPuan = puan + kazanilan;
      setPuan(yeniPuan);
      // Giriş yapmış kullanıcının puanını sunucuda da güncelle (kalıcı)
      if (kullanici) puaniGuncelle(yeniPuan);
    }

    // Ödenen ürünlerin bir kopyası (sepet birazdan boşalacak)
    const odenenUrunler = sepet.map((u) => ({
      id: u.id, ad: u.ad, fiyat: u.fiyat, adet: u.adet, gorsel: u.gorsel,
      kategori: u.kategori,   // damga sayacı için (Burgerler sayılır)
    }));

    const ozet = {
      tutar, yontem, masaNo, misafir,
      kazanilanPuan: kazanilan,
      urunler: odenenUrunler,
      tarih: new Date().toISOString(),
    };
    setSonOdeme(ozet);

    // Mutfağa gönder (masaya servis ise masa no ile, al götür ise "algotur" etiketiyle)
    // İsim: giriş yapmışsa gerçek adı, misafirse "Misafir".
    const gonderenAd = kullanici ? `${kullanici.ad} ${kullanici.soyad}` : "Misafir";
    odenenUrunler.forEach((u) => {
      socket.emit("urun-ekle", {
        masaNo: masaNo || "algotur",
        urun: { id: u.id, ad: u.ad, fiyat: u.fiyat, adet: u.adet },
        kisiAdi: gonderenAd,
      });
    });

    // Siparişlerim'e kalıcı ekle
    siparisEkle({
      id: Date.now(),
      masaNo: masaNo || null,
      tip: masaNo ? "masa" : "algotur",
      urunler: odenenUrunler,
      tutar,
      kazanilanPuan: kazanilan,
      misafir,
      durum: "hazirlaniyor",
      tarih: new Date().toISOString(),
    });

    sepetiBosalt();
    setAktifMasa(null);
    setMisafir(false);
    return ozet;
  };

  const deger = {
    puan,
    setPuan,
    karanlik,
    temaDegistir,
    // auth
    kullanici,
    adminMi,
    authYuklendi,
    girisiTamamla,
    cikisYap,
    profiliGuncelle,
    // sepet (yerel/kişisel)
    sepet: aktifSepet,
    sepeteEkle,
    adetArtir,
    adetAzalt,
    sepettenCikar,
    sepetiBosalt,
    sepetToplam,
    sepetAdet,
    // ödeme
    sonOdeme,
    odemeyiTamamla,
    // siparişlerim (kalıcı liste)
    siparislerim,
    // burger damga sayacı (5 al 1 bedava)
    burgerDamga,
    burgerDamgaHedef: DAMGA_HEDEF,
    toplamBurger,
    kazanilanHediye,
    // masa özeti (canlı, masadaki herkesin siparişi)
    masaOzeti,
    ozetMasaNo,
    masaDurumu,
    // aktif masa (QR ile gelen)
    aktifMasa,
    setAktifMasa,
    // misafir oturumu
    misafir,
    setMisafir,
  };

  return <AppContext.Provider value={deger}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp, AppProvider içinde kullanılmalı");
  return ctx;
}
