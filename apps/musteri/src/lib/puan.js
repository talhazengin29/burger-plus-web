// Bu hesap yalnızca ödeme öncesi tahmin içindir; kesin puanı backend belirler.
const PUAN_ORANI_TL = 10;

export function puanHesapla(tutar) {
  return Math.floor(Number(tutar || 0) / PUAN_ORANI_TL);
}
