import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const contextKodu = await readFile(new URL("../src/context/AppContext.jsx", import.meta.url), "utf8");
const sepetKodu = await readFile(new URL("../src/screens/Cart.jsx", import.meta.url), "utf8");
const odemeKodu = await readFile(new URL("../src/screens/Payment.jsx", import.meta.url), "utf8");
const detayKodu = await readFile(new URL("../src/screens/UrunDetay.jsx", import.meta.url), "utf8");

test("sepet onerisi imzali referans ve sunucu olayi ile sepete tasinir", () => {
  assert.match(sepetKodu, /olay: "sepete_eklendi"/);
  assert.match(sepetKodu, /oneriReferansi: dogrulanmisReferans/);
  assert.match(contextKodu, /oneriReferanslari:/);
  assert.doesNotMatch(contextKodu, /oneriAdedi:/);
});

test("odeme istekleri ham adet yerine imzali referanslari backende gonderir", () => {
  assert.equal((odemeKodu.match(/oneriReferanslari: u\.oneriReferanslari \|\| \[\]/g) || []).length, 2);
  assert.doesNotMatch(odemeKodu, /oneriAdedi:/);
});

test("yapilandirilan urun detay sayfasinda oneri kaynagi korunur", () => {
  assert.match(sepetKodu, /\?kaynak=sepet_onerisi/);
  assert.match(detayKodu, /aramaParametreleri\.get\("kaynak"\) === "sepet_onerisi"/);
  assert.match(detayKodu, /konum\.state\?\.oneriReferansi/);
});
