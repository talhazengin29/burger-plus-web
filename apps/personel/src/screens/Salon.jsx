import { useCallback, useState, useEffect, useMemo } from "react";
import { socket } from "../lib/socket";
import {
  nakitMasalariniGetir,
  nakitMasasiniAc,
  nakitSiparisiOnayla,
  nakitSiparisiReddet,
  nakitSiparisiTahsilEt,
  personelCagrilariniGetir,
  personelCagrisiGuncelle,
  rezervasyonlariGetir,
  salonKrokisiniGetir,
} from "../lib/adminApi";
import "./Salon.css";
import "./SalonKrokiAlanlari.css";

/*
  Salon ekrani (garson/kasiyer). Tum acik masalari, hesaplarini ve kimin ne
  aldigini gosterir. "Masayi Kapat" ile oturumu kapatir → masa temizlenir,
  yeni gelen musteriler temiz masa gorur.
*/

function gecenSure(tarih) {
  if (!tarih) return "";
  const fark = Math.floor((Date.now() - new Date(tarih).getTime()) / 60000);
  if (fark < 1) return "Az önce";
  if (fark < 60) return `${fark} dk`;
  const saat = Math.floor(fark / 60);
  return `${saat}s ${fark % 60}dk`;
}

// Kaleme göre durum etiketi
const DURUM_ETIKET = {
  yeni: "Yeni",
  hazirlaniyor: "Hazırlanıyor",
  hazir: "Hazır",
};

const CAGRI_NEDENLERI = {
  siparis: ["Sipariş desteği", "Müşteri sipariş vermek istiyor"],
  hesap: ["Hesap istiyor", "Ödeme için personel bekliyor"],
  ihtiyac: ["Bir ihtiyacı var", "Peçete, çatal veya farklı bir istek"],
  temizlik: ["Masa temizliği", "Masanın temizlenmesini istiyor"],
};
const KROKI_ALANLARI = {
  mutfak: ["♨", "Mutfak"], wc: ["WC", "WC"], kasa: ["₺", "Kasa"],
  giris: ["↳", "Giriş"], cikis: ["↗", "Çıkış"], merdiven: ["≋", "Merdiven"],
  bar: ["▰", "Bar"], servis: ["◇", "Servis Alanı"], ic_mekan: ["⌂", "İç Mekân"], dis_mekan: ["☀", "Dış Mekân"],
};
const sandalyeKonumlari = (kapasite) => {
  const adet = Math.min(12, Math.max(1, kapasite || 1));
  return Array.from({ length: adet }, (_, index) => {
    const aci = ((Math.PI * 2) / adet) * index - Math.PI / 2;
    return {
      left: `${50 + Math.cos(aci) * 44}%`,
      top: `${50 + Math.sin(aci) * 43}%`,
      transform: `translate(-50%, -50%) rotate(${(aci * 180) / Math.PI + 90}deg)`,
    };
  });
};

function boyutMetinleri(secimler) {
  return [
    secimler.boyutEtiketi && `${secimler.boyutEtiketi}: ${secimler.boyutMiktar} ${secimler.boyutBirim}`,
    secimler.yanBoyutEtiketi && `${secimler.yanLezzetAd}: ${secimler.yanBoyutEtiketi}`,
    secimler.icecekBoyutEtiketi && `${secimler.icecekAd}: ${secimler.icecekBoyutEtiketi}`,
  ].filter(Boolean);
}

