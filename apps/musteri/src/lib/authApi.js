export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export function aktifIsletmeSlug() {
  if (typeof window === "undefined") return "";
  return decodeURIComponent(window.location.pathname.split("/").filter(Boolean)[0] || "").trim().toLowerCase();
}

export function tenantDepoAnahtari(anahtar, slug = aktifIsletmeSlug()) {
  const temizSlug = String(slug || "").trim().toLowerCase();
  if (!temizSlug) throw new Error("İşletme slug bilgisi bulunamadı.");
  return `${anahtar}_${temizSlug}`;
}

function tokenAnahtari() {
  return tenantDepoAnahtari("bp_token");
}

export function tokeniKaydet(token, hatirla = true) {
  const anahtar = tokenAnahtari();
  if (hatirla) {
    localStorage.setItem(anahtar, token);
    sessionStorage.removeItem(anahtar);
  } else {
    sessionStorage.setItem(anahtar, token);
    localStorage.removeItem(anahtar);
  }
}

export function tokeniAl() {
  const anahtar = tokenAnahtari();
  return localStorage.getItem(anahtar) || sessionStorage.getItem(anahtar);
}

export function tokeniSil() {
  const anahtar = tokenAnahtari();
  localStorage.removeItem(anahtar);
  sessionStorage.removeItem(anahtar);
}

export function tokenBasligi() {
  const token = tokeniAl();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function istekAt(yol, secenekler = {}) {
  const { isletmeBasligi = true, ...fetchSecenekleri } = secenekler;
  const slug = aktifIsletmeSlug();
  const headers = new Headers(fetchSecenekleri.headers || {});
  if (isletmeBasligi) {
    if (!slug) throw new Error("İşletme belirtilmedi.");
    headers.set("X-Isletme", slug);
    const token = tokeniAl();
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(`${BACKEND_URL}${yol}`, { ...fetchSecenekleri, headers });
}

async function jsonYanitiOku(yanit, varsayilanHata) {
  const icerikTipi = yanit.headers.get("content-type") || "";
  if (!icerikTipi.toLowerCase().includes("application/json")) {
    await yanit.text().catch(() => "");
    throw new Error(varsayilanHata);
  }
  try {
    return await yanit.json();
  } catch {
    throw new Error(varsayilanHata);
  }
}

async function jsonIstegi(yol, secenekler = {}, varsayilanHata = "İstek tamamlanamadı.") {
  const yanit = await istekAt(yol, secenekler);
  const veri = await jsonYanitiOku(yanit, varsayilanHata);
  if (!yanit.ok) {
    const hata = new Error(veri.hata || varsayilanHata);
    hata.status = yanit.status;
    throw hata;
  }
  return veri;
}

export async function isletmeBilgisiniGetir(slug) {
  const temizSlug = encodeURIComponent(String(slug || "").trim().toLowerCase());
  const veri = await jsonIstegi(`/api/isletme/${temizSlug}`, { isletmeBasligi: false }, "İşletme bulunamadı.");
  return { ...veri.isletme, tema: veri.tema };
}

export async function kayitOl(veri) {
  try {
    return await jsonIstegi("/api/kayit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(veri) }, "Kayıt işlemi tamamlanamadı.");
  } catch (hata) {
    return { hata: hata.message };
  }
}

export async function girisYap(email, sifre) {
  try {
    return await jsonIstegi("/api/giris", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, sifre }) }, "Giriş yapılamadı.");
  } catch (hata) {
    return { hata: hata.message };
  }
}

