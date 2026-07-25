import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

/*
  Koruma bileşeni: giriş yapılmamışsa login'e yönlendirir.
  Misafir de giriş yapmış sayılır (misafir bayrağı true ise geçer).
  Kullanım: <Korumali><Home /></Korumali>
*/
export default function Korumali({ children }) {
  const { kullanici, misafir, authYuklendi } = useApp();

  if (!authYuklendi) return null; // token kontrolü bitmeden bekliyoruz

  // Giriş yapmış (kullanici dolu) VEYA misafir olarak devam etmiş → geçebilir
  if (kullanici || misafir) return children;

  // Hiçbiri yoksa → login'e gönder
  return <Navigate to="/" replace />;
}
