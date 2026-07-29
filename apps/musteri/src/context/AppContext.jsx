/* ==========================================================================
   Uygulama geneli paylaşılan state: puan, tema ve sepet + ödeme.
   Ödeme yapıldığında puan burada artar. Puan oranı mockData'da (PUAN_ORANI_TL).
   ========================================================================== */

import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  puanHesapla,
  kampanyalar,
  kampanyaAktifMi,
  urunler as varsayilanUrunler,
  urunKurallariniUygula,
} from "../data/mockData";
import { socket } from "../lib/socket";
import { sepetAnahtariOlustur } from "../lib/urunSecimleri";
import { beniGetir, tokeniSil, puaniGuncelle, profilGuncelle, siparisGecmisiniGetir, siparisiHesabaKaydet } from "../lib/authApi";

const AppContext = createContext(null);

function kataloguBirlestir(uzakUrunler) {
  return uzakUrunler.map((uzak) => {
    const yerel = varsayilanUrunler.find((u) => String(u.id) === String(uzak.id)) || {};
    const doluUzakAlanlar = Object.fromEntries(
      Object.entries(uzak).filter(([, deger]) => deger !== null && deger !== undefined)
    );
    return urunKurallariniUygula({ ...yerel, ...doluUzakAlanlar });
  });
}

