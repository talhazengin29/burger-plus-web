const kategoriUrunKurallari = {
  Burgerler: { etiket: "Köfte gramajı", birim: "gr", artisOrani: 0.25, miktarYuvarlama: 25, fiyatArtisOrani: 0.20, fiyatYuvarlama: 5, maxAdim: 3 },
  "Yan Lezzetler": { etiket: "Porsiyon gramajı", birim: "gr", artisOrani: 0.25, miktarYuvarlama: 25, fiyatArtisOrani: 0.40, fiyatYuvarlama: 5, maxAdim: 3 },
  "İçecekler": { etiket: "İçecek hacmi", birim: "ml", artisOrani: 0.25, miktarYuvarlama: 25, fiyatArtisOrani: 0.25, fiyatYuvarlama: 5, maxAdim: 3 },
};

function enYakinaYuvarla(deger, adim) {
  return Math.max(adim, Math.round(deger / adim) * adim);
}

export function urunKurallariniUygula(urun) {
  if (urun.urunTipi && urun.urunTipi !== "burger") return urun;
  const kategoriKurali = kategoriUrunKurallari[urun.kategori];
  const uruneOzelMi = Object.prototype.hasOwnProperty.call(urun, "gramajOpsiyonu");
  if (!kategoriKurali || !Number.isFinite(urun.temelMiktar) || urun.temelMiktar <= 0) return urun;
  if (uruneOzelMi && !urun.gramajOpsiyonu) return urun;

  return {
    ...urun,
    gramajOpsiyonu: {
      aktif: true,
      etiket: kategoriKurali.etiket,
      birim: kategoriKurali.birim,
      artisMiktari: enYakinaYuvarla(urun.temelMiktar * kategoriKurali.artisOrani, kategoriKurali.miktarYuvarlama),
      maxAdim: kategoriKurali.maxAdim,
      fiyatArtisi: enYakinaYuvarla(urun.fiyat * kategoriKurali.fiyatArtisOrani, kategoriKurali.fiyatYuvarlama),
      ...(urun.gramajOpsiyonu || {}),
    },
  };
}

export function kampanyaAktifMi(kampanya, simdi = new Date()) {
  if (!kampanya.aktif) return false;
  if (kampanya.kampanyaTipi === "surekli") return true;
  if (kampanya.kampanyaTipi === "saatli") {
    const saat = simdi.getHours();
    return saat >= kampanya.baslangicSaat && saat < kampanya.bitisSaat;
  }
  return false;
}

export function kampanyaDurumu(kampanya, simdi = new Date()) {
  if (kampanya.kampanyaTipi !== "saatli") return kampanyaAktifMi(kampanya, simdi) ? "aktif" : "pasif";
  const saat = simdi.getHours();
  if (saat < kampanya.baslangicSaat) return "baslamadi";
  if (saat >= kampanya.bitisSaat) return "sonaerdi";
  return "aktif";
}
