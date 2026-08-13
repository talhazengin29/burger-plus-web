import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { adminIstek, gorselYukle, jsonGonder, temaKaydet } from "../lib/adminApi";
import { socket } from "../lib/socket";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { useIsletme } from "../context/IsletmeContext";
import BurgerPlusLogosu from "../../../musteri/src/components/BurgerPlusLogosu";
import TemaYonetimi from "./admin/TemaYonetimi";
import "./Admin.css";

const BOS_GRAMAJ = { goster: false, aktif: false, etiket: "Ürün miktarı", birim: "gr", artisMiktari: 50, maxAdim: 3, fiyatArtisi: 35 };
const BOS_BOYUTLAR = (birim = "gr") => [
  { kod: "kucuk", etiket: "Küçük Boy", miktar: "", birim, fiyatFarki: 0, varsayilan: true },
  { kod: "orta", etiket: "Orta Boy", miktar: "", birim, fiyatFarki: "", varsayilan: false },
  { kod: "buyuk", etiket: "Büyük Boy", miktar: "", birim, fiyatFarki: "", varsayilan: false },
];
const BOS_MENU = { burgerUrunId: "", yanLezzetUrunId: "", icecekUrunId: "", varsayilanYanBoyut: "", varsayilanIcecekBoyut: "" };
const BOS_EKSTRA = { aktif: false, baslik: "Ekstra malzeme seç", minSecim: 0, maxSecim: 1, secenekler: [] };
const BOS_URUN = { ad: "", fiyat: "", sira: 100, kategori: "Burgerler", urunTipi: "burger", temelMiktar: "", gorsel: "", aciklama: "", malzemeler: "", alerjenler: "", aktif: true, populer: false, stokTakibi: false, stokAdedi: 0, onerilenUrunler: [], gramajOpsiyonu: BOS_GRAMAJ, boyutSecenekleri: [], ekstraMalzemeAyari: BOS_EKSTRA, menuYapisi: BOS_MENU };
const BOS_KATEGORI = { ad: "", gorsel: "", sira: 10 };
const BOS_PERSONEL = { ad: "", soyad: "", rol: "Mutfak", email: "", telefon: "", saatlikUcret: "", sifre: "" };
const BOS_DUYURU = { baslik: "", mesaj: "", hedef: "/anasayfa" };
const BOS_KAMPANYA = { etiket: "", baslik: "", aciklama: "", buton: "Sipariş Ver", butonTipi: "primary", gorsel: "", ikon: "🎯", aktif: true, baslangicSaat: 14, bitisSaat: 17, indirimYuzde: 10, gecerliKategoriler: [], kampanyaTipi: "surekli", sira: 10 };
const BOS_ODUL = { ad: "", puan: 300, urunId: "", gorsel: "", aktif: true };
const BOS_DAMGA_KARTI = { aktif: true, hedefAdet: 5, kategori: "Burgerler", odulUrunId: "", odulMetni: "1 Burger Hediye", kartEtiketi: "YE KAZAN", baslik: "Lezzet yolculuğun", aciklama: "Her uygun üründe bir damga kazan, kartını tamamla ve hediyeni kap.", damgaBirimi: "ürün", tamamlanmaMetni: "Hediyen hazır!", ikon: "★" };
const BOS_CUZDAN_AYARI = { aktif: true, bonusAktif: true, bonusYuzde: 5, minYukleme: 100, maxYukleme: 10000, kampanyaBasligi: "Nakit yüklemene ekstra bakiye", kampanyaAciklamasi: "Kasadan nakit yükle, bonus bakiyeni anında kullan." };
const KAMPANYA_IKONLARI = [
  ["🎯", "Fırsat"], ["🕒", "Saat"], ["🎓", "Öğrenci"], ["🎁", "Hediye"],
  ["🔥", "Popüler"], ["🍔", "Burger"], ["🥤", "İçecek"], ["👥", "Davet"],
  ["💳", "Ödeme"], ["⭐", "Özel"], ["⚡", "Hızlı"], ["💸", "İndirim"],
];

const BOLUMLER = [
  ["genel", "Genel Bakış", "▦", "genel-bakis"],
  ["tema", "Tema", "◐", "tema"],
  ["urunler", "Ürünler", "◆", "urunler"],
  ["stok", "Stok Takibi", "▤", "stok-takibi"],
  ["kampanyalar", "Kampanyalar", "%", "kampanyalar"],
  ["oduller", "Puan Marketi", "★", "puan-marketi"],
  ["cuzdan", "Uygulama Cüzdanı", "₺", "cuzdan"],
  ["duyurular", "Duyurular", "●", "duyurular"],
  ["satislar", "Canlı Satışlar", "◉", "satislar"],
  ["gecmis-siparisler", "Geçmiş Siparişler", "◷", "gecmis-siparisler"],
  ["mutfak-kayitlari", "Mutfak Kayıtları", "◫", "mutfak-kayitlari"],
  ["musteriler", "Müşteri Kayıtları", "◎", "musteriler"],
  ["personel", "Personel", "♟", "personel"],
  ["personel-kayitlari", "Personel Kayıtları", "◷", "personel-kayitlari"],
  ["revizyonlar", "Revizyon Kayıtları", "↺", "revizyon-kayitlari"],
  ["raporlar", "Satış Raporları", "↗", "satis-raporlari"],
];

const MENU_GRUPLARI = [
  { id: "uygulama", ad: "Uygulama", ikon: "◇", aciklama: "Marka ve müşteri alanları", bolumler: ["tema", "urunler", "stok", "kampanyalar", "oduller", "cuzdan", "duyurular"] },
  { id: "operasyon", ad: "Operasyon", ikon: "◉", aciklama: "Anlık işletme yönetimi", bolumler: ["satislar", "mutfak-kayitlari", "personel"] },
  { id: "kayitlar", ad: "Kayıtlar", ikon: "▤", aciklama: "Geçmiş ve denetim kayıtları", bolumler: ["gecmis-siparisler", "musteriler", "personel-kayitlari", "revizyonlar"] },
  { id: "analiz", ad: "Analiz", ikon: "↗", aciklama: "Satış ve performans", bolumler: ["raporlar"] },
];
const KAYIT_BOLUMLERI = ["satislar", "gecmis-siparisler", "mutfak-kayitlari", "musteriler", "personel-kayitlari", "revizyonlar"];

