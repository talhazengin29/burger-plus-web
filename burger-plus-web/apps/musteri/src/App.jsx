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
import { useApp } from "./context/AppContext";
import { Navigate } from "react-router-dom";
import "./App.css";

// Alt menünün gösterileceği ekranlar. Giriş, sepet, ödeme akışında alt menü olmaz.
const altMenuluYollar = ["/anasayfa", "/kampanyalar", "/siparislerim", "/puanlarim", "/profil"];

// Sadece admin girebilir; değilse ana sayfaya yönlendir.
function AdminKorumali({ children }) {
  const { adminMi, authYuklendi } = useApp();
  if (!authYuklendi) return null; // token kontrolü bitene kadar bekle
  return adminMi ? children : <Navigate to="/anasayfa" replace />;
}

function Icerik() {
  const konum = useLocation();
  const altMenuGoster = altMenuluYollar.includes(konum.pathname);

  return (
    <div className="telefon">
      <div className="telefon-ekran">
        <Routes>
          {/* Açılış: Giriş ekranı */}
          <Route path="/" element={<Login />} />
          <Route path="/kayit" element={<Kayit />} />
          <Route path="/anasayfa" element={<Home />} />
          <Route path="/kampanyalar" element={<Campaigns />} />
          <Route path="/puanlarim" element={<Rewards />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/profil-duzenle" element={<ProfilDuzenle />} />
          {/* Sipariş/menü akışı */}
          <Route path="/sepet" element={<Cart />} />
          <Route path="/qr" element={<QrScan />} />
          <Route path="/odeme" element={<Payment />} />
          <Route path="/odeme-basarili" element={<PaymentSuccess />} />
          {/* Siparişlerim sekmesi */}
          <Route path="/siparislerim" element={<Orders />} />
          {/* QR ile masa karşılama (müşteri buraya QR'dan gelir) */}
          <Route path="/masa" element={<TableWelcome />} />
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
