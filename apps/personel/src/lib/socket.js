import { io } from "socket.io-client";
import { adminToken, aktifIsletmeSlug } from "./adminApi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
export const socket = io(BACKEND_URL, { autoConnect: false });

export function personelSocketiniBagla() {
  const isletme = aktifIsletmeSlug();
  socket.auth = { isletme, token: adminToken.al() || "" };
  if (socket.connected) socket.disconnect();
  socket.connect();
}

export function personelSocketiniKes() { socket.disconnect(); }

socket.on("connect", () => console.log("Personel backend'e bağlandı:", socket.id));
socket.on("disconnect", () => console.log("Personel bağlantısı kesildi"));
socket.on("connect_error", (e) => console.warn("Backend'e ulaşılamıyor:", e.message));