const para = (n) => `₺${Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const kategoriyeGoreUrunTipi = (kategori) => {
  const ad = String(kategori || "").toLocaleLowerCase("tr");
  if (ad.includes("menü") || ad.includes("menu")) return "menu";
  if (ad.includes("içecek") || ad.includes("icecek")) return "icecek";
  if (ad.includes("yan lezzet") || ad.includes("atıştır") || ad.includes("atistir")) return "yan_lezzet";
  return "burger";
};
const tarihSaat = (d) => d ? new Date(d).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const kampanyaIkonu = (kampanya) => kampanya?.ikon || (String(kampanya?.etiket || "").includes(":") ? "🕒" : kampanya?.kod === "davet-et" || kampanya?.etiket === "Davet Et" ? "👥" : "🎓");

const GRAMAJ_KURALLARI = {
  "Burgerler": { etiket: "Köfte gramajı", birim: "gr", artisOrani: .25, miktarYuvarlama: 25, fiyatArtisOrani: .20, fiyatYuvarlama: 5 },
  "Yan Lezzetler": { etiket: "Porsiyon gramajı", birim: "gr", artisOrani: .25, miktarYuvarlama: 25, fiyatArtisOrani: .40, fiyatYuvarlama: 5 },
  "İçecekler": { etiket: "İçecek hacmi", birim: "ml", artisOrani: .25, miktarYuvarlama: 25, fiyatArtisOrani: .25, fiyatYuvarlama: 5 },
};

const enYakinaYuvarla = (deger, adim) => Math.max(adim, Math.round(deger / adim) * adim);
const gramajVarsayilani = (urun) => {
  const kural = GRAMAJ_KURALLARI[urun.kategori];
  const temel = Number(urun.temelMiktar);
  const fiyat = Number(urun.fiyat);
  if (!kural || !Number.isFinite(temel) || temel <= 0) return { ...BOS_GRAMAJ, etiket: kural?.etiket || BOS_GRAMAJ.etiket, birim: kural?.birim || "gr" };
  return {
    goster: true,
    aktif: true,
    etiket: kural.etiket,
    birim: kural.birim,
    artisMiktari: enYakinaYuvarla(temel * kural.artisOrani, kural.miktarYuvarlama),
    maxAdim: 3,
    fiyatArtisi: enYakinaYuvarla((Number.isFinite(fiyat) ? fiyat : 0) * kural.fiyatArtisOrani, kural.fiyatYuvarlama),
  };
};

const yeniUrunFormu = (kategori = "Burgerler") => ({ ...BOS_URUN, kategori, urunTipi: kategoriyeGoreUrunTipi(kategori), gramajOpsiyonu: { ...BOS_GRAMAJ }, boyutSecenekleri: [], ekstraMalzemeAyari: { ...BOS_EKSTRA, secenekler: [] }, menuYapisi: { ...BOS_MENU } });
const urunuFormaCevir = (urun) => ({
  ...urun,
  populer: urun.populer === true,
  stokTakibi: urun.stokTakibi === true,
  stokAdedi: Number(urun.stokAdedi || 0),
  sira: Number(urun.sira ?? 100),
  onerilenUrunler: (urun.onerilenUrunler || []).map(Number).filter(Number.isInteger),
  malzemeler: (urun.malzemeler || []).join(", "),
  alerjenler: (urun.alerjenler || []).join(", "),
  gramajOpsiyonu: {
    ...gramajVarsayilani(urun),
    ...(urun.gramajOpsiyonu || {}),
    goster: urun.gramajOpsiyonu ? urun.gramajOpsiyonu.goster !== false : false,
  },
  // Boyut seçenekleri isteğe bağlıdır: boş bırakılmışsa ürün standart/tek fiyatla satılır.
  boyutSecenekleri: (urun.boyutSecenekleri || []).map((boyut) => ({ ...boyut })),
  ekstraMalzemeAyari: {
    ...BOS_EKSTRA,
    ...(urun.ekstraMalzemeAyari || {}),
    secenekler: (urun.ekstraMalzemeAyari?.secenekler || []).map((secenek) => ({ ...secenek })),
  },
  menuYapisi: { ...BOS_MENU, ...(urun.menuYapisi || {}) },
});

export default function Admin({ onCikis }) {
  const konum = useLocation();
  const git = useIsletmeNavigate();
  const { isletme, isletmeyiGuncelle } = useIsletme();
  const yolParcasi = konum.pathname.split("/").filter(Boolean).at(-1) || "genel-bakis";
  const bolum = BOLUMLER.find(([, , , yol]) => yol === yolParcasi)?.[0] || "genel";
  const [dashboard, setDashboard] = useState(null);
  const [urunler, setUrunler] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [personeller, setPersoneller] = useState([]);
  const [duyurular, setDuyurular] = useState([]);
  const [kampanyalar, setKampanyalar] = useState([]);
  const [oduller, setOduller] = useState([]);
  const [damgaKarti, setDamgaKarti] = useState(BOS_DAMGA_KARTI);
  const [cuzdanAyari, setCuzdanAyari] = useState(BOS_CUZDAN_AYARI);
  const [cuzdanRaporu, setCuzdanRaporu] = useState({ toplamNakit: 0, toplamBonus: 0, bugunNakit: 0, yuklemeYapanMusteri: 0, dolasimdakiBakiye: 0 });
  const [rapor, setRapor] = useState({
    gunluk: [], urunler: [], kategoriler: [], saatlik: [], haftalik: [],
    ozet: { ciro: 0, adet: 0, siparis: 0 }, oncekiOzet: { ciro: 0, adet: 0, siparis: 0 },
  });
  const [canliSatislar, setCanliSatislar] = useState([]);
  const [gecmisSatislar, setGecmisSatislar] = useState([]);
  const [mutfakKayitlari, setMutfakKayitlari] = useState([]);
  const [musteriler, setMusteriler] = useState([]);
  const [personelKayitlari, setPersonelKayitlari] = useState({ vardiyalar: [], performans: [] });
  const [revizyonlar, setRevizyonlar] = useState([]);
  const [kayitFiltre, setKayitFiltre] = useState({ arama: "", baslangic: "", bitis: "", durum: "", personelId: "", rol: "", varlikTuru: "", islem: "" });
  const [canliBildirim, setCanliBildirim] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [bildirim, setBildirim] = useState("");
  const [urunForm, setUrunForm] = useState(null);
  const [urunArama, setUrunArama] = useState("");
  const [urunKategoriFiltre, setUrunKategoriFiltre] = useState("tumu");
  const [urunDurumFiltre, setUrunDurumFiltre] = useState("tumu");
  const [urunSiralama, setUrunSiralama] = useState("yeni");
  const [oneriArama, setOneriArama] = useState("");
  const [gorselYukleniyor, setGorselYukleniyor] = useState(false);
  const [kategoriForm, setKategoriForm] = useState(null);
  const [personelForm, setPersonelForm] = useState(null);
  const [duyuruForm, setDuyuruForm] = useState(null);
  const [kampanyaForm, setKampanyaForm] = useState(null);
  const [odulForm, setOdulForm] = useState(null);
  const aktifMenuGrubu = MENU_GRUPLARI.find((grup) => grup.bolumler.includes(bolum))?.id;
  const [acikMenuGrubu, setAcikMenuGrubu] = useState(aktifMenuGrubu || "uygulama");
  const veriYuklemeDevamEdiyor = useRef(false);

  const verileriYukle = useCallback(async () => {
    if (veriYuklemeDevamEdiyor.current) return;
    veriYuklemeDevamEdiyor.current = true;
    setYukleniyor(true);
    setHata("");
    try {
      const istekler = [
        ["Genel bakış", "/dashboard"], ["Ürünler", "/urunler"], ["Personel", "/personeller"],
        ["Satış raporları", "/raporlar/satis?gun=30"], ["Duyurular", "/duyurular"], ["Kategoriler", "/kategoriler"],
        ["Kampanyalar", "/kampanyalar"], ["Puan marketi", "/oduller"], ["Damga kartı", "/sadakat-ayari"], ["Cüzdan", "/cuzdan-ayari"], ["Cüzdan raporu", "/cuzdan-raporu"],
      ];
      const sonuclar = await Promise.allSettled(istekler.map(([, yol]) => adminIstek(yol)));
      const yetkiHatasi = sonuclar.find((sonuc) =>
        sonuc.status === "rejected" && [401, 403].includes(sonuc.reason?.status)
      );
      if (yetkiHatasi) {
        onCikis();
        return;
      }

      const [d, u, p, r, duy, k, kamp, od, sadakatAyari, cuzdanVerisi, cuzdanRaporVerisi] = sonuclar.map((sonuc) =>
        sonuc.status === "fulfilled" ? sonuc.value : null
      );
      if (d) setDashboard(d);
      if (u) setUrunler(u.urunler || []);
      if (p) setPersoneller(p.personeller || []);
      if (r) setRapor(r);
      if (duy) setDuyurular(duy.duyurular || []);
      if (k) setKategoriler(k.kategoriler || []);
      else if (u) setKategoriler(Array.from(new Set((u.urunler || []).map((urun) => urun.kategori))).map((ad, index) => ({ id: `urun-${ad}`, ad, gorsel: (u.urunler || []).find((urun) => urun.kategori === ad)?.gorsel || null, sira: (index + 1) * 10, aktif: true })));
      if (kamp) setKampanyalar(kamp.kampanyalar || []);
      if (od) setOduller(od.oduller || []);
      if (sadakatAyari?.damgaKarti) setDamgaKarti({ ...BOS_DAMGA_KARTI, ...sadakatAyari.damgaKarti });
      if (cuzdanVerisi?.cuzdanAyari) setCuzdanAyari({ ...BOS_CUZDAN_AYARI, ...cuzdanVerisi.cuzdanAyari });
      if (cuzdanRaporVerisi?.cuzdanRaporu) setCuzdanRaporu(cuzdanRaporVerisi.cuzdanRaporu);

      const hatalar = sonuclar.flatMap((sonuc, index) =>
        sonuc.status === "rejected" ? [`${istekler[index][0]}: ${sonuc.reason.message}`] : []
      );
      setHata(hatalar.join(" • "));
    } finally {
      veriYuklemeDevamEdiyor.current = false;
      setYukleniyor(false);
    }
  }, [onCikis]);

  useEffect(() => { verileriYukle(); }, [verileriYukle]);
  useEffect(() => {
    if (!BOLUMLER.some(([, , , yol]) => yol === yolParcasi)) git("/yonetim/genel-bakis", { replace: true });
  }, [git, yolParcasi]);
  useEffect(() => {
    setKayitFiltre({ arama: "", baslangic: "", bitis: "", durum: "", personelId: "", rol: "", varlikTuru: "", islem: "" });
  }, [bolum]);
  useEffect(() => {
    if (aktifMenuGrubu) setAcikMenuGrubu(aktifMenuGrubu);
  }, [aktifMenuGrubu]);
  useEffect(() => {
    const yonetimeKatil = () => socket.emit("yonetime-katil");
    const satisGeldi = (satis) => {
      setCanliSatislar((onceki) => [satis, ...onceki.filter((kayit) => kayit.siparis_no !== satis.siparisNo)].slice(0, 100));
      setCanliBildirim(`${satis.kisiAdi || "Yeni müşteri"} · ${para(satis.tutar)}`);
      adminIstek("/dashboard").then(setDashboard).catch(() => {});
      adminIstek("/urunler").then((veri) => setUrunler(veri.urunler || [])).catch(() => {});
    };
    const satislarGeldi = (satislar) => setCanliSatislar(satislar || []);
    const operasyonGuncellendi = () => {
      Promise.allSettled([
        adminIstek("/satislar/canli?limit=100").then((veri) => setCanliSatislar(veri.satislar || [])),
        adminIstek("/satislar/gecmis?limit=100").then((veri) => setGecmisSatislar(veri.satislar || [])),
        adminIstek("/kayitlar/mutfak?limit=200").then((veri) => setMutfakKayitlari(veri.kayitlar || [])),
      ]);
    };
    yonetimeKatil();
    socket.on("connect", yonetimeKatil);
    socket.on("yonetim-satis-guncellendi", satisGeldi);
    socket.on("yonetim-satislar", satislarGeldi);
    socket.on("yonetim-operasyon-guncellendi", operasyonGuncellendi);
    return () => {
      socket.off("yonetim-satis-guncellendi", satisGeldi);
      socket.off("yonetim-satislar", satislarGeldi);
      socket.off("yonetim-operasyon-guncellendi", operasyonGuncellendi);
      socket.off("connect", yonetimeKatil);
    };
  }, []);
  useEffect(() => {
    if (!canliBildirim) return;
    const timer = setTimeout(() => setCanliBildirim(""), 4200);
    return () => clearTimeout(timer);
  }, [canliBildirim]);
  useEffect(() => {
    if (!bildirim) return;
    const timer = setTimeout(() => setBildirim(""), 3000);
    return () => clearTimeout(timer);
  }, [bildirim]);
  useEffect(() => {
    const yollar = {
      satislar: ["/satislar/canli", (veri) => setCanliSatislar(veri.satislar || [])],
      "gecmis-siparisler": ["/satislar/gecmis", (veri) => setGecmisSatislar(veri.satislar || [])],
      "mutfak-kayitlari": ["/kayitlar/mutfak", (veri) => setMutfakKayitlari(veri.kayitlar || [])],
      musteriler: ["/kayitlar/musteriler", (veri) => setMusteriler(veri.musteriler || [])],
      "personel-kayitlari": ["/kayitlar/personel", (veri) => setPersonelKayitlari({ vardiyalar: veri.vardiyalar || [], performans: veri.performans || [] })],
      revizyonlar: ["/revizyonlar", (veri) => setRevizyonlar(veri.revizyonlar || [])],
    };
    if (!yollar[bolum]) return;
    const timer = setTimeout(async () => {
      const sorgu = new URLSearchParams();
      Object.entries(kayitFiltre).forEach(([anahtar, deger]) => deger && sorgu.set(anahtar, deger));
      sorgu.set("limit", ["satislar", "gecmis-siparisler"].includes(bolum) ? "100" : "300");
      try {
        const [yol, uygula] = yollar[bolum];
        uygula(await adminIstek(`${yol}?${sorgu.toString()}`));
      } catch (err) {
        setHata(err.message);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [bolum, kayitFiltre]);

  const islem = async (fn, mesaj) => {
    setHata("");
    try { await fn(); setBildirim(mesaj); await verileriYukle(); return true; }
    catch (err) { setHata(err.message); return false; }
  };

  const urunKaydet = async (e) => {
    e.preventDefault();
    if (gorselYukleniyor) return setHata("Görsel yüklemesi tamamlanmadan ürünü kaydedemezsin.");
    if (!urunForm.gorsel) return setHata("Ürün için bir görsel yüklemelisin.");
    const urunTipi = kategoriyeGoreUrunTipi(urunForm.kategori);
    const veri = {
      ...urunForm,
      urunTipi,
      fiyat: Number(urunForm.fiyat), sira: Number(urunForm.sira), temelMiktar: Number(urunForm.temelMiktar),
      gramajOpsiyonu: urunTipi === "burger" ? {
        goster: urunForm.gramajOpsiyonu?.goster === true,
        aktif: urunForm.gramajOpsiyonu?.aktif === true,
        etiket: String(urunForm.gramajOpsiyonu?.etiket || "").trim(),
        birim: String(urunForm.gramajOpsiyonu?.birim || "gr").trim().toLowerCase(),
        artisMiktari: Number(urunForm.gramajOpsiyonu?.artisMiktari),
        maxAdim: Number(urunForm.gramajOpsiyonu?.maxAdim),
        fiyatArtisi: Number(urunForm.gramajOpsiyonu?.fiyatArtisi),
      } : null,
      boyutSecenekleri: (urunForm.boyutSecenekleri || []).map((boyut) => ({
        ...boyut, miktar: Number(boyut.miktar), fiyatFarki: Number(boyut.fiyatFarki),
      })),
      ekstraMalzemeAyari: {
        aktif: urunForm.ekstraMalzemeAyari?.aktif === true,
        baslik: String(urunForm.ekstraMalzemeAyari?.baslik || "Ekstra malzeme seç").trim(),
        minSecim: Number(urunForm.ekstraMalzemeAyari?.minSecim || 0),
        maxSecim: Number(urunForm.ekstraMalzemeAyari?.maxSecim || 1),
        secenekler: (urunForm.ekstraMalzemeAyari?.secenekler || []).map((secenek) => ({
          id: secenek.id,
          ad: String(secenek.ad || "").trim(),
          fiyat: Number(secenek.fiyat),
          aktif: secenek.aktif !== false,
        })),
      },
      menuYapisi: urunTipi === "menu" ? {
        ...urunForm.menuYapisi,
        burgerUrunId: Number(urunForm.menuYapisi.burgerUrunId),
        yanLezzetUrunId: Number(urunForm.menuYapisi.yanLezzetUrunId),
        icecekUrunId: Number(urunForm.menuYapisi.icecekUrunId),
      } : null,
      populer: urunForm.populer === true,
      stokTakibi: urunForm.stokTakibi === true,
      stokAdedi: urunForm.stokTakibi ? Number(urunForm.stokAdedi) : 0,
      onerilenUrunler: [...new Set((urunForm.onerilenUrunler || []).map(Number).filter(Number.isInteger))].slice(0, 5),
      malzemeler: urunForm.malzemeler.split(",").map((x) => x.trim()).filter(Boolean),
      alerjenler: urunForm.alerjenler.split(",").map((x) => x.trim()).filter(Boolean),
    };
    if (await islem(() => adminIstek("/urunler", jsonGonder("POST", veri)), "Ürün kataloğu güncellendi.")) setUrunForm(null);
  };

  const stokAdediniDegistir = (urun, fark) => {
    const yeniAdet = Math.max(0, Math.min(1000000, Number(urun.stokAdedi || 0) + fark));
    return islem(
      () => adminIstek("/urunler", jsonGonder("POST", { ...urun, stokTakibi: true, stokAdedi: yeniAdet })),
      `${urun.ad} stoku ${yeniAdet} adet olarak güncellendi.`
    );
  };

  const stokTakibiniKapat = (urun) => {
    if (!window.confirm(`${urun.ad} için stok takibi kapatılsın mı? Ürün stok sınırı olmadan satışta kalır.`)) return;
    islem(
      () => adminIstek("/urunler", jsonGonder("POST", { ...urun, stokTakibi: false, stokAdedi: 0 })),
      `${urun.ad} için stok takibi kapatıldı.`
    );
  };

  const boyutlandirmaDegistir = (aktif) => setUrunForm((onceki) => ({
    ...onceki,
    boyutSecenekleri: aktif
      ? (onceki.boyutSecenekleri?.length ? onceki.boyutSecenekleri : BOS_BOYUTLAR(onceki.urunTipi === "icecek" ? "ml" : "gr"))
      : [],
  }));

  const boyutGuncelle = (index, alan, deger) => setUrunForm((onceki) => ({
    ...onceki,
    boyutSecenekleri: onceki.boyutSecenekleri.map((boyut, sira) => ({
      ...boyut,
      ...(alan === "varsayilan" ? { varsayilan: sira === index } : (sira === index ? { [alan]: deger } : {})),
    })),
  }));

  const ekstraAyarGuncelle = (alan, deger) => setUrunForm((onceki) => ({
    ...onceki,
    ekstraMalzemeAyari: { ...BOS_EKSTRA, ...onceki.ekstraMalzemeAyari, [alan]: deger },
  }));
  const ekstraSecenekEkle = () => setUrunForm((onceki) => ({
    ...onceki,
    ekstraMalzemeAyari: {
      ...BOS_EKSTRA,
      ...onceki.ekstraMalzemeAyari,
      secenekler: [...(onceki.ekstraMalzemeAyari?.secenekler || []), { id: `ekstra-${Date.now()}`, ad: "", fiyat: "", aktif: true }],
    },
  }));
  const ekstraSecenekGuncelle = (index, alan, deger) => setUrunForm((onceki) => ({
    ...onceki,
    ekstraMalzemeAyari: {
      ...onceki.ekstraMalzemeAyari,
      secenekler: onceki.ekstraMalzemeAyari.secenekler.map((secenek, sira) => sira === index ? { ...secenek, [alan]: deger } : secenek),
    },
  }));
  const ekstraSecenekSil = (index) => setUrunForm((onceki) => ({
    ...onceki,
    ekstraMalzemeAyari: {
      ...onceki.ekstraMalzemeAyari,
      secenekler: onceki.ekstraMalzemeAyari.secenekler.filter((_, sira) => sira !== index),
    },
  }));

  const gorselSecici = (setForm) => async (dosya) => {
    if (!dosya) return;
    setGorselYukleniyor(true);
    setHata("");
    try {
      const { gorsel } = await gorselYukle(dosya);
      setForm((onceki) => onceki ? { ...onceki, gorsel } : onceki);
    } catch (err) {
      setHata(err.message);
    } finally {
      setGorselYukleniyor(false);
    }
  };
  const urunGorseliSec = gorselSecici(setUrunForm);
  const kategoriGorseliSec = gorselSecici(setKategoriForm);
  const kampanyaGorseliSec = gorselSecici(setKampanyaForm);
  const odulGorseliSec = gorselSecici(setOdulForm);

  const [tumuYukleniyor, setTumuYukleniyor] = useState(false);
  const tumuGorseliRef = useRef(null);
  const tumuGorseliSec = async (dosya) => {
    if (!dosya) return;
    setTumuYukleniyor(true);
    setHata("");
    try {
      const { gorsel } = await gorselYukle(dosya);
      const yanit = await temaKaydet({ tumuGorseli: gorsel });
      isletmeyiGuncelle(yanit.isletme, yanit.tema);
      setBildirim('"Tümü" görseli güncellendi ve müşteri uygulamasına yansıtıldı.');
    } catch (err) {
      setHata(err.message);
    } finally {
      setTumuYukleniyor(false);
    }
  };

  const gramajGuncelle = (alan, deger) => setUrunForm((onceki) => ({
    ...onceki,
    gramajOpsiyonu: { ...onceki.gramajOpsiyonu, [alan]: deger },
  }));

  const urunKategorisiDegistir = (kategori) => setUrunForm((onceki) => {
    const urunTipi = kategoriyeGoreUrunTipi(kategori);
    const varsayilan = gramajVarsayilani({ ...onceki, kategori });
    return {
      ...onceki,
      kategori,
      urunTipi,
      temelMiktar: urunTipi === "burger" ? onceki.temelMiktar : "",
      gramajOpsiyonu: urunTipi === "burger" ? { ...BOS_GRAMAJ, ...onceki.gramajOpsiyonu, etiket: varsayilan.etiket, birim: varsayilan.birim, goster: varsayilan.goster === true, aktif: varsayilan.aktif === true } : null,
      boyutSecenekleri: ["yan_lezzet", "icecek"].includes(urunTipi) ? (onceki.boyutSecenekleri || []) : [],
      menuYapisi: urunTipi === "menu" ? { ...BOS_MENU, ...onceki.menuYapisi } : { ...BOS_MENU },
    };
  });

  const kategoriKaydet = async (e) => {
    e.preventDefault();
    const veri = {
      ...kategoriForm,
      ad: String(kategoriForm.ad || "").trim(),
      gorsel: String(kategoriForm.gorsel || "").trim(),
      sira: Number(kategoriForm.sira),
    };
    if (await islem(() => adminIstek("/kategoriler", jsonGonder("POST", veri)), "Kategori uygulama menüsüne kaydedildi.")) setKategoriForm(null);
  };

  const personelKaydet = async (e) => {
    e.preventDefault();
    if (await islem(() => adminIstek("/personeller", jsonGonder("POST", personelForm)), "Personel kaydı güncellendi.")) setPersonelForm(null);
  };

  const duyuruKaydet = async (e) => {
    e.preventDefault();
    if (await islem(() => adminIstek("/duyurular", jsonGonder("POST", duyuruForm)), "Duyuru yayınlandı.")) setDuyuruForm(null);
  };

  const kampanyaKaydet = async (e) => {
    e.preventDefault();
    const veri = { ...kampanyaForm, indirimYuzde: Number(kampanyaForm.indirimYuzde), sira: Number(kampanyaForm.sira), baslangicSaat: Number(kampanyaForm.baslangicSaat), bitisSaat: Number(kampanyaForm.bitisSaat) };
    if (await islem(() => adminIstek("/kampanyalar", jsonGonder("POST", veri)), "Kampanya uygulamaya kaydedildi.")) setKampanyaForm(null);
  };

  const odulKaydet = async (e) => {
    e.preventDefault();
    const veri = { ...odulForm, puan: Number(odulForm.puan), urunId: Number(odulForm.urunId) };
    if (await islem(() => adminIstek("/oduller", jsonGonder("POST", veri)), "Puan marketi güncellendi.")) setOdulForm(null);
  };

  const damgaKartiniKaydet = async (e) => {
    e.preventDefault();
    const veri = { ...damgaKarti, hedefAdet: Number(damgaKarti.hedefAdet), odulUrunId: Number(damgaKarti.odulUrunId) };
    const basarili = await islem(
      () => adminIstek("/sadakat-ayari", jsonGonder("PUT", veri)),
      "Damga kartı ayarları müşteri uygulamasına yansıtıldı."
    );
    if (basarili) setDamgaKarti((onceki) => ({ ...onceki, hedefAdet: veri.hedefAdet, odulUrunId: veri.odulUrunId }));
  };

  const cuzdanAyariniKaydet = async (e) => {
    e.preventDefault();
    const veri = { ...cuzdanAyari, bonusYuzde: Number(cuzdanAyari.bonusYuzde), minYukleme: Number(cuzdanAyari.minYukleme), maxYukleme: Number(cuzdanAyari.maxYukleme) };
    const basarili = await islem(() => adminIstek("/cuzdan-ayari", jsonGonder("PUT", veri)), "Cüzdan ve nakit bonus ayarları uygulamaya yansıtıldı.");
    if (basarili) setCuzdanAyari(veri);
  };

  const kampanyaKategoriDegistir = (kategori) => setKampanyaForm((onceki) => ({
    ...onceki,
    gecerliKategoriler: onceki.gecerliKategoriler.includes(kategori)
      ? onceki.gecerliKategoriler.filter((ad) => ad !== kategori)
      : [...onceki.gecerliKategoriler, kategori],
  }));

  const toplamCiro = useMemo(() => rapor.gunluk.reduce((t, g) => t + Number(g.ciro), 0), [rapor]);
  const toplamUrun = useMemo(() => rapor.gunluk.reduce((t, g) => t + Number(g.adet), 0), [rapor]);
  const yogunSaat = useMemo(() => (rapor.saatlik || []).reduce((en, s) => s.adet > en.adet ? s : en, { saat: null, adet: 0 }), [rapor]);
  const siparisSayisi = rapor.ozet?.siparis || 0;
  const ortalamaSepet = siparisSayisi ? toplamCiro / siparisSayisi : 0;
  const oncekiOrtalamaSepet = rapor.oncekiOzet?.siparis ? rapor.oncekiOzet.ciro / rapor.oncekiOzet.siparis : 0;
  const ciroTrend = useMemo(() => yuzdeDegisim(toplamCiro, rapor.oncekiOzet?.ciro), [toplamCiro, rapor]);
  const urunTrend = useMemo(() => yuzdeDegisim(toplamUrun, rapor.oncekiOzet?.adet), [toplamUrun, rapor]);
  const sepetTrend = useMemo(() => yuzdeDegisim(ortalamaSepet, oncekiOrtalamaSepet), [ortalamaSepet, oncekiOrtalamaSepet]);
  const gunlukDoldurulmus = useMemo(() => sonOtuzGunuDoldur(rapor.gunluk), [rapor]);
  const ciroSpark = useMemo(() => gunlukDoldurulmus.map((g) => g.ciro), [gunlukDoldurulmus]);
  const urunSpark = useMemo(() => gunlukDoldurulmus.map((g) => g.adet), [gunlukDoldurulmus]);
  const sepetSpark = useMemo(() => gunlukDoldurulmus.map((g) => (g.siparis ? g.ciro / g.siparis : 0)), [gunlukDoldurulmus]);
  const canliSatisToplami = useMemo(() => canliSatislar.reduce((toplam, satis) => toplam + Number(satis.tutar || 0), 0), [canliSatislar]);
  const gecmisSatisToplami = useMemo(() => gecmisSatislar.reduce((toplam, satis) => toplam + Number(satis.tutar || 0), 0), [gecmisSatislar]);
  const tamamlananMutfak = useMemo(() => mutfakKayitlari.filter((kayit) => kayit.durum === "hazir"), [mutfakKayitlari]);
  const ortalamaHazirlama = useMemo(() => {
    const sureli = tamamlananMutfak.filter((kayit) => kayit.hazirlamaDakika != null);
    return sureli.length ? sureli.reduce((toplam, kayit) => toplam + kayit.hazirlamaDakika, 0) / sureli.length : 0;
  }, [tamamlananMutfak]);
  const filtreliUrunler = useMemo(() => {
    const arama = urunArama.trim().toLocaleLowerCase("tr");
    const liste = urunler.filter((urun) =>
      (!arama || urun.ad.toLocaleLowerCase("tr").includes(arama)) &&
      (urunKategoriFiltre === "tumu" || urun.kategori === urunKategoriFiltre) &&
      (urunDurumFiltre === "tumu" || (urunDurumFiltre === "aktif" ? urun.aktif : !urun.aktif))
    );
    return [...liste].sort((a, b) => {
      if (urunSiralama === "fiyat-artan") return a.fiyat - b.fiyat;
      if (urunSiralama === "fiyat-azalan") return b.fiyat - a.fiyat;
      if (urunSiralama === "ad") return a.ad.localeCompare(b.ad, "tr");
      return Number(b.id) - Number(a.id);
    });
  }, [urunler, urunArama, urunKategoriFiltre, urunDurumFiltre, urunSiralama]);
  const burgerUrunleri = urunler.filter((urun) => urun.urunTipi === "burger" && urun.aktif);
  const yanLezzetUrunleri = urunler.filter((urun) => urun.urunTipi === "yan_lezzet" && urun.aktif);
  const icecekUrunleri = urunler.filter((urun) => urun.urunTipi === "icecek" && urun.aktif);
  const onerilebilecekUrunler = urunler.filter((urun) => urun.aktif && String(urun.id) !== String(urunForm?.id || ""));
  const filtreliOneriUrunleri = onerilebilecekUrunler.filter((urun) => urun.ad.toLocaleLowerCase("tr").includes(oneriArama.trim().toLocaleLowerCase("tr")));
  const onerilenUrunuDegistir = (urunId) => {
    const seciliIdler = urunForm?.onerilenUrunler || [];
    if (seciliIdler.includes(urunId)) {
      setUrunForm({ ...urunForm, onerilenUrunler: seciliIdler.filter((id) => id !== urunId) });
    } else if (seciliIdler.length >= 5) {
      setHata("En fazla 5 önerilen ürün seçebilirsin.");
    } else {
      setUrunForm({ ...urunForm, onerilenUrunler: [...seciliIdler, urunId] });
    }
  };
  const kayitSayilari = {
    satislar: canliSatislar.length,
    "gecmis-siparisler": gecmisSatislar.length,
    "mutfak-kayitlari": mutfakKayitlari.length,
    musteriler: musteriler.length,
    "personel-kayitlari": personelKayitlari.vardiyalar.length,
    revizyonlar: revizyonlar.length,
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-marka">
          {(isletme.tema?.logoUrl || isletme.logoUrl) && <img className="admin-marka-logo-yuklu" src={isletme.tema?.logoUrl || isletme.logoUrl} alt={isletme.ad} />}
          {!isletme.tema?.logoUrl && !isletme.logoUrl && isletme.slug === "burger-plus" && <BurgerPlusLogosu className="admin-marka-logo" alt={isletme.ad} />}
          {!isletme.tema?.logoUrl && !isletme.logoUrl && isletme.slug !== "burger-plus" && <strong className="admin-marka-metin">{isletme.ad}</strong>}
          <small>{isletme.ad} · Yönetim Merkezi</small>
        </div>
        <nav aria-label="Yönetim bölümleri">
          <button type="button" className={`admin-nav-ana ${bolum === "genel" ? "aktif" : ""}`} onClick={() => git("/yonetim/genel-bakis")}><b>▦</b><span>Genel Bakış</span></button>
          {MENU_GRUPLARI.map((grup) => {
            const acik = acikMenuGrubu === grup.id;
            const grupSecili = grup.bolumler.includes(bolum);
            return <section className={`admin-menu-grup ${acik ? "acik" : ""} ${grupSecili ? "secili" : ""}`} key={grup.id}>
              <button type="button" className="admin-menu-grup-baslik" aria-expanded={acik} aria-controls={`admin-menu-${grup.id}`} onClick={() => setAcikMenuGrubu((onceki) => onceki === grup.id ? null : grup.id)}>
                <b>{grup.ikon}</b><span><strong>{grup.ad}</strong><small>{grup.aciklama}</small></span><i>⌄</i>
              </button>
              <div className="admin-menu-alt" id={`admin-menu-${grup.id}`}>
                {grup.bolumler.map((bolumId) => {
                  const menu = BOLUMLER.find(([id]) => id === bolumId);
                  if (!menu) return null;
                  const [id, ad, ikon, yol] = menu;
                  return <button type="button" key={id} className={bolum === id ? "aktif" : ""} onClick={() => git(`/yonetim/${yol}`)}><b>{ikon}</b><span>{ad}</span></button>;
                })}
              </div>
            </section>;
          })}
        </nav>
        <div className="admin-sidebar-alt"><i className={hata ? "durum-hata" : ""} />{hata ? "Bağlantı sorunu" : "Sistem çevrimiçi"}</div>
      </aside>

      <main className="admin-main">
        <header className="admin-ust">
          <div><span className="admin-kicker">İŞLETME YÖNETİMİ</span><h1>{BOLUMLER.find(([id]) => id === bolum)?.[1]}</h1></div>
          <div className="admin-ust-sag"><button onClick={verileriYukle}>↻ Yenile</button><button onClick={onCikis}>Çıkış</button><span className="admin-avatar">A</span></div>
        </header>

        {bildirim && <div className="admin-toast">✓ {bildirim}</div>}
        {canliBildirim && <div className="admin-canli-toast"><i /> <div><b>Yeni satış alındı</b><span>{canliBildirim}</span></div></div>}
        {hata && <div className="admin-hata">{hata}</div>}
        {yukleniyor && !dashboard ? <div className="admin-yukleniyor">Veriler hazırlanıyor…</div> : (
          <div className="admin-icerik">
            {KAYIT_BOLUMLERI.includes(bolum) && <KayitGezgini aktif={bolum} sayilar={kayitSayilari} git={git} />}
            {bolum === "tema" && <TemaYonetimi />}
            {bolum === "genel" && dashboard && <>
              <section className="admin-metrikler">
                <Metrik ad="Bugünkü ciro" deger={para(dashboard.bugunCiro)} alt={`${dashboard.bugunSiparis} sipariş`} renk="turuncu" />
                <Metrik ad="Bugünkü sipariş" deger={dashboard.bugunSiparis} alt="Toplam sipariş" renk="yesil" />
                <Metrik ad="Menü" deger={urunler.length} alt="Katalogdaki ürünler" renk="mavi" />
                <Metrik ad="Ekip" deger={`${dashboard.vardiyada}/${dashboard.personel}`} alt="Şu an vardiyada" renk="mor" />
                <Metrik ad="Mutfak ortalaması" deger={dashboard.ortalamaHazirlamaDakika == null ? "—" : `${dashboard.ortalamaHazirlamaDakika} dk`} alt="Son 30 gün" renk="yesil" />
                <Metrik ad="Geciken sipariş" deger={dashboard.gecikenSiparis || 0} alt="15 dakika üzeri" renk="turuncu" />
              </section>
              <section className="admin-grid-2">
                <Panel baslik="Son 30 gün satış hareketi" alt={para(toplamCiro)}>
                  <SatisCizgiGrafigi veriler={rapor.gunluk} />
                </Panel>
                <Panel baslik="En çok satanlar" alt="Son 30 gün">
                  <div className="admin-siralama">{dashboard.populer?.length ? dashboard.populer.map((u, i) => (
                    <div key={u.urun_ad}><span>{i + 1}</span><b>{u.urun_ad}</b><small>{u.adet} adet</small><strong>{para(u.ciro)}</strong></div>
                  )) : <Bos yazi="Henüz satış verisi yok." />}</div>
                </Panel>
              </section>
              <section className="admin-grid-3">
                <Panel baslik="Saatlik talep" alt="Satılan ürün adedi"><MiniCizgiGrafigi veriler={saatleriDoldur(rapor.saatlik || [])} deger="adet" etiket={(s) => `${String(s.saat).padStart(2, "0")}:00`} renk="mavi" /></Panel>
                <Panel baslik="Kategori dağılımı" alt="Son 30 gün"><KategoriDagilimi veriler={rapor.kategoriler || []} toplam={toplamUrun} /></Panel>
                <Panel baslik="Haftalık ritim" alt="Hangi gün daha yoğun?"><MiniCizgiGrafigi veriler={haftayiDoldur(rapor.haftalik || [])} deger="adet" etiket={(g) => haftaAdi(g.gun)} renk="mor" /></Panel>
              </section>
              <Panel baslik="Canlı satış akışı" alt="Yeni ödemeler otomatik görünür">
                <div className="dashboard-canli-akis">{canliSatislar.slice(0, 5).map((satis, index) => <button type="button" key={`${satis.siparisNo || satis.siparis_no}-${index}`} onClick={() => git("/yonetim/satislar")}><i /><span><b>{satis.kisiAdi || satis.kisi_adi || "Misafir"}</b><small>{(Array.isArray(satis.urunler) ? satis.urunler : []).map((urun) => `${urun.ad} x${urun.adet}`).join(", ") || `${satis.urunAdedi || satis.urun_adedi || 0} ürün`}</small></span><em>{String(satis.masaNo || satis.masa_no || "algotur").toLowerCase() === "algotur" ? "Al Götür" : `Masa ${satis.masaNo || satis.masa_no}`}</em><strong>{para(satis.tutar)}</strong><time>{tarihSaat(satis.olusturma)}</time></button>)}{!canliSatislar.length && <Bos yazi="Henüz satış kaydı yok." />}</div>
              </Panel>
            </>}

            {bolum === "stok" && <>
              <BolumBaslik baslik="Paketli ürün stok takibi" aciklama="Adetle sayılan hazır ürünleri tek ekrandan izleyin ve güncelleyin." />
              <section className="stok-ozet-grid">
                <article><span>Takip edilen</span><strong>{urunler.filter((urun) => urun.stokTakibi).length}</strong><small>paketli ürün</small></article>
                <article className="uyari"><span>Kritik stok</span><strong>{urunler.filter((urun) => urun.stokTakibi && urun.stokAdedi > 0 && urun.stokAdedi <= 5).length}</strong><small>5 adet veya altı</small></article>
                <article className="tehlike"><span>Tükenen</span><strong>{urunler.filter((urun) => urun.stokTakibi && urun.stokAdedi <= 0).length}</strong><small>satışa kapalı</small></article>
              </section>
              <section className="stok-yonetim-paneli">
                <header><div><span>AKTİF TAKİP</span><h3>Stoklu ürünler</h3></div><small>{urunler.filter((urun) => urun.stokTakibi).length} ürün</small></header>
                <div className="stok-urun-listesi">
                  {urunler.filter((urun) => urun.stokTakibi).map((urun) => (
                    <article className={urun.stokAdedi <= 0 ? "tukendi" : urun.stokAdedi <= 5 ? "kritik" : ""} key={urun.id}>
                      {urun.gorsel ? <img src={urun.gorsel} alt="" /> : <span className="stok-gorselsiz">BP</span>}
                      <div className="stok-urun-bilgi"><b>{urun.ad}</b><small>{urun.kategori}</small></div>
                      <div className="stok-adet"><strong>{urun.stokAdedi}</strong><small>adet</small></div>
                      <div className="stok-hizli-islem">
                        <button type="button" onClick={() => stokAdediniDegistir(urun, -10)} disabled={urun.stokAdedi <= 0}>-10</button>
                        <button type="button" onClick={() => stokAdediniDegistir(urun, -1)} disabled={urun.stokAdedi <= 0}>-1</button>
                        <button type="button" className="arti" onClick={() => stokAdediniDegistir(urun, 1)}>+1</button>
                        <button type="button" className="arti" onClick={() => stokAdediniDegistir(urun, 10)}>+10</button>
                      </div>
                      <button type="button" className="stok-duzenle" onClick={() => setUrunForm(urunuFormaCevir(urun))}>Düzenle</button>
                      <button type="button" className="stok-kapat" onClick={() => stokTakibiniKapat(urun)}>Takibi kapat</button>
                    </article>
                  ))}
                  {!urunler.some((urun) => urun.stokTakibi) && <Bos yazi="Henüz stok takibine alınmış ürün yok." />}
                </div>
              </section>
              <section className="stok-aday-paneli">
                <header><div><span>TAKİBE AL</span><h3>Diğer ürünler</h3><p>Paketli olarak sattığınız ürünü seçip başlangıç adedini girin.</p></div></header>
                <div>{urunler.filter((urun) => !urun.stokTakibi && urun.urunTipi !== "menu").map((urun) => (
                  <button type="button" key={urun.id} onClick={() => setUrunForm({ ...urunuFormaCevir(urun), stokTakibi: true, stokAdedi: 0 })}>
                    {urun.gorsel ? <img src={urun.gorsel} alt="" /> : <span>BP</span>}<b>{urun.ad}</b><small>{urun.kategori}</small><em>Takibe al</em>
                  </button>
                ))}</div>
              </section>
            </>}

            {bolum === "urunler" && <>
              <BolumBaslik baslik="Menü kataloğu" aciklama="Burger, boyutlu ürün ve menü yapılarını müşteri uygulamasıyla birlikte yönetin." buton="+ Yeni ürün" onClick={() => setUrunForm(yeniUrunFormu(kategoriler[0]?.ad))} />
              <section className="kategori-yonetim-karti">
                <header><div><span>UYGULAMA MENÜSÜ</span><h3>Kategoriler</h3><p>Buradaki sıralama ve görseller müşteri uygulamasına anında yansır.</p></div><button type="button" onClick={() => setKategoriForm({ ...BOS_KATEGORI, sira: (kategoriler.at(-1)?.sira || 0) + 10 })}>+ Kategori ekle</button></header>
                <div className="kategori-yonetim-listesi">
                  <article className="kategori-yonetim-sabit">
                    <button type="button" className="kategori-duzenle" disabled={tumuYukleniyor} onClick={() => tumuGorseliRef.current?.click()}>
                      <span className="kategori-yonetim-gorsel">{isletme.tema?.tumuGorseli ? <img src={isletme.tema.tumuGorseli} alt="" /> : <b>T</b>}</span>
                      <span><b>Tümü</b><small>Müşteri uygulamasındaki "Tümü" sekmesi{tumuYukleniyor ? " · yükleniyor…" : ""}</small></span>
                      <em>{tumuYukleniyor ? "…" : "Görsel değiştir"}</em>
                    </button>
                    <input ref={tumuGorseliRef} type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/bmp" onChange={(e) => { const dosya = e.target.files?.[0]; e.target.value = ""; tumuGorseliSec(dosya); }} />
                  </article>
                  {kategoriler.map((kategori) => (
                    <article className={!kategori.aktif ? "pasif" : ""} key={kategori.id}>
                      <button type="button" className="kategori-duzenle" onClick={() => setKategoriForm({ ...kategori })}>
                        <span className="kategori-yonetim-gorsel">{kategori.gorsel ? <img src={kategori.gorsel} alt="" /> : <b>{kategori.ad.charAt(0)}</b>}</span>
                        <span><b>{kategori.ad}</b><small>{urunler.filter((urun) => urun.kategori === kategori.ad).length} ürün · sıra {kategori.sira}</small></span>
                        <em>Düzenle</em>
                      </button>
                      <button type="button" className="kategori-sil" onClick={() => { if (window.confirm(`${kategori.ad} kategorisi silinsin mi? İçinde ürün varsa işlem güvenli biçimde engellenir.`)) islem(() => adminIstek(`/kategoriler/${kategori.id}`, { method: "DELETE" }), "Kategori arşivlendi."); }}>Sil</button>
                    </article>
                  ))}
                </div>
              </section>
              <section className="urun-filtreleri">
                <input type="search" value={urunArama} onChange={(e) => setUrunArama(e.target.value.slice(0, 80))} placeholder="Ürün adına göre ara…" aria-label="Ürün ara" />
                <select value={urunKategoriFiltre} onChange={(e) => setUrunKategoriFiltre(e.target.value)} aria-label="Kategori filtresi"><option value="tumu">Tüm kategoriler</option>{kategoriler.map((kategori) => <option key={kategori.id} value={kategori.ad}>{kategori.ad}</option>)}</select>
                <select value={urunDurumFiltre} onChange={(e) => setUrunDurumFiltre(e.target.value)} aria-label="Durum filtresi"><option value="tumu">Tüm durumlar</option><option value="aktif">Yayında</option><option value="pasif">Pasif</option></select>
                <select value={urunSiralama} onChange={(e) => setUrunSiralama(e.target.value)} aria-label="Ürün sıralaması"><option value="yeni">Son eklenen</option><option value="ad">Ada göre</option><option value="fiyat-artan">Fiyat artan</option><option value="fiyat-azalan">Fiyat azalan</option></select>
                <small>{filtreliUrunler.length} ürün</small>
              </section>
              <div className="admin-kart-grid">{filtreliUrunler.map((u) => (
                <article className={`admin-urun-kart ${!u.aktif ? "pasif" : ""}`} key={u.id}>
                  {u.gorsel ? <img src={u.gorsel} alt="" /> : <div className="admin-urun-gorselsiz">Görsel</div>}
                  <div><span className="admin-rozet">{u.kategori}</span><h3>{u.ad}</h3>{u.gramajOpsiyonu?.goster !== false && u.temelMiktar > 0 && <p>{u.temelMiktar} {u.gramajOpsiyonu?.birim || "gr"}</p>}{u.boyutSecenekleri?.length > 0 && <small className="admin-gramaj-ozet">{u.boyutSecenekleri.map((boyut) => boyut.etiket).join(" · ")}</small>}{u.urunTipi === "menu" && <small className="admin-gramaj-ozet">Burger + Yan lezzet + İçecek</small>}{u.gramajOpsiyonu?.aktif && <small className="admin-gramaj-ozet">+{u.gramajOpsiyonu.artisMiktari} {u.gramajOpsiyonu.birim} · {para(u.gramajOpsiyonu.fiyatArtisi)} / adım</small>}{u.stokTakibi && <small className={`admin-stok-ozet ${u.stokAdedi <= 5 ? "kritik" : ""}`}>{u.stokAdedi > 0 ? `${u.stokAdedi} adet stokta` : "Stok tükendi"}</small>}{!u.stokTakibi && u.stokta === false && <small className="admin-stok-ozet kritik">Menü bileşeni tükendi</small>}<strong>{para(u.fiyat)}</strong></div>
                  <footer><button onClick={() => setUrunForm(urunuFormaCevir(u))}>Düzenle</button>{u.stokTakibi && <button onClick={() => islem(() => adminIstek("/urunler", jsonGonder("POST", { ...u, stokAdedi: Number(u.stokAdedi || 0) + 10 })), "Stoğa 10 adet eklendi.")}>+10 stok</button>}<button onClick={() => islem(() => adminIstek(`/urunler/${u.id}/aktif`, jsonGonder("PATCH", { aktif: !u.aktif })), u.aktif ? "Ürün yayından kaldırıldı." : "Ürün yayınlandı.")}>{u.aktif ? "Pasife al" : "Yayınla"}</button><button className="tehlike" onClick={() => { if (window.confirm(`${u.ad} katalogdan silinsin mi? Geçmiş siparişler korunacak.`)) islem(() => adminIstek(`/urunler/${u.id}`, { method: "DELETE" }), "Ürün katalogdan silindi."); }}>Sil</button></footer>
              </article>
              ))}{filtreliUrunler.length === 0 && <Bos yazi={urunler.length ? "Filtreye uygun ürün bulunamadı." : "Katalog boş. İlk ürünü yönetim panelinden ekleyebilirsin."} />}</div>
            </>}

            {bolum === "kampanyalar" && <>
              <BolumBaslik baslik="Kampanya yönetimi" aciklama="Uygulamada görünen kampanyaları, geçerli kategorileri ve indirim saatlerini yönetin." buton="+ Yeni kampanya" onClick={() => setKampanyaForm({ ...BOS_KAMPANYA, gecerliKategoriler: [] })} />
              <div className="yonetim-kart-grid">{kampanyalar.length ? kampanyalar.map((kampanya) => (
                <article className={`yonetim-kart kampanya-yonetim-kart ${!kampanya.aktif ? "pasif" : ""}`} key={kampanya.id}>
                  <div className="yonetim-kart-gorsel">
                    {kampanya.gorsel ? <img src={kampanya.gorsel} alt="" /> : <span>%{kampanya.indirimYuzde}</span>}
                    <b>{kampanya.aktif ? "YAYINDA" : "PASİF"}</b>
                  </div>
                  <div className="yonetim-kart-icerik">
                    <small><span className="kampanya-kart-ikonu">{kampanyaIkonu(kampanya)}</span>{kampanya.etiket}</small><h3>{kampanya.baslik}</h3><p>{kampanya.aciklama}</p>
                    <div className="yonetim-etiketler">
                      {Number(kampanya.indirimYuzde) > 0 && <span>%{kampanya.indirimYuzde} indirim</span>}
                      <span>{kampanya.kampanyaTipi === "saatli" ? `${String(kampanya.baslangicSaat).padStart(2, "0")}:00–${String(kampanya.bitisSaat).padStart(2, "0")}:00` : "Sürekli"}</span>
                      {(kampanya.gecerliKategoriler || []).map((kategori) => <span key={kategori}>{kategori}</span>)}
                    </div>
                  </div>
                  <footer><button type="button" onClick={() => setKampanyaForm({ ...kampanya, gecerliKategoriler: [...(kampanya.gecerliKategoriler || [])] })}>Düzenle</button><button type="button" className="tehlike" onClick={() => { if (window.confirm(`${kampanya.baslik} kampanyası arşivlensin mi?`)) islem(() => adminIstek(`/kampanyalar/${kampanya.id}`, { method: "DELETE" }), "Kampanya arşivlendi."); }}>Sil</button></footer>
                </article>
              )) : <Bos yazi="Henüz kampanya tanımlanmamış." />}</div>
            </>}

            {bolum === "cuzdan" && <>
              <BolumBaslik baslik="Uygulama cüzdanı" aciklama="Kasadan nakit yükleme, hediye bakiye kampanyası ve işlem limitlerini yönetin." />
              <section className="admin-metrikler cuzdan-metrikleri">
                <Metrik ad="Bugünkü nakit" deger={para(cuzdanRaporu.bugunNakit)} alt="Kasadan cüzdana yüklenen" renk="yesil" />
                <Metrik ad="Toplam nakit girişi" deger={para(cuzdanRaporu.toplamNakit)} alt={`${cuzdanRaporu.yuklemeYapanMusteri} müşteri yükleme yaptı`} renk="mavi" />
                <Metrik ad="Verilen bonus" deger={para(cuzdanRaporu.toplamBonus)} alt="Hediye bakiye maliyeti" renk="mor" />
                <Metrik ad="Dolaşımdaki bakiye" deger={para(cuzdanRaporu.dolasimdakiBakiye)} alt="Müşterilerin kullanılabilir toplamı" renk="turuncu" />
              </section>
              <section className={`cuzdan-admin-paneli ${cuzdanAyari.aktif ? "aktif" : "pasif"}`}>
                <header className="cuzdan-admin-baslik">
                  <div><span>ÖN ÖDEMELİ BAKİYE</span><h2>Nakit akışını sadakate dönüştür</h2><p>Müşteri kasada nakit ödeme yapar; personel tutarı hesabına yükler. Tanımladığınız hediye oranı otomatik eklenir.</p></div>
                  <label className="admin-switch"><input type="checkbox" checked={cuzdanAyari.aktif === true} onChange={(e) => setCuzdanAyari({ ...cuzdanAyari, aktif: e.target.checked })} /><span /></label>
                </header>
                <div className="cuzdan-admin-yerlesim">
                  <form className="cuzdan-admin-form" onSubmit={cuzdanAyariniKaydet}>
                    <label className="cuzdan-bonus-switch"><span><b>Hediye bakiye kampanyası</b><small>Nakit yüklemeye ek bakiye ver</small></span><input type="checkbox" checked={cuzdanAyari.bonusAktif === true} onChange={(e) => setCuzdanAyari({ ...cuzdanAyari, bonusAktif: e.target.checked })} /></label>
                    <div className="cuzdan-admin-grid">
                      <Alan etiket="Hediye oranı (%)"><input required type="number" min="0" max="100" step="0.01" value={cuzdanAyari.bonusYuzde} disabled={!cuzdanAyari.bonusAktif} onChange={(e) => setCuzdanAyari({ ...cuzdanAyari, bonusYuzde: e.target.value })} /><small>Örn. ₺500 nakit + %{cuzdanAyari.bonusYuzde || 0} = {para(500 + 500 * Number(cuzdanAyari.bonusYuzde || 0) / 100)} bakiye.</small></Alan>
                      <Alan etiket="Minimum yükleme"><input required type="number" min="1" step="0.01" value={cuzdanAyari.minYukleme} onChange={(e) => setCuzdanAyari({ ...cuzdanAyari, minYukleme: e.target.value })} /></Alan>
                      <Alan etiket="Tek işlem üst limiti"><input required type="number" min="1" max="1000000" step="0.01" value={cuzdanAyari.maxYukleme} onChange={(e) => setCuzdanAyari({ ...cuzdanAyari, maxYukleme: e.target.value })} /></Alan>
                      <Alan etiket="Kampanya başlığı"><input required maxLength="100" value={cuzdanAyari.kampanyaBasligi} onChange={(e) => setCuzdanAyari({ ...cuzdanAyari, kampanyaBasligi: e.target.value })} /></Alan>
                      <Alan etiket="Müşteriye gösterilen açıklama"><textarea maxLength="240" value={cuzdanAyari.kampanyaAciklamasi} onChange={(e) => setCuzdanAyari({ ...cuzdanAyari, kampanyaAciklamasi: e.target.value })} /></Alan>
                    </div>
                    <div className="cuzdan-admin-guvence"><b>Operasyon kuralları</b><ul><li>Yükleme sadece salon/kasiyer hesabından yapılır.</li><li>Her işlem personel, müşteri ve zaman bilgisiyle kaydedilir.</li><li>Aynı kasa isteği iki kez bakiyeye yansımaz.</li><li>Bakiye başka işletmede kullanılamaz.</li></ul></div>
                    <div className="cuzdan-admin-alt"><p>Cüzdanı kapatmak mevcut bakiyeleri silmez; yalnızca yeni yükleme ve harcamaları durdurur.</p><button className="primary" type="submit">Cüzdan ayarlarını kaydet</button></div>
                  </form>
                  <aside className="cuzdan-admin-onizleme">
                    <small>MÜŞTERİ UYGULAMASI</small><span className="cuzdan-admin-ikon">₺</span><h3>{cuzdanAyari.kampanyaBasligi}</h3><p>{cuzdanAyari.kampanyaAciklamasi}</p>
                    {cuzdanAyari.bonusAktif && <strong>%{cuzdanAyari.bonusYuzde} hediye bakiye</strong>}
                    <div><span>Örnek nakit yükleme</span><b>{para(500)}</b><span>Müşteriye geçen</span><b>{para(500 + 500 * Number(cuzdanAyari.bonusAktif ? cuzdanAyari.bonusYuzde : 0) / 100)}</b></div>
                  </aside>
                </div>
              </section>
            </>}

            {bolum === "oduller" && <>
              <section className={`damga-ayar-paneli ${damgaKarti.aktif ? "aktif" : "pasif"}`}>
                <header className="damga-ayar-baslik">
                  <div><span>SADAKAT PROGRAMI</span><h2>Damga kartı</h2><p>Müşterinin hangi alışverişte damga kazanacağını, kaç damgada hangi ürünü hediye alacağını ve kartın uygulamadaki dilini yönetin.</p></div>
                  <label className="admin-switch"><input type="checkbox" checked={damgaKarti.aktif === true} onChange={(e) => setDamgaKarti({ ...damgaKarti, aktif: e.target.checked })} /><span /></label>
                </header>
                <div className="damga-ayar-yerlesim">
                  <form className="damga-ayar-form" onSubmit={damgaKartiniKaydet}>
                    <div className="damga-ayar-grid">
                      <Alan etiket="Kaç damgada hediye?"><input required type="number" min="2" max="30" step="1" value={damgaKarti.hedefAdet} onChange={(e) => setDamgaKarti({ ...damgaKarti, hedefAdet: e.target.value })} /><small>Örn. 5: Beş uygun ürün satın alan müşteri ödül kazanır.</small></Alan>
                      <Alan etiket="Damga kazandıran kategori"><select required value={damgaKarti.kategori} onChange={(e) => setDamgaKarti({ ...damgaKarti, kategori: e.target.value })}>{kategoriler.filter((k) => k.aktif !== false).map((k) => <option key={k.id} value={k.ad}>{k.ad}</option>)}</select><small>Bu kategorideki her ürün adedi bir damga kazandırır.</small></Alan>
                      <Alan etiket="Tamamlanınca verilecek ürün"><select required={damgaKarti.aktif} value={damgaKarti.odulUrunId || ""} onChange={(e) => { const urun = urunler.find((u) => String(u.id) === e.target.value); setDamgaKarti({ ...damgaKarti, odulUrunId: e.target.value, odulMetni: urun ? `1 ${urun.ad} Hediye` : damgaKarti.odulMetni }); }}><option value="">Ürün seçin</option>{urunler.filter((u) => u.aktif).map((u) => <option key={u.id} value={u.id}>{u.ad} · {u.kategori}</option>)}</select></Alan>
                      <Alan etiket="Ödül adı"><input required maxLength="120" value={damgaKarti.odulMetni} onChange={(e) => setDamgaKarti({ ...damgaKarti, odulMetni: e.target.value })} placeholder="1 Burger Hediye" /></Alan>
                      <Alan etiket="Kart etiketi"><input required maxLength="40" value={damgaKarti.kartEtiketi} onChange={(e) => setDamgaKarti({ ...damgaKarti, kartEtiketi: e.target.value })} /></Alan>
                      <Alan etiket="Kart başlığı"><input required maxLength="100" value={damgaKarti.baslik} onChange={(e) => setDamgaKarti({ ...damgaKarti, baslik: e.target.value })} /></Alan>
                      <Alan etiket="Damga birimi"><input required maxLength="40" value={damgaKarti.damgaBirimi} onChange={(e) => setDamgaKarti({ ...damgaKarti, damgaBirimi: e.target.value })} placeholder="burger / kahve / ürün" /></Alan>
                      <Alan etiket="Damga ikonu"><input required maxLength="16" value={damgaKarti.ikon} onChange={(e) => setDamgaKarti({ ...damgaKarti, ikon: e.target.value })} placeholder="★" /></Alan>
                      <Alan etiket="Kart açıklaması"><textarea maxLength="240" value={damgaKarti.aciklama} onChange={(e) => setDamgaKarti({ ...damgaKarti, aciklama: e.target.value })} /></Alan>
                      <Alan etiket="Tamamlanma mesajı"><input required maxLength="80" value={damgaKarti.tamamlanmaMetni} onChange={(e) => setDamgaKarti({ ...damgaKarti, tamamlanmaMetni: e.target.value })} /></Alan>
                    </div>
                    <div className="damga-ayar-alt"><p>Hedef değiştiğinde müşterilerin mevcut damgaları silinmez. Kazanılmış hediyeler her zaman korunur.</p><button className="primary" type="submit">Damga kartını kaydet</button></div>
                  </form>
                  <aside className="damga-admin-onizleme">
                    <span>{damgaKarti.kartEtiketi || "YE KAZAN"}</span><h3>{damgaKarti.baslik || "Damga kartı"}</h3><p>{damgaKarti.aciklama}</p>
                    <div className="damga-admin-daireler">{Array.from({ length: Math.min(12, Math.max(2, Number(damgaKarti.hedefAdet) || 5)) }, (_, i) => <i key={i} className={i < Math.min(2, Number(damgaKarti.hedefAdet) || 5) ? "dolu" : ""}>{i < 2 ? damgaKarti.ikon : i + 1}</i>)}</div>
                    {Number(damgaKarti.hedefAdet) > 12 && <small>+{Number(damgaKarti.hedefAdet) - 12} damga daha</small>}
                    <footer><b>2 / {damgaKarti.hedefAdet || 5}</b><strong>{damgaKarti.odulMetni || "Hediye"}</strong></footer>
                  </aside>
                </div>
              </section>
              <BolumBaslik baslik="Puan marketi" aciklama="Müşterilerin puanlarıyla alabileceği ürünleri ve gerekli puan tutarını belirleyin." buton="+ Yeni ödül" onClick={() => setOdulForm({ ...BOS_ODUL, urunId: urunler.find((urun) => urun.aktif)?.id || urunler[0]?.id || "" })} />
              <div className="yonetim-kart-grid">{oduller.length ? oduller.map((odul) => (
                <article className={`yonetim-kart odul-yonetim-kart ${!odul.aktif ? "pasif" : ""}`} key={odul.id}>
                  <div className="yonetim-kart-gorsel">
                    {odul.gorsel ? <img src={odul.gorsel} alt="" /> : <span>★</span>}
                    <b>{odul.aktif ? "MARKETTE" : "PASİF"}</b>
                  </div>
                  <div className="yonetim-kart-icerik"><small>PUAN ÖDÜLÜ</small><h3>{odul.ad}</h3><strong>{Number(odul.puan).toLocaleString("tr-TR")} Puan</strong><p>Bağlı ürün: {odul.urunAd}</p><div className="yonetim-etiketler"><span>{odul.kazanilmaSayisi} kez kazanıldı</span></div></div>
                  <footer><button type="button" onClick={() => setOdulForm({ ...odul })}>Düzenle</button><button type="button" className="tehlike" onClick={() => { if (window.confirm(`${odul.ad} puan marketinden kaldırılsın mı? Kazanılmış ödüller korunur.`)) islem(() => adminIstek(`/oduller/${odul.id}`, { method: "DELETE" }), "Ödül puan marketinden arşivlendi."); }}>Sil</button></footer>
                </article>
              )) : <Bos yazi="Puan marketinde henüz ödül yok." />}</div>
            </>}

            {bolum === "duyurular" && <>
              <BolumBaslik baslik="Müşteri duyuruları" aciklama="Yayınlanan duyurular müşterilerin bildirim panelinde görünür." buton="+ Duyuru yayınla" onClick={() => setDuyuruForm({ ...BOS_DUYURU })} />
              <div className="duyuru-liste">{duyurular.length ? duyurular.map((duyuru) => <article key={duyuru.id} className={!duyuru.aktif ? "pasif" : ""}><span>DUYURU</span><h3>{duyuru.baslik}</h3><p>{duyuru.mesaj}</p><footer><small>{tarihSaat(duyuru.olusturma)}</small><b>{duyuru.hedef}</b><button type="button" className="tehlike" onClick={() => { if (window.confirm(`${duyuru.baslik} duyurusu yayından kaldırılsın mı?`)) islem(() => adminIstek(`/duyurular/${duyuru.id}`, { method: "DELETE" }), "Duyuru yayından kaldırıldı."); }}>Sil</button></footer></article>) : <Bos yazi="Henüz yayınlanmış duyuru yok." />}</div>
            </>}

            {bolum === "satislar" && <>
              <BolumBaslik baslik="Canlı satış merkezi" aciklama="Yeni ödemeler bu ekrana sayfa yenilemeden düşer; sipariş içeriğini ve mutfak durumunu anlık izleyin." />
              <section className="admin-metrikler kayit-metrikleri">
                <Metrik ad="Görünen satış" deger={canliSatislar.length} alt="Filtre sonucundaki sipariş" renk="mavi" />
                <Metrik ad="Satış toplamı" deger={para(canliSatisToplami)} alt="Görünen kayıtlar" renk="turuncu" />
                <Metrik ad="Hazırlanıyor" deger={canliSatislar.filter((s) => s.durum === "hazirlaniyor").length} alt="Mutfakta aktif" renk="mor" />
                <Metrik ad="Hazır" deger={canliSatislar.filter((s) => s.durum === "hazir").length} alt="Teslime hazır" renk="yesil" />
              </section>
              <KayitFiltreleri tur="satis" filtre={kayitFiltre} setFiltre={setKayitFiltre} />
              <SatisKartlari satislar={canliSatislar} />
            </>}

            {bolum === "gecmis-siparisler" && <>
              <BolumBaslik baslik="Geçmiş siparişler" aciklama="Masa kapatıldığında canlı satıştan çıkan siparişler burada kalıcı olarak saklanır ve geriye dönük incelenebilir." />
              <section className="admin-metrikler kayit-metrikleri">
                <Metrik ad="Kapanan sipariş" deger={gecmisSatislar.length} alt="Filtre sonucundaki kayıt" renk="mavi" />
                <Metrik ad="Geçmiş satış toplamı" deger={para(gecmisSatisToplami)} alt="Görünen kayıtlar" renk="turuncu" />
                <Metrik ad="Hazır tamamlanan" deger={gecmisSatislar.filter((s) => s.durum === "hazir").length} alt="Masa kapanmadan hazırlanmış" renk="yesil" />
              </section>
              <KayitFiltreleri tur="gecmis" filtre={kayitFiltre} setFiltre={setKayitFiltre} />
              <SatisKartlari satislar={gecmisSatislar} gecmis />
            </>}

            {bolum === "mutfak-kayitlari" && <>
              <BolumBaslik baslik="Mutfak işleyiş kayıtları" aciklama="Siparişin gelişinden hazırlanmasına kadar geçen süreyi, işlemi yapan personeli ve gecikmeleri kontrol edin." />
              <section className="admin-metrikler kayit-metrikleri">
                <Metrik ad="Ortalama hazırlama" deger={`${ortalamaHazirlama.toFixed(1)} dk`} alt="Tamamlanan siparişler" renk="turuncu" />
                <Metrik ad="Tamamlanan" deger={tamamlananMutfak.length} alt="Hazır durumundaki kayıt" renk="yesil" />
                <Metrik ad="Aktif mutfak" deger={mutfakKayitlari.filter((k) => k.durum === "hazirlaniyor").length} alt="Şu an hazırlanıyor" renk="mavi" />
                <Metrik ad="15 dk üzeri" deger={mutfakKayitlari.filter((k) => Number(k.hazirlamaDakika) > 15).length} alt="İncelenmesi gereken" renk="mor" />
              </section>
              <KayitFiltreleri tur="mutfak" filtre={kayitFiltre} setFiltre={setKayitFiltre} personeller={personeller} />
              <Panel baslik="Hazırlık geçmişi" alt={`${mutfakKayitlari.length} kayıt`}>
                <div className="admin-tablo-sarici"><table className="admin-tablo kayit-tablosu mutfak-zaman-tablosu"><thead><tr><th>Sipariş</th><th>Masa / kişi</th><th>Ürünler</th><th>Personel</th><th>Durum</th><th>İşlem zamanları</th></tr></thead><tbody>{mutfakKayitlari.map((kayit) => <tr key={kayit.siparis_no} className={Number(kayit.hazirlamaDakika) > 15 ? "kritik" : ""}><td><b>{kayit.siparis_no}</b><small>{tarihSaat(kayit.siparis_at)}</small></td><td><b>{String(kayit.masa_no).toLowerCase() === "algotur" ? "Al Götür" : `Masa ${kayit.masa_no}`}</b><span>{kayit.kisi_adi || "Misafir"}</span></td><td className="kayit-urun-metni">{kayit.urunler}</td><td>{kayit.personel_ad || "—"}</td><td><DurumRozeti durum={kayit.durum} /></td><td><MutfakSureAkisi kayit={kayit} /></td></tr>)}</tbody></table></div>
              </Panel>
            </>}

            {bolum === "musteriler" && <>
              <BolumBaslik baslik="Müşteri kayıtları" aciklama="Hesap sahiplerini, sipariş sıklığını, toplam harcamayı ve sadakat puanlarını tek ekrandan inceleyin." />
              <section className="admin-metrikler kayit-metrikleri">
                <Metrik ad="Kayıtlı müşteri" deger={musteriler.length} alt="Filtre sonucundaki hesap" renk="mavi" />
                <Metrik ad="Sipariş veren" deger={musteriler.filter((m) => m.siparisSayisi > 0).length} alt="En az bir sipariş" renk="yesil" />
                <Metrik ad="Toplam harcama" deger={para(musteriler.reduce((t, m) => t + m.toplamHarcama, 0))} alt="Müşteri hesapları" renk="turuncu" />
                <Metrik ad="Toplam puan" deger={musteriler.reduce((t, m) => t + m.puan, 0).toLocaleString("tr-TR")} alt="Kullanılabilir puan" renk="mor" />
              </section>
              <KayitFiltreleri tur="musteri" filtre={kayitFiltre} setFiltre={setKayitFiltre} />
              <Panel baslik="Müşteri listesi" alt={`${musteriler.length} hesap`}><div className="admin-tablo-sarici"><table className="admin-tablo kayit-tablosu"><thead><tr><th>Müşteri</th><th>İletişim</th><th>Kayıt tarihi</th><th>Sipariş</th><th>Toplam harcama</th><th>Puan</th><th>Son sipariş</th></tr></thead><tbody>{musteriler.map((musteri) => <tr key={musteri.id}><td><div className="tablo-kisi"><i>{musteri.ad?.[0]}{musteri.soyad?.[0]}</i><b>{musteri.ad} {musteri.soyad}</b></div></td><td><b>{musteri.email}</b><span>{musteri.telefon || "—"}</span></td><td>{tarihSaat(musteri.olusturma)}</td><td>{musteri.siparisSayisi}</td><td><strong>{para(musteri.toplamHarcama)}</strong></td><td>{musteri.puan.toLocaleString("tr-TR")}</td><td>{tarihSaat(musteri.son_siparis)}</td></tr>)}</tbody></table></div></Panel>
            </>}

            {bolum === "personel-kayitlari" && <>
              <BolumBaslik baslik="Personel performansı" aciklama="Vardiya sürelerini ve mutfakta tamamlanan sipariş performansını tarih aralığına göre karşılaştırın." />
              <KayitFiltreleri tur="personel" filtre={kayitFiltre} setFiltre={setKayitFiltre} personeller={personeller} />
              <div className="performans-grid">{personelKayitlari.performans.map((p) => <article key={p.id}><div className="personel-avatar">{p.ad?.[0]}{p.soyad?.[0]}</div><div><span>{p.rol}</span><h3>{p.ad} {p.soyad}</h3></div><strong>{p.hazirlananSiparis}</strong><small>hazırlanan sipariş</small><b>{p.ortalamaDakika == null ? "—" : `${p.ortalamaDakika} dk ort.`}</b></article>)}</div>
              <Panel baslik="Vardiya hareketleri" alt={`${personelKayitlari.vardiyalar.length} kayıt`}><div className="admin-tablo-sarici"><table className="admin-tablo kayit-tablosu"><thead><tr><th>Personel</th><th>Rol</th><th>Giriş</th><th>Çıkış</th><th>Çalışma</th><th>Durum</th></tr></thead><tbody>{personelKayitlari.vardiyalar.map((v) => <tr key={v.id}><td><b>{v.ad} {v.soyad}</b></td><td>{v.rol}</td><td>{tarihSaat(v.giris)}</td><td>{v.cikis ? tarihSaat(v.cikis) : "—"}</td><td><strong>{v.calismaSaati.toFixed(2)} saat</strong></td><td><span className={`vardiya-rozet ${v.cikis ? "kapali" : "acik"}`}>{v.cikis ? "Tamamlandı" : "Vardiyada"}</span></td></tr>)}</tbody></table></div></Panel>
            </>}

            {bolum === "revizyonlar" && <>
              <BolumBaslik baslik="Revizyon günlüğü" aciklama="Yönetim panelindeki ekleme, düzenleme, durum değiştirme ve arşivleme işlemleri geriye dönük izlenir." />
              <KayitFiltreleri tur="revizyon" filtre={kayitFiltre} setFiltre={setKayitFiltre} />
              <div className="revizyon-zaman-cizgisi">{revizyonlar.length ? revizyonlar.map((kayit) => <article key={kayit.id}><i className={`revizyon-ikon ${kayit.islem}`}>{kayit.islem === "arsivleme" ? "×" : kayit.islem === "ekleme" ? "+" : "↺"}</i><div className="revizyon-icerik"><header><div><span>{kayit.varlik_turu}</span><h3>{kayit.aciklama}</h3></div><time>{tarihSaat(kayit.olusturma)}</time></header><p>{kayit.yapan_ad} tarafından gerçekleştirildi.</p>{(kayit.eski_deger || kayit.yeni_deger) && <details><summary>Değişiklik ayrıntısı</summary><div>{kayit.eski_deger && <pre>{JSON.stringify(kayit.eski_deger, null, 2)}</pre>}{kayit.yeni_deger && <pre>{JSON.stringify(kayit.yeni_deger, null, 2)}</pre>}</div></details>}</div></article>) : <Bos yazi="Filtreye uygun revizyon kaydı bulunamadı." />}</div>
            </>}

            {bolum === "personel" && <>
              <BolumBaslik baslik="Ekip ve vardiyalar" aciklama="Giriş–çıkış saatleri, çalışma süresi ve tahmini ücret takibi." buton="+ Personel ekle" onClick={() => setPersonelForm({ ...BOS_PERSONEL })} />
              <div className="admin-personel-grid">{personeller.map((p) => (
                <article className="admin-personel" key={p.id}><div className="personel-avatar">{p.ad[0]}{p.soyad[0]}</div><div className="personel-bilgi"><h3>{p.ad} {p.soyad}</h3><span>{p.rol}</span><small>{p.acik_vardiya_id ? `Giriş: ${tarihSaat(p.vardiya_giris)}` : "Vardiyada değil"}</small></div><div className="personel-saat"><b>{p.aylik_saat.toFixed(1)} sa</b><small>{para(p.aylik_saat * p.saatlik_ucret)}</small></div>{p.sifre_degistirmeli && p.sifre_gecici_metin && <GeciciSifre deger={p.sifre_gecici_metin} />}<button className={p.acik_vardiya_id ? "vardiya-cikis" : "vardiya-giris"} onClick={() => islem(() => adminIstek(`/personeller/${p.id}/vardiya`, jsonGonder("POST", { islem: p.acik_vardiya_id ? "cikis" : "giris" })), p.acik_vardiya_id ? "Çıkış kaydedildi." : "Giriş kaydedildi.")}>{p.acik_vardiya_id ? "Çıkış yap" : "Giriş yap"}</button><div className="personel-kart-islemleri"><button onClick={() => setPersonelForm({ id: p.id, ad: p.ad, soyad: p.soyad, rol: p.rol, email: p.email || "", telefon: p.telefon || "", saatlikUcret: p.saatlik_ucret, sifre: "" })}>Düzenle</button><button className="tehlike" onClick={() => { if (window.confirm(`${p.ad} ${p.soyad} ekipten çıkarılsın mı? Açık vardiyası kapatılır ve personel girişi devre dışı kalır.`)) islem(() => adminIstek(`/personeller/${p.id}`, { method: "DELETE" }), "Personel güvenli biçimde arşivlendi."); }}>Sil</button></div></article>
              ))}</div>
            </>}

            {bolum === "raporlar" && <>
              <BolumBaslik baslik="Satış analizi" aciklama="Son 30 günün ürün, adet ve ciro performansı." />
              <section className="admin-metrikler rapor-metrik">
                <Metrik ad="30 günlük ciro" deger={para(toplamCiro)} alt={`${toplamUrun} ürün`} renk="turuncu" trend={ciroTrend} spark={ciroSpark} />
                <Metrik ad="Günlük ortalama" deger={para(toplamCiro / Math.max(1, rapor.gunluk.length))} alt={`${rapor.gunluk.length} aktif satış günü`} renk="mavi" trend={ciroTrend} spark={ciroSpark} />
                <Metrik ad="Ortalama sepet tutarı" deger={para(ortalamaSepet)} alt={`${siparisSayisi} sipariş`} renk="kirmizi" trend={sepetTrend} spark={sepetSpark} />
                <Metrik ad="Satılan ürün" deger={toplamUrun} alt={`${rapor.urunler.length} farklı ürün`} renk="yesil" trend={urunTrend} spark={urunSpark} />
                <Metrik ad="Yoğun saat" deger={yogunSaat.saat == null ? "—" : `${String(yogunSaat.saat).padStart(2, "0")}:00`} alt={`${yogunSaat.adet} ürün satıldı`} renk="mor" />
              </section>
              <Panel baslik="Ciro ve sipariş trendi" alt="Son 30 gün"><SatisCizgiGrafigi veriler={rapor.gunluk} /></Panel>
              <section className="admin-grid-2">
                <Panel baslik="Ürün talep sıralaması" alt="Kaç adet satıldı?"><UrunAdetGrafigi veriler={rapor.urunler} /></Panel>
                <Panel baslik="Günün yoğun saatleri" alt="Ürün adedi"><MiniCizgiGrafigi veriler={saatleriDoldur(rapor.saatlik || [])} deger="adet" etiket={(s) => `${String(s.saat).padStart(2, "0")}:00`} renk="mavi" /></Panel>
              </section>
              <section className="admin-grid-2">
                <Panel baslik="Kategori payları" alt="Ürün adedi"><KategoriDagilimi veriler={rapor.kategoriler || []} toplam={toplamUrun} detayli /></Panel>
                <Panel baslik="Haftanın satış ritmi" alt="Ürün adedi"><MiniCizgiGrafigi veriler={haftayiDoldur(rapor.haftalik || [])} deger="adet" etiket={(g) => haftaAdi(g.gun)} renk="mor" /></Panel>
              </section>
              <Panel baslik="Ürün performansı" alt={`${rapor.urunler.length} ürün`}><div className="admin-tablo-sarici"><table className="admin-tablo"><thead><tr><th>Ürün</th><th>Satılan</th><th>Ciro</th><th>Pay</th></tr></thead><tbody>{rapor.urunler.map((u) => <tr key={u.urun_ad}><td><b>{u.urun_ad}</b></td><td>{u.adet}</td><td><strong>{para(u.ciro)}</strong></td><td>%{toplamCiro ? ((u.ciro / toplamCiro) * 100).toFixed(1) : 0}</td></tr>)}</tbody></table></div></Panel>
            </>}
          </div>
        )}
      </main>

      {urunForm && (
        <Modal baslik={urunForm.id ? "Ürünü düzenle" : "Yeni ürün"} aciklama="Ürün bilgileri, fiyatlandırma ve porsiyon seçenekleri" sinif="admin-modal--urun" kapat={() => setUrunForm(null)}>
          <form className="admin-form urun-duzenleme-form" onSubmit={urunKaydet}>
            <div className="urun-form-onizleme">
              <span className="urun-form-gorsel">{urunForm.gorsel ? <img src={urunForm.gorsel} alt="Ürün önizleme" /> : <b>BP</b>}</span>
              <div><small>{urunForm.kategori || "KATEGORİ"}</small><h3>{urunForm.ad || "Yeni ürün"}</h3><p>{para(urunForm.fiyat)}{urunForm.gramajOpsiyonu?.goster ? ` · ${urunForm.temelMiktar || "—"} ${urunForm.gramajOpsiyonu?.birim || "gr"}` : ""}</p></div>
              <i>{urunForm.id ? "DÜZENLENİYOR" : "YENİ KAYIT"}</i>
            </div>
            <Ikili>
              <Alan etiket="Ürün adı"><input required maxLength="120" value={urunForm.ad} onChange={(e) => setUrunForm({ ...urunForm, ad: e.target.value })} /></Alan>
              <Alan etiket="Kategori"><select value={urunForm.kategori} onChange={(e) => urunKategorisiDegistir(e.target.value)}>{kategoriler.map((kategori) => <option key={kategori.id} value={kategori.ad}>{kategori.ad}</option>)}</select></Alan>
            </Ikili>
            <Ikili>
              <Alan etiket="Başlangıç fiyatı (₺)"><input required type="number" min="0" max="100000" step="0.01" value={urunForm.fiyat} onChange={(e) => setUrunForm({ ...urunForm, fiyat: e.target.value })} /></Alan>
              <Alan etiket="Gösterim sırası"><input required type="number" min="0" max="9999" step="1" value={urunForm.sira} onChange={(e) => setUrunForm({ ...urunForm, sira: e.target.value })} /><small>Küçük sayı önce görünür. Örn. 10, 20, 30.</small></Alan>
            </Ikili>

            <section className={`urun-vitrin-kart ${urunForm.populer ? "aktif" : ""}`}>
              <header>
                <div><b>Popüler ürün vitrini</b><small>Açıksa müşteri ana sayfasında bu kategorinin popüler ürünleri arasında gösterilir.</small></div>
                <label className="admin-switch"><input type="checkbox" checked={urunForm.populer === true} onChange={(e) => setUrunForm({ ...urunForm, populer: e.target.checked })} /><span /></label>
              </header>
            </section>

            <section className={`urun-stok-karti ${urunForm.stokTakibi ? "aktif" : ""}`}>
              <header>
                <div><b>Paketli ürün stok takibi</b><small>Kola, su ve ayran gibi adetle sayılan hazır ürünlerde kullanın.</small></div>
                <label className="admin-switch"><input type="checkbox" checked={urunForm.stokTakibi === true} onChange={(e) => setUrunForm({ ...urunForm, stokTakibi: e.target.checked, stokAdedi: e.target.checked ? urunForm.stokAdedi : 0 })} /><span /></label>
              </header>
              {urunForm.stokTakibi && <Alan etiket="Mevcut stok (adet)"><input required type="number" min="0" max="1000000" step="1" value={urunForm.stokAdedi} onChange={(e) => setUrunForm({ ...urunForm, stokAdedi: e.target.value })} /></Alan>}
            </section>

            <section className={`ekstra-malzeme-editoru ${urunForm.ekstraMalzemeAyari?.aktif ? "aktif" : ""}`}>
              <header>
                <div><b>Ekstra malzeme seçenekleri</b><small>Bu ürün için müşterinin ücretli veya ücretsiz ek malzeme seçmesini açıp kapat.</small></div>
                <label className="admin-switch"><input type="checkbox" checked={urunForm.ekstraMalzemeAyari?.aktif === true} onChange={(e) => ekstraAyarGuncelle("aktif", e.target.checked)} /><span /></label>
              </header>
              {urunForm.ekstraMalzemeAyari?.aktif && <div className="ekstra-malzeme-alanlari">
                <div className="ekstra-malzeme-kurallari">
                  <Alan etiket="Müşteriye görünen başlık"><input required maxLength="80" value={urunForm.ekstraMalzemeAyari.baslik} onChange={(e) => ekstraAyarGuncelle("baslik", e.target.value)} /></Alan>
                  <Alan etiket="Minimum seçim"><input required type="number" min="0" max="10" value={urunForm.ekstraMalzemeAyari.minSecim} onChange={(e) => ekstraAyarGuncelle("minSecim", e.target.value)} /></Alan>
                  <Alan etiket="Maksimum seçim"><input required type="number" min="1" max="10" value={urunForm.ekstraMalzemeAyari.maxSecim} onChange={(e) => ekstraAyarGuncelle("maxSecim", e.target.value)} /></Alan>
                </div>
                <div className="ekstra-malzeme-liste-baslik"><span>Malzeme</span><span>Ek fiyat</span><span>Satışta</span><i /></div>
                <div className="ekstra-malzeme-editor-listesi">
                  {(urunForm.ekstraMalzemeAyari.secenekler || []).map((secenek, index) => <div className="ekstra-malzeme-editor-satir" key={secenek.id}>
                    <input required maxLength="80" value={secenek.ad} onChange={(e) => ekstraSecenekGuncelle(index, "ad", e.target.value)} placeholder="Örn. Cheddar peyniri" />
                    <input required type="number" min="0" max="100000" step="0.01" value={secenek.fiyat} onChange={(e) => ekstraSecenekGuncelle(index, "fiyat", e.target.value)} placeholder="₺0,00" />
                    <label className="ekstra-aktif-secim"><input type="checkbox" checked={secenek.aktif !== false} onChange={(e) => ekstraSecenekGuncelle(index, "aktif", e.target.checked)} /><span>✓</span></label>
                    <button type="button" onClick={() => ekstraSecenekSil(index)} aria-label={`${secenek.ad || "Malzeme"} seçeneğini sil`}>×</button>
                  </div>)}
                </div>
                <button className="ekstra-malzeme-ekle" type="button" onClick={ekstraSecenekEkle} disabled={(urunForm.ekstraMalzemeAyari.secenekler || []).length >= 30}>+ Malzeme ekle</button>
                <p>Müşteri en az {urunForm.ekstraMalzemeAyari.minSecim || 0}, en fazla {urunForm.ekstraMalzemeAyari.maxSecim || 1} seçenek seçebilir. Fiyat sipariş sırasında sunucuda doğrulanır.</p>
              </div>}
            </section>

            <section className="urun-oneri-editoru">
              <header><div><b>Bu ürünle önerilecekler</b><small>Sepette ve ürün detayında gösterilir. En fazla 5 aktif ürün seçebilirsin.</small></div><strong>{urunForm.onerilenUrunler?.length || 0}/5</strong></header>
              <input className="oneri-arama" type="search" value={oneriArama} onChange={(e) => setOneriArama(e.target.value.slice(0, 80))} placeholder="Ürün ara…" aria-label="Önerilecek ürün ara" />
              <div className="oneri-secim-listesi">{filtreliOneriUrunleri.map((urun) => {
                const secili = (urunForm.onerilenUrunler || []).includes(urun.id);
                const devreDisi = !secili && (urunForm.onerilenUrunler || []).length >= 5;
                return <label className={`oneri-secim-karti ${secili ? "secili" : ""} ${devreDisi ? "devre-disi" : ""}`} key={urun.id}>
                  <input type="checkbox" checked={secili} disabled={devreDisi} onChange={() => onerilenUrunuDegistir(urun.id)} />
                  {urun.gorsel ? <img src={urun.gorsel} alt="" /> : <span className="oneri-secim-gorselsiz">BP</span>}
                  <span><b>{urun.ad}</b><small>{para(urun.fiyat)}</small></span><i>✓</i>
                </label>;
              })}</div>
              {onerilebilecekUrunler.length > 0 && !filtreliOneriUrunleri.length && <p>Aramana uygun ürün bulunamadı.</p>}
              {!onerilebilecekUrunler.length && <p>Öneri eklemek için önce başka bir aktif ürün oluşturmalısın.</p>}
            </section>

            {urunForm.urunTipi === "burger" && <section className={`gramaj-kural-kart ${urunForm.gramajOpsiyonu?.goster ? "aktif" : ""}`}>
              <header>
                <div><b>Miktar / gramaj bilgisini göster</b><small>Kapalıysa müşteri ürünün gramajını veya miktarını hiçbir yerde görmez.</small></div>
                <label className="admin-switch"><input type="checkbox" checked={urunForm.gramajOpsiyonu?.goster === true} onChange={(e) => setUrunForm((onceki) => ({ ...onceki, gramajOpsiyonu: { ...onceki.gramajOpsiyonu, goster: e.target.checked, aktif: e.target.checked ? onceki.gramajOpsiyonu.aktif : false } }))} /><span /></label>
              </header>
              {urunForm.gramajOpsiyonu?.goster && (
                <div className="gramaj-kural-alanlari">
                  <Ikili>
                    <Alan etiket="Müşteriye görünen başlık"><input required maxLength="80" value={urunForm.gramajOpsiyonu.etiket} onChange={(e) => gramajGuncelle("etiket", e.target.value)} placeholder="Örn. Porsiyon miktarı" /></Alan>
                    <Alan etiket="Birim"><select value={urunForm.gramajOpsiyonu.birim} onChange={(e) => gramajGuncelle("birim", e.target.value)}><option value="gr">gr</option><option value="ml">ml</option><option value="adet">adet</option></select></Alan>
                  </Ikili>
                  <Alan etiket="Standart miktar"><input required type="number" min="1" max="10000" step="1" value={urunForm.temelMiktar} onChange={(e) => setUrunForm({ ...urunForm, temelMiktar: e.target.value })} /></Alan>
                  <div className="gramaj-alt-switch"><div><b>Müşteri miktarı artırabilsin</b><small>Kapalıysa miktar yalnızca bilgi olarak gösterilir.</small></div><label className="admin-switch"><input type="checkbox" checked={urunForm.gramajOpsiyonu?.aktif === true} onChange={(e) => gramajGuncelle("aktif", e.target.checked)} /><span /></label></div>
                  {urunForm.gramajOpsiyonu?.aktif && <div className="gramaj-uc-alan">
                    <Alan etiket="Her artışta miktar"><input required type="number" min="1" max="10000" step="1" value={urunForm.gramajOpsiyonu.artisMiktari} onChange={(e) => gramajGuncelle("artisMiktari", e.target.value)} /></Alan>
                    <Alan etiket="Maksimum artış"><input required type="number" min="1" max="20" step="1" value={urunForm.gramajOpsiyonu.maxAdim} onChange={(e) => gramajGuncelle("maxAdim", e.target.value)} /></Alan>
                    <Alan etiket="Artış fiyatı (₺)"><input required type="number" min="0" max="100000" step="0.01" value={urunForm.gramajOpsiyonu.fiyatArtisi} onChange={(e) => gramajGuncelle("fiyatArtisi", e.target.value)} /></Alan>
                  </div>
                  }
                  {urunForm.gramajOpsiyonu?.aktif && <p className="gramaj-onizleme">Örnek: Standart {urunForm.temelMiktar || "—"} {urunForm.gramajOpsiyonu.birim} → ilk artış +{urunForm.gramajOpsiyonu.artisMiktari || "—"} {urunForm.gramajOpsiyonu.birim}, fiyat +{para(urunForm.gramajOpsiyonu.fiyatArtisi)}</p>}
                </div>
              )}
            </section>}

            {["yan_lezzet", "icecek"].includes(urunForm.urunTipi) && (
              <section className={`boyut-editoru ${urunForm.boyutSecenekleri.length ? "aktif" : ""}`}>
                <header>
                  <div><b>Boyut seçenekleri</b><small>İsteğe bağlıdır — kapalıysa ürün tek/standart fiyatla satılır.</small></div>
                  <label className="admin-switch"><input type="checkbox" checked={urunForm.boyutSecenekleri.length > 0} onChange={(e) => boyutlandirmaDegistir(e.target.checked)} /><span /></label>
                </header>
                {urunForm.boyutSecenekleri.length > 0 && (
                  <>
                    <div className="boyut-editor-baslik"><span>Varsayılan</span><span>Boyut</span><span>Miktar</span><span>Birim</span><span>Fiyat farkı</span></div>
                    {urunForm.boyutSecenekleri.map((boyut, index) => (
                      <div className="boyut-editor-satir" key={boyut.kod}>
                        <input type="radio" name="varsayilan-boyut" checked={boyut.varsayilan === true} onChange={() => boyutGuncelle(index, "varsayilan", true)} aria-label={`${boyut.etiket} varsayılan`} />
                        <input required maxLength="40" value={boyut.etiket} onChange={(e) => boyutGuncelle(index, "etiket", e.target.value)} />
                        <input required type="number" min="1" max="10000" value={boyut.miktar} onChange={(e) => boyutGuncelle(index, "miktar", e.target.value)} />
                        <select value={boyut.birim} onChange={(e) => boyutGuncelle(index, "birim", e.target.value)}><option value="gr">gr</option><option value="ml">ml</option><option value="adet">adet</option></select>
                        <input required type="number" min="0" max="100000" step="0.01" value={boyut.fiyatFarki} onChange={(e) => boyutGuncelle(index, "fiyatFarki", e.target.value)} />
                      </div>
                    ))}
                  </>
                )}
              </section>
            )}

            {urunForm.urunTipi === "menu" && (
              <section className="menu-editoru">
                <header><b>Menü içeriği</b><small>Önce burger, yan lezzet ve içecek ürünlerini eklemelisin.</small></header>
                <Alan etiket="Menü burgeri"><select required value={urunForm.menuYapisi.burgerUrunId} onChange={(e) => setUrunForm({ ...urunForm, menuYapisi: { ...urunForm.menuYapisi, burgerUrunId: e.target.value } })}><option value="">Burger seç</option>{burgerUrunleri.map((urun) => <option key={urun.id} value={urun.id}>{urun.ad}</option>)}</select></Alan>
                <Ikili>
                  <Alan etiket="Yan lezzet"><select required value={urunForm.menuYapisi.yanLezzetUrunId} onChange={(e) => { const urun = yanLezzetUrunleri.find((aday) => String(aday.id) === e.target.value); setUrunForm({ ...urunForm, menuYapisi: { ...urunForm.menuYapisi, yanLezzetUrunId: e.target.value, varsayilanYanBoyut: urun?.boyutSecenekleri?.find((boyut) => boyut.varsayilan)?.kod || urun?.boyutSecenekleri?.[0]?.kod || "" } }); }}><option value="">Yan lezzet seç</option>{yanLezzetUrunleri.map((urun) => <option key={urun.id} value={urun.id}>{urun.ad}</option>)}</select></Alan>
                  <Alan etiket="Başlangıç boyutu"><select required value={urunForm.menuYapisi.varsayilanYanBoyut} onChange={(e) => setUrunForm({ ...urunForm, menuYapisi: { ...urunForm.menuYapisi, varsayilanYanBoyut: e.target.value } })}><option value="">Boyut seç</option>{(yanLezzetUrunleri.find((urun) => String(urun.id) === String(urunForm.menuYapisi.yanLezzetUrunId))?.boyutSecenekleri || []).map((boyut) => <option key={boyut.kod} value={boyut.kod}>{boyut.etiket} · {boyut.miktar} {boyut.birim}</option>)}</select></Alan>
                </Ikili>
                <Ikili>
                  <Alan etiket="İçecek"><select required value={urunForm.menuYapisi.icecekUrunId} onChange={(e) => { const urun = icecekUrunleri.find((aday) => String(aday.id) === e.target.value); setUrunForm({ ...urunForm, menuYapisi: { ...urunForm.menuYapisi, icecekUrunId: e.target.value, varsayilanIcecekBoyut: urun?.boyutSecenekleri?.find((boyut) => boyut.varsayilan)?.kod || urun?.boyutSecenekleri?.[0]?.kod || "" } }); }}><option value="">İçecek seç</option>{icecekUrunleri.map((urun) => <option key={urun.id} value={urun.id}>{urun.ad}</option>)}</select></Alan>
                  <Alan etiket="Başlangıç boyutu"><select required value={urunForm.menuYapisi.varsayilanIcecekBoyut} onChange={(e) => setUrunForm({ ...urunForm, menuYapisi: { ...urunForm.menuYapisi, varsayilanIcecekBoyut: e.target.value } })}><option value="">Boyut seç</option>{(icecekUrunleri.find((urun) => String(urun.id) === String(urunForm.menuYapisi.icecekUrunId))?.boyutSecenekleri || []).map((boyut) => <option key={boyut.kod} value={boyut.kod}>{boyut.etiket} · {boyut.miktar} {boyut.birim}</option>)}</select></Alan>
                </Ikili>
                <p>Menünün “İçindekiler” alanında seçilen burgerin malzemeleri gösterilir. Boyut büyütmelerinin fiyatı ilgili yan lezzet ve içecekten alınır.</p>
              </section>
            )}

            <Alan etiket="Ürün görseli (en fazla 5 MB)"><label className={`gorsel-yukleme ${gorselYukleniyor ? "yukleniyor" : ""}`}><input required={!urunForm.gorsel} type="file" accept="image/*" onChange={(e) => urunGorseliSec(e.target.files?.[0])} /><span>{gorselYukleniyor ? "Görsel yükleniyor…" : urunForm.gorsel ? "Görseli değiştir" : "Bilgisayardan görsel seç"}</span><small>{urunForm.gorsel ? "Görsel güvenli depolamaya yüklendi." : "PNG, JPG, WebP, GIF, AVIF ve BMP desteklenir."}</small></label></Alan>
            <Alan etiket="Açıklama"><textarea value={urunForm.aciklama || ""} onChange={(e) => setUrunForm({ ...urunForm, aciklama: e.target.value })} /></Alan>
            {urunForm.urunTipi !== "menu" ? <Alan etiket="Malzemeler (virgülle)"><input value={urunForm.malzemeler || ""} onChange={(e) => setUrunForm({ ...urunForm, malzemeler: e.target.value })} /></Alan> : <p className="menu-malzeme-notu">Menü malzemeleri seçilen burgerden otomatik alınır.</p>}
            <Alan etiket="Alerjenler (virgülle)"><input value={urunForm.alerjenler || ""} onChange={(e) => setUrunForm({ ...urunForm, alerjenler: e.target.value })} /></Alan>
            <FormAlt kapat={() => setUrunForm(null)} />
          </form>
        </Modal>
      )}
      {kategoriForm && (
        <Modal baslik={kategoriForm.id ? "Kategoriyi düzenle" : "Yeni kategori"} aciklama="Kategori adı ve görseli müşteri uygulamasındaki yuvarlak menüde kullanılır." sinif="admin-modal--kategori" kapat={() => setKategoriForm(null)}>
          <form className="admin-form kategori-form" onSubmit={kategoriKaydet}>
            <div className="kategori-form-onizleme">
              <span>{kategoriForm.gorsel ? <img src={kategoriForm.gorsel} alt="Kategori önizleme" /> : <b>{kategoriForm.ad?.charAt(0) || "+"}</b>}</span>
              <div><small>UYGULAMA ÖNİZLEMESİ</small><strong>{kategoriForm.ad || "Kategori adı"}</strong><p>Ana sayfadaki kategori satırında bu şekilde görünür.</p></div>
            </div>
            <Alan etiket="Kategori adı"><input required minLength="2" maxLength="60" value={kategoriForm.ad} onChange={(e) => setKategoriForm({ ...kategoriForm, ad: e.target.value })} placeholder="Örn. Tatlılar" /></Alan>
            <Alan etiket="Kategori görseli (en fazla 5 MB)"><label className={`gorsel-yukleme ${gorselYukleniyor ? "yukleniyor" : ""}`}><input required={!kategoriForm.gorsel} type="file" accept="image/*" onChange={(e) => kategoriGorseliSec(e.target.files?.[0])} /><span>{gorselYukleniyor ? "Görsel yükleniyor…" : kategoriForm.gorsel ? "Görseli değiştir" : "Bilgisayardan görsel seç"}</span><small>{kategoriForm.gorsel ? "Görsel güvenli depolamaya yüklendi." : "PNG, JPG, WebP, GIF, AVIF ve BMP desteklenir."}</small></label></Alan>
            <Alan etiket="Menü sırası"><input required type="number" min="0" max="999" step="1" value={kategoriForm.sira} onChange={(e) => setKategoriForm({ ...kategoriForm, sira: e.target.value })} /></Alan>
            <FormAlt kapat={() => setKategoriForm(null)} />
          </form>
        </Modal>
      )}
      {kampanyaForm && (
        <Modal baslik={kampanyaForm.id ? "Kampanyayı düzenle" : "Yeni kampanya"} aciklama="Kaydettiğiniz değişiklikler müşteri uygulamasına anında yansır." sinif="admin-modal--yonetim" kapat={() => setKampanyaForm(null)}>
          <form className="admin-form" onSubmit={kampanyaKaydet}>
            <section className="kampanya-ikon-editoru">
              <header><div><span>{kampanyaIkonu(kampanyaForm)}</span><div><b>Kampanya ikonu</b><small>Müşteri uygulamasındaki kampanya etiketinin yanında görünür.</small></div></div><input aria-label="Özel kampanya emojisi" maxLength="16" value={kampanyaForm.ikon || ""} onChange={(e) => setKampanyaForm({ ...kampanyaForm, ikon: e.target.value })} placeholder="Emoji" /></header>
              <div>{KAMPANYA_IKONLARI.map(([ikon, ad]) => <button type="button" key={ikon} className={kampanyaForm.ikon === ikon ? "secili" : ""} title={ad} aria-label={`${ad} ikonunu seç`} onClick={() => setKampanyaForm({ ...kampanyaForm, ikon })}><span>{ikon}</span><small>{ad}</small></button>)}</div>
            </section>
            <Ikili><Alan etiket="Kısa etiket"><input required maxLength="80" value={kampanyaForm.etiket} onChange={(e) => setKampanyaForm({ ...kampanyaForm, etiket: e.target.value })} placeholder="Örn. HAFTA SONU" /></Alan><Alan etiket="Kampanya başlığı"><input required maxLength="120" value={kampanyaForm.baslik} onChange={(e) => setKampanyaForm({ ...kampanyaForm, baslik: e.target.value })} /></Alan></Ikili>
            <Alan etiket="Açıklama"><textarea required maxLength="600" value={kampanyaForm.aciklama} onChange={(e) => setKampanyaForm({ ...kampanyaForm, aciklama: e.target.value })} /></Alan>
            <Alan etiket="Kampanya görseli (isteğe bağlı, en fazla 5 MB)"><label className={`gorsel-yukleme ${gorselYukleniyor ? "yukleniyor" : ""}`}><input type="file" accept="image/*" onChange={(e) => kampanyaGorseliSec(e.target.files?.[0])} /><span>{gorselYukleniyor ? "Görsel yükleniyor…" : kampanyaForm.gorsel ? "Görseli değiştir" : "Bilgisayardan görsel seç"}</span><small>{kampanyaForm.gorsel ? "Görsel güvenli depolamaya yüklendi." : "PNG, JPG, WebP, GIF, AVIF ve BMP desteklenir."}</small></label></Alan>
            <Ikili><Alan etiket="Kampanya türü"><select value={kampanyaForm.kampanyaTipi} onChange={(e) => setKampanyaForm({ ...kampanyaForm, kampanyaTipi: e.target.value })}><option value="surekli">Sürekli</option><option value="saatli">Saat aralığı</option></select></Alan><Alan etiket="İndirim oranı (%)"><input required type="number" min="0" max="90" step="1" value={kampanyaForm.indirimYuzde} onChange={(e) => setKampanyaForm({ ...kampanyaForm, indirimYuzde: e.target.value })} /></Alan></Ikili>
            {kampanyaForm.kampanyaTipi === "saatli" && <Ikili><Alan etiket="Başlangıç saati"><input required type="number" min="0" max="23" step="1" value={kampanyaForm.baslangicSaat} onChange={(e) => setKampanyaForm({ ...kampanyaForm, baslangicSaat: e.target.value })} /></Alan><Alan etiket="Bitiş saati"><input required type="number" min="1" max="24" step="1" value={kampanyaForm.bitisSaat} onChange={(e) => setKampanyaForm({ ...kampanyaForm, bitisSaat: e.target.value })} /></Alan></Ikili>}
            <fieldset className="kampanya-kategori-secimi"><legend>İndirimin geçerli olduğu kategoriler</legend><p>İndirim oranı sıfırdan büyükse en az bir kategori seçin.</p><div>{kategoriler.filter((kategori) => kategori.aktif !== false).map((kategori) => <label key={kategori.id}><input type="checkbox" checked={(kampanyaForm.gecerliKategoriler || []).includes(kategori.ad)} onChange={() => kampanyaKategoriDegistir(kategori.ad)} /><span>{kategori.ad}</span></label>)}</div></fieldset>
            <Ikili><Alan etiket="Buton metni"><input required maxLength="60" value={kampanyaForm.buton} onChange={(e) => setKampanyaForm({ ...kampanyaForm, buton: e.target.value })} /></Alan><Alan etiket="Buton görünümü"><select value={kampanyaForm.butonTipi} onChange={(e) => setKampanyaForm({ ...kampanyaForm, butonTipi: e.target.value })}><option value="primary">Turuncu</option><option value="charcoal">Koyu</option></select></Alan></Ikili>
            <Ikili><Alan etiket="Gösterim sırası"><input required type="number" min="0" max="999" step="1" value={kampanyaForm.sira} onChange={(e) => setKampanyaForm({ ...kampanyaForm, sira: e.target.value })} /></Alan><label className="yonetim-aktiflik"><input type="checkbox" checked={kampanyaForm.aktif === true} onChange={(e) => setKampanyaForm({ ...kampanyaForm, aktif: e.target.checked })} /><span>Uygulamada yayınla</span></label></Ikili>
            <FormAlt kapat={() => setKampanyaForm(null)} />
          </form>
        </Modal>
      )}
      {odulForm && (
        <Modal baslik={odulForm.id ? "Ödülü düzenle" : "Yeni puan ödülü"} aciklama="Ödül, seçilen gerçek menü ürünüyle eşleşir; fiyat ve sipariş güvenliği backend tarafından korunur." sinif="admin-modal--yonetim" kapat={() => setOdulForm(null)}>
          <form className="admin-form" onSubmit={odulKaydet}>
            <Alan etiket="Markette görünen ad"><input required maxLength="120" value={odulForm.ad} onChange={(e) => setOdulForm({ ...odulForm, ad: e.target.value })} placeholder="Örn. Seçili Burger" /></Alan>
            <Ikili><Alan etiket="Gerekli puan"><input required type="number" min="1" max="1000000" step="1" value={odulForm.puan} onChange={(e) => setOdulForm({ ...odulForm, puan: e.target.value })} /></Alan><Alan etiket="Verilecek ürün"><select required value={odulForm.urunId} onChange={(e) => setOdulForm({ ...odulForm, urunId: e.target.value })}>{urunler.map((urun) => <option key={urun.id} value={urun.id}>{urun.ad}{!urun.aktif ? " (pasif ürün)" : ""}</option>)}</select></Alan></Ikili>
            {Number(odulForm.kazanilmaSayisi) > 0 && <p className="yonetim-uyari">Bu ödül daha önce {odulForm.kazanilmaSayisi} kez kazanılmış. Geçmiş siparişleri korumak için bağlı ürünü değiştirmek isterseniz yeni ödül oluşturun.</p>}
            <Alan etiket="Ödül görseli (isteğe bağlı, en fazla 5 MB)"><label className={`gorsel-yukleme ${gorselYukleniyor ? "yukleniyor" : ""}`}><input type="file" accept="image/*" onChange={(e) => odulGorseliSec(e.target.files?.[0])} /><span>{gorselYukleniyor ? "Görsel yükleniyor…" : odulForm.gorsel ? "Görseli değiştir" : "Bilgisayardan görsel seç"}</span><small>{odulForm.gorsel ? "Görsel güvenli depolamaya yüklendi." : "Görsel seçmezsen bağlı ürünün görseli kullanılır."}</small></label></Alan>
            <label className="yonetim-aktiflik"><input type="checkbox" checked={odulForm.aktif === true} onChange={(e) => setOdulForm({ ...odulForm, aktif: e.target.checked })} /><span>Puan marketinde yayınla</span></label>
            <FormAlt kapat={() => setOdulForm(null)} />
          </form>
        </Modal>
      )}
      {personelForm && <Modal baslik={personelForm.id ? "Personeli düzenle" : "Personel ekle"} kapat={() => setPersonelForm(null)}><form className="admin-form" onSubmit={personelKaydet}><Ikili><Alan etiket="Ad"><input required value={personelForm.ad} onChange={(e) => setPersonelForm({ ...personelForm, ad: e.target.value })} /></Alan><Alan etiket="Soyad"><input required value={personelForm.soyad} onChange={(e) => setPersonelForm({ ...personelForm, soyad: e.target.value })} /></Alan></Ikili><Ikili><Alan etiket="Rol"><select value={personelForm.rol} onChange={(e) => setPersonelForm({ ...personelForm, rol: e.target.value })}><option>Mutfak</option><option>Salon</option><option>Kasiyer</option><option>Yönetici</option></select></Alan><Alan etiket="Saatlik ücret"><input type="number" value={personelForm.saatlikUcret} onChange={(e) => setPersonelForm({ ...personelForm, saatlikUcret: e.target.value })} /></Alan></Ikili><Ikili><Alan etiket="E-posta"><input required type="email" value={personelForm.email} onChange={(e) => setPersonelForm({ ...personelForm, email: e.target.value })} /></Alan><Alan etiket="Telefon"><input value={personelForm.telefon} onChange={(e) => setPersonelForm({ ...personelForm, telefon: e.target.value })} /></Alan></Ikili><Alan etiket={personelForm.id ? "Yeni şifre (değişmeyecekse boş bırak)" : "Giriş şifresi"}><input required={!personelForm.id} minLength="8" maxLength="72" type="password" autoComplete="new-password" value={personelForm.sifre || ""} onChange={(e) => setPersonelForm({ ...personelForm, sifre: e.target.value })} /></Alan><FormAlt kapat={() => setPersonelForm(null)} /></form></Modal>}
      {duyuruForm && <Modal baslik="Yeni duyuru" kapat={() => setDuyuruForm(null)}><form className="admin-form" onSubmit={duyuruKaydet}><Alan etiket="Duyuru başlığı"><input required maxLength="100" value={duyuruForm.baslik} onChange={(e) => setDuyuruForm({ ...duyuruForm, baslik: e.target.value })} placeholder="Örn. Yeni menümüz yayında" /></Alan><Alan etiket="Mesaj"><textarea required maxLength="600" value={duyuruForm.mesaj} onChange={(e) => setDuyuruForm({ ...duyuruForm, mesaj: e.target.value })} placeholder="Müşterilerin bildirim panelinde göreceği açıklama" /></Alan><Alan etiket="Tıklandığında açılacak sayfa"><select value={duyuruForm.hedef} onChange={(e) => setDuyuruForm({ ...duyuruForm, hedef: e.target.value })}><option value="/anasayfa">Ana sayfa</option><option value="/kampanyalar">Kampanyalar</option><option value="/hediyelerim">Hediyelerim</option></select></Alan><FormAlt kapat={() => setDuyuruForm(null)} /></form></Modal>}
    </div>
  );
}

function yuzdeDegisim(simdi, once) { return once > 0 ? ((simdi - once) / once) * 100 : null; }

// Personel kendi şifresini belirleyene kadar (sifre_degistirmeli), yönetici
// oluşturma/düzenleme sırasında tek seferlik gösterilen şifreyi kaçırmışsa
// burada tekrar görüp kopyalayabilir.
function GeciciSifre({ deger }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  return (
    <div className="personel-gecici-sifre">
      <small>GEÇİCİ ŞİFRE</small>
      <code>{deger}</code>
      <button type="button" onClick={() => navigator.clipboard.writeText(deger).then(() => { setKopyalandi(true); setTimeout(() => setKopyalandi(false), 1500); })}>{kopyalandi ? "Kopyalandı" : "Kopyala"}</button>
    </div>
  );
}

function Metrik({ ad, deger, alt, renk, trend, spark }) {
  return (
    <article className={`admin-metrik ${renk}`}>
      <div className="admin-metrik-ust">
        <span>{ad}</span>
        {trend != null && (
          <b className={`admin-metrik-trend ${trend >= 0 ? "arti" : "eksi"}`}>
            {trend >= 0 ? "▲" : "▼"} %{Math.abs(trend).toFixed(1)}
          </b>
        )}
      </div>
      <strong>{deger}</strong>
      <small>{alt}</small>
      {spark && spark.length > 1 && <MetrikSparkline veriler={spark} />}
    </article>
  );
}

function MetrikSparkline({ veriler }) {
  const w = 100;
  const h = 30;
  const max = Math.max(1, ...veriler);
  const min = Math.min(0, ...veriler);
  const aralik = Math.max(1, max - min);
  const x = (i) => (i / Math.max(1, veriler.length - 1)) * w;
  const y = (v) => h - ((v - min) / aralik) * h;
  const points = veriler.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  return (
    <svg className="admin-metrik-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
}
function Panel({ baslik, alt, children }) { return <section className="admin-panel"><header><h2>{baslik}</h2><span>{alt}</span></header>{children}</section>; }
function Bos({ yazi }) { return <div className="admin-bos">{yazi}</div>; }
function BolumBaslik({ baslik, aciklama, buton, onClick }) { return <div className="admin-bolum-baslik"><div><h2>{baslik}</h2><p>{aciklama}</p></div>{buton && <button onClick={onClick}>{buton}</button>}</div>; }
function SatisCizgiGrafigi({ veriler }) {
  const [secili, setSecili] = useState(null);
  const gunler = sonOtuzGunuDoldur(veriler);
  const ciroMax = Math.max(1, ...gunler.map((g) => g.ciro));
  const adetMax = Math.max(1, ...gunler.map((g) => g.adet));
  const w = 680;
  const h = 236;
  const pad = { sol: 12, sag: 12, ust: 18, alt: 31 };
  const x = (i) => pad.sol + (i / Math.max(1, gunler.length - 1)) * (w - pad.sol - pad.sag);
  const y = (deger, max) => pad.ust + (1 - deger / max) * (h - pad.ust - pad.alt);
  const noktalar = (alan, max) => gunler.map((g, i) => `${x(i)},${y(g[alan], max)}`).join(" ");
  const alan = `M ${x(0)} ${h - pad.alt} L ${gunler.map((g, i) => `${x(i)} ${y(g.ciro, ciroMax)}`).join(" L ")} L ${x(gunler.length - 1)} ${h - pad.alt} Z`;
  const seciliGun = secili == null ? gunler[gunler.length - 1] : gunler[secili];
  const enYuksek = gunler.reduce((en, g) => g.ciro > en.ciro ? g : en, gunler[0]);
  const sonYedi = gunler.slice(-7).reduce((t, g) => t + g.ciro, 0);
  const oncekiYedi = gunler.slice(-14, -7).reduce((t, g) => t + g.ciro, 0);
  const degisim = oncekiYedi ? ((sonYedi - oncekiYedi) / oncekiYedi) * 100 : null;

  if (!veriler.length) return <Bos yazi="Grafik için satış verisi bekleniyor." />;

  return <div className="cizgi-grafik">
    <div className="cizgi-grafik-ust">
      <div className="cizgi-lejant"><span><i className="ciro" />Ciro</span><span><i className="adet" />Ürün adedi</span></div>
      <div className="cizgi-secili"><b>{gunEtiketi(seciliGun.gun)}</b><span>{para(seciliGun.ciro)} · {seciliGun.adet} ürün</span></div>
    </div>
    <div className="cizgi-cizim">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Son 30 gün ciro ve ürün adedi çizgi grafiği">
        <defs>
          <linearGradient id="ciro-alani" x1="0" x2="0" y1="0" y2="1"><stop stopColor="var(--primary)" stopOpacity=".32" /><stop offset="1" stopColor="var(--primary)" stopOpacity="0" /></linearGradient>
        </defs>
        {[0.2, 0.4, 0.6, 0.8].map((oran) => <line key={oran} className="cizgi-grid" x1={pad.sol} x2={w - pad.sag} y1={pad.ust + oran * (h - pad.ust - pad.alt)} y2={pad.ust + oran * (h - pad.ust - pad.alt)} />)}
        <path d={alan} fill="url(#ciro-alani)" />
        <polyline className="cizgi ciro" points={noktalar("ciro", ciroMax)} />
        <polyline className="cizgi adet" points={noktalar("adet", adetMax)} />
        {gunler.map((g, i) => <g key={g.gun} onMouseEnter={() => setSecili(i)} onFocus={() => setSecili(i)} tabIndex={0} role="button" aria-label={`${gunEtiketi(g.gun)}: ${para(g.ciro)}, ${g.adet} ürün`}>
          <line className="cizgi-hedef" x1={x(i) - 8} x2={x(i) + 8} y1={pad.ust} y2={h - pad.alt} />
          <circle className={`cizgi-nokta ${secili === i ? "aktif" : ""}`} cx={x(i)} cy={y(g.ciro, ciroMax)} r={secili === i ? "4.5" : "2.5"} />
        </g>)}
        {gunler.filter((_, i) => i === 0 || i === gunler.length - 1 || i % 7 === 0).map((g, i) => <text className="cizgi-etiket" key={g.gun} x={x(gunler.indexOf(g))} y={h - 8} textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}>{new Date(g.gun).getDate()}</text>)}
      </svg>
    </div>
    <div className="cizgi-ozet">
      <div><span>En yüksek gün</span><b>{para(enYuksek.ciro)}</b><small>{gunEtiketi(enYuksek.gun)}</small></div>
      <div><span>Günlük ortalama</span><b>{para(gunler.reduce((t, g) => t + g.ciro, 0) / gunler.length)}</b><small>30 günlük görünüm</small></div>
      <div><span>Son 7 gün</span><b className={degisim != null && degisim < 0 ? "eksi" : "arti"}>{degisim == null ? "Yeni veri" : `${degisim >= 0 ? "+" : ""}%${degisim.toFixed(1)}`}</b><small>Önceki 7 güne göre</small></div>
    </div>
  </div>;
}

function sonOtuzGunuDoldur(veriler) {
  const kayitlar = new Map(veriler.map((g) => [String(g.gun).slice(0, 10), { ciro: Number(g.ciro || 0), adet: Number(g.adet || 0), siparis: Number(g.siparis || 0) }]));
  return Array.from({ length: 30 }, (_, i) => {
    const tarih = new Date();
    tarih.setHours(12, 0, 0, 0);
    tarih.setDate(tarih.getDate() - (29 - i));
    const gun = tarih.toISOString().slice(0, 10);
    return { gun, ...(kayitlar.get(gun) || { ciro: 0, adet: 0, siparis: 0 }) };
  });
}

function gunEtiketi(gun) { return new Date(`${gun}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }); }

