import { useCallback, useState, useEffect } from "react";
import { socket } from "../lib/socket";
import {
  nakitMasalariniGetir,
  nakitMasasiniAc,
  nakitSiparisiOnayla,
  nakitSiparisiReddet,
  nakitSiparisiTahsilEt,
} from "../lib/adminApi";
import "./Salon.css";
import CuzdanYukleme from "../components/CuzdanYukleme";

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

function boyutMetinleri(secimler) {
  return [
    secimler.boyutEtiketi && `${secimler.boyutEtiketi}: ${secimler.boyutMiktar} ${secimler.boyutBirim}`,
    secimler.yanBoyutEtiketi && `${secimler.yanLezzetAd}: ${secimler.yanBoyutEtiketi}`,
    secimler.icecekBoyutEtiketi && `${secimler.icecekAd}: ${secimler.icecekBoyutEtiketi}`,
  ].filter(Boolean);
}

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

    socket.on("connect", acildi);
    socket.on("disconnect", kapandi);
    socket.on("salon-guncellendi", guncelle);
    socket.on("nakit-guncellendi", nakitGuncelle);

    if (socket.connected) acildi();
    nakitMasalariYenile();

    return () => {
      socket.off("connect", acildi);
      socket.off("disconnect", kapandi);
      socket.off("salon-guncellendi", guncelle);
      socket.off("nakit-guncellendi", nakitGuncelle);
    };
  }, [nakitMasalariYenile]);

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

      <CuzdanYukleme />

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
                  return (
                    <div key={k.id} className="salon-kalem">
                      <span className="salon-kalem-adet">{k.adet}×</span>
                      <span className="salon-kalem-ad">
                        {k.urun_ad}
                        {gramaj && <small className="salon-kalem-gramaj">{gramaj}</small>}
                        {boyutlar.map((boyut) => <small className="salon-kalem-gramaj" key={boyut}>{boyut}</small>)}
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
