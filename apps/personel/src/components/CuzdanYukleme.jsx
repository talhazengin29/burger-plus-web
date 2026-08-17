import { useCallback, useEffect, useMemo, useState } from "react";
import { kasaCuzdanMusteriAra, kasaCuzdanSonYuklemeler, kasaCuzdanYukle } from "../lib/adminApi";
import { socket } from "../lib/socket";
import { yuzdeTutariniHesapla } from "../lib/yuzde";
import "./CuzdanYukleme.css";

const para = (n) => `₺${Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CuzdanYukleme() {
  const [arama, setArama] = useState("");
  const [musteriler, setMusteriler] = useState([]);
  const [secili, setSecili] = useState(null);
  const [tutar, setTutar] = useState("");
  const [ayar, setAyar] = useState(null);
  const [sonYuklemeler, setSonYuklemeler] = useState([]);
  const [aranıyor, setAraniyor] = useState(false);
  const [islemde, setIslemde] = useState(false);
  const [onay, setOnay] = useState(false);
  const [istekAnahtari, setIstekAnahtari] = useState(null);
  const [mesaj, setMesaj] = useState(null);

  const gecmisiYenile = useCallback(async () => {
    try {
      const veri = await kasaCuzdanSonYuklemeler();
      setAyar(veri.ayar);
      setSonYuklemeler(veri.yuklemeler || []);
    } catch (e) { setMesaj({ tip: "hata", metin: e.message }); }
  }, []);

  useEffect(() => {
    gecmisiYenile();
    const yenile = () => gecmisiYenile();
    socket.on("cuzdan-kasa-guncellendi", yenile);
    return () => socket.off("cuzdan-kasa-guncellendi", yenile);
  }, [gecmisiYenile]);

  useEffect(() => {
    if (arama.trim().length < 2 || secili) { setMusteriler([]); return undefined; }
    setAraniyor(true);
    const zamanlayici = setTimeout(() => {
      kasaCuzdanMusteriAra(arama).then(setMusteriler).catch((e) => setMesaj({ tip: "hata", metin: e.message })).finally(() => setAraniyor(false));
    }, 280);
    return () => clearTimeout(zamanlayici);
  }, [arama, secili]);

  const sayisalTutar = Number(String(tutar).replace(",", ".")) || 0;
  const bonus = useMemo(() => ayar?.bonusAktif ? yuzdeTutariniHesapla(sayisalTutar, ayar.bonusYuzde) : 0, [ayar, sayisalTutar]);
  const toplam = sayisalTutar + bonus;
  const tutarUygun = sayisalTutar >= Number(ayar?.minYukleme || 0) && sayisalTutar <= Number(ayar?.maxYukleme || Infinity);

  const yukle = async () => {
    if (!secili || !tutarUygun || islemde) return;
    if (!onay) { setIstekAnahtari(crypto.randomUUID()); setOnay(true); setMesaj(null); return; }
    setIslemde(true);
    try {
      const sonuc = await kasaCuzdanYukle({ kullaniciId: secili.id, tutar: String(tutar).replace(",", "."), istekAnahtari });
      setMesaj({ tip: "basari", metin: `${secili.ad} ${secili.soyad} hesabına ${para(sonuc.tutar)} yüklendi. Yeni bakiye ${para(sonuc.bakiye)}.` });
      setSecili({ ...secili, bakiye: sonuc.bakiye });
      setTutar("");
      setOnay(false);
      setIstekAnahtari(null);
      await gecmisiYenile();
    } catch (e) {
      setMesaj({ tip: "hata", metin: e.message || "Yükleme tamamlanamadı." });
    } finally { setIslemde(false); }
  };

  return (
    <section className="kasa-cuzdan">
      <header className="kasa-cuzdan-baslik">
        <div><small>NAKİT YÜKLEME</small><h2>Müşteri Cüzdanı</h2><p>Kasada alınan nakdi uygulama bakiyesine dönüştür.</p></div>
        {ayar?.bonusAktif && <span className="kasa-bonus-rozet">%{ayar.bonusYuzde} HEDİYE</span>}
      </header>
      {!ayar?.aktif ? <div className="kasa-cuzdan-kapali">Cüzdan yüklemeleri işletme yöneticisi tarafından durduruldu.</div> : (
        <div className="kasa-cuzdan-icerik">
          <div className="kasa-cuzdan-form">
            <label className="kasa-arama">
              <span>Müşteriyi bul</span>
              <input value={arama} onChange={(e) => { setArama(e.target.value.slice(0, 100)); setSecili(null); setOnay(false); setIstekAnahtari(null); }} placeholder="Telefon, e-posta, ad veya üye no" autoComplete="off" />
              {aranıyor && <small>Aranıyor…</small>}
            </label>
            {musteriler.length > 0 && <div className="kasa-musteri-sonuclari">{musteriler.map((m) => (
              <button type="button" key={m.id} onClick={() => { setSecili(m); setArama(`${m.ad} ${m.soyad}`); setMusteriler([]); setOnay(false); setIstekAnahtari(null); }}>
                <span><b>{m.ad} {m.soyad}</b><small>{m.telefon || m.email} · Üye #{m.id}</small></span><strong>{para(m.bakiye)}</strong>
              </button>
            ))}</div>}
            {secili && <div className="kasa-secili-musteri"><span><small>SEÇİLEN MÜŞTERİ</small><b>{secili.ad} {secili.soyad}</b><em>{secili.email} · {secili.telefon || "Telefon yok"}</em></span><strong><small>MEVCUT BAKİYE</small>{para(secili.bakiye)}</strong></div>}
            <label className="kasa-tutar"><span>Nakit alınan tutar</span><div><b>₺</b><input inputMode="decimal" value={tutar} onChange={(e) => { setTutar(e.target.value.replace(/[^0-9,.]/g, "").slice(0, 12)); setOnay(false); setIstekAnahtari(null); }} placeholder="0,00" /></div><small>İzin verilen: {para(ayar?.minYukleme)} – {para(ayar?.maxYukleme)}</small></label>
            <div className="kasa-hizli-tutar">{[100, 250, 500, 1000].map((deger) => <button type="button" key={deger} onClick={() => { setTutar(String(deger)); setOnay(false); setIstekAnahtari(null); }}>+{para(deger)}</button>)}</div>
            {sayisalTutar > 0 && <div className="kasa-yukleme-ozeti"><span>Nakit<b>{para(sayisalTutar)}</b></span><span>Hediye bakiye<b className="bonus">+{para(bonus)}</b></span><strong>Müşteriye geçecek<b>{para(toplam)}</b></strong></div>}
            {onay && <div className="kasa-yukleme-onay"><b>Nakit tahsil edildi mi?</b><p>Bu işlem {secili?.ad} {secili?.soyad} cüzdanına geri alınmadan {para(toplam)} ekler ve personel hesabınla kaydedilir.</p></div>}
            {mesaj && <p className={`kasa-cuzdan-mesaj ${mesaj.tip}`}>{mesaj.metin}</p>}
            <div className="kasa-cuzdan-butonlar">{onay && <button type="button" className="ikincil" onClick={() => { setOnay(false); setIstekAnahtari(null); }}>Vazgeç</button>}<button type="button" disabled={!secili || !tutarUygun || islemde} onClick={yukle}>{islemde ? "Yükleniyor…" : onay ? "Nakit Alındı, Yükle" : "Yüklemeyi Kontrol Et"}</button></div>
          </div>
          <aside className="kasa-son-yuklemeler"><h3>Son yüklemeler</h3>{sonYuklemeler.length === 0 ? <p>Henüz yükleme yok.</p> : sonYuklemeler.slice(0, 8).map((y) => <article key={y.id}><span><b>{y.musteriAdi}</b><small>{new Date(y.tarih).toLocaleString("tr-TR")} · {y.personelAdi || "Personel"}</small></span><strong>+{para(y.tutar)}<small>{y.bonusTutar > 0 ? `${para(y.bonusTutar)} hediye` : "Bonus yok"}</small></strong></article>)}</aside>
        </div>
      )}
    </section>
  );
}
