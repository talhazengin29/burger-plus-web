import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import Home from "./screens/Home";
import Rewards from "./screens/Rewards";
import Campaigns from "./screens/Campaigns";
import Profile from "./screens/Profile";
import Orders from "./screens/Orders";
import Login from "./screens/Login";
import SifremiUnuttum from "./screens/SifremiUnuttum";
import SifreSifirla from "./screens/SifreSifirla";
import Cart from "./screens/Cart";
import QrScan from "./screens/QrScan";
import Payment from "./screens/Payment";
import PaymentSuccess from "./screens/PaymentSuccess";
import TableWelcome from "./screens/TableWelcome";
import QrGenerator from "./screens/QrGenerator";
import Kayit from "./screens/Kayit";
import ProfilDuzenle from "./screens/ProfilDuzenle";
import UrunDetay from "./screens/UrunDetay";
import Hediyelerim from "./screens/Hediyelerim";
import Wallet from "./screens/Wallet";
import Sikayet from "./screens/Sikayet";
import Korumali from "./components/Korumali";
import { useApp } from "./context/AppContext";
import { IsletmeSarici } from "./context/IsletmeContext";
import { useIsletme } from "./context/IsletmeContext";
import DilSecici from "./components/DilSecici";
import "./App.css";
import "./tablet.css";

const altMenuluYollar = ["/anasayfa", "/kampanyalar", "/siparislerim", "/puanlarim", "/profil", "/hediyelerim", "/cuzdanim"];

function IsletmeSecim() {
  return <Navigate to="/burger-plus" replace />;
}

function AdminKorumali({ children }) {
  const { adminMi, authYuklendi } = useApp();
  const { isletmeSlug } = useIsletme();
  if (!authYuklendi) return null;
  return adminMi ? children : <Navigate to={`/${isletmeSlug}/anasayfa`} replace />;
}

function TelefonYerlesimi() {
  const konum = useLocation();
  const tenantSonrasiYol = `/${konum.pathname.split("/").filter(Boolean).slice(1).join("/")}`;
  const altMenuGoster = altMenuluYollar.includes(tenantSonrasiYol);
  return (
    <div className="telefon">
      <div className="telefon-ekran">
        {tenantSonrasiYol !== "/qr-uret" && <DilSecici />}
        <Outlet />
        {altMenuGoster && <BottomNav />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IsletmeSecim />} />
        <Route path="/:isletmeSlug" element={<IsletmeSarici />}>
          <Route element={<TelefonYerlesimi />}>
              <Route index element={<Login />} />
              <Route path="kayit" element={<Kayit />} />
              <Route path="sifremi-unuttum" element={<SifremiUnuttum />} />
              <Route path="sifre-sifirla" element={<SifreSifirla />} />
              <Route path="masa" element={<TableWelcome />} />
              <Route path="anasayfa" element={<Korumali><Home /></Korumali>} />
              <Route path="kampanyalar" element={<Korumali><Campaigns /></Korumali>} />
              <Route path="puanlarim" element={<Korumali><Rewards /></Korumali>} />
              <Route path="profil" element={<Korumali><Profile /></Korumali>} />
              <Route path="profil-duzenle" element={<Korumali><ProfilDuzenle /></Korumali>} />
              <Route path="hediyelerim" element={<Korumali><Hediyelerim /></Korumali>} />
              <Route path="cuzdanim" element={<Korumali><Wallet /></Korumali>} />
              <Route path="sikayet" element={<Korumali><Sikayet /></Korumali>} />
              <Route path="sepet" element={<Korumali><Cart /></Korumali>} />
              <Route path="qr" element={<Korumali><QrScan /></Korumali>} />
              <Route path="odeme" element={<Korumali><Payment /></Korumali>} />
              <Route path="odeme-sonuc" element={<Korumali><PaymentSuccess /></Korumali>} />
              <Route path="odeme-basarili" element={<Korumali><PaymentSuccess /></Korumali>} />
              <Route path="siparislerim" element={<Korumali><Orders /></Korumali>} />
              <Route path="urun/:id" element={<Korumali><UrunDetay /></Korumali>} />
              <Route path="qr-uret" element={<AdminKorumali><QrGenerator /></AdminKorumali>} />
          </Route>
        </Route>
        <Route path="*" element={<IsletmeSecim />} />
      </Routes>
    </BrowserRouter>
  );
}
