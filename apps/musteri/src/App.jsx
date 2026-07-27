import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import BottomNav from "./components/BottomNav";
import Home from "./screens/Home";
import Rewards from "./screens/Rewards";
import Campaigns from "./screens/Campaigns";
import Profile from "./screens/Profile";
import Orders from "./screens/Orders";
import Login from "./screens/Login";
import Cart from "./screens/Cart";
import QrScan from "./screens/QrScan";
import Payment from "./screens/Payment";
import PaymentSuccess from "./screens/PaymentSuccess";
import TableWelcome from "./screens/TableWelcome";
import QrGenerator from "./screens/QrGenerator";
import Kayit from "./screens/Kayit";
import ProfilDuzenle from "./screens/ProfilDuzenle";
import Korumali from "./components/Korumali";
import { useApp } from "./context/AppContext";
import { Navigate } from "react-router-dom";
import "./App.css";

// Alt menünün gösterileceği ekranlar. Giriş, sepet, ödeme akışında alt menü olmaz.
const altMenuluYollar = ["/anasayfa", "/kampanyalar", "/siparislerim", "/puanlarim", "/profil"];

// Sadece admin girebilir; değilse ana sayfaya yönlendir.
function AdminKorumali({ children }) {
  const { adminMi, authYuklendi } = useApp();
  if (!authYuklendi) return null;
  return adminMi ? children : <Navigate to="/anasayfa" replace />;
}

function Icerik() {
  const konum = useLocation();
  const altMenuGoster = altMenuluYollar.includes(konum.pathname);

  return (
    <div className="telefon">
      <div className="telefon-ekran">
        <Routes>
          {/* Açık rotalar: giriş, kayıt, QR ile masa */}
          <Route path="/" element={<Login />} />
          <Route path="/kayit" element={<Kayit />} />
          <Route path="/masa" element={<TableWelcome />} />
          {/* Korumalı rotalar: giriş yapmış veya misafir olmalı */}
          <Route path="/anasayfa" element={<Korumali><Home /></Korumali>} />
          <Route path="/kampanyalar" element={<Korumali><Campaigns /></Korumali>} />
          <Route path="/puanlarim" element={<Korumali><Rewards /></Korumali>} />
          <Route path="/profil" element={<Korumali><Profile /></Korumali>} />
          <Route path="/profil-duzenle" element={<Korumali><ProfilDuzenle /></Korumali>} />
          <Route path="/sepet" element={<Korumali><Cart /></Korumali>} />
          <Route path="/qr" element={<Korumali><QrScan /></Korumali>} />
          <Route path="/odeme" element={<Korumali><Payment /></Korumali>} />
          <Route path="/odeme-basarili" element={<Korumali><PaymentSuccess /></Korumali>} />
          <Route path="/siparislerim" element={<Korumali><Orders /></Korumali>} />
          {/* İşletme: masa QR'ları üret — SADECE ADMIN */}
          <Route path="/qr-uret" element={<AdminKorumali><QrGenerator /></AdminKorumali>} />
        </Routes>
        {altMenuGoster && <BottomNav />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Icerik />
      </BrowserRouter>
    </AppProvider>
  );
}
