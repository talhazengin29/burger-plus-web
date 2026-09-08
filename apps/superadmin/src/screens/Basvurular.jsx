import { useEffect, useState } from "react";
import { basvuruGuncelle, basvurulariGetir } from "../lib/superApi";
import { Basari, Bos, Hata, Metrik, tarih, Yukleme } from "../components/Ui";

const DURUMLAR = [
  ["yeni", "Yeni"],
  ["iletisime_gecildi", "İletişime geçildi"],
  ["teklif_verildi", "Teklif verildi"],
  ["musteri_oldu", "Müşteri oldu"],
  ["reddedildi", "Reddedildi"],
  ["spam", "Spam"],
];
const durumAdi = (durum) => DURUMLAR.find(([deger]) => deger === durum)?.[1] || durum;
const telefonAdresi = (telefon) => `tel:+${String(telefon || "").replace(/\D/g, "").replace(/^0/, "90")}`;
const whatsappAdresi = (telefon) => `https://wa.me/${String(telefon || "").replace(/\D/g, "").replace(/^0/, "90")}`;

export default function Basvurular() {
  const [veri, setVeri] = useState(null);
  const [filtre, setFiltre] = useState({ durum: "", arama: "" });
  const [secili, setSecili] = useState(null);
  const [hata, setHata] = useState("");
  const [basari, setBasari] = useState("");
  const [islemde, setIslemde] = useState(false);

  const yukle = async (guncelFiltre = filtre) => {
    setHata("");
    try { setVeri(await basvurulariGetir(guncelFiltre)); }
    catch (e) { setHata(e.message); }
  };

  useEffect(() => {
    let aktif = true;
    basvurulariGetir({}).then((sonuc) => { if (aktif) setVeri(sonuc); }).catch((e) => { if (aktif) setHata(e.message); });
    return () => { aktif = false; };
  }, []);

  const filtrele = (e) => { e.preventDefault(); yukle(filtre); };
  const temizle = () => { const bos = { durum: "", arama: "" }; setFiltre(bos); yukle(bos); };
  const kaydet = async (e) => {
    e.preventDefault();
    setIslemde(true); setHata(""); setBasari("");
    try {
      const sonuc = await basvuruGuncelle(secili.id, { durum: secili.durum, yoneticiNotu: secili.yoneticiNotu });
      setSecili(null);
      setBasari("Başvuru güncellendi.");
      await yukle(filtre);
      if (sonuc.basvuru?.durum === "musteri_oldu") setBasari("Başvuru müşteri olarak işaretlendi.");
    } catch (e) { setHata(e.message); }
    finally { setIslemde(false); }
  };

  if (!veri && !hata) return <Yukleme yazi="Başvurular yükleniyor…" />;
  const basvurular = veri?.basvurular || [];
  const ozet = veri?.ozet || {};

  return <div className="sayfa basvuru-sayfasi">
    <div className="sayfa-araclari">
      <div><h2>Satış başvuruları</h2><p>Landing sayfasından gelen işletmeleri takip edin ve satış sürecini yönetin.</p></div>
      <button type="button" onClick={() => yukle(filtre)}>Yenile</button>
    </div>
    <Hata mesaj={hata} /><Basari mesaj={basari} />
    {veri && <>
      <section className="metrikler">
        <Metrik baslik="Yeni" deger={ozet.yeni || 0} alt="işlem bekliyor" />
        <Metrik baslik="İletişimde" deger={ozet.iletisimeGecildi || 0} alt="görüşme başladı" ton="mavi" />
        <Metrik baslik="Teklif" deger={ozet.teklifVerildi || 0} alt="teklif verildi" ton="turkuaz" />
        <Metrik baslik="Müşteri oldu" deger={ozet.musteriOldu || 0} alt={`${ozet.buAy || 0} başvuru bu ay`} ton="yesil" />
      </section>

      <form className="filtreler basvuru-filtre" onSubmit={filtrele}>
        <input aria-label="Başvurularda ara" placeholder="İsim, işletme, telefon veya e-posta ara…" value={filtre.arama} onChange={(e) => setFiltre({ ...filtre, arama: e.target.value })} />
        <select aria-label="Başvuru durumu" value={filtre.durum} onChange={(e) => setFiltre({ ...filtre, durum: e.target.value })}>
          <option value="">Tüm durumlar</option>
          {DURUMLAR.map(([deger, ad]) => <option key={deger} value={deger}>{ad}</option>)}
        </select>
        <button type="submit">Filtrele</button>
        <button type="button" className="ikincil" onClick={temizle}>Temizle</button>
        <span>{basvurular.length} kayıt</span>
      </form>

      {!basvurular.length ? <Bos yazi="Bu filtreye uygun başvuru bulunamadı." /> : <section className="tablo-panel basvuru-tablo">
        <table><thead><tr><th>Başvuru</th><th>İletişim</th><th>Paket</th><th>Durum</th><th>Tarih</th><th /></tr></thead>
          <tbody>{basvurular.map((basvuru) => <tr key={basvuru.id}>
            <td><b>{basvuru.isletmeAdi}</b><small>{basvuru.adSoyad}{basvuru.masaSayisi ? ` · ${basvuru.masaSayisi} masa` : ""}</small></td>
            <td><a href={telefonAdresi(basvuru.telefon)}>{basvuru.telefon}</a>{basvuru.email && <small><a href={`mailto:${basvuru.email}`}>{basvuru.email}</a></small>}</td>
            <td>{basvuru.paket}</td>
            <td><span className={`basvuru-durum ${basvuru.durum}`}>{durumAdi(basvuru.durum)}</span></td>
            <td><time>{tarih(basvuru.olusturma)}</time></td>
            <td><button type="button" onClick={() => setSecili({ ...basvuru })}>İncele</button></td>
          </tr>)}</tbody>
        </table>
      </section>}
    </>}

    {secili && <div className="modal-perde"><form className="modal basvuru-modal" onSubmit={kaydet}>
      <header><div><small>SATIŞ BAŞVURUSU</small><h2>{secili.isletmeAdi}</h2><p>{secili.adSoyad} · {tarih(secili.olusturma)}</p></div><button type="button" onClick={() => setSecili(null)}>×</button></header>
      <div className="basvuru-detay-grid">
        <div><span>Telefon</span><b>{secili.telefon}</b><nav><a href={telefonAdresi(secili.telefon)}>Ara</a><a href={whatsappAdresi(secili.telefon)} target="_blank" rel="noreferrer">WhatsApp</a></nav></div>
        <div><span>E-posta</span><b>{secili.email || "Belirtilmedi"}</b>{secili.email && <nav><a href={`mailto:${secili.email}`}>E-posta gönder</a></nav>}</div>
        <div><span>İlgilendiği paket</span><b>{secili.paket}</b></div>
        <div><span>Masa sayısı</span><b>{secili.masaSayisi || "Belirtilmedi"}</b></div>
      </div>
      {secili.mesaj && <section className="basvuru-mesaj"><span>Müşteri notu</span><p>{secili.mesaj}</p></section>}
      <div className="form-grid">
        <label><span>Satış durumu</span><select value={secili.durum} onChange={(e) => setSecili({ ...secili, durum: e.target.value })}>{DURUMLAR.map(([deger, ad]) => <option key={deger} value={deger}>{ad}</option>)}</select></label>
        <label className="tam"><span>Yönetici notu</span><textarea rows="5" maxLength="3000" placeholder="Görüşme sonucu, takip tarihi veya teklif ayrıntısı…" value={secili.yoneticiNotu || ""} onChange={(e) => setSecili({ ...secili, yoneticiNotu: e.target.value })} /></label>
      </div>
      <footer><button type="button" className="ikincil" onClick={() => setSecili(null)}>Vazgeç</button><button disabled={islemde}>{islemde ? "Kaydediliyor…" : "Başvuruyu Güncelle"}</button></footer>
    </form></div>}
  </div>;
}
