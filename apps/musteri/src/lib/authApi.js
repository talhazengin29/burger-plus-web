/* ==========================================================================
   Backend auth API'sine baglanan yardimci fonksiyonlar.
   Token localStorage'da tutulur (oturum kalici).
   ========================================================================== */

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const TOKEN_ANAHTARI = "bp_token";

// Beni hatırla: true → localStorage (kalıcı), false → sessionStorage (sekme kapanınca gider)
export function tokeniKaydet(token, hatirla = true) {
  if (hatirla) {
    localStorage.setItem(TOKEN_ANAHTARI, token);
    sessionStorage.removeItem(TOKEN_ANAHTARI);
  } else {
    sessionStorage.setItem(TOKEN_ANAHTARI, token);
    localStorage.removeItem(TOKEN_ANAHTARI);
  }
}
export function tokeniAl() {
  // Önce kalıcı (localStorage), yoksa oturumluk (sessionStorage)
  return localStorage.getItem(TOKEN_ANAHTARI) || sessionStorage.getItem(TOKEN_ANAHTARI);
}
export function tokeniSil() {
  localStorage.removeItem(TOKEN_ANAHTARI);
  sessionStorage.removeItem(TOKEN_ANAHTARI);
}

// Kayit ol
export async function kayitOl(veri) {
  const r = await fetch(`${BACKEND_URL}/api/kayit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(veri),
  });
  return r.json();
}

// Giris yap
export async function girisYap(email, sifre) {
  const r = await fetch(`${BACKEND_URL}/api/giris`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, sifre }),
  });
  return r.json();
}

export async function ikiFaktorGirisiniTamamla(ikiFaktorToken, kod) {
  const r = await fetch(`${BACKEND_URL}/api/giris/2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ikiFaktorToken, kod }),
  });
  return r.json();
}

async function ikiFaktorIstegi(yol, veri) {
  const r = await fetch(`${BACKEND_URL}/api/2fa/${yol}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...yetkiBasligi() },
    body: JSON.stringify(veri),
  });
  const sonuc = await r.json();
  if (!r.ok) throw new Error(sonuc.hata || "İki adımlı doğrulama işlemi tamamlanamadı.");
  return sonuc;
}

export const ikiFaktorKurulumBaslat = (sifre) => ikiFaktorIstegi("kurulum-baslat", { sifre });
export const ikiFaktorKurulumOnayla = (kod) => ikiFaktorIstegi("kurulum-onayla", { kod });
export const ikiFaktorKapat = (sifre, kod) => ikiFaktorIstegi("kapat", { sifre, kod });

// Sifremi unuttum: talep gonder (backend her zaman ayni mesajla doner)
export async function sifirlamaTalep(email) {
  const r = await fetch(`${BACKEND_URL}/api/sifre-sifirlama-talep`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return r.json();
}

// Sifre sifirlama linkindeki token'i backend'de dogrula
export async function tokenDogrula(token) {
  const r = await fetch(`${BACKEND_URL}/api/sifre-sifirla/dogrula?token=${encodeURIComponent(token)}`);
  if (!r.ok) return { gecerli: false };
  return r.json();
}

// Yeni sifreyi token ile birlikte gonder
export async function sifreSifirla(token, yeniSifre) {
  const r = await fetch(`${BACKEND_URL}/api/sifre-sifirla`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, yeniSifre }),
  });
  return r.json();
}

// Token ile guncel kullanici bilgisi (sayfa yenilenince oturum korunur)
export async function beniGetir() {
  const token = tokeniAl();
  if (!token) return null;
  const r = await fetch(`${BACKEND_URL}/api/ben`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  const d = await r.json();
  return d.kullanici;
}

export async function davetOzetiniGetir() {
  const token = tokeniAl();
  if (!token) return null;
  const r = await fetch(`${BACKEND_URL}/api/davetim`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const veri = await r.json();
  if (!r.ok) throw new Error(veri.hata || "Davet bilgileri alınamadı.");
  return veri.davet;
}

// Profil guncelle (email + telefon)
export async function profilGuncelle(email, telefon) {
  const token = tokeniAl();
  if (!token) return { hata: "Giriş gerekli." };
  const r = await fetch(`${BACKEND_URL}/api/profil`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, telefon }),
  });
  return r.json();
}

export async function duyurulariGetir() {
  const r = await fetch(`${BACKEND_URL}/api/duyurular`);
  if (!r.ok) return [];
  const veri = await r.json();
  return veri.duyurular || [];
}

export async function siparisGecmisiniGetir() {
  const token = tokeniAl();
  if (!token) return [];
  const r = await fetch(`${BACKEND_URL}/api/siparislerim`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Sipariş geçmişi alınamadı.");
  const veri = await r.json();
  return veri.siparisler || [];
}

export async function sadakatOzetiniGetir() {
  const token = tokeniAl();
  if (!token) return null;
  const r = await fetch(`${BACKEND_URL}/api/sadakat`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const veri = await r.json();
  if (!r.ok) throw new Error(veri.hata || "Sadakat bilgileri alınamadı.");
  return veri.sadakat;
}

export async function puanlaOdulSatinAl(odulId, istekAnahtari) {
  const r = await fetch(`${BACKEND_URL}/api/sadakat/oduller/${encodeURIComponent(odulId)}/satin-al`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...yetkiBasligi() },
    body: JSON.stringify({ istekAnahtari }),
  });
  const veri = await r.json();
  if (!r.ok) throw new Error(veri.hata || "Ödül alınamadı.");
  return veri.sadakat;
}

export async function kullaniciHediyesiniKullan(hediyeId, masaNo) {
  const r = await fetch(`${BACKEND_URL}/api/sadakat/hediyeler/${encodeURIComponent(hediyeId)}/kullan`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...yetkiBasligi() },
    body: JSON.stringify({ masaNo: masaNo || null }),
  });
  const veri = await r.json();
  if (!r.ok) throw new Error(veri.hata || "Hediye kullanılamadı.");
  return veri;
}

function yetkiBasligi() {
  const token = tokeniAl();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function odemeTaslagiOlustur(veri) {
  const r = await fetch(`${BACKEND_URL}/api/odeme/taslak`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...yetkiBasligi() },
    body: JSON.stringify(veri),
  });
  const yanit = await r.json();
  if (!r.ok) throw new Error(yanit.hata || "Ödeme taslağı oluşturulamadı.");
  return yanit.odeme;
}

export async function iyzicoOdemesiniBaslat(odemeId, alici) {
  const r = await fetch(`${BACKEND_URL}/api/odeme/${encodeURIComponent(odemeId)}/iyzico-baslat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...yetkiBasligi() },
    body: JSON.stringify({ alici }),
  });
  const yanit = await r.json();
  if (!r.ok) throw new Error(yanit.hata || "İyzico ödeme formu başlatılamadı.");
  return yanit.paymentPageUrl;
}

export async function odemeSonucunuGetir(odemeId) {
  const r = await fetch(`${BACKEND_URL}/api/odeme/${encodeURIComponent(odemeId)}/sonuc`, {
    headers: yetkiBasligi(),
  });
  const yanit = await r.json();
  if (!r.ok) throw new Error(yanit.hata || "Ödeme sonucu alınamadı.");
  return yanit.odeme;
}
