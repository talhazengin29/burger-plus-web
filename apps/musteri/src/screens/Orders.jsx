import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { IconBag } from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import SayfaSarici from "../components/SayfaSarici";
import { gramajMetni, haricMalzemeleriGetir } from "../lib/urunSecimleri";
import { istekAt, siparisDegerlendirmesiGonder } from "../lib/authApi";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import "./Orders.css";
import "./OrdersDegerlendirme.css";

/*
  Siparişlerim ekranı — KİŞİSEL, iki bölüm:
   1) Aktif Siparişler: masa hâlâ açıkken (durum canlı: Alındı/Hazırlanıyor/Hazır)
   2) Geçmiş Siparişler: masa kapatıldıktan sonra ("Ödeme tamamlandı" olarak kalır)
*/

function tarihGoster(iso) {
  const t = new Date(iso);
  return t.toLocaleString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const urunAnahtari = (urun) => String(urun.sepetAnahtari || urun.id || urun.ad);
const benzersizUrunler = (urunler) => [...new Map((urunler || []).map((urun) => [urunAnahtari(urun), urun])).values()];

function YildizSecimi({ puan, onChange, etiket }) {
  return <div className="degerlendirme-yildizlar" role="group" aria-label={etiket}>{[1,2,3,4,5].map((yildiz) => <button type="button" key={yildiz} className={yildiz <= puan ? "aktif" : ""} onClick={() => onChange(yildiz)} aria-label={`${etiket}: ${yildiz} yıldız`}>★</button>)}</div>;
}

function DegerlendirmeModal({ form, setForm, onKapat, onKaydet, kaydediliyor }) {
  const siparisUrunleri = benzersizUrunler(form.siparis.urunler);
  const kriterler = [["genelPuan","Genel deneyim"],["servisHiziPuani","Servis hızı"],["personelPuani","Personel ve hizmet"],["siparisDogruluguPuani","Sipariş doğruluğu"]];
  return <div className="degerlendirme-perde" onMouseDown={(e) => { if (e.target === e.currentTarget && !kaydediliyor) onKapat(); }}><form className="degerlendirme-modal" onSubmit={onKaydet}>
    <header><div><small>SİPARİŞ DENEYİMİ</small><h2>Deneyimini değerlendir</h2><p>Sipariş #{form.siparis.siparisNo}</p></div><button type="button" onClick={onKapat} disabled={kaydediliyor}>×</button></header>
    <div className="degerlendirme-icerik">
      <section><h3>Ürünler nasıldı?</h3><p className="degerlendirme-aciklama">Siparişindeki her ürünü ayrı ayrı puanla.</p>{siparisUrunleri.map((urun) => <div className="degerlendirme-urun" key={urunAnahtari(urun)}>{urun.gorsel ? <img src={urun.gorsel} alt="" /> : <span>{urun.ad?.charAt(0)}</span>}<b>{urun.ad}</b><YildizSecimi etiket={urun.ad} puan={form.urunPuanlari[urunAnahtari(urun)] || 0} onChange={(puan) => setForm((onceki) => ({ ...onceki, urunPuanlari: { ...onceki.urunPuanlari, [urunAnahtari(urun)]: puan } }))} /></div>)}</section>
      <section className="degerlendirme-kriterler"><h3>Servis deneyimi</h3>{kriterler.map(([alan, ad]) => <div key={alan}><label>{ad}</label><YildizSecimi etiket={ad} puan={form[alan]} onChange={(puan) => setForm((onceki) => ({ ...onceki, [alan]: puan }))} /></div>)}</section>
      <label className="degerlendirme-yorum">Eklemek istediğin bir yorum var mı?<textarea maxLength="1000" rows="4" value={form.yorum} onChange={(e) => setForm((onceki) => ({ ...onceki, yorum: e.target.value }))} placeholder="Ürün, servis veya genel deneyimin hakkında yazabilirsin…" /><span>{form.yorum.length}/1000</span></label>
    </div>
    <footer><button type="button" onClick={onKapat} disabled={kaydediliyor}>Daha sonra</button><button className="degerlendirme-kaydet" disabled={kaydediliyor}>{kaydediliyor ? "Gönderiliyor…" : "Değerlendirmeyi Gönder"}</button></footer>
  </form></div>;
}

// Tek bir sipariş kartı
function SiparisKart({ s, durum, gecmis, onTekrarSiparisVer, onDegerlendir }) {
  return (
    <article className={"siparis-kart" + (gecmis ? " siparis-kart--gecmis" : "")}>
      <div className="siparis-kart-ust">
        <div className="siparis-ust-sol">
          <span className="siparis-tip-rozet">
            {s.tip === "masa" ? `🍽️ Masa ${s.masaNo}` : "🥡 Gel Al"}
          </span>
          <span className="siparis-tarih">{tarihGoster(s.tarih)}</span>
        </div>
        {!gecmis && (
          <span className={"siparis-durum-rozet " + durum.sinif}>{durum.yazi}</span>
        )}
      </div>

      <div className="siparis-urunler">
        {s.urunler.map((u) => (
          <div key={u.sepetAnahtari || u.id} className="siparis-urun-satir">
            {u.gorsel
              ? <img className="siparis-urun-gorsel" src={u.gorsel} alt={u.ad} />
              : <span className="siparis-urun-gorsel siparis-urun-gorselsiz">{u.ad?.charAt(0) || "?"}</span>}
            <div className="siparis-urun-orta">
              <span className="siparis-urun-ad">{u.ad}</span>
              <span className="siparis-urun-birim">₺{u.fiyat.toFixed(2)}</span>
              {gramajMetni(u.secimler) && <span className="siparis-urun-secim">{gramajMetni(u.secimler)}</span>}
              {haricMalzemeleriGetir(u).length > 0 && (
                <span className="siparis-urun-haric">Haric: {haricMalzemeleriGetir(u).join(", ")}</span>
              )}
            </div>
            <span className="siparis-urun-adet">{u.adet}×</span>
          </div>
        ))}
      </div>

      <div className="siparis-alt">
        <div className="siparis-toplam">
          <span>Toplam</span>
          <span className="siparis-toplam-tutar">₺{s.tutar.toFixed(2)}</span>
        </div>
        {!s.misafir && s.kazanilanPuan > 0 && (
          <span className="siparis-puan">+{s.kazanilanPuan} puan</span>
        )}
      </div>
      <p className="siparis-not siparis-not--odendi">✓ Ödeme tamamlandı</p>
      <button className="siparis-tekrar-btn" onClick={() => onTekrarSiparisVer(s)}>
        🔁 Tekrar Sipariş Ver
      </button>
      {gecmis && !s.misafir && (s.degerlendirildi ? <div className="siparis-degerlendirildi"><span>{"★".repeat(s.degerlendirmePuani || 5)}</span> Değerlendirmen alındı</div> : <button className="siparis-degerlendir-btn" onClick={() => onDegerlendir(s)}>☆ Siparişi Değerlendir</button>)}
    </article>
  );
}

export default function Orders() {
  const git = useIsletmeNavigate();
  const { siparislerim, siparisleriYenile, masaDurumu, ozetMasaNo, ozetMasaTokeni, sepeteEkle, urunler } = useApp();

  const [mesaj, setMesaj] = useState(null); // { tip: "basari" | "hata", metin }
  const [degerlendirmeFormu, setDegerlendirmeFormu] = useState(null);
  const [degerlendirmeKaydediliyor, setDegerlendirmeKaydediliyor] = useState(false);
  const oncekiTamamlananlar = useRef(null);
  useEffect(() => {
    if (!mesaj) return;
    const t = setTimeout(() => setMesaj(null), 2500);
    return () => clearTimeout(t);
  }, [mesaj]);

  const tekrarSiparisVer = (s) => {
    let eklenen = 0, eksik = 0;
    for (const kalem of s.urunler) {
      const guncelUrun = urunler.find((u) => Number(u.id) === Number(kalem.id));
      if (!guncelUrun) { eksik++; continue; }
      for (let i = 0; i < (kalem.adet || 1); i++) sepeteEkle(guncelUrun);
      eklenen++;
    }
    if (eklenen === 0) {
      setMesaj({ tip: "hata", metin: "Bu siparişteki ürünler artık mevcut değil." });
      return;
    }
    if (eksik > 0) {
      setMesaj({ tip: "hata", metin: `${eksik} ürün artık mevcut değil, eklenemedi.` });
      setTimeout(() => git("/sepet"), 1200);
      return;
    }
    git("/sepet");
  };

  const degerlendirmeyiAc = (siparis) => setDegerlendirmeFormu({ siparis, urunPuanlari: {}, genelPuan: 0, servisHiziPuani: 0, personelPuani: 0, siparisDogruluguPuani: 0, yorum: "" });
  const degerlendirmeyiKaydet = async (event) => {
    event.preventDefault();
    const form = degerlendirmeFormu; const urunler = benzersizUrunler(form.siparis.urunler);
    if (urunler.some((urun) => !form.urunPuanlari[urunAnahtari(urun)]) || [form.genelPuan,form.servisHiziPuani,form.personelPuani,form.siparisDogruluguPuani].some((puan) => !puan)) {
      setMesaj({ tip: "hata", metin: "Lütfen ürünlerin ve servis kriterlerinin tamamını puanla." }); return;
    }
    setDegerlendirmeKaydediliyor(true);
    try {
      await siparisDegerlendirmesiGonder(form.siparis.id, { genelPuan: form.genelPuan, servisHiziPuani: form.servisHiziPuani, personelPuani: form.personelPuani, siparisDogruluguPuani: form.siparisDogruluguPuani, yorum: form.yorum, urunler: urunler.map((urun) => ({ urunAnahtari: urunAnahtari(urun), puan: form.urunPuanlari[urunAnahtari(urun)] })) });
      setDegerlendirmeFormu(null); setMesaj({ tip: "basari", metin: "Değerlendirmen için teşekkür ederiz." }); await siparisleriYenile();
    } catch (e) { setMesaj({ tip: "hata", metin: e.message || "Değerlendirme kaydedilemedi." }); }
    finally { setDegerlendirmeKaydediliyor(false); }
  };

  useEffect(() => {
    siparisleriYenile().catch(() => {});
    const zamanlayici = setInterval(() => siparisleriYenile().catch(() => {}), 5000);
    return () => clearInterval(zamanlayici);
  }, [siparisleriYenile]);

  // Yedek: socket kopmuş olabilir. Masaların durumunu sunucudan da sorguluyoruz.
  const [masaDurumlari, setMasaDurumlari] = useState({});
  // İlk poll sonucu gelene kadar aktif/geçmiş bölümlerini göstermeyip bekleriz —
  // aksi halde masaDurumlari boşken sipariş bir an "Hazırlanıyor" görünüp poll
  // sonucu "kapali" gelince aniden Geçmiş'e düşüyordu (görsel flaş).
  const [ilkSorguTamam, setIlkSorguTamam] = useState(false);
  useEffect(() => {
    // Zaten tamamlandı işaretli siparişler için sorgulamaya gerek yok.
    const masalar = [...new Set(
      siparislerim
        .filter((s) => s.tip === "masa" && s.masaNo && !s.tamamlandi)
        .map((s) => String(s.masaNo))
    )];
    if (masalar.length === 0) { setIlkSorguTamam(true); return; }

    let iptal = false;
    const sorgula = async () => {
      const yeni = {};
      for (const no of masalar) {
        if (String(ozetMasaNo) !== no || !ozetMasaTokeni) continue;
        try {
          const r = await istekAt(`/api/masa/${encodeURIComponent(no)}`, {
            headers: { "X-Masa-Token": ozetMasaTokeni },
          });
          if (!r.ok) continue;
          const d = await r.json();
          const k = d.kalemler || [];
          // Masa boş → oturum kapatılmış → sipariş tamamlanmış
          if (k.length === 0) { yeni[no] = "kapali"; continue; }
          if (k.every((x) => x.durum === "hazir")) yeni[no] = "hazir";
          else if (k.some((x) => x.durum === "hazirlaniyor")) yeni[no] = "hazirlaniyor";
          else yeni[no] = "yeni";
        } catch { /* sunucu yok, sessizce geç */ }
      }
      if (!iptal) {
        setMasaDurumlari(yeni);
        setIlkSorguTamam(true);
      }
    };
    sorgula();
    const zamanlayici = setInterval(sorgula, 5000);
    return () => { iptal = true; clearInterval(zamanlayici); };
  }, [siparislerim, ozetMasaNo, ozetMasaTokeni]);

  const durumBilgi = (s) => {
    if (s.tip === "masa" && s.masaNo) {
      const no = String(s.masaNo);
      const d = (String(ozetMasaNo) === no && masaDurumu) || masaDurumlari[no];
      if (d === "hazir") return { yazi: "Hazır ✓", sinif: "durum--hazir" };
      if (d === "hazirlaniyor") return { yazi: "Hazırlanıyor", sinif: "durum--hazirlaniyor" };
      if (d === "yeni") return { yazi: "Alındı", sinif: "durum--yeni" };
    }
    return { yazi: "Hazırlanıyor", sinif: "durum--hazirlaniyor" };
  };

  // Masa kapatıldıysa sipariş geçmişe düşer
  const tamamlandiMi = (s) => {
    if (s.tamamlandi) return true;
    if (s.tip === "masa" && s.masaNo && masaDurumlari[String(s.masaNo)] === "kapali") return true;
    return false;
  };

  const aktifler = siparislerim.filter((s) => !tamamlandiMi(s));
  const gecmisler = siparislerim.filter((s) => tamamlandiMi(s));

  useEffect(() => {
    const simdi = new Set(gecmisler.map((siparis) => siparis.id));
    if (oncekiTamamlananlar.current) {
      const yeniTamamlanan = gecmisler.find((siparis) => !oncekiTamamlananlar.current.has(siparis.id) && !siparis.misafir && !siparis.degerlendirildi);
      if (yeniTamamlanan && !degerlendirmeFormu) degerlendirmeyiAc(yeniTamamlanan);
    }
    oncekiTamamlananlar.current = simdi;
  }, [gecmisler, degerlendirmeFormu]);

  // Durumu henüz bilinmeyen (poll edilmemiş) masa siparişi varsa bölümleri
  // gösterme — aksi halde sipariş yanlış bölümde görünüp sonra sıçrar.
  const bekleniyor = siparislerim.some(
    (s) => s.tip === "masa" && s.masaNo && !s.tamamlandi && !ilkSorguTamam
  );

  return (
    <div className="ekran orders">
      <OrtakHeader />
      <SayfaSarici>

      <div className="orders-govde">
        <h1 className="orders-baslik">Siparişlerim</h1>

        <AnimatePresence>
          {mesaj && (
            <motion.div
              className={"orders-toast orders-toast--" + mesaj.tip}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {mesaj.metin}
            </motion.div>
          )}
        </AnimatePresence>

        {siparislerim.length === 0 ? (
          <div className="orders-bos">
            <IconBag className="orders-bos-ikon" />
            <p className="orders-bos-yazi">Henüz siparişin yok</p>
            <p className="orders-bos-alt">Sipariş verdiğinde burada görünecek.</p>
            <button className="orders-bos-btn" onClick={() => git("/anasayfa")}>
              Menüye Git
            </button>
          </div>
        ) : bekleniyor ? (
          <div className="orders-yukleniyor">
            <p className="orders-bos-alt">Siparişler yükleniyor…</p>
          </div>
        ) : (
          <>
            {/* Aktif siparişler (masa açık) */}
            {aktifler.length > 0 && (
              <section className="orders-bolum">
                <h2 className="orders-bolum-baslik">Aktif Siparişler</h2>
                <div className="orders-liste">
                  {aktifler.map((s) => (
                    <SiparisKart key={s.id} s={s} durum={durumBilgi(s)} gecmis={false} onTekrarSiparisVer={tekrarSiparisVer} onDegerlendir={degerlendirmeyiAc} />
                  ))}
                </div>
              </section>
            )}

            {/* Geçmiş siparişler (masa kapatıldı) */}
            {gecmisler.length > 0 && (
              <section className="orders-bolum">
                <h2 className="orders-bolum-baslik">Geçmiş Siparişler</h2>
                <div className="orders-liste">
                  {gecmisler.map((s) => (
                    <SiparisKart key={s.id} s={s} durum={durumBilgi(s)} gecmis={true} onTekrarSiparisVer={tekrarSiparisVer} onDegerlendir={degerlendirmeyiAc} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
      </SayfaSarici>
      {degerlendirmeFormu && <DegerlendirmeModal form={degerlendirmeFormu} setForm={setDegerlendirmeFormu} onKapat={() => setDegerlendirmeFormu(null)} onKaydet={degerlendirmeyiKaydet} kaydediliyor={degerlendirmeKaydediliyor} />}
    </div>
  );
}