function MiniCizgiGrafigi({ veriler, deger, etiket, renk = "turuncu" }) {
  const [secili, setSecili] = useState(null);
  const doluVeri = veriler.some((v) => Number(v[deger]) > 0);
  if (!doluVeri) return <Bos yazi="Bu görünüm için henüz satış verisi yok." />;
  const w = 540;
  const h = 174;
  const pad = { sol: 10, sag: 10, ust: 12, alt: 28 };
  const max = Math.max(1, ...veriler.map((v) => Number(v[deger] || 0)));
  const x = (i) => pad.sol + (i / Math.max(1, veriler.length - 1)) * (w - pad.sol - pad.sag);
  const y = (n) => pad.ust + (1 - Number(n || 0) / max) * (h - pad.ust - pad.alt);
  const points = veriler.map((v, i) => `${x(i)},${y(v[deger])}`).join(" ");
  const alan = `M ${x(0)} ${h - pad.alt} L ${veriler.map((v, i) => `${x(i)} ${y(v[deger])}`).join(" L ")} L ${x(veriler.length - 1)} ${h - pad.alt} Z`;
  const indeks = secili == null ? veriler.length - 1 : secili;
  const secilen = veriler[indeks];
  const etiketAraligi = Math.max(1, Math.ceil((veriler.length - 1) / 4));

  return <div className={`mini-cizgi mini-cizgi--${renk}`}>
    <div className="mini-cizgi-bilgi"><span>{etiket(secilen)}</span><b>{Number(secilen[deger] || 0).toLocaleString("tr-TR")} ürün</b></div>
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Satış yoğunluğu çizgi grafiği">
      <defs><linearGradient id={`mini-alan-${renk}`} x1="0" x2="0" y1="0" y2="1"><stop stopColor="currentColor" stopOpacity=".25" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
      {[.25, .5, .75].map((oran) => <line key={oran} className="mini-cizgi-grid" x1={pad.sol} x2={w - pad.sag} y1={pad.ust + oran * (h - pad.ust - pad.alt)} y2={pad.ust + oran * (h - pad.ust - pad.alt)} />)}
      <path d={alan} fill={`url(#mini-alan-${renk})`} />
      <polyline className="mini-cizgi-cizgi" points={points} />
      {veriler.map((v, i) => <g key={i} tabIndex={0} role="button" onMouseEnter={() => setSecili(i)} onFocus={() => setSecili(i)} aria-label={`${etiket(v)}: ${v[deger]} ürün`}>
        <line className="mini-cizgi-hedef" x1={x(i)} x2={x(i)} y1={pad.ust} y2={h - pad.alt} />
        <circle className={secili === i ? "aktif" : ""} cx={x(i)} cy={y(v[deger])} r={secili === i ? "4" : "2.25"} />
      </g>)}
      {veriler.map((v, i) => (i === 0 || i === veriler.length - 1 || i % etiketAraligi === 0) && <text className="mini-cizgi-etiket" key={`etiket-${i}`} x={x(i)} y={h - 8} textAnchor={i === 0 ? "start" : i === veriler.length - 1 ? "end" : "middle"}>{etiket(v)}</text>)}
    </svg>
  </div>;
}

