import { useState } from "react";
import { superGiris, superIkiFaktor, superToken } from "../lib/superApi";
import { Hata } from "../components/Ui";

export default function Login({ onGiris }) {
  const [form, setForm] = useState({ email: "", sifre: "", kod: "" });
  const [ikiFaktor, setIkiFaktor] = useState(null);
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const gonder = async (e) => {
    e.preventDefault(); setHata(""); setYukleniyor(true);
    try {
      if (!ikiFaktor) {
        const sonuc = await superGiris(form.email.trim(), form.sifre);
        setIkiFaktor(sonuc);
        setForm((onceki) => ({ ...onceki, sifre: "" }));
      } else {
        if (!/^\d{6}$/.test(form.kod.trim())) throw new Error("Authenticator uygulamasındaki 6 haneli kodu girin.");
        const sonuc = await superIkiFaktor(ikiFaktor.ikiFaktorToken, form.kod.trim());
        superToken.kaydet(sonuc.token);
        onGiris(sonuc.superAdmin);
      }
    } catch (istekHatasi) { setHata(istekHatasi.message); }
    finally { setYukleniyor(false); }
  };

  return <main className="super-login"><section><header><i>BP</i><div><span>BURGER PLUS</span><h1>Platform Yönetimi</h1><p>Bu alan yalnızca yetkili platform yöneticilerine açıktır.</p></div></header><div className="guvenlik-notu"><b>Yüksek güvenlikli oturum</b><span>4 saatlik oturum · zorunlu iki faktör · işlem denetimi</span></div><form onSubmit={gonder}><Hata mesaj={hata} />{ikiFaktor ? <><div className="adim"><i>2</i><div><b>İki faktör doğrulama</b><span>{ikiFaktor.ikiFaktorKurulumGerekli ? "Authenticator kurulumunu tamamlayın" : "Authenticator kodunuzu girin"}</span></div></div>{ikiFaktor.ikiFaktorKurulumGerekli && <div className="totp-kurulum"><b>İlk kurulum anahtarı</b><code>{ikiFaktor.secret}</code><p>Bu anahtarı Google Authenticator, Microsoft Authenticator veya uyumlu bir TOTP uygulamasına ekleyin. Kod doğrulanmadan oturum açılmaz.</p><a href={ikiFaktor.otpauthUri}>Authenticator uygulamasında aç</a></div>}<label><span>6 haneli doğrulama kodu</span><input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength="6" value={form.kod} onChange={(e) => setForm({ ...form, kod: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="000000" /></label><button disabled={yukleniyor}>{yukleniyor ? "Doğrulanıyor…" : "Güvenli Oturumu Aç"}</button><button type="button" className="ikincil" onClick={() => { setIkiFaktor(null); setForm((onceki) => ({ ...onceki, kod: "" })); }}>Girişe dön</button></> : <><div className="adim"><i>1</i><div><b>Yönetici kimliği</b><span>E-posta ve şifrenizle devam edin</span></div></div><label><span>E-posta</span><input type="email" autoComplete="username" required maxLength="254" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label><span>Şifre</span><input type="password" autoComplete="current-password" required maxLength="72" value={form.sifre} onChange={(e) => setForm({ ...form, sifre: e.target.value })} /></label><button disabled={yukleniyor}>{yukleniyor ? "Kontrol ediliyor…" : "İki Faktör Adımına Geç"}</button></>}</form><footer>Yetkili oturumlarda yapılan işlemler denetim günlüğüne yazılır.</footer></section></main>;
}
