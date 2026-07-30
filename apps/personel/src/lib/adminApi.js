const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const TOKEN = "burger-plus-admin-token";

export const adminToken = {
  al: () => sessionStorage.getItem(TOKEN),
  kaydet: (token) => sessionStorage.setItem(TOKEN, token),
  sil: () => sessionStorage.removeItem(TOKEN),
};

export async function adminGiris(email, sifre) {
  return personelGiris(email, sifre, "admin");
}

export async function personelGiris(email, sifre, ekranRolu) {
  const r = await fetch(`${BACKEND_URL}/api/giris`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, sifre }),
  });
  const veri = await r.json();
  if (!r.ok) throw new Error(veri.hata || "Giriş yapılamadı.");
  const izinler = {
    admin: ["admin"],
    mutfak: ["mutfak", "admin"],
    salon: ["salon", "kasiyer", "admin"],
  };
  if (!izinler[ekranRolu]?.includes(veri.kullanici?.rol)) {
    throw new Error("Bu hesabın seçilen bölüm için yetkisi yok.");
  }
  adminToken.kaydet(veri.token);
  return veri.kullanici;
}

export async function ilkYerelAdminOlustur(email, sifre) {
  const r = await fetch(`${BACKEND_URL}/api/yerel-admin-kurulum`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, sifre }),
  });
  const veri = await r.json();
  if (!r.ok) throw new Error(veri.hata || "İlk yönetici oluşturulamadı.");
  return veri;
}

export async function yerelAdminDurumu() {
  const r = await fetch(`${BACKEND_URL}/api/yerel-admin-durum`);
  if (!r.ok) return false;
  const veri = await r.json();
  return veri.kurulumGerekli === true;
}

export async function adminIstek(yol, secenekler = {}) {
  const r = await fetch(`${BACKEND_URL}/api/admin${yol}`, {
    ...secenekler,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken.al()}`,
      ...(secenekler.headers || {}),
    },
  });
  const veri = await r.json().catch(() => ({}));
  if (!r.ok) {
    const hata = new Error(
      veri.hata || (r.status === 401 || r.status === 403
        ? "Yönetici oturumunuz geçersiz veya süresi dolmuş. Lütfen yeniden giriş yapın."
        : `${yol} verisi alınamadı (HTTP ${r.status}).`)
    );
    hata.status = r.status;
    hata.yol = yol;
    if (r.status === 401 || r.status === 403) adminToken.sil();
    throw hata;
  }
  return veri;
}

export const jsonGonder = (method, body) => ({ method, body: JSON.stringify(body) });

const DESTEKLENEN_GORSELLER = new Set([
  "image/png", "image/jpeg", "image/webp", "image/gif", "image/avif", "image/bmp",
]);

export async function gorselYukle(dosya) {
  if (!dosya || !DESTEKLENEN_GORSELLER.has(dosya.type)) {
    throw new Error("PNG, JPG/JPEG, WebP, GIF, AVIF veya BMP formatında bir görsel seçebilirsin.");
  }
  if (dosya.size > 5 * 1024 * 1024) throw new Error("Görsel en fazla 5 MB olabilir.");
  return adminIstek("/gorseller", {
    method: "POST",
    headers: { "Content-Type": dosya.type },
    body: dosya,
  });
}
