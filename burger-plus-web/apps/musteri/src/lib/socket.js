/* ==========================================================================
   Backend'e (Socket.io) bağlantı katmanı.
   Tek bir bağlantı açılır, tüm uygulama bunu kullanır.

   Backend adresi: geliştirmede localhost:4000. Telefondan/Docker'dan
   erişim için ileride sitenin adresine göre ayarlanır (VITE_BACKEND_URL).
   ========================================================================== */

import { io } from "socket.io-client";

// Backend adresi. Ortam değişkeni varsa onu, yoksa localhost'u kullan.
// Telefonda/canlıda VITE_BACKEND_URL ile gerçek adres verilir.
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export const socket = io(BACKEND_URL, {
  autoConnect: true,
});

socket.on("connect", () => console.log("Backend'e bağlanıldı:", socket.id));
socket.on("disconnect", () => console.log("Backend bağlantısı kesildi"));
socket.on("connect_error", (e) =>
  console.warn("Backend'e bağlanılamadı (offline mı?):", e.message)
);