function KategoriDagilimi({ veriler, toplam, detayli = false }) {
  if (!veriler.length || !toplam) return <Bos yazi="Kategori dağılımı satışlarla oluşacak." />;
  const renkler = ["turuncu", "mavi", "mor", "yesil", "kirmizi"];
  return <div className={`kategori-dagilim ${detayli ? "detayli" : ""}`}>
    <div className="kategori-yigin">{veriler.map((k, i) => <i key={k.kategori} className={renkler[i % renkler.length]} style={{ width: `${(k.adet / toplam) * 100}%` }} title={`${k.kategori}: ${k.adet} ürün`} />)}</div>
    <div className="kategori-liste">{veriler.map((k, i) => <div key={k.kategori}><span><i className={renkler[i % renkler.length]} />{k.kategori}</span><b>{k.adet} ürün</b>{detayli && <small>{para(k.ciro)} · %{((k.adet / toplam) * 100).toFixed(1)}</small>}</div>)}</div>
  </div>;
}

function UrunAdetGrafigi({ veriler }) {
  const ilkler = veriler.slice(0, 6);
  const max = Math.max(1, ...ilkler.map((u) => Number(u.adet || 0)));
  if (!ilkler.length) return <Bos yazi="Ürün talebi sipariş geldikçe oluşacak." />;
  return <div className="urun-adet-grafik">{ilkler.map((u, i) => <div key={u.urun_ad}><header><span>{i + 1}</span><b>{u.urun_ad}</b><strong>{u.adet} adet</strong></header><div><i style={{ width: `${(u.adet / max) * 100}%` }} /></div></div>)}</div>;
}

