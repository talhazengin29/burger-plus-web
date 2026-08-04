import { useEffect, useRef, useState } from "react";
import { abonelikGuncelle, abonelikOlustur, erisimTokeniOlustur, isletmeAdminiKaydet, isletmeAdminleriniGetir, isletmeDurumuDegistir, isletmeGetir, isletmeGuncelle, isletmeSil, personelPanelineGit } from "../lib/superApi";
import { qrPdfIndir } from "../lib/qrPdf";
import { Basari, DurumRozeti, Hata, Metrik, para, sayi, Yukleme } from "../components/Ui";

export default function IsletmeDetay({ id, kapat, degisti }) {
  const [veri, setVeri] = useState(null);
  const [form, setForm] = useState(null);
  const [abonelik, setAbonelik] = useState(null);
  const [hata, setHata] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [islemde, setIslemde] = useState(false);
  const [onay, setOnay] = useState("");
  const [adminler, setAdminler] = useState([]);
  const [adminForm, setAdminForm] = useState({ ad: "", soyad: "", email: "", sifre: "" });
  const panelRef = useRef(null);

  const adminleriYukle = () => isletmeAdminleriniGetir(id)
    .then((sonuc) => setAdminler(sonuc.adminler || []))
    .catch(() => setAdminler([]));

  const yukle = () => isletmeGetir(id).then((sonuc) => {
    setVeri(sonuc);
    const isletme = sonuc.isletme;
    setForm({ ad: isletme.ad, slug: isletme.slug, konsept: isletme.konsept, iletisimEmail: isletme.iletisimEmail || "", iletisimTelefon: isletme.iletisimTelefon || "", adres: isletme.adres || "", notlar: isletme.notlar || "" });
    setAbonelik(isletme.abonelik ? { ...isletme.abonelik, baslangicTarihi: String(isletme.abonelik.baslangicTarihi).slice(0, 10), bitisTarihi: isletme.abonelik.bitisTarihi ? String(isletme.abonelik.bitisTarihi).slice(0, 10) : "" } : { plan: "baslangic", aylikUcret: 0, durum: "deneme", baslangicTarihi: new Date().toISOString().slice(0, 10), bitisTarihi: "", notlar: "" });
  }).catch((err) => setHata(err.message));

  useEffect(() => {
    setVeri(null); setHata(""); setAdminler([]);
    setAdminForm({ ad: "", soyad: "", email: "", sifre: "" });
    yukle(); adminleriYukle();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Panel artık sayfa akışında; açılınca görünür alana getirilir.
  useEffect(() => {
    if (veri && panelRef.current) panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [veri]);

  const calistir = async (islem, basari) => {
    setIslemde(true); setHata(""); setMesaj("");
    try { await islem(); setMesaj(basari); await yukle(); degisti(); } catch (err) { setHata(err.message); } finally { setIslemde(false); }
  };
  const adminKaydet = async () => {
    setIslemde(true); setHata(""); setMesaj("");
    try {
      const sonuc = await isletmeAdminiKaydet(id, adminForm);
      setMesaj(sonuc.olusturuldu
        ? `Yönetici hesabı oluşturuldu: ${sonuc.admin.email}`
        : sonuc.oncekiRol && sonuc.oncekiRol !== "admin"
          ? `${sonuc.admin.email} hesabı "${sonuc.oncekiRol}" rolünden yöneticiliğe yükseltildi ve şifresi yenilendi.`
          : `${sonuc.admin.email} hesabının şifresi yenilendi. Açık oturumları kapandı.`);
      setAdminForm({ ad: "", soyad: "", email: "", sifre: "" });
      await adminleriYukle();
    } catch (err) { setHata(err.message); } finally { setIslemde(false); }
  };

  if (!veri || !form || !abonelik) return <aside className="detay-panel" ref={panelRef}><button className="detay-kapat" onClick={kapat}>×</button>{hata ? <Hata mesaj={hata} /> : <Yukleme />}</aside>;

  const isletme = veri.isletme;
  const tema = veri.tema;
  const paneleGit = async () => {
    setIslemde(true);
    try { const sonuc = await erisimTokeniOlustur(isletme.id); personelPanelineGit(sonuc.token); } catch (err) { setHata(err.message); setIslemde(false); }
  };
  const qrIndir = async () => {
    setIslemde(true); setHata("");
    try { await qrPdfIndir({ slug: isletme.slug, ad: isletme.ad, masaSayisi: isletme.masaSayisi }); } catch (err) { setHata(err.message); } finally { setIslemde(false); }
  };
  const sil = async () => {
    if (onay !== isletme.slug) return setHata("Silmek için işletmenin slug değerini birebir yazın.");
    if (!window.confirm(`${isletme.ad} yumuşak silmeye alınacak. ${isletme.kullaniciSayisi} kullanıcı ve ${isletme.siparisSayisi} sipariş etkilenecek. Devam edilsin mi?`)) return;
    setIslemde(true);
    try { await isletmeSil(isletme.id, onay); degisti(); kapat(); } catch (err) { setHata(err.message); } finally { setIslemde(false); }
  };

  return <aside className="detay-panel" ref={panelRef}>
    <button className="detay-kapat" onClick={kapat}>×</button>
    <header className="detay-baslik"><span className="detay-logo">{isletme.logoUrl ? <img src={isletme.logoUrl} alt="" /> : isletme.ad.slice(0, 2).toUpperCase()}</span><div><small>{isletme.slug}</small><h2>{isletme.ad}</h2><DurumRozeti durum={isletme.silinmeTarihi ? "siliniyor" : isletme.aktif ? "aktif" : "askida"} /></div></header>
    <Hata mesaj={hata} /><Basari mesaj={mesaj} />
    <section className="detay-metrikler"><Metrik baslik="Kullanıcı" deger={sayi(isletme.kullaniciSayisi)} /><Metrik baslik="Sipariş" deger={sayi(isletme.siparisSayisi)} ton="mavi" /><Metrik baslik="Toplam ciro" deger={para(isletme.toplamCiro)} ton="yesil" /><Metrik baslik="Personel" deger={sayi(isletme.personelSayisi)} ton="turkuaz" /></section>
    <div className="detay-ust-islemler"><button className="panel-erisim" disabled={islemde || isletme.silinmeTarihi} onClick={paneleGit}>Bu işletmenin paneline git ↗</button><button className="panel-erisim ikincil" disabled={islemde} onClick={qrIndir}>{isletme.masaSayisi || 10} Masa QR Kodunu İndir</button></div>

    <section className="detay-bolum"><h3>Genel bilgiler</h3><div className="form-grid"><label><span>İşletme adı</span><input value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} /></label><label><span>Slug</span><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} /></label><label><span>Konsept</span><select value={form.konsept} onChange={(e) => setForm({ ...form, konsept: e.target.value })}><option value="burger">Burger</option><option value="cafe">Cafe</option><option value="pizza">Pizza</option></select></label><label><span>İletişim e-postası</span><input type="email" value={form.iletisimEmail} onChange={(e) => setForm({ ...form, iletisimEmail: e.target.value })} /></label><label><span>Telefon</span><input value={form.iletisimTelefon} onChange={(e) => setForm({ ...form, iletisimTelefon: e.target.value })} /></label><label className="tam"><span>Adres</span><textarea value={form.adres} onChange={(e) => setForm({ ...form, adres: e.target.value })} /></label><label className="tam"><span>Notlar</span><textarea value={form.notlar} onChange={(e) => setForm({ ...form, notlar: e.target.value })} /></label></div><button disabled={islemde} onClick={() => calistir(() => isletmeGuncelle(isletme.id, form), "İşletme bilgileri güncellendi.")}>Bilgileri Kaydet</button></section>

    <section className="detay-bolum"><h3>Abonelik</h3><div className="form-grid"><label><span>Plan</span><select value={abonelik.plan} onChange={(e) => setAbonelik({ ...abonelik, plan: e.target.value })}><option value="baslangic">Başlangıç</option><option value="profesyonel">Profesyonel</option><option value="kurumsal">Kurumsal</option></select></label><label><span>Aylık ücret</span><input type="number" min="0" value={abonelik.aylikUcret} onChange={(e) => setAbonelik({ ...abonelik, aylikUcret: e.target.value })} /></label><label><span>Durum</span><select value={abonelik.durum} onChange={(e) => setAbonelik({ ...abonelik, durum: e.target.value })}><option value="aktif">Aktif</option><option value="deneme">Deneme</option><option value="askida">Askıda</option><option value="iptal">İptal</option></select></label><label><span>Bitiş tarihi</span><input type="date" value={abonelik.bitisTarihi || ""} onChange={(e) => setAbonelik({ ...abonelik, bitisTarihi: e.target.value })} /></label><label className="tam"><span>Abonelik notu</span><textarea value={abonelik.notlar || ""} onChange={(e) => setAbonelik({ ...abonelik, notlar: e.target.value })} /></label></div><button disabled={islemde} onClick={() => calistir(() => abonelik.id ? abonelikGuncelle(abonelik.id, abonelik) : abonelikOlustur({ ...abonelik, isletmeId: isletme.id }), "Abonelik güncellendi.")}>Aboneliği Kaydet</button></section>

    <section className="detay-bolum">
      <h3>İşletme yöneticisi</h3>
      <p className="bolum-ipucu">Buradan tanımladığınız e-posta ve şifreyle işletme sahibi kendi paneline giriş yapar. Var olan bir e-postayı tekrar girerseniz o hesabın şifresi yenilenir ve açık oturumları kapanır. Girilen şifre geçicidir; ilk girişte kendi şifresini belirlemesi istenir.</p>
      {adminler.length
        ? <ul className="admin-listesi">{adminler.map((admin) => <li key={admin.id}><span><b>{admin.ad} {admin.soyad}</b><small>{admin.email}</small></span><em>{admin.ikiFaktorAktif ? "2FA açık" : "2FA kapalı"}</em></li>)}</ul>
        : <p className="bolum-ipucu uyari">Bu işletmenin tanımlı bir yöneticisi yok; sahibi panele giriş yapamaz.</p>}
      <div className="form-grid">
        <label><span>Ad</span><input value={adminForm.ad} onChange={(e) => setAdminForm({ ...adminForm, ad: e.target.value })} /></label>
        <label><span>Soyad</span><input value={adminForm.soyad} onChange={(e) => setAdminForm({ ...adminForm, soyad: e.target.value })} /></label>
        <label><span>E-posta</span><input type="email" autoComplete="off" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} /></label>
        <label><span>Şifre (en az 8 karakter)</span><input type="text" autoComplete="new-password" value={adminForm.sifre} onChange={(e) => setAdminForm({ ...adminForm, sifre: e.target.value })} /></label>
      </div>
      <button disabled={islemde} onClick={adminKaydet}>Yöneticiyi Kaydet</button>
    </section>

    <section className="detay-bolum"><h3>Tema önizlemesi</h3><div className="tema-serit" style={{ "--isletme-accent": tema.renkler.accent, "--isletme-bg": tema.renkler.bgPrimary, "--isletme-card": tema.renkler.bgCard }}><div>{isletme.logoUrl ? <img src={isletme.logoUrl} alt="" /> : <b>{isletme.ad}</b>}<h4>{tema.metinler.slogan}</h4><span>{tema.metinler.kampanyaBaslik}</span></div><code>{tema.renkler.accent} · {tema.font.baslik}</code></div></section>

    <section className="detay-bolum tehlikeli"><h3>Tehlikeli bölge</h3><p>{isletme.silinmeTarihi ? "Bu işletme 30 günlük yumuşak silme bekleme döneminde; kalıcı silme uygulanmadan geri yüklenebilir." : "Askıya alınan işletmenin müşteri sitesi kapanır. Silme işlemi önce 30 günlük yumuşak silme durumuna geçer."}</p><div className="tehlike-islemleri"><button disabled={islemde} onClick={() => { const soru = isletme.silinmeTarihi ? "İşletme yumuşak silmeden geri yüklensin mi?" : isletme.aktif ? "İşletme askıya alınsın mı? Müşteri sitesi kapanacaktır." : "İşletme yeniden etkinleştirilsin mi?"; if (window.confirm(soru)) calistir(() => isletmeDurumuDegistir(isletme.id, isletme.silinmeTarihi ? true : !isletme.aktif), isletme.silinmeTarihi ? "İşletme geri yüklendi." : isletme.aktif ? "İşletme askıya alındı." : "İşletme etkinleştirildi."); }}>{isletme.silinmeTarihi ? "Geri Yükle" : isletme.aktif ? "Askıya Al" : "Etkinleştir"}</button><input disabled={Boolean(isletme.silinmeTarihi)} placeholder={`Onay için ${isletme.slug} yazın`} value={onay} onChange={(e) => setOnay(e.target.value)} /><button className="sil" disabled={islemde || isletme.silinmeTarihi} onClick={sil}>Yumuşak Sil</button></div></section>
  </aside>;
}
