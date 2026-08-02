import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export const socket = io(BACKEND_URL, { autoConnect: false });

function tenantTokeni(slug) {
  const anahtar = `bp_token_${slug}`;
  return localStorage.getItem(anahtar) || sessionStorage.getItem(anahtar) || "";
}

export function socketIsletmesiniAyarla(slug) {
  const temizSlug = String(slug || "").trim().toLowerCase();
  if (!temizSlug) return;
  const token = tenantTokeni(temizSlug);
  const degisti = socket.auth?.isletme !== temizSlug || socket.auth?.token !== token;
  socket.auth = { isletme: temizSlug, ...(token ? { token } : {}) };
  if (degisti && socket.connected) socket.disconnect();
  if (!socket.connected) socket.connect();
}

socket.on("connect", () => console.log("Backend'e bağlanıldı:", socket.id));
socket.on("disconnect", () => console.log("Backend bağlantısı kesildi"));
socket.on("connect_error", (e) => console.warn("Backend'e bağlanılamadı:", e.message));