function saatleriDoldur(veriler) {
  const kayitlar = new Map(veriler.map((s) => [Number(s.saat), s]));
  return Array.from({ length: 24 }, (_, saat) => kayitlar.get(saat) || { saat, adet: 0, siparis: 0 });
}

function haftayiDoldur(veriler) {
  const kayitlar = new Map(veriler.map((g) => [Number(g.gun), g]));
  return Array.from({ length: 7 }, (_, i) => kayitlar.get(i + 1) || { gun: i + 1, adet: 0, ciro: 0 });
}

function haftaAdi(gun) { return ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][Number(gun) - 1] || "—"; }
function sureMetni(saniye) {
  if (saniye == null || !Number.isFinite(Number(saniye))) return "—";
  const toplam = Math.max(0, Math.round(Number(saniye)));
  const saat = Math.floor(toplam / 3600);
  const dakika = Math.floor((toplam % 3600) / 60);
  const kalanSaniye = toplam % 60;
  if (saat) return `${saat} sa ${dakika} dk ${kalanSaniye} sn`;
  if (dakika) return `${dakika} dk ${kalanSaniye} sn`;
  return `${kalanSaniye} sn`;
}

function SatisKartlari({ satislar, gecmis = false }) {
  return <div className={`canli-satis-listesi ${gecmis ? "gecmis-satis-listesi" : ""}`}>
    {satislar.length ? satislar.map((satis, index) => {
      const siparisNo = satis.siparisNo || satis.siparis_no;
      const urunlerListesi = Array.isArray(satis.urunler) ? satis.urunler : [];
      return <article className="canli-satis-karti" key={`${siparisNo}-${index}`}>
        <header><div><span className={gecmis ? "gecmis-nokta" : "canli-nokta"} /> <b>{siparisNo}</b><small>{tarihSaat(satis.olusturma)}</small></div><DurumRozeti durum={satis.durum} /></header>
        <div className="canli-satis-ozet"><strong>{para(satis.tutar)}</strong><span>{satis.kisiAdi || satis.kisi_adi || "Misafir"}</span><span>{String(satis.masaNo || satis.masa_no || "algotur").toLowerCase() === "algotur" ? "Al Götür" : `Masa ${satis.masaNo || satis.masa_no}`}</span></div>
        <div className="canli-urunler">{urunlerListesi.map((urun, sira) => <span key={`${urun.ad}-${sira}`}><b>{urun.ad}</b> x{urun.adet}</span>)}</div>
        {gecmis && <footer className="gecmis-satis-alt"><span>Masa kapatıldı</span><time>{tarihSaat(satis.kapandi_at)}</time></footer>}
      </article>;
    }) : <Bos yazi={gecmis ? "Filtreye uygun geçmiş sipariş bulunamadı." : "Şu anda açık masaya ait canlı satış yok."} />}
  </div>;
}

