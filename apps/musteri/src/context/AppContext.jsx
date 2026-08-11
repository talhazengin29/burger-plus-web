/* ==========================================================================
   Uygulama geneli paylaşılan state: puan, tema ve sepet + ödeme.
   Ödeme yapıldığında puan burada artar. Puan oranı mockData'da (PUAN_ORANI_TL).
   ========================================================================== */

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  kampanyalar as varsayilanKampanyalar,
  kampanyaAktifMi,
  kategoriler as varsayilanKategoriAdlari,
  kategoriGorseller,
  urunler as varsayilanUrunler,
  urunKurallariniUygula,
} from "../data/mockData";
import { socket, socketIsletmesiniAyarla } from "../lib/socket";
import { sepetAnahtariOlustur } from "../lib/urunSecimleri";
import { useIsletme } from "./IsletmeContext";
import {
  beniGetir, tokeniAl, tokeniSil, profilGuncelle, siparisGecmisiniGetir,
  sadakatOzetiniGetir, puanlaOdulSatinAl, kullaniciHediyesiniKullan,
  istekAt, tenantDepoAnahtari,
} from "../lib/authApi";

const AppContext = createContext(null);

function kataloguBirlestir(uzakUrunler, isletmeSlug) {
  return uzakUrunler.map((uzak) => {
    const yerel = isletmeSlug === "burger-plus"
      ? varsayilanUrunler.find((u) => String(u.id) === String(uzak.id)) || {}
      : {};
    const doluUzakAlanlar = Object.fromEntries(
      Object.entries(uzak).filter(([, deger]) => deger !== null && deger !== undefined)
    );
    return urunKurallariniUygula({ ...yerel, ...doluUzakAlanlar });
  });
}

const varsayilanKategoriler = varsayilanKategoriAdlari.map((ad, sira) => ({
  id: ad === "Tümü" ? "tumu" : `varsayilan-${sira}`,
  ad,
  gorsel: kategoriGorseller[ad] || null,
  sira,
}));

function kategorileriBirlestir(uzakKategoriler, isletmeSlug) {
  const tumu = varsayilanKategoriler[0];
  const liste = uzakKategoriler
    .filter((kategori) => kategori && String(kategori.ad || "").trim() && kategori.aktif !== false)
    .map((kategori, sira) => ({
      id: kategori.id ?? `uzak-${sira}`,
      ad: String(kategori.ad).trim(),
      gorsel: kategori.gorsel || (isletmeSlug === "burger-plus" ? kategoriGorseller[kategori.ad] : null) || null,
      sira: Number.isFinite(Number(kategori.sira)) ? Number(kategori.sira) : sira + 1,
    }));
  const benzersiz = Array.from(new Map(liste.map((kategori) => [kategori.ad, kategori])).values());
  return [tumu, ...benzersiz.sort((a, b) => a.sira - b.sira || a.ad.localeCompare(b.ad, "tr"))];
}

function kategorileriUrunlerdenTamamla(mevcut, urunler) {
  const adlar = new Set(mevcut.map((kategori) => kategori.ad));
  const eklenenler = [];
  for (const urun of urunler) {
    const ad = String(urun.kategori || "").trim();
    if (!ad || adlar.has(ad)) continue;
    adlar.add(ad);
    eklenenler.push({ id: `urun-${ad}`, ad, gorsel: urun.gorsel || null, sira: mevcut.length + eklenenler.length });
  }
  return eklenenler.length ? [...mevcut, ...eklenenler] : mevcut;
}

