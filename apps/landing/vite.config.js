import { defineConfig } from "vite";
import bolumParcalari from "./vite-bolum-parcalari.js";

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  server: { port: 5176 },
  // index.html'i bolumler/*.html parçalarından derler (bkz. vite-bolum-parcalari.js).
  plugins: [bolumParcalari()],
});