function MutfakSureAkisi({ kayit }) {
  const adimlar = [
    { ad: "Sipariş alındı", zaman: kayit.siparis_at, bilgi: "Başlangıç" },
    { ad: "Hazırlamaya başladı", zaman: kayit.baslangic_at, bilgi: kayit.beklemeSaniye == null ? "Henüz başlamadı" : `${sureMetni(kayit.beklemeSaniye)} sonra` },
    { ad: "Servise gönderildi", zaman: kayit.hazir_at, bilgi: kayit.hazirlamaSaniye == null ? "Hazırlanıyor" : `${sureMetni(kayit.hazirlamaSaniye)} sürdü` },
  ];
  return <div className="mutfak-sure-akisi">{adimlar.map((adim, index) => <div className={adim.zaman ? "tamam" : "bekliyor"} key={adim.ad}><i>{index + 1}</i><span><b>{adim.ad}</b><small>{adim.zaman ? tarihSaat(adim.zaman) : adim.bilgi}</small>{adim.zaman && index > 0 && <em>{adim.bilgi}</em>}</span></div>)}</div>;
}

function KayitGezgini({ aktif, sayilar, git }) {
  const sekmeler = [
    ["satislar", "Canlı Satış", "Ödemeler", "satislar", "◉"],
    ["gecmis-siparisler", "Geçmiş", "Kapanan masalar", "gecmis-siparisler", "◷"],
    ["mutfak-kayitlari", "Mutfak", "Hazırlama süreleri", "mutfak-kayitlari", "◇"],
    ["musteriler", "Müşteriler", "Hesap ve sadakat", "musteriler", "◎"],
    ["personel-kayitlari", "Personel", "Vardiya ve performans", "personel-kayitlari", "♟"],
    ["revizyonlar", "Revizyon", "Yönetim hareketleri", "revizyon-kayitlari", "↻"],
  ];
  return <section className="kayit-merkezi-gecis">
    <header><div><span>KAYIT MERKEZİ</span><h2>İşletme hareketleri</h2></div><p>Canlı işleyişten geçmiş değişikliklere kadar bütün kayıtları tek noktadan takip edin.</p></header>
    <div>{sekmeler.map(([id, ad, aciklama, yol, ikon]) => <button type="button" className={aktif === id ? "aktif" : ""} key={id} onClick={() => git(`/yonetim/${yol}`)}><i>{ikon}</i><span><b>{ad}</b><small>{aciklama}</small></span><strong>{aktif === id ? Number(sayilar[id] || 0).toLocaleString("tr-TR") : "Aç"}</strong></button>)}</div>
  </section>;
}