export function AppProvider({ children }) {
  const { isletmeSlug, tema } = useIsletme();
  const depoAnahtari = useCallback((anahtar) => tenantDepoAnahtari(anahtar, isletmeSlug), [isletmeSlug]);
  const [puan, setPuan] = useState(0);
  const [sadakat, setSadakat] = useState({ burgerDamga: 0, burgerDamgaHedef: 5, oduller: [], puanGecmisi: [], hediyeler: [] });
  const [urunler, setUrunler] = useState(() => isletmeSlug === "burger-plus" ? varsayilanUrunler : []);
  const [menuKategorileri, setMenuKategorileri] = useState(() => isletmeSlug === "burger-plus" ? varsayilanKategoriler : [varsayilanKategoriler[0]]);
  const [kampanyalar, setKampanyalar] = useState(() => isletmeSlug === "burger-plus" ? varsayilanKampanyalar : []);

  // Backend kataloğu varsa onu kullan; sunucu kapalıyken mevcut menü çalışmaya devam eder.
  useEffect(() => {
    istekAt("/api/urunler")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(({ urunler: uzakUrunler }) => {
        if (!Array.isArray(uzakUrunler)) return;
        const katalog = kataloguBirlestir(uzakUrunler, isletmeSlug);
        setUrunler(katalog);
        setMenuKategorileri((mevcut) => kategorileriUrunlerdenTamamla(mevcut, katalog));
      })
      .catch(() => {});
    istekAt("/api/kategoriler")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(({ kategoriler: uzakKategoriler }) => {
        if (Array.isArray(uzakKategoriler) && uzakKategoriler.length) {
          setMenuKategorileri(kategorileriBirlestir(uzakKategoriler, isletmeSlug));
        }
      })
      .catch(() => {});
    istekAt("/api/kampanyalar")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(({ kampanyalar: uzakKampanyalar }) => {
        if (Array.isArray(uzakKampanyalar)) setKampanyalar(uzakKampanyalar);
      })
      .catch(() => {});
  }, [isletmeSlug]);

  // İşletme "Tümü" rozeti için kendi görselini ayarladıysa (yönetim panelinden),
  // konseptin genel varsayılan görselinin önüne geçer. State üzerinde değil
  // her render'da türetilir: /api/kategoriler'in gecikmeli yanıtı ya da
  // urunler-guncellendi soketi menuKategorileri'ni değiştirdiğinde bile
  // (kategorileriBirlestir tumuGorseli'nden habersiz olduğundan) üzerine
  // yazılmadan hep en güncel değeri gösterir.
  const gosterilenKategoriler = useMemo(() => {
    if (tema?.tumuGorseli === undefined) return menuKategorileri;
    return menuKategorileri.map((kategori) =>
      kategori.ad === "Tümü" ? { ...kategori, gorsel: tema.tumuGorseli ?? kategori.gorsel } : kategori
    );
  }, [menuKategorileri, tema?.tumuGorseli]);

  useEffect(() => {
    const katalogGuncelle = (uzakUrunler) => {
      if (!Array.isArray(uzakUrunler)) return;
      const katalog = kataloguBirlestir(uzakUrunler, isletmeSlug);
      setUrunler(katalog);
      setMenuKategorileri((mevcut) => kategorileriUrunlerdenTamamla(mevcut, katalog));
    };
    const kategorilerGuncelle = (uzakKategoriler) => {
      if (Array.isArray(uzakKategoriler)) setMenuKategorileri(kategorileriBirlestir(uzakKategoriler, isletmeSlug));
    };
    const kampanyalarGuncelle = (uzakKampanyalar) => {
      if (Array.isArray(uzakKampanyalar)) setKampanyalar(uzakKampanyalar);
    };
    socket.on("urunler-guncellendi", katalogGuncelle);
    socket.on("kategoriler-guncellendi", kategorilerGuncelle);
    socket.on("kampanyalar-guncellendi", kampanyalarGuncelle);
    return () => {
      socket.off("urunler-guncellendi", katalogGuncelle);
      socket.off("kategoriler-guncellendi", kategorilerGuncelle);
      socket.off("kampanyalar-guncellendi", kampanyalarGuncelle);
    };
  }, [isletmeSlug]);

  // --- Giriş yapmış kullanıcı (auth) ---
  // null ise misafir/giriş yapılmamış. Doluysa gerçek hesap.
  const [kullanici, setKullanici] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [authYuklendi, setAuthYuklendi] = useState(false);
  const adminMi = kullanici?.rol === "admin";

  const kullaniciyiYenile = useCallback(async () => {
    const guncel = await beniGetir();
    if (guncel) {
      setKullanici(guncel);
      setPuan(guncel.puan || 0);
    } else if (!tokeniAl()) {
      setKullanici(null);
      setPuan(0);
      socketIsletmesiniAyarla(isletmeSlug);
    }
    return guncel;
  }, [isletmeSlug]);

  useEffect(() => {
    setAvatar(kullanici?.id ? localStorage.getItem(`bp_avatar_${isletmeSlug}_${kullanici.id}`) : null);
  }, [isletmeSlug, kullanici?.id]);

  // Açılışta token varsa kullanıcıyı geri getir (oturum korunur)
  useEffect(() => {
    kullaniciyiYenile().then((k) => {
      if (k) {
        setKullanici(k);
        setPuan(k.puan || 0);
      }
      setAuthYuklendi(true);
    });
  }, [kullaniciyiYenile]);

  // Davet edilen kişinin ödemesi başka bir cihazda tamamlanabilir. Kullanıcı
  // uygulamaya geri döndüğünde güncel puanı ve davet bilgileri otomatik alınır.
  useEffect(() => {
    const odaklaninca = () => kullaniciyiYenile().catch(() => {});
    const gorunurlukDegisince = () => {
      if (document.visibilityState === "visible") odaklaninca();
    };
    window.addEventListener("focus", odaklaninca);
    document.addEventListener("visibilitychange", gorunurlukDegisince);
    return () => {
      window.removeEventListener("focus", odaklaninca);
      document.removeEventListener("visibilitychange", gorunurlukDegisince);
    };
  }, [kullaniciyiYenile]);

  // Giriş/kayıt başarılı olunca çağrılır
  const girisiTamamla = (k) => {
    setKullanici(k);
    setPuan(k.puan || 0);
    sessionStorage.removeItem(depoAnahtari("bp_misafir")); // giriş yapan misafir değildir
    socketIsletmesiniAyarla(isletmeSlug);
  };
  // Çıkış
  const cikisYap = () => {
    tokeniSil();
    setKullanici(null);
    setPuan(0);
    setAvatar(null);
    setSiparislerim([]);
    setSadakat({ burgerDamga: 0, burgerDamgaHedef: 5, oduller: [], puanGecmisi: [], hediyeler: [] });
    socketIsletmesiniAyarla(isletmeSlug);
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
  const [oneriler, setOneriler] = useState([]);

  // Aktif masa: QR ile karşılama ekranından gelince set edilir.
  // null ise al götür; dolu ise masaya servis. Sipariş tipini bu belirler.
  // sessionStorage'a yazılır → sayfa yenilenince (F5) korunur.
  const [aktifMasa, setAktifMasaState] = useState(
    () => sessionStorage.getItem(tenantDepoAnahtari("bp_aktifMasa", isletmeSlug)) || null
  );
  const setAktifMasa = (deger) => {
    const anahtar = depoAnahtari("bp_aktifMasa");
    if (deger) sessionStorage.setItem(anahtar, deger);
    else sessionStorage.removeItem(anahtar);
    setAktifMasaState(deger);
  };

  // Misafir oturumu: QR'dan "Misafir olarak devam et" ile gelince true olur.
  // sessionStorage'a yazılır → sayfa yenilenince korunur.
  // ÖNEMLİ: Giriş yapmış kullanıcı ASLA misafir değildir (kullanici doluysa misafir=false).
  const [misafirState, setMisafirState] = useState(
    () => sessionStorage.getItem(tenantDepoAnahtari("bp_misafir", isletmeSlug)) === "1"
  );
  const misafir = kullanici ? false : misafirState;
  const setMisafir = (deger) => {
    const anahtar = depoAnahtari("bp_misafir");
    if (deger) sessionStorage.setItem(anahtar, "1");
    else sessionStorage.removeItem(anahtar);
    setMisafirState(deger);
  };

  // --- Masa özeti (canlı) ---
  // Masadaki HERKESİN siparişi. Backend'den canlı gelir.
  // Masa numarası localStorage'da tutulur → sekme/tarayıcı kapansa bile
  // masaya bağlanmaya devam eder, sipariş durumu (hazırlanıyor→hazır) güncellenir.
  const [ozetMasaNo, setOzetMasaNo] = useState(
    () => localStorage.getItem(tenantDepoAnahtari("bp_ozetMasa", isletmeSlug)) || sessionStorage.getItem(tenantDepoAnahtari("bp_ozetMasa", isletmeSlug)) || null
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
      localStorage.setItem(depoAnahtari("bp_ozetMasa"), aktifMasa);
    }
  }, [aktifMasa, depoAnahtari]);

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
    [kampanyalar, kampanyaSaati]
  );
  // Ürünün kategorisine uygulanan aktif kampanya varsa indirimli fiyatı döner.
  // Kampanya indirimleri sadece giriş yapmış (üye) kullanıcılar içindir — misafir
  // kampanyayı görebilir ama fiyat indirimi/otomatik uygulama misafire yapılmaz.
  const indirimliFiyat = (urun) => {
    if (!kullanici) return null;
    const k = aktifKampanyalar
      .filter((kk) => kk.gecerliKategoriler?.includes(urun.kategori) && Number(kk.indirimYuzde) > 0)
      .sort((a, b) => Number(b.indirimYuzde) - Number(a.indirimYuzde))[0];
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
    if (urun?.stokta === false) return false;
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
    return true;
  };

  const avatarGuncelle = (gorsel) => {
    if (!kullanici?.id) return;
    const anahtar = `bp_avatar_${isletmeSlug}_${kullanici.id}`;
    if (gorsel) localStorage.setItem(anahtar, gorsel);
    else localStorage.removeItem(anahtar);
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

  // Sepet değiştikten kısa süre sonra çapraz satış önerilerini katalogdan al.
  // Debounce, adet artırma/azaltmada gereksiz ağ isteğini önler.
  useEffect(() => {
    const urunIdleri = [...new Set(sepet.map((urun) => Number(urun.id)).filter((id) => Number.isInteger(id) && id > 0))];
    if (!urunIdleri.length) {
      setOneriler([]);
      return undefined;
    }
    let iptalEdildi = false;
    const zamanlayici = setTimeout(() => {
      istekAt(`/api/oneriler?urunler=${encodeURIComponent(urunIdleri.join(","))}`)
        .then((yanit) => yanit.ok ? yanit.json() : Promise.reject())
        .then(({ urunler: uzakUrunler }) => {
          if (!iptalEdildi && Array.isArray(uzakUrunler)) setOneriler(kataloguBirlestir(uzakUrunler, isletmeSlug));
        })
        .catch(() => { if (!iptalEdildi) setOneriler([]); });
    }, 300);
    return () => {
      iptalEdildi = true;
      clearTimeout(zamanlayici);
    };
  }, [sepet, isletmeSlug]);

  // --- Ödeme ---
  // Son ödemenin özeti (onay ekranı bunu gösterir)
  const [sonOdeme, setSonOdeme] = useState(null);

  // --- Siparişlerim ve sadakat ---
  // Üye kullanıcı için tek doğruluk kaynağı backend'dir. Misafirin hesabı
  // olmadığından backend'de kalıcı bir siparişi yoktur — bu yüzden misafirin
  // kendi siparişleri, aynı cihaz/tarayıcıda görünmeye devam etsin diye
  // işletmeye özel localStorage'da ayrıca tutulur (bkz. misafirSiparisiKaydet).
  const [siparislerim, setSiparislerim] = useState([]);
  const [misafirSiparisleri, setMisafirSiparisleri] = useState(() => {
    try {
      const ham = localStorage.getItem(tenantDepoAnahtari("bp_misafirSiparisler", isletmeSlug));
      const liste = ham ? JSON.parse(ham) : [];
      return Array.isArray(liste) ? liste : [];
    } catch {
      return [];
    }
  });

  const siparisleriYenile = useCallback(async () => {
    if (!kullanici?.id) {
      setSiparislerim([]);
      return [];
    }
    const liste = await siparisGecmisiniGetir();
    setSiparislerim(liste);
    return liste;
  }, [kullanici?.id]);

  // Misafir olarak tamamlanan bir siparişi cihazda kalıcı hale getirir; aynı
  // siparişin (siparisNo) tekrar eklenmesini engeller, listeyi son 20 ile sınırlar.
  const misafirSiparisiKaydet = useCallback((ozet) => {
    setMisafirSiparisleri((onceki) => {
      const digerleri = onceki.filter((s) => s.siparisNo !== ozet.siparisNo);
      const guncel = [ozet, ...digerleri].slice(0, 20);
      try {
        localStorage.setItem(depoAnahtari("bp_misafirSiparisler"), JSON.stringify(guncel));
      } catch { /* depolama dolu/erişilemez olabilir, sessizce geç */ }
      return guncel;
    });
  }, [depoAnahtari]);

  const sadakatiYenile = useCallback(async () => {
    if (!kullanici?.id) return null;
    const guncel = await sadakatOzetiniGetir();
    setSadakat(guncel);
    setPuan(guncel.puan);
    return guncel;
  }, [kullanici?.id]);

  useEffect(() => {
    const odulleriYenile = () => sadakatiYenile().catch(() => {});
    socket.on("oduller-guncellendi", odulleriYenile);
    return () => socket.off("oduller-guncellendi", odulleriYenile);
  }, [sadakatiYenile]);

  useEffect(() => {
    if (!authYuklendi || !kullanici?.id) {
      setSiparislerim([]);
      return;
    }
    siparisleriYenile().catch(() => {});
    sadakatiYenile().catch(() => {});
  }, [authYuklendi, kullanici?.id, siparisleriYenile, sadakatiYenile]);

  const masaSiparisleriniTamamla = useCallback(() => {
    siparisleriYenile().catch(() => {});
  }, [siparisleriYenile]);

  const odulSatinAl = async (odul) => {
    const istekAnahtari = crypto.randomUUID();
    const guncel = await puanlaOdulSatinAl(odul.id, istekAnahtari);
    setSadakat(guncel);
    setPuan(guncel.puan);
    return { basarili: true };
  };

  const hediyeKullan = async (hediye) => {
    const sonuc = await kullaniciHediyesiniKullan(hediye.id, aktifMasa);
    setSadakat(sonuc.sadakat);
    setPuan(sonuc.sadakat.puan);
    await siparisleriYenile();
    return sonuc.odeme;
  };

  const burgerDamga = Number(sadakat.burgerDamga || 0);
  const DAMGA_HEDEF = Number(sadakat.burgerDamgaHedef || 5);
  const hediyeler = sadakat.hediyeler || [];

  // Masa kapatıldı bildirimini dinle (salon personeli kapatınca gelir).
  // O masanın siparişleri "tamamlandı" olur, masa bağlantısı temizlenir.
  useEffect(() => {
    const kapandi = ({ masaNo }) => {
      masaSiparisleriniTamamla(masaNo);
      // Bu masaya bağlıysak bağlantıyı bırak (yeni müşteri temiz başlasın)
      if (String(masaNo) === String(ozetMasaNo)) {
        setOzetMasaNo(null);
        localStorage.removeItem(depoAnahtari("bp_ozetMasa"));
        setMasaOzeti({ kalemler: [], toplam: 0 });
      }
    };
    socket.on("masa-kapandi", kapandi);
    return () => socket.off("masa-kapandi", kapandi);
  }, [ozetMasaNo, masaSiparisleriniTamamla, depoAnahtari]);

  // Başarı yalnızca backend'in onayladığı ödeme nesnesiyle işlenir. Böylece
  // tarayıcı tutarı/puanı değiştiremez ve mutfak aktarımı backend'de kalır.
  const odemeyiTamamla = (onayliOdeme) => {
    const ozet = {
      ...onayliOdeme,
      misafir,
      tarih: onayliOdeme.tarih || new Date().toISOString(),
    };
    setSonOdeme(ozet);
    if (Number.isFinite(onayliOdeme.guncelPuan)) setPuan(onayliOdeme.guncelPuan);

    if (Number.isFinite(onayliOdeme.burgerDamga)) {
      setSadakat((onceki) => ({ ...onceki, burgerDamga: onayliOdeme.burgerDamga }));
    }
    if (kullanici?.id) {
      siparisleriYenile().catch(() => {});
      sadakatiYenile().catch(() => {});
    } else {
      misafirSiparisiKaydet(ozet);
    }
    sepetiBosalt();
    setAktifMasa(null);
    return ozet;
  };

  const deger = {
    puan,
    // auth
    kullanici,
    avatar,
    avatarGuncelle,
    adminMi,
    authYuklendi,
    girisiTamamla,
    cikisYap,
    profiliGuncelle,
    kullaniciyiYenile,
    // kampanyalar (saatli/sürekli indirimler)
    aktifKampanyalar,
    kampanyalar,
    indirimliFiyat,
    // Backend tarafından yönetilen dinamik ürün kataloğu
    urunler,
    kategoriler: gosterilenKategoriler,
    // sepet (yerel/kişisel)
    sepet: aktifSepet,
    sepeteEkle,
    adetArtir,
    adetAzalt,
    sepettenCikar,
    sepetiBosalt,
    sepetToplam,
    sepetAdet,
    oneriler,
    // ödeme
    sonOdeme,
    odemeyiTamamla,
    // siparişlerim (üye için backend'den, misafir için bu cihazda kalıcı liste)
    siparislerim: kullanici?.id ? siparislerim : misafirSiparisleri,
    siparisleriYenile,
    // burger damga sayacı (5 al 1 bedava)
    burgerDamga,
    burgerDamgaHedef: DAMGA_HEDEF,
    // hediye envanteri (Ye Kazan + puanla alınan ödüller)
    hediyeler,
    oduller: sadakat.oduller || [],
    puanGecmisi: sadakat.puanGecmisi || [],
    hediyeKullan,
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
