function guvenliDosyaAdi(deger) {
  return String(deger || "isletme").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "isletme";
}

function pdfMetni(deger) {
  return String(deger || "")
    .replace(/[çÇ]/g, "c").replace(/[ğĞ]/g, "g").replace(/[ıİ]/g, "i")
    .replace(/[öÖ]/g, "o").replace(/[şŞ]/g, "s").replace(/[üÜ]/g, "u");
}

export async function qrPdfIndir({ slug, ad, masaSayisi = 10 }) {
  const adet = Math.min(500, Math.max(1, Number(masaSayisi) || 10));
  const [{ default: QRCode }, { jsPDF }] = await Promise.all([import("qrcode"), import("jspdf")]);
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const kartlar = [[15, 17], [110, 17], [15, 151], [110, 151]];
  const musteriTemeli = String(import.meta.env.VITE_MUSTERI_URL || window.location.origin).replace(/\/+$/, "");

  for (let masa = 1; masa <= adet; masa += 1) {
    const sayfaIndeksi = (masa - 1) % kartlar.length;
    if (masa > 1 && sayfaIndeksi === 0) pdf.addPage();
    const [x, y] = kartlar[sayfaIndeksi];
    const url = `${musteriTemeli}/${encodeURIComponent(slug)}/masa?no=${masa}`;
    const qr = await QRCode.toDataURL(url, { width: 700, margin: 1, errorCorrectionLevel: "H" });
    pdf.setDrawColor(48, 48, 74);
    pdf.roundedRect(x, y, 85, 120, 3, 3);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(pdfMetni(ad || slug), x + 42.5, y + 10, { align: "center", maxWidth: 76 });
    pdf.addImage(qr, "PNG", x + 10, y + 17, 65, 65);
    pdf.setFontSize(18);
    pdf.text(`Masa ${masa}`, x + 42.5, y + 92, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("Menuyu acmak ve siparis vermek icin okutun", x + 42.5, y + 101, { align: "center", maxWidth: 72 });
    pdf.setTextColor(99, 102, 241);
    pdf.setFontSize(6.5);
    pdf.text(url, x + 42.5, y + 113, { align: "center", maxWidth: 76 });
    pdf.setTextColor(0, 0, 0);
  }
  pdf.save(`${guvenliDosyaAdi(slug)}-masa-qr-kodlari.pdf`);
}
