/* oxlint-disable react/only-export-components */
export const para = (deger) => `₺${Number(deger || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
export const sayi = (deger) => Number(deger || 0).toLocaleString("tr-TR");
export const tarih = (deger) => deger ? new Date(deger).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }) : "—";

export function Yukleme({ yazi = "Veriler yükleniyor…" }) { return <div className="durum-ekrani"><i className="spinner" />{yazi}</div>; }
export function Hata({ mesaj }) { return mesaj ? <div className="uyari hata">{mesaj}</div> : null; }
export function Basari({ mesaj }) { return mesaj ? <div className="uyari basari">✓ {mesaj}</div> : null; }
export function Bos({ yazi = "Kayıt bulunamadı." }) { return <div className="bos">{yazi}</div>; }

export function Metrik({ baslik, deger, alt, ton = "mor" }) {
  return <article className={`metrik ${ton}`}><span>{baslik}</span><strong>{deger}</strong><small>{alt}</small></article>;
}

export function DurumRozeti({ durum }) {
  const deger = String(durum || "bilinmiyor").toLowerCase();
  return <span className={`durum-rozeti ${deger}`}>{deger}</span>;
}

export function CubukGrafik({ veriler = [], deger = "ciro", etiket = "ad", bicim = para }) {
  const max = Math.max(1, ...veriler.map((oge) => Number(oge[deger] || 0)));
  return <div className="cubuk-grafik">{veriler.slice(0, 10).map((oge) => <div key={oge.isletmeId || oge[etiket]}><header><span>{oge[etiket]}</span><b>{bicim(oge[deger])}</b></header><i><em style={{ width: `${Math.max(2, Number(oge[deger] || 0) / max * 100)}%` }} /></i></div>)}</div>;
}

export function CizgiGrafik({ veriler = [], deger = "ciro", etiket = "ay", bicim = para }) {
  if (!veriler.length) return <Bos yazi="Grafik verisi henüz yok." />;
  const genislik = 720, yukseklik = 230, bosluk = 24;
  const max = Math.max(1, ...veriler.map((oge) => Number(oge[deger] || 0)));
  const noktalar = veriler.map((oge, index) => ({
    x: bosluk + index * ((genislik - bosluk * 2) / Math.max(1, veriler.length - 1)),
    y: yukseklik - bosluk - (Number(oge[deger] || 0) / max) * (yukseklik - bosluk * 2), oge,
  }));
  return <div className="cizgi-grafik"><svg viewBox={`0 0 ${genislik} ${yukseklik}`} role="img" aria-label="Zaman içindeki değişim grafiği"><defs><linearGradient id="super-alan" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#6366f1" stopOpacity=".3" /><stop offset="1" stopColor="#6366f1" stopOpacity="0" /></linearGradient></defs><path className="alan" d={`M ${noktalar[0].x} ${yukseklik - bosluk} L ${noktalar.map((n) => `${n.x} ${n.y}`).join(" L ")} L ${noktalar.at(-1).x} ${yukseklik - bosluk} Z`} /><polyline points={noktalar.map((n) => `${n.x},${n.y}`).join(" ")} />{noktalar.map((n) => <circle key={`${n.x}-${n.y}`} cx={n.x} cy={n.y} r="4"><title>{`${new Date(n.oge[etiket]).toLocaleDateString("tr-TR", { month: "short", year: "numeric" })}: ${bicim(n.oge[deger])}`}</title></circle>)}</svg></div>;
}
