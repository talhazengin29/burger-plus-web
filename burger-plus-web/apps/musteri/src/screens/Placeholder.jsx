// Geçici tutucu — Kampanyalar/Puan/Profil eklenene kadar
export default function Placeholder({ ad }) {
  return (
    <div className="ekran" style={{ display: "grid", placeItems: "center", padding: 40 }}>
      <p style={{ color: "var(--charcoal-soft)" }}>{ad} ekranı — yakında</p>
    </div>
  );
}
