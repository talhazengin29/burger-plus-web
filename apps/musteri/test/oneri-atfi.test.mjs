import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const contextKodu = await readFile(new URL("../src/context/AppContext.jsx", import.meta.url), "utf8");
const sepetKodu = await readFile(new URL("../src/screens/Cart.jsx", import.meta.url), "utf8");
const odemeKodu = await readFile(new URL("../src/screens/Payment.jsx", import.meta.url), "utf8");
const detayKodu = await readFile(new URL("../src/screens/UrunDetay.jsx", import.meta.url), "utf8");

test("sepet onerisi kaynak bilgisini sepete tasir", () => {
  assert.match(sepetKodu, /satisKaynagi: "sepet_onerisi"/);
  assert.match(contextKodu, /oneriAdedi: Math\.min/);
  assert.match(contextKodu, /oneriAdedi: oneridenEklendi \? 1 : 0/);
});

test("oneri adedi nakit ve online odeme isteklerine eklenir", () => {
  assert.equal((odemeKodu.match(/oneriAdedi: u\.oneriAdedi \|\| 0/g) || []).length, 2);
});

test("yapilandirilan urun detay sayfasinda oneri kaynagi korunur", () => {
  assert.match(sepetKodu, /\?kaynak=sepet_onerisi/);
  assert.match(detayKodu, /aramaParametreleri\.get\("kaynak"\) === "sepet_onerisi"/);
});