function KayitFiltreleri({ tur, filtre, setFiltre, personeller = [] }) {
  const guncelle = (alan, deger) => setFiltre((onceki) => ({ ...onceki, [alan]: deger }));
  const temizle = () => setFiltre({ arama: "", baslangic: "", bitis: "", durum: "", personelId: "", rol: "", varlikTuru: "", islem: "" });
  const tarihDegeri = (tarih) => `${tarih.getFullYear()}-${String(tarih.getMonth() + 1).padStart(2, "0")}-${String(tarih.getDate()).padStart(2, "0")}`;
  const hizliAralik = (gun) => {
    const bitis = new Date();
    const baslangic = new Date();
    baslangic.setDate(bitis.getDate() - Math.max(0, gun - 1));
    setFiltre((onceki) => ({ ...onceki, baslangic: tarihDegeri(baslangic), bitis: tarihDegeri(bitis) }));
  };
  const aktifFiltre = Object.values(filtre).filter(Boolean).length;
  const basliklar = { satis: "Canlı satışları süz", gecmis: "Geçmiş siparişleri süz", mutfak: "Mutfak hareketlerini süz", musteri: "Müşteri hesaplarını süz", personel: "Personel hareketlerini süz", revizyon: "Revizyon günlüğünü süz" };
  return <section className="kayit-filtreleri">
    <header><div><b>{basliklar[tur] || "Kayıtları süz"}</b><small>Aradığınız kayda tarih, durum veya kişi bilgisiyle hızla ulaşın.</small></div><span>{aktifFiltre ? `${aktifFiltre} aktif filtre` : "Tüm kayıtlar"}</span></header>
    <div className="kayit-hizli-tarih"><span>Hızlı tarih</span><button type="button" onClick={() => hizliAralik(1)}>Bugün</button><button type="button" onClick={() => hizliAralik(7)}>Son 7 gün</button><button type="button" onClick={() => hizliAralik(30)}>Son 30 gün</button></div>
    <div className="kayit-filtre-alanlari">
      <label className="kayit-arama"><span>Ara</span><input type="search" value={filtre.arama} onChange={(e) => guncelle("arama", e.target.value.slice(0, 100))} placeholder={tur === "musteri" ? "Ad, e-posta veya telefon…" : "Sipariş no, kişi veya kayıt…"} /></label>
      <label><span>Başlangıç</span><input type="date" value={filtre.baslangic} onChange={(e) => guncelle("baslangic", e.target.value)} /></label>
      <label><span>Bitiş</span><input type="date" value={filtre.bitis} onChange={(e) => guncelle("bitis", e.target.value)} /></label>
      {["satis", "gecmis", "mutfak"].includes(tur) && <label><span>Durum</span><select value={filtre.durum} onChange={(e) => guncelle("durum", e.target.value)}><option value="">Tüm durumlar</option><option value="yeni">Yeni</option><option value="hazirlaniyor">Hazırlanıyor</option><option value="hazir">Hazır</option></select></label>}
      {["mutfak", "personel"].includes(tur) && <label><span>Personel</span><select value={filtre.personelId} onChange={(e) => guncelle("personelId", e.target.value)}><option value="">Tüm personel</option>{personeller.map((personel) => <option key={personel.id} value={personel.id}>{personel.ad} {personel.soyad}</option>)}</select></label>}
      {tur === "personel" && <label><span>Rol</span><select value={filtre.rol} onChange={(e) => guncelle("rol", e.target.value)}><option value="">Tüm roller</option><option>Mutfak</option><option>Salon</option><option>Kasiyer</option><option>Yönetici</option></select></label>}
      {tur === "revizyon" && <><label><span>Kayıt türü</span><select value={filtre.varlikTuru} onChange={(e) => guncelle("varlikTuru", e.target.value)}><option value="">Tüm kayıtlar</option><option value="urun">Ürün</option><option value="kategori">Kategori</option><option value="kampanya">Kampanya</option><option value="odul">Ödül</option><option value="duyuru">Duyuru</option><option value="personel">Personel</option><option value="vardiya">Vardiya</option></select></label><label><span>İşlem</span><select value={filtre.islem} onChange={(e) => guncelle("islem", e.target.value)}><option value="">Tüm işlemler</option><option value="ekleme">Ekleme</option><option value="guncelleme">Güncelleme</option><option value="durum">Durum</option><option value="arsivleme">Arşivleme</option></select></label></>}
      <button type="button" className="kayit-filtre-temizle" disabled={!aktifFiltre} onClick={temizle}>Filtreleri temizle</button>
    </div>
  </section>;
}
function DurumRozeti({ durum }) {
  const etiketler = { yeni: "Yeni", hazirlaniyor: "Hazırlanıyor", hazir: "Hazır", tamamlandi: "Tamamlandı" };
  return <span className={`durum-rozeti ${durum || "yeni"}`}>{etiketler[durum] || durum || "Yeni"}</span>;
}
function Modal({ baslik, aciklama, sinif = "", kapat, children }) { return <div className="admin-modal-perde" onMouseDown={(e) => e.target === e.currentTarget && kapat()}><section className={`admin-modal ${sinif}`}><header><div><h2>{baslik}</h2>{aciklama && <p>{aciklama}</p>}</div><button type="button" aria-label="Pencereyi kapat" onClick={kapat}>×</button></header>{children}</section></div>; }
function Alan({ etiket, children }) { return <label className="admin-alan"><span>{etiket}</span>{children}</label>; }
function Ikili({ children }) { return <div className="admin-ikili">{children}</div>; }
function FormAlt({ kapat }) { return <div className="form-alt"><button type="button" onClick={kapat}>Vazgeç</button><button className="primary" type="submit">Kaydet</button></div>; }
