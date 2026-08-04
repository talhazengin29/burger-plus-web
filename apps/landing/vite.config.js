import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import bolumParcalari from "./vite-bolum-parcalari.js";

const kok = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  server: { port: 5176 },
  // index.html'i bolumler/*.html parçalarından derler (bkz. vite-bolum-parcalari.js).
  plugins: [bolumParcalari()],
  build: {
    rollupOptions: {
      // Yasal metinler ayrı statik sayfalardır; her biri bir Vite girişidir.
      // Aynı bölüm-parçası eklentisinden geçtikleri için {{ degisken }} ve
      // <!-- parca: ... --> ifadeleri bu sayfalarda da çalışır.
      //
      // Not: yollar .html uzantılı kalır — Vercel'de cleanUrls kapalı ve kök
      // seviyedeki işletme-slug rewrite'ı uzantısız /yasal/kvkk yolunu müşteri
      // uygulamasına yönlendirirdi (bkz. kökteki vercel.json).
      input: {
        index: resolve(kok, "index.html"),
        kvkk: resolve(kok, "yasal/kvkk.html"),
        gizlilik: resolve(kok, "yasal/gizlilik.html"),
        kosullar: resolve(kok, "yasal/kosullar.html"),
        cerez: resolve(kok, "yasal/cerez.html"),
      },
    },
  },
});
