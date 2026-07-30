/* ==========================================================================
   Backend'e Socket.io baglantisi (mutfak uygulamasi).
   ========================================================================== */

import { io } from "socket.io-client";
import { adminToken } from "./adminApi";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export const socket = io(BACKEND_URL, {
  autoConnect: false,
  auth: (tamamlandi) => tamamlandi({ token: adminToken.al() || "" }),
});

export function personelSocketiniBagla() {
  if (socket.connected) socket.disconnect();
  socket.connect();
}

export function personelSocketiniKes() {
  socket.disconnect();
}

socket.on("connect", () => console.log("Mutfak backend'e baglandi:", socket.id));
socket.on("disconnect", () => console.log("Mutfak baglantisi kesildi"));
socket.on("connect_error", (e) =>
  console.warn("Backend'e ulasilamiyor:", e.message)
);
