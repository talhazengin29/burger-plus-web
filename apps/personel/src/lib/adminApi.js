const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const TOKEN = "burger-plus-admin-token";

export const adminToken = {
  al: () => sessionStorage.getItem(TOKEN),
  kaydet: (token) => sessionStorage.setItem(TOKEN, token),
  sil: () => sessionStorage.removeItem(TOKEN),
};

export async function adminGiris(email, sifre) {
  const r = await fetch(`${BACKEND_URL}/api/giris`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, sifre }),
  });
  const veri = await r.json();
  if (!r.ok) throw new Error(veri.hata || "Giriş yapılamadı.");
  if (veri.kullanici?.rol !== "admin") throw new Error("Bu hesabın yönetici yetkisi yok.");
  adminToken.kaydet(veri.token);
  return veri.kullanici;
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
  if (!r.ok) throw new Error(veri.hata || "İşlem tamamlanamadı.");
  return veri;
}

export const jsonGonder = (method, body) => ({ method, body: JSON.stringify(body) });