export function AppProvider({ children }) {
  const [puan, setPuan] = useState(0);
  const [urunler, setUrunler] = useState(varsayilanUrunler);

  // Backend kataloğu varsa onu kullan; sunucu kapalıyken mevcut menü çalışmaya devam eder.
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
    fetch(`${backendUrl}/api/urunler`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(({ urunler: uzakUrunler }) => {
        if (!Array.isArray(uzakUrunler) || uzakUrunler.length === 0) return;
        setUrunler(kataloguBirlestir(uzakUrunler));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const katalogGuncelle = (uzakUrunler) => {
      if (Array.isArray(uzakUrunler)) setUrunler(kataloguBirlestir(uzakUrunler));
    };
    socket.on("urunler-guncellendi", katalogGuncelle);
    return () => socket.off("urunler-guncellendi", katalogGuncelle);
  }, []);

  // --- Giriş yapmış kullanıcı (auth) ---
  // null ise misafir/giriş yapılmamış. Doluysa gerçek hesap.
  const [kullanici, setKullanici] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [authYuklendi, setAuthYuklendi] = useState(false);
  const adminMi = kullanici?.rol === "admin";

  useEffect(() => {
    setAvatar(kullanici?.id ? localStorage.getItem(`bp_avatar_${kullanici.id}`) : null);
  }, [kullanici?.id]);

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
    setAvatar(null);
    // Ekrandaki kişisel veriyi temizle; hesaba ait geçmiş kendi anahtarında ve backend'de korunur.
    setSiparislerim([]);
    localStorage.removeItem("bp_hediyeler");
    setHediyeler([]);
  };

  // Profil güncelle (email + telefon). Başarılıysa kullanıcı state'ini tazeler.
  const profiliGuncelle = async (email, telefon) => {
    const sonuc = await profilGuncelle(email, telefon);
    if (sonuc.kullanici) setKullanici(sonuc.kullanici);
    return sonuc; // {kullanici} veya {hata}
  };

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

  // --- Kampanyalar (saatli/sürekli indirimler) ---
  // Dakikada bir tazelenen saat — saatli kampanyaların (örn. 14:00-17:00
  // Happy Hour) aktiflik durumu otomatik güncellensin diye.
  const [kampanyaSaati, setKampanyaSaati] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setKampanyaSaati(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const aktifKampanyalar = useMemo(
    () => kampanyalar.filter((k) => kampanyaAktifMi(k, kampanyaSaati)),
    [kampanyaSaati]
  );
  // Ürünün kategorisine uygulanan aktif kampanya varsa indirimli fiyatı döner.
  // Kampanya indirimleri sadece giriş yapmış (üye) kullanıcılar içindir — misafir
  // kampanyayı görebilir ama fiyat indirimi/otomatik uygulama misafire yapılmaz.
  const indirimliFiyat = (urun) => {
    if (!kullanici) return null;
    const k = aktifKampanyalar.find((kk) => kk.gecerliKategoriler?.includes(urun.kategori));
    if (!k) return null;
    return {
      kampanya: k,
      orijinalFiyat: urun.fiyat,
      fiyat: Math.round(urun.fiyat * (1 - k.indirimYuzde / 100) * 100) / 100,
    };
  };

  // --- Sepet (tamamen yerel/kişisel) ---
  // Ortak masa sepeti YOK. Herkes kendi sepetini oluşturur, kendi öder.
  // Backend'e gönderim ödeme anında olur (aşağıda odemeyiTamamla).
  const sepeteEkle = (urun) => {
    // Aktif kampanya varsa ürün sepete indirimli fiyatla girer — ödeme akışı
    // (sepetToplam, odemeyiTamamla) hiç değişmeden bu fiyatı kullanır.
    const indirim = indirimliFiyat(urun);
    const ekstraFiyat = Number(urun.gramajFiyatArtisi) || 0;
    const eklenecek = indirim
      ? { ...urun, fiyat: indirim.fiyat + ekstraFiyat, orijinalFiyat: indirim.orijinalFiyat + ekstraFiyat }
      : { ...urun, fiyat: urun.fiyat + ekstraFiyat };
    const sepetAnahtari = sepetAnahtariOlustur(urun);
    setSepet((onceki) => {
      const mevcut = onceki.find((s) => s.sepetAnahtari === sepetAnahtari);
      if (mevcut) {
        return onceki.map((s) =>
          s.sepetAnahtari === sepetAnahtari ? { ...s, adet: s.adet + 1 } : s
        );
      }
      return [...onceki, { ...eklenecek, sepetAnahtari, adet: 1 }];
    });
  };

  const avatarGuncelle = (gorsel) => {
    if (!kullanici?.id) return;
    if (gorsel) localStorage.setItem(`bp_avatar_${kullanici.id}`, gorsel);
    else localStorage.removeItem(`bp_avatar_${kullanici.id}`);
    setAvatar(gorsel || null);
  };

  const adetArtir = (anahtar) =>
    setSepet((o) => o.map((s) => (s.sepetAnahtari === anahtar ? { ...s, adet: s.adet + 1 } : s)));

  const adetAzalt = (anahtar) =>
    setSepet((o) =>
      o
        .map((s) => (s.sepetAnahtari === anahtar ? { ...s, adet: s.adet - 1 } : s))
        .filter((s) => s.adet > 0)
    );

  const sepettenCikar = (anahtar) => setSepet((o) => o.filter((s) => s.sepetAnahtari !== anahtar));

  const sepetiBosalt = () => setSepet([]);

  const aktifSepet = sepet;
  const sepetToplam = sepet.reduce((t, s) => t + s.fiyat * s.adet, 0);
  const sepetAdet = sepet.reduce((t, s) => t + s.adet, 0);

  // --- Ödeme ---
  // Son ödemenin özeti (onay ekranı bunu gösterir)
  const [sonOdeme, setSonOdeme] = useState(null);

  // --- Siparişlerim (hesaba bağlı kalıcı liste) ---
  // Giriş yapan kullanıcıda backend esas kaynaktır; hesap başına ayrı local kopya ağ kesintisine karşı tutulur.
  const siparisDepoAnahtari = kullanici?.id ? `bp_siparislerim_hesap_${kullanici.id}` : "bp_siparislerim_misafir";
  const [siparislerim, setSiparislerim] = useState([]);

  useEffect(() => {
    if (!authYuklendi) return;
    let iptal = false;
    let yerel = [];
    try { yerel = JSON.parse(localStorage.getItem(siparisDepoAnahtari) || "[]"); }
    catch { yerel = []; }
    setSiparislerim(yerel);
    if (!kullanici?.id) return () => { iptal = true; };
    siparisGecmisiniGetir()
      .then((siparisler) => {
        if (iptal) return;
        setSiparislerim(siparisler);
        localStorage.setItem(siparisDepoAnahtari, JSON.stringify(siparisler));
      })
      .catch(() => {});
    return () => { iptal = true; };
  }, [authYuklendi, kullanici?.id, siparisDepoAnahtari]);

  const siparisEkle = (siparis) => {
    setSiparislerim((o) => {
      const yeni = [siparis, ...o];
      localStorage.setItem(siparisDepoAnahtari, JSON.stringify(yeni));
      return yeni;
    });
    if (kullanici?.id) siparisiHesabaKaydet(siparis).catch(() => {});
  };

  // Masa kapatıldığında o masanın siparişlerini "tamamlandı" işaretle.
  // Böylece aktif sipariş ekranından düşer, geçmişte "ödeme tamamlandı" kalır.
  const masaSiparisleriniTamamla = useCallback((masaNo) => {
    setSiparislerim((o) => {
      const yeni = o.map((s) =>
        s.tip === "masa" && String(s.masaNo) === String(masaNo)
          ? { ...s, tamamlandi: true, kapanmaTarihi: new Date().toISOString() }
          : s
      );
      localStorage.setItem(siparisDepoAnahtari, JSON.stringify(yeni));
      return yeni;
    });
  }, [siparisDepoAnahtari]);

  // --- Burger damga sayacı (5 al 1 bedava) ---
  // Siparişlerden toplam burger adedini sayar. Her 5'te bir hediye kazanılır,
  // sayaç 0'dan tekrar başlar (kalan = toplam % 5).
  const DAMGA_HEDEF = 5;
  const toplamBurger = siparislerim.reduce((toplam, s) => {
    const burgerAdet = (s.urunler || [])
      .filter((u) => u.kategori === "Burgerler")
      .reduce((t, u) => t + (u.adet || 1), 0); // adet alanı yoksa bile en az 1 say
    return toplam + burgerAdet;
  }, 0);
  const burgerDamga = toplamBurger % DAMGA_HEDEF;
  const kazanilanHediye = Math.floor(toplamBurger / DAMGA_HEDEF);

  // --- Hediye envanteri (Ye Kazan + puanla alınan ödüller) ---
  // localStorage'da kalıcı — tarayıcı kapansa bile korunur.
  const [hediyeler, setHediyeler] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bp_hediyeler") || "[]"); }
    catch { return []; }
  });
  const hediyeEkle = (hediye) => {
    setHediyeler((o) => {
      const yeni = [hediye, ...o];
      localStorage.setItem("bp_hediyeler", JSON.stringify(yeni));
      return yeni;
    });
  };
  const hediyeKullan = (id) => {
    setHediyeler((o) => {
      const yeni = o.map((h) => (h.id === id ? { ...h, kullanildi: true } : h));
      localStorage.setItem("bp_hediyeler", JSON.stringify(yeni));
      return yeni;
    });
  };

  // kazanilanHediye arttıkça (her 5 burgerde bir) otomatik hediye ekle.
  // useRef: yalnızca artışta tetiklensin, her render'da değil.
  const oncekiKazanilanHediye = useRef(kazanilanHediye);
  useEffect(() => {
    const fark = kazanilanHediye - oncekiKazanilanHediye.current;
    for (let i = 0; i < fark; i++) {
      hediyeEkle({
        id: Date.now() + i,
        ad: "Bedava Burger (Ye Kazan)",
        tip: "ye-kazan",
        tarih: new Date().toISOString(),
        kullanildi: false,
      });
    }
    oncekiKazanilanHediye.current = kazanilanHediye;
  }, [kazanilanHediye]);

  // Puanla ödül satın alma (Rewards ekranındaki "+" butonu çağırır).
  const odulSatinAl = (odul) => {
    if (puan < odul.puan) return { basarili: false };
    const yeniPuan = puan - odul.puan;
    setPuan(yeniPuan);
    if (kullanici) puaniGuncelle(yeniPuan);
    hediyeEkle({
      id: Date.now(),
      ad: odul.ad,
      tip: "puan",
      puan: odul.puan,
      gorsel: odul.gorsel || null,
      tarih: new Date().toISOString(),
      kullanildi: false,
    });
    return { basarili: true };
  };

  // Hediyeyi sepete 0₺ olarak ekler — indirim/birleştirme mantığından muaf,
  // kendi bağımsız satırı olarak girer.
  const hediyeSepeteEkle = (hediye) => {
    const sepetAnahtari = `hediye-${hediye.id}-${Date.now()}`;
    setSepet((onceki) => [...onceki, {
      id: hediye.id, ad: hediye.ad, fiyat: 0, adet: 1,
      gorsel: hediye.gorsel || null, kategori: hediye.kategori || null, hediyeMi: true,
      sepetAnahtari,
    }]);
    hediyeKullan(hediye.id);
  };

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
  }, [ozetMasaNo, masaSiparisleriniTamamla]);

  // Ödemeyi tamamlar: (misafir değilse) puanı artırır, siparişi mutfağa gönderir,
  // Siparişlerim'e kalıcı ekler, sepeti boşaltır.
  // tutar: bu ödemede gerçekten ödenen miktar (bölüşmede kişi payı olabilir).
  // yontem: "tam" | "esit" | "urun". masaNo: masaya servis ise masa no; al götürde null.
  // odenenUrunlerParam: ürüne göre ödemede sadece seçilen ürünler gelir.
  // Tamamını öde/eşit böl'de tüm sepet gelir.
  const odemeyiTamamla = (tutar, yontem = "tam", masaNo = null, odenenUrunlerParam = null) => {
    const kazanilan = misafir ? 0 : puanHesapla(tutar);
    if (kazanilan > 0) {
      const yeniPuan = puan + kazanilan;
      setPuan(yeniPuan);
      if (kullanici) puaniGuncelle(yeniPuan);
    }

    // Ödenen ürünler: parametre geldiyse onu kullan, yoksa tüm sepeti al
    const kaynakUrunler = odenenUrunlerParam || sepet;
    const odenenUrunler = kaynakUrunler.map((u) => {
      const secimler = {
        dahilMalzemeler: u.secimler?.dahilMalzemeler || u.malzemeler || [],
        standartGramaj: u.secimler?.standartGramaj ?? u.temelMiktar ?? 0,
        ekstraGramaj: u.secimler?.ekstraGramaj ?? 0,
        toplamGramaj: u.secimler?.toplamGramaj ?? u.temelMiktar ?? 0,
        gramajEtiketi: u.secimler?.gramajEtiketi || u.gramajOpsiyonu?.etiket || "Ürün gramajı",
        gramajBirim: u.secimler?.gramajBirim || u.gramajOpsiyonu?.birim || "gr",
        ...(u.secimler || {}),
      };
      return {
        id: u.id, ad: u.ad, fiyat: u.fiyat, adet: u.adet, gorsel: u.gorsel,
        kategori: u.kategori, temelMiktar: u.temelMiktar, malzemeler: u.malzemeler || [],
        gramajOpsiyonu: u.gramajOpsiyonu || null,
        haricMalzemeler: u.haricMalzemeler || [], secimler,
        sepetAnahtari: u.sepetAnahtari,
      };
    });

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
    const siparisNo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    odenenUrunler.forEach((u) => {
      socket.emit("urun-ekle", {
        masaNo: masaNo || "algotur",
        urun: {
          id: u.id, ad: u.ad, fiyat: u.fiyat, adet: u.adet, kategori: u.kategori,
          temelMiktar: u.temelMiktar, malzemeler: u.malzemeler || [],
          gramajOpsiyonu: u.gramajOpsiyonu,
          haricMalzemeler: u.haricMalzemeler || [], secimler: u.secimler || {},
        },
        secimler: u.secimler || {},
        haricMalzemeler: u.haricMalzemeler || [],
        siparisNo,
        kisiAdi: gonderenAd,
      });
    });

    // Siparişlerim'e kalıcı ekle
    siparisEkle({
      id: Date.now(),
      siparisNo,
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
    return ozet;
  };

  const deger = {
    puan,
    setPuan,
    // auth
    kullanici,
    avatar,
    avatarGuncelle,
    adminMi,
    authYuklendi,
    girisiTamamla,
    cikisYap,
    profiliGuncelle,
    // kampanyalar (saatli/sürekli indirimler)
    aktifKampanyalar,
    indirimliFiyat,
    // Backend tarafından yönetilen dinamik ürün kataloğu
    urunler,
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
    // hediye envanteri (Ye Kazan + puanla alınan ödüller)
    hediyeler,
    hediyeSepeteEkle,
    odulSatinAl,
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
