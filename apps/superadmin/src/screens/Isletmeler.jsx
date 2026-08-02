import { useEffect, useMemo, useState } from "react";
import { erisimTokeniOlustur, isletmeDurumuDegistir, isletmeleriGetir, personelPanelineGit } from "../lib/superApi";
import { DurumRozeti, Hata, para, sayi, Yukleme } from "../components/Ui";
import IsletmeDetay from "./IsletmeDetay";
import KurulumSihirbazi from "./KurulumSihirbazi";

export default function Isletmeler() {
  const [isletmeler, setIsletmeler] = useState(null);
  const [secili, setSecili] = useState(null);
  const [sihirbazAcik, setSihirbazAcik] = useState(false);
  const [filtre, setFiltre] = useState({ arama: "", konsept: "", durum: "" });
  const [hata, setHata] = useState("");
  const [islemde, setIslemde] = useState(false);
  const yukle = () => isletmeleriGetir().then((v) => setIsletmeler(v.isletmeler)).catch((e) => setHata(e.message));
  useEffect(() => { yukle(); }, []);

  const liste = useMemo(() => (isletmeler || []).filter((isletme) => {
    const arama = filtre.arama.toLocaleLowerCase("tr");
    const durum = isletme.silinmeTarihi ? "siliniyor" : isletme.aktif ? "aktif" : "askida";
    return (!arama || `${isletme.ad} ${isletme.slug}`.toLocaleLowerCase("tr").includes(arama))
      && (!filtre.konsept || isletme.konsept === filtre.konsept)
      && (!filtre.durum || durum === filtre.durum);
  }), [filtre, isletmeler]);

  const hizli = async (olay, islem) => {
    olay.stopPropagation(); setIslemde(true); setHata("");
    try { await islem(); await yukle(); } catch (err) { setHata(err.message); } finally { setIslemde(false); }
  };
  if (!isletmeler && !hata) return <Yukleme />;

  return <div className="sayfa">
    <div className="sayfa-araclari"><div><h2>İşletme yönetimi</h2><p>Tüm tenant'ları, abonelikleri ve erişim durumlarını tek yerden yönetin.</p></div><button onClick={() => setSihirbazAcik(true)}>+ Yeni İşletme</button></div>
    <Hata mesaj={hata} />
    <section className="filtreler"><input type="search" placeholder="İşletme adı veya slug ara…" value={filtre.arama} onChange={(e) => setFiltre({ ...filtre, arama: e.target.value })} /><select value={filtre.konsept} onChange={(e) => setFiltre({ ...filtre, konsept: e.target.value })}><option value="">Tüm konseptler</option><option value="burger">Burger</option><option value="cafe">Cafe</option><option value="pizza">Pizza</option></select><select value={filtre.durum} onChange={(e) => setFiltre({ ...filtre, durum: e.target.value })}><option value="">Tüm durumlar</option><option value="aktif">Aktif</option><option value="askida">Askıda</option><option value="siliniyor">Siliniyor</option></select><span>{liste.length} işletme</span></section>
    <section className="tablo-panel"><table><thead><tr><th>İşletme</th><th>Konsept</th><th>Durum</th><th>Kullanıcı</th><th>Aylık ciro</th><th>Plan</th><th>Hızlı işlemler</th></tr></thead><tbody>{liste.map((isletme) => <tr key={isletme.id} onClick={() => setSecili(isletme.id)}><td><div className="isletme-hucre"><i>{isletme.logoUrl ? <img src={isletme.logoUrl} alt="" /> : isletme.ad.slice(0, 2).toUpperCase()}</i><span><b>{isletme.ad}</b><small>/{isletme.slug}</small></span></div></td><td><span className="konsept">{isletme.konsept}</span></td><td><DurumRozeti durum={isletme.silinmeTarihi ? "siliniyor" : isletme.aktif ? "aktif" : "askida"} /></td><td>{sayi(isletme.kullaniciSayisi)}</td><td><strong>{para(isletme.aylikCiro)}</strong></td><td>{isletme.abonelik?.plan || "—"}</td><td><div className="satir-islem"><button disabled={islemde} onClick={(e) => { e.stopPropagation(); const soru = isletme.silinmeTarihi ? `${isletme.ad} yumuşak silmeden geri yüklensin mi?` : isletme.aktif ? `${isletme.ad} askıya alınsın mı? Müşteri sitesi kapanacaktır.` : `${isletme.ad} yeniden etkinleştirilsin mi?`; if (window.confirm(soru)) hizli(e, () => isletmeDurumuDegistir(isletme.id, isletme.silinmeTarihi ? true : !isletme.aktif)); }}>{isletme.silinmeTarihi ? "Geri yükle" : isletme.aktif ? "Askıya al" : "Aç"}</button><button disabled={islemde || isletme.silinmeTarihi} onClick={(e) => hizli(e, async () => { const v = await erisimTokeniOlustur(isletme.id); personelPanelineGit(v.token); })}>Panele git ↗</button></div></td></tr>)}</tbody></table></section>
    {secili && <><button className="detay-perde" aria-label="Detayı kapat" onClick={() => setSecili(null)} /><IsletmeDetay id={secili} kapat={() => setSecili(null)} degisti={yukle} /></>}
    {sihirbazAcik && <KurulumSihirbazi kapat={() => setSihirbazAcik(false)} tamamlandi={() => yukle()} />}
  </div>;
}
