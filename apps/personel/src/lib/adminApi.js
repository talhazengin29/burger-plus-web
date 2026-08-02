const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export function aktifIsletmeSlug() {
  const temel = String(import.meta.env.BASE_URL || "/").replace(/^\/+|\/+$/g, "");
  const parcalar = window.location.pathname.split("/").filter(Boolean);
  const temelParcalari = temel ? temel.split("/") : [];
  return decodeURIComponent(parcalar.slice(temelParcalari.length)[0] || "").trim().toLowerCase();
}

const tokenAnahtari = () => `burger-plus-admin-token_${aktifIsletmeSlug()}`;

export const adminToken = {
  al: () => sessionStorage.getItem(tokenAnahtari()),
  kaydet: (token) => sessionStorage.setItem(tokenAnahtari(), token),
  sil: () => sessionStorage.removeItem(tokenAnahtari()),
};

async function istekAt(yol, secenekler = {}) {
  const { isletmeBasligi = true, ...fetchSecenekleri } = secenekler;
  const headers = new Headers(fetchSecenekleri.headers || {});
  if (isletmeBasligi) {
    const slug = aktifIsletmeSlug();
    if (!slug) throw new Error("İşletme belirtilmedi.");
    headers.set("X-Isletme", slug);
    const token = adminToken.al();
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(`${BACKEND_URL}${yol}`, { ...fetchSecenekleri, headers });
}

async function jsonOku(r) {
  const tip = r.headers.get("content-type") || "";
  if (!tip.includes("application/json")) {
    await r.text().catch(() => "");
    throw new Error(`Sunucu geçersiz yanıt döndürdü (HTTP ${r.status}).`);
  }
  return r.json();
}

export async function isletmeBilgisiniGetir(slug) {
  const r = await istekAt(`/api/isletme/${encodeURIComponent(String(slug || "").trim().toLowerCase())}`, { isletmeBasligi: false });
  const veri = await jsonOku(r);
  if (!r.ok) throw new Error(veri.hata || "İşletme bulunamadı.");
  return veri.isletme;
}

export async function adminGiris(email, sifre) { return personelGiris(email, sifre, "admin"); }

export async function personelGiris(email, sifre, ekranRolu) {
  const r = await istekAt("/api/giris", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, sifre }) });
  const veri = await jsonOku(r);
  if (!r.ok) throw new Error(veri.hata || "Giriş yapılamadı.");
  if (veri.ikiFaktorGerekli) return veri;
  return personelGirisiniTamamla(veri, ekranRolu);
}

function personelGirisiniTamamla(veri, ekranRolu) {
  const izinler = { admin: ["admin"], mutfak: ["mutfak", "admin"], salon: ["salon", "kasiyer", "admin"] };
  if (!izinler[ekranRolu]?.includes(veri.kullanici?.rol)) throw new Error("Bu hesabın seçilen bölüm için yetkisi yok.");
  adminToken.kaydet(veri.token);
  return veri.kullanici;
}

export async function personelIkiFaktorGirisiniTamamla(ikiFaktorToken, kod, ekranRolu) {
  const r = await istekAt("/api/giris/2fa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ikiFaktorToken, kod }) });
  const veri = await jsonOku(r);
  if (!r.ok) throw new Error(veri.hata || "Doğrulama kodu geçersiz.");
  return personelGirisiniTamamla(veri, ekranRolu);
}

export async function ilkYerelAdminOlustur(email, sifre) {
  const r = await istekAt("/api/yerel-admin-kurulum", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, sifre }) });
  const veri = await jsonOku(r);
  if (!r.ok) throw new Error(veri.hata || "İlk yönetici oluşturulamadı.");
  return veri;
}

export async function yerelAdminDurumu() {
  const r = await istekAt("/api/yerel-admin-durum");
  if (!r.ok) return false;
  return (await jsonOku(r)).kurulumGerekli === true;
}

export async function adminIstek(yol, secenekler = {}) {
  const r = await istekAt(`/api/admin${yol}`, {
    ...secenekler,
    headers: { "Content-Type": "application/json", ...(secenekler.headers || {}) },
  });
  const veri = await jsonOku(r).catch(() => ({}));
  if (!r.ok) {
    const hata = new Error(veri.hata || ([401, 403].includes(r.status)
      ? "Yönetici oturumunuz geçersiz veya başka bir işletmeye ait. Lütfen yeniden giriş yapın."
      : r.status === 429 ? "Çok fazla istek gönderildi. Birkaç saniye bekleyin." : `${yol} verisi alınamadı (HTTP ${r.status}).`));
    hata.status = r.status;
    hata.yol = yol;
    if ([401, 403].includes(r.status)) adminToken.sil();
    throw hata;
  }
  return veri;
}

export const jsonGonder = (method, body) => ({ method, body: JSON.stringify(body) });

const DESTEKLENEN_GORSELLER = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif", "image/bmp"]);
export async function gorselYukle(dosya) {
  if (!dosya || !DESTEKLENEN_GORSELLER.has(dosya.type)) throw new Error("PNG, JPG/JPEG, WebP, GIF, AVIF veya BMP formatında bir görsel seçebilirsin.");
  if (dosya.size > 5 * 1024 * 1024) throw new Error("Görsel en fazla 5 MB olabilir.");
  return adminIstek("/gorseller", { method: "POST", headers: { "Content-Type": dosya.type }, body: dosya });
}