const bugununTarihi = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function Salon() {
  const [masalar, setMasalar] = useState([]);
  const [bagli, setBagli] = useState(socket.connected);
  const [onayMasa, setOnayMasa] = useState(null); // kapatma onayı beklenen masa
  const [kapatilanMasalar, setKapatilanMasalar] = useState(new Set());
  const [nakitMasalar, setNakitMasalar] = useState([]);
  const [nakitYukleniyor, setNakitYukleniyor] = useState(true);
  const [nakitIslemler, setNakitIslemler] = useState(new Set());
  const [nakitOnay, setNakitOnay] = useState(null);
  const [hata, setHata] = useState("");
  const [personelCagrilari, setPersonelCagrilari] = useState([]);
  const [cagriIslemleri, setCagriIslemleri] = useState(new Set());
  const [kroki, setKroki] = useState(null);
  const [aktifKatId, setAktifKatId] = useState("");
  const [rezervasyonlar, setRezervasyonlar] = useState([]);
  const [seciliKrokiMasasi, setSeciliKrokiMasasi] = useState("");

  const krokiyiYenile = useCallback(async () => {
    try {
      const [krokiVerisi, rezervasyonVerisi] = await Promise.all([
        salonKrokisiniGetir(),
        rezervasyonlariGetir({ baslangic: bugununTarihi(), bitis: bugununTarihi() }),
      ]);
      setKroki(krokiVerisi);
      setAktifKatId((onceki) => krokiVerisi.katlar.some((kat) => kat.id === onceki) ? onceki : krokiVerisi.katlar[0]?.id || "");
      setRezervasyonlar(rezervasyonVerisi);
    } catch (e) { setHata(e.message || "Salon krokisi alınamadı."); }
  }, []);

  const personelCagrilariniYenile = useCallback(async () => {
    try { setPersonelCagrilari(await personelCagrilariniGetir()); }
    catch (e) { setHata(e.message || "Personel çağrıları alınamadı."); }
  }, []);

  const nakitMasalariYenile = useCallback(async () => {
    try {
      setNakitMasalar(await nakitMasalariniGetir());
      setHata("");
    } catch (e) {
      setHata(e.message || "Nakit masalar alınamadı.");
    } finally {
      setNakitYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    const acildi = () => {
      setBagli(true);
      socket.emit("salona-katil");
    };
    const kapandi = () => setBagli(false);
    const guncelle = (yeniMasalar) => setMasalar(yeniMasalar);
    const nakitGuncelle = () => nakitMasalariYenile();
    const cagrilariGuncelle = (cagrilar) => setPersonelCagrilari(Array.isArray(cagrilar) ? cagrilar : []);
    const krokiGuncelle = (yeniKroki) => {
      setKroki(yeniKroki);
      setAktifKatId((onceki) => yeniKroki.katlar.some((kat) => kat.id === onceki) ? onceki : yeniKroki.katlar[0]?.id || "");
    };

    socket.on("connect", acildi);
    socket.on("disconnect", kapandi);
    socket.on("salon-guncellendi", guncelle);
    socket.on("nakit-guncellendi", nakitGuncelle);
    socket.on("personel-cagrilari-guncellendi", cagrilariGuncelle);
    socket.on("salon-krokisi-guncellendi", krokiGuncelle);

    if (socket.connected) acildi();
    nakitMasalariYenile();
    personelCagrilariniYenile();
    krokiyiYenile();
    const rezervasyonYenileme = setInterval(krokiyiYenile, 60000);

    return () => {
      socket.off("connect", acildi);
      socket.off("disconnect", kapandi);
      socket.off("salon-guncellendi", guncelle);
      socket.off("nakit-guncellendi", nakitGuncelle);
      socket.off("personel-cagrilari-guncellendi", cagrilariGuncelle);
      socket.off("salon-krokisi-guncellendi", krokiGuncelle);
      clearInterval(rezervasyonYenileme);
    };
  }, [nakitMasalariYenile, personelCagrilariniYenile, krokiyiYenile]);

  const aktifKat = useMemo(() => kroki?.katlar.find((kat) => kat.id === aktifKatId) || kroki?.katlar[0], [kroki, aktifKatId]);
  const masaDurumu = useCallback((masaNo) => {
    const no = String(masaNo);
    const cagri = personelCagrilari.find((oge) => String(oge.masaNo) === no);
    if (cagri) return { tur: "cagri", etiket: cagri.durum === "goruldu" ? "İlgileniliyor" : "Personel çağrısı" };
    const acik = masalar.some((oge) => String(oge.masaNo) === no) || nakitMasalar.some((oge) => String(oge.masaNo) === no && (oge.nakitAcik || oge.siparisler?.length));
    if (acik) return { tur: "dolu", etiket: "Dolu" };
    const rezervasyon = rezervasyonlar.find((oge) => String(oge.masaNo) === no && ["bekliyor", "geldi"].includes(oge.durum));
    if (rezervasyon) return { tur: "rezerve", etiket: `${rezervasyon.saat} · ${rezervasyon.musteriAdi}` };
    return { tur: "bos", etiket: "Boş" };
  }, [personelCagrilari, masalar, nakitMasalar, rezervasyonlar]);

  const cagriyiGuncelle = async (cagri, durum) => {
    if (cagriIslemleri.has(cagri.id)) return;
    setCagriIslemleri((onceki) => new Set(onceki).add(cagri.id));
    setHata("");
    try {
      await personelCagrisiGuncelle(cagri.id, durum);
      await personelCagrilariniYenile();
    } catch (e) { setHata(e.message || "Çağrı güncellenemedi."); }
    finally {
      setCagriIslemleri((onceki) => { const sonraki = new Set(onceki); sonraki.delete(cagri.id); return sonraki; });
    }
  };

  const masayiKapat = (masaNo) => {
    if (kapatilanMasalar.has(masaNo)) return;
    setKapatilanMasalar((onceki) => new Set(onceki).add(masaNo));
    setHata("");
    socket.timeout(8000).emit("masa-kapat", masaNo, (zamanAsimi, sonuc) => {
      setKapatilanMasalar((onceki) => {
        const sonraki = new Set(onceki);
        sonraki.delete(masaNo);
        return sonraki;
      });
      if (zamanAsimi) setHata("Masa kapatma isteği zaman aşımına uğradı.");
      else if (sonuc?.basarili === false) setHata(sonuc.hata || "Masa kapatılamadı.");
      else nakitMasalariYenile();
    });
    setOnayMasa(null);
  };

  const nakitMasayiAc = async (masaNo) => {
    const anahtar = `ac-${masaNo}`;
    if (nakitIslemler.has(anahtar)) return;
    setNakitIslemler((onceki) => new Set(onceki).add(anahtar));
    setHata("");
    try {
      await nakitMasasiniAc(masaNo);
      await nakitMasalariYenile();
    } catch (e) {
      setHata(e.message || "Masa açılamadı.");
    } finally {
      setNakitIslemler((onceki) => {
        const sonraki = new Set(onceki);
        sonraki.delete(anahtar);
        return sonraki;
      });
    }
  };

  const nakitSiparisIslemi = async (siparis, tur) => {
    const anahtar = `${tur}-${siparis.id}`;
    if (nakitIslemler.has(anahtar)) return;
    setNakitIslemler((onceki) => new Set(onceki).add(anahtar));
    setHata("");
    try {
      if (tur === "onayla") await nakitSiparisiOnayla(siparis.id);
      else if (tur === "reddet") await nakitSiparisiReddet(siparis.id);
      else await nakitSiparisiTahsilEt(siparis.id);
      setNakitOnay(null);
      await nakitMasalariYenile();
    } catch (e) {
      setHata(e.message || "Nakit sipariş işlemi tamamlanamadı.");
    } finally {
      setNakitIslemler((onceki) => {
        const sonraki = new Set(onceki);
        sonraki.delete(anahtar);
        return sonraki;
      });
    }
  };

  const nakitSiparisler = nakitMasalar.flatMap((masa) =>
    (masa.siparisler || []).map((siparis) => ({ ...siparis, masaNo: masa.masaNo }))
  );

  return (
    <div className="salon">
      <header className="salon-header">
        <span className="salon-etiket">🍽️ SALON</span>
        <div className="salon-header-sag">
          <span className={"baglanti " + (bagli ? "baglanti--acik" : "baglanti--kapali")}>
            {bagli ? "● Bağlı" : "● Bağlantı yok"}
          </span>
          <span className="salon-sayi">{nakitMasalar.filter((masa) => masa.nakitAcik).length} açık masa</span>
        </div>
      </header>

      {hata && <div className="salon-hata" role="alert">{hata}</div>}

      {aktifKat && <section className="salon-kroki-paneli">
        <div className="salon-bolum-baslik"><div><small>CANLI YERLEŞİM</small><h2>Salon krokisi</h2></div><span>{aktifKat.masalar.filter((masa) => masa.aktif).length} aktif masa</span></div>
        <div className="salon-kat-sekmeleri">{kroki.katlar.map((kat) => <button key={kat.id} className={kat.id === aktifKat.id ? "aktif" : ""} onClick={() => { setAktifKatId(kat.id); setSeciliKrokiMasasi(""); }}>{kat.ad}<span>{kat.masalar.length}</span></button>)}</div>
        <div className={`salon-kroki-tuval salon-kroki-tuval--${aktifKat.mekanTuru || "ic_mekan"}`}>
          {(aktifKat.alanlar || []).filter((alan) => alan.aktif).map((alan) => { const [ikon, varsayilanAd] = KROKI_ALANLARI[alan.tur] || KROKI_ALANLARI.servis; return <div key={alan.id} className={`salon-kroki-alan salon-kroki-alan--${alan.tur}${["ic_mekan", "dis_mekan"].includes(alan.tur) ? " salon-kroki-alan--bolge" : ""}`} style={{ left: `${alan.x}%`, top: `${alan.y}%`, width: `${alan.genislik}%`, height: `${alan.yukseklik}%` }}><i>{ikon}</i><b>{alan.ad || varsayilanAd}</b></div>; })}
          {aktifKat.masalar.filter((masa) => masa.aktif).map((masa) => {
            const durum = masaDurumu(masa.masaNo);
            return <button key={masa.id} title={`${masa.ad} · ${durum.etiket}`} className={`salon-kroki-masa salon-kroki-masa--${masa.sekil} salon-kroki-masa--${durum.tur}${seciliKrokiMasasi === masa.id ? " secili" : ""}`} style={{ left: `${masa.x}%`, top: `${masa.y}%`, width: `${masa.genislik}%`, height: `${masa.yukseklik}%` }} onClick={() => setSeciliKrokiMasasi(masa.id)}><span className="salon-kroki-masa-yuzeyi"><b>{masa.ad}</b><span>{durum.etiket}</span><small>{masa.kapasite} kişi</small></span>{sandalyeKonumlari(masa.kapasite).map((stil, index) => <i key={index} className="salon-kroki-sandalye" style={stil} />)}</button>;
          })}
        </div>
        <div className="salon-kroki-aciklama"><span><i className="bos"/>Boş</span><span><i className="dolu"/>Dolu</span><span><i className="rezerve"/>Rezerve</span><span><i className="cagri"/>Personel çağrısı</span></div>
      </section>}

      <section className={`personel-cagri-paneli${personelCagrilari.length ? " personel-cagri-paneli--aktif" : ""}`}>
        <div className="salon-bolum-baslik">
          <div><small>CANLI SERVİS TALEPLERİ</small><h2>Personel Çağrıları</h2></div>
          <span>{personelCagrilari.length ? `${personelCagrilari.length} bekliyor` : "Çağrı yok"}</span>
        </div>
        {personelCagrilari.length ? (
          <div className="personel-cagri-grid">
            {personelCagrilari.map((cagri) => {
              const [baslik, aciklama] = CAGRI_NEDENLERI[cagri.neden] || ["Personel çağrısı", "Müşteri destek bekliyor"];
              const islemde = cagriIslemleri.has(cagri.id);
              return (
                <article key={cagri.id} className={`personel-cagri-karti personel-cagri-karti--${cagri.durum}`}>
                  <header><div><strong>Masa {cagri.masaNo}</strong><span>{gecenSure(cagri.olusturma)}</span></div><em>{cagri.durum === "goruldu" ? "İlgileniliyor" : "Yeni çağrı"}</em></header>
                  <h3>{baslik}</h3><p>{aciklama}</p>
                  <div className="personel-cagri-butonlar">
                    {cagri.durum === "bekliyor" && <button disabled={islemde} onClick={() => cagriyiGuncelle(cagri, "goruldu")}>Gördüm</button>}
                    <button disabled={islemde} onClick={() => cagriyiGuncelle(cagri, "tamamlandi")}>Tamamlandı</button>
                    <button className="masada-yok" disabled={islemde} onClick={() => cagriyiGuncelle(cagri, "masada_yok")}>Masada yok</button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <p className="personel-cagri-bos">Aktif servis talebi bulunmuyor. Yeni çağrılar bu alana anında düşer.</p>}
      </section>

      <section className="nakit-masa-paneli">
        <div className="salon-bolum-baslik">
          <div><small>NAKİT YETKİSİ</small><h2>Masalar</h2></div>
          <span>{nakitYukleniyor ? "Yükleniyor" : `${nakitMasalar.length} masa`}</span>
        </div>
        <div className="nakit-masa-grid">
          {nakitMasalar.map((masa) => {
            const bekleyen = (masa.siparisler || []).filter((siparis) => siparis.durum === "personel_onayi").length;
            const borc = (masa.siparisler || []).filter((siparis) => siparis.durum === "nakit_bekliyor").reduce((toplam, siparis) => toplam + Number(siparis.tutar), 0);
            const aciliyor = nakitIslemler.has(`ac-${masa.masaNo}`);
            return (
              <article key={masa.masaNo} className={"nakit-masa-karti" + (masa.nakitAcik ? " nakit-masa-karti--acik" : "") + (bekleyen ? " nakit-masa-karti--bekleyen" : "")}>
                <div><b>Masa {masa.masaNo}</b><small>{masa.nakitAcik ? "Nakit siparişe açık" : "Kapalı"}</small></div>
                {bekleyen > 0 && <strong>{bekleyen} onay</strong>}
                {borc > 0 && <em>₺{borc.toFixed(2)}</em>}
                {!masa.nakitAcik ? (
                  <button disabled={aciliyor} onClick={() => nakitMasayiAc(masa.masaNo)}>{aciliyor ? "Açılıyor…" : "Masayı Aç"}</button>
                ) : onayMasa === masa.masaNo ? (
                  <div className="nakit-masa-mini-onay">
                    <button onClick={() => setOnayMasa(null)}>Vazgeç</button>
                    <button disabled={kapatilanMasalar.has(masa.masaNo)} onClick={() => masayiKapat(masa.masaNo)}>Kapat</button>
                  </div>
                ) : (
                  <button className="nakit-masa-kapat" onClick={() => setOnayMasa(masa.masaNo)}>Masayı Kapat</button>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {nakitSiparisler.length > 0 && (
        <section className="nakit-siparis-paneli">
          <div className="salon-bolum-baslik">
            <div><small>PERSONEL KONTROLÜ</small><h2>Nakit Siparişler</h2></div>
            <span>{nakitSiparisler.length} işlem</span>
          </div>
          <div className="nakit-siparis-liste">
            {nakitSiparisler.map((siparis) => {
              const bekliyor = siparis.durum === "personel_onayi";
              const mutfakAktarimiBekliyor = siparis.durum === "nakit_bekliyor" && !siparis.mutfagaAktarildi;
              const islemde = ["onayla", "reddet", "tahsil"].some((tur) => nakitIslemler.has(`${tur}-${siparis.id}`));
              const onayAcik = nakitOnay?.id === siparis.id;
              return (
                <article key={siparis.id} className={"nakit-siparis-karti " + (bekliyor ? "nakit-siparis-karti--onay" : "nakit-siparis-karti--tahsil")}>
                  <header>
                    <div><b>Masa {siparis.masaNo}</b><small>{bekliyor ? "Personel onayı bekliyor" : mutfakAktarimiBekliyor ? "Mutfak aktarımı tamamlanmadı" : "Nakit tahsilatı bekliyor"}</small></div>
                    <strong>₺{Number(siparis.tutar).toFixed(2)}</strong>
                  </header>
                  <p>{siparis.kisiAdi} · {siparis.urunler.reduce((toplam, urun) => toplam + Number(urun.adet || 1), 0)} ürün</p>
                  <ul>{siparis.urunler.map((urun, sira) => <li key={`${urun.id}-${sira}`}><span>{urun.adet}× {urun.ad}</span><b>₺{(Number(urun.fiyat) * Number(urun.adet)).toFixed(2)}</b></li>)}</ul>
                  {onayAcik ? (
                    <div className="nakit-siparis-onay">
                      <span>{nakitOnay.tur === "reddet" ? "Sipariş reddedilsin mi?" : "Nakit tamamen alındı mı?"}</span>
                      <button onClick={() => setNakitOnay(null)}>Vazgeç</button>
                      <button disabled={islemde} onClick={() => nakitSiparisIslemi(siparis, nakitOnay.tur)}>{islemde ? "İşleniyor…" : "Onayla"}</button>
                    </div>
                  ) : bekliyor ? (
                    <div className="nakit-siparis-butonlar">
                      <button className="nakit-reddet" onClick={() => setNakitOnay({ id: siparis.id, tur: "reddet" })}>Reddet</button>
                      <button disabled={islemde} onClick={() => nakitSiparisIslemi(siparis, "onayla")}>{islemde ? "Gönderiliyor…" : "Onayla ve Mutfağa Gönder"}</button>
                    </div>
                  ) : mutfakAktarimiBekliyor ? (
                    <button disabled={islemde} className="nakit-tahsil nakit-yeniden-gonder" onClick={() => nakitSiparisIslemi(siparis, "onayla")}>{islemde ? "Gönderiliyor…" : "Mutfağa Yeniden Gönder"}</button>
                  ) : (
                    <button className="nakit-tahsil" onClick={() => setNakitOnay({ id: siparis.id, tur: "tahsil" })}>Nakit Tahsil Edildi</button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {masalar.length === 0 ? (
        <div className="bos-durum">
          <div className="bos-emoji">🪑</div>
          <h2>Mutfağa iletilmiş sipariş yok</h2>
          <p>Onaylanan nakit veya online siparişler burada görünecek.</p>
        </div>
      ) : (
        <div className="salon-liste">
          {masalar.map((masa) => (
            <article key={masa.masaNo} className="salon-kart">
              <div className="salon-kart-ust">
                <div className="salon-masa-baslik">
                  <span className="salon-masa-no">Masa {masa.masaNo}</span>
                  <span className="salon-masa-sure">
                    {masa.kalemler.length} ürün · {gecenSure(masa.kalemler[0]?.olusturma)} önce açıldı
                  </span>
                </div>
                <span className="salon-hesap">₺{Number(masa.toplam).toFixed(2)}</span>
              </div>

              {/* Kim ne aldı */}
              <div className="salon-kalemler">
                {masa.kalemler.map((k) => {
                  const secimler = k.secimler || {};
                  const haric = k.haricMalzemeler || k.haric_malzemeler || secimler.haricMalzemeler;
                  const dahil = secimler.dahilMalzemeler || [];
                  const gramaj = Number(secimler.toplamGramaj) > 0
                    ? `${secimler.toplamGramaj} ${secimler.gramajBirim || "gr"}${Number(secimler.ekstraGramaj) > 0 ? ` (+${secimler.ekstraGramaj})` : " (Standart)"}`
                    : Number(secimler.ekstraGramaj) > 0
                      ? `+${secimler.ekstraGramaj} ${secimler.gramajBirim || "gr"}`
                      : null;
                  const boyutlar = boyutMetinleri(secimler);
                  const ekstralar = Array.isArray(secimler.ekstraMalzemeler) ? secimler.ekstraMalzemeler : [];
                  return (
                    <div key={k.id} className="salon-kalem">
                      <span className="salon-kalem-adet">{k.adet}×</span>
                      <span className="salon-kalem-ad">
                        {k.urun_ad}
                        {gramaj && <small className="salon-kalem-gramaj">{gramaj}</small>}
                        {boyutlar.map((boyut) => <small className="salon-kalem-gramaj" key={boyut}>{boyut}</small>)}
                        {ekstralar.length > 0 && <small className="salon-kalem-dahil">Ekstra: {ekstralar.map((ekstra) => ekstra.ad).join(", ")}</small>}
                        {dahil.length > 0 && <small className="salon-kalem-dahil">Dahil: {dahil.join(", ")}</small>}
                        {haric?.length > 0 && <small className="salon-kalem-haric">Haric: {haric.join(", ")}</small>}
                      </span>
                      <span className={"salon-kalem-durum durum-" + k.durum}>
                        {DURUM_ETIKET[k.durum] || k.durum}
                      </span>
                      <span className="salon-kalem-kisi">{k.kisi_adi}</span>
                    </div>
                  );
                })}
              </div>

              {/* Kapat butonu / onay */}
              <div className="salon-kart-alt">
                {onayMasa === masa.masaNo ? (
                  <div className="salon-onay">
                    <span className="salon-onay-yazi">Masa {masa.masaNo} kapatılsın mı?</span>
                    <div className="salon-onay-butonlar">
                      <button className="salon-btn-iptal" onClick={() => setOnayMasa(null)}>
                        Vazgeç
                      </button>
                      <button disabled={kapatilanMasalar.has(masa.masaNo)} className="salon-btn-kapat" onClick={() => masayiKapat(masa.masaNo)}>
                        {kapatilanMasalar.has(masa.masaNo) ? "Kapatılıyor…" : "Evet, Kapat"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="salon-btn-ana" onClick={() => setOnayMasa(masa.masaNo)}>
                    Masayı Kapat
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