export async function ikiFaktorGirisiniTamamla(ikiFaktorToken, kod) {
  try {
    return await jsonIstegi("/api/giris/2fa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ikiFaktorToken, kod }) }, "İki adımlı doğrulama tamamlanamadı.");
  } catch (hata) {
    return { hata: hata.message };
  }
}

function ikiFaktorIstegi(yol, veri) {
  return jsonIstegi(`/api/2fa/${yol}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(veri) }, "İki adımlı doğrulama işlemi tamamlanamadı.");
}

export const ikiFaktorKurulumBaslat = (sifre) => ikiFaktorIstegi("kurulum-baslat", { sifre });
export const ikiFaktorKurulumOnayla = (kod) => ikiFaktorIstegi("kurulum-onayla", { kod });
export const ikiFaktorKapat = (sifre, kod) => ikiFaktorIstegi("kapat", { sifre, kod });

export async function sifirlamaTalep(email) {
  return jsonIstegi("/api/sifre-sifirlama-talep", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }, "Sıfırlama isteği gönderilemedi.");
}

export async function tokenDogrula(token) {
  try {
    return await jsonIstegi(`/api/sifre-sifirla/dogrula?token=${encodeURIComponent(token)}`, {}, "Bağlantı doğrulanamadı.");
  } catch {
    return { gecerli: false };
  }
}

export async function sifreSifirla(token, yeniSifre) {
  try {
    return await jsonIstegi("/api/sifre-sifirla", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, yeniSifre }) }, "Şifre sıfırlanamadı.");
  } catch (hata) {
    return { hata: hata.message };
  }
}

export async function beniGetir() {
  if (!tokeniAl()) return null;
  try {
    const veri = await jsonIstegi("/api/ben", {}, "Oturum doğrulanamadı.");
    return veri.kullanici;
  } catch (hata) {
    if ([401, 403].includes(hata?.status)) tokeniSil();
    return null;
  }
}

export async function davetOzetiniGetir() {
  if (!tokeniAl()) return null;
  return (await jsonIstegi("/api/davetim", {}, "Davet bilgileri alınamadı.")).davet;
}

export async function profilGuncelle(email, telefon) {
  if (!tokeniAl()) return { hata: "Giriş gerekli." };
  try {
    return await jsonIstegi("/api/profil", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, telefon }) }, "Profil güncellenemedi.");
  } catch (hata) {
    return { hata: hata.message };
  }
}

export async function duyurulariGetir() {
  try { return (await jsonIstegi("/api/duyurular", {}, "Duyurular alınamadı.")).duyurular || []; }
  catch { return []; }
}

export async function siparisGecmisiniGetir() {
  if (!tokeniAl()) return [];
  return (await jsonIstegi("/api/siparislerim", {}, "Sipariş geçmişi alınamadı.")).siparisler || [];
}

export async function sadakatOzetiniGetir() {
  if (!tokeniAl()) return null;
  return (await jsonIstegi("/api/sadakat", {}, "Sadakat bilgileri alınamadı.")).sadakat;
}

export async function damgaKartiAyariniGetir() {
  return (await jsonIstegi("/api/sadakat-ayari", {}, "Damga kartı ayarı alınamadı.")).damgaKarti;
}

export async function cuzdanOzetiniGetir() {
  if (!tokeniAl()) return null;
  return (await jsonIstegi("/api/cuzdan", {}, "Cüzdan bilgileri alınamadı.")).cuzdan;
}

export async function puanlaOdulSatinAl(odulId, istekAnahtari) {
  return (await jsonIstegi(`/api/sadakat/oduller/${encodeURIComponent(odulId)}/satin-al`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ istekAnahtari }) }, "Ödül alınamadı.")).sadakat;
}

export async function kullaniciHediyesiniKullan(hediyeId, masaNo) {
  return jsonIstegi(`/api/sadakat/hediyeler/${encodeURIComponent(hediyeId)}/kullan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ masaNo: masaNo || null }) }, "Hediye kullanılamadı.");
}

export async function odemeTaslagiOlustur(veri) {
  return (await jsonIstegi("/api/odeme/taslak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(veri) }, "Ödeme taslağı oluşturulamadı.")).odeme;
}

export async function nakitMasaDurumunuGetir(masaNo, masaToken) {
  return jsonIstegi(`/api/nakit/masa/${encodeURIComponent(masaNo)}/durum`, {
    headers: { "X-Masa-Token": masaToken || "" },
  }, "Masa durumu alınamadı.");
}

export async function nakitSiparisGonder(veri) {
  return (await jsonIstegi("/api/nakit/siparis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(veri),
  }, "Nakit sipariş gönderilemedi.")).siparis;
}

export async function iyzicoOdemesiniBaslat(odemeId, alici) {
  return (await jsonIstegi(`/api/odeme/${encodeURIComponent(odemeId)}/iyzico-baslat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alici }) }, "İyzico ödeme formu başlatılamadı.")).paymentPageUrl;
}

export async function iyzicoOdemesiniDogrula(odemeId) {
  return (await jsonIstegi(`/api/odeme/${encodeURIComponent(odemeId)}/iyzico-dogrula`, { method: "POST" }, "İyzico ödeme sonucu doğrulanamadı.")).odeme;
}

export async function odemeSonucunuGetir(odemeId) {
  return (await jsonIstegi(`/api/odeme/${encodeURIComponent(odemeId)}/sonuc`, {}, "Ödeme sonucu alınamadı.")).odeme;
}

export async function cuzdanlaOdemeyiOnayla(odemeId) {
  return jsonIstegi(`/api/odeme/${encodeURIComponent(odemeId)}/cuzdan-onay`, { method: "POST" }, "Cüzdan ödemesi tamamlanamadı.");
}
