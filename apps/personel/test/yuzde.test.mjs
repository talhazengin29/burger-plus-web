import assert from "node:assert/strict";
import test from "node:test";
import { yuzdeTutariniHesapla, yuzdeliToplamiHesapla } from "../src/lib/yuzde.js";

test("paneldeki yüzde değeri gerçek yüzde olarak hesaplanır", () => {
  assert.equal(yuzdeTutariniHesapla(1_000, 5), 50);
  assert.equal(yuzdeliToplamiHesapla(1_000, 5), 1_050);
});

test("ondalıklı ve değiştirilebilir bonus oranı kuruş hassasiyetini korur", () => {
  assert.equal(yuzdeTutariniHesapla(125.50, 7.5), 9.41);
  assert.equal(yuzdeliToplamiHesapla(125.50, 7.5), 134.91);
});

test("bonus oranı güvenli yüzde aralığında tutulur", () => {
  assert.equal(yuzdeTutariniHesapla(1_000, 0), 0);
  assert.equal(yuzdeTutariniHesapla(1_000, 100), 1_000);
  assert.equal(yuzdeTutariniHesapla(1_000, 500), 1_000);
  assert.equal(yuzdeTutariniHesapla(1_000, "geçersiz"), 0);
});
