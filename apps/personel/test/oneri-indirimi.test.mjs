import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const admin = await readFile(new URL("../src/screens/Admin.jsx", import.meta.url), "utf8");

test("panel öneri indirimini açıp oranıyla birlikte kaydeder", () => {
  assert.match(admin, /\/oneri-indirim-ayari/);
  assert.match(admin, /indirimYuzde: Number\(oneriIndirimAyari\.indirimYuzde\)/);
  assert.match(admin, /min="1" max="50"/);
  assert.match(admin, /MÜŞTERİYE GÖRÜNEN/);
});
