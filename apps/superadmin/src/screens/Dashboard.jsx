import { useEffect, useState } from "react";
import { buyumeRaporu, ciroRaporu, gelirRaporu, kayitlariGetir, ozetGetir } from "../lib/superApi";
import { CizgiGrafik, CubukGrafik, Hata, Metrik, para, sayi, tarih, Yukleme } from "../components/Ui";

export default function Dashboard() {
  const [veri, setVeri] = useState(null);
  const [hata, setHata] = useState("");
  useEffect(() => {
    let aktif = true;
    Promise.all([ozetGetir(), ciroRaporu(30), buyumeRaporu(12), kayitlariGetir({ limit: 10 }), gelirRaporu(12)])
      .then(([ozet, ciro, buyume, kayit, gelir]) => { if (aktif) setVeri({ ozet, ciro, buyume, kayit: kayit.kayitlar, gelir }); })
      .catch((e) => { if (aktif) setHata(e.message); });
    return () => { aktif = false; };
  }, []);
  if (!veri && !hata) return <Yukleme />;
  if (!veri) return <Hata mesaj={hata} />;
  return <div className="sayfa"><Hata mesaj={hata} /><section className="metrikler"><Metrik baslik="Toplam işletme" deger={sayi(veri.ozet.toplamIsletme)} alt={`${veri.ozet.aktifIsletme} aktif · ${veri.ozet.pasifIsletme} pasif`} /><Metrik baslik="Aylık tekrarlayan gelir" deger={para(veri.ozet.mrr)} alt="Güncel MRR" ton="yesil" /><Metrik baslik="Bu ay sipariş" deger={sayi(veri.ozet.buAySiparis)} alt={`${para(veri.ozet.toplamCiro)} platform cirosu`} ton="mavi" /><Metrik baslik="Kayıtlı kullanıcı" deger={sayi(veri.ozet.toplamKullanici)} alt={`${sayi(veri.ozet.aktifKullanici)} son 30 günde aktif`} ton="turkuaz" /></section><section className="iki-kolon"><article className="panel"><header><div><h2>İşletme bazlı ciro</h2><p>Son 30 gün karşılaştırması</p></div><b>{para(veri.ciro.isletmeler.reduce((t, i) => t + i.ciro, 0))}</b></header><CubukGrafik veriler={veri.ciro.isletmeler} /></article><article className="panel"><header><div><h2>Platform büyümesi</h2><p>Son 12 ay toplam ciro eğilimi</p></div></header><CizgiGrafik veriler={veri.buyume} /></article></section><section className="iki-kolon alt"><article className="panel"><header><div><h2>MRR trendi</h2><p>Aktif ve deneme abonelikleri</p></div><b>{para(veri.gelir.guncelMrr)}</b></header><CizgiGrafik veriler={veri.gelir.seri} deger="mrr" /></article><article className="panel"><header><div><h2>Son işlemler</h2><p>Super admin denetim izi</p></div></header><div className="islem-listesi">{veri.kayit.map((kayit) => <div key={kayit.id}><i /><span><b>{kayit.islem}</b><small>{kayit.superAdmin.ad} · {kayit.isletmeAd}</small></span><time>{tarih(kayit.olusturma)}</time></div>)}</div></article></section></div>;
}
