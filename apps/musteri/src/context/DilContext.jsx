import { createContext, useContext, useEffect, useMemo, useState } from "react";

const SOZLUK = {
  en: {
    "language.title": "Language",
    "language.tr": "Türkçe",
    "language.en": "English",
    "login.slogan": "Great taste and rewards are waiting for you",
    "login.title": "Sign In",
    "login.securityTitle": "Security Code",
    "login.email": "Email",
    "login.password": "Password",
    "login.forgot": "Forgot password",
    "login.remember": "Remember me",
    "login.submit": "Sign In",
    "login.loading": "Verifying...",
    "login.verify": "Verify Code",
    "login.noAccount": "Don't have an account?",
    "login.register": "Create Account",
    "login.guest": "Continue as Guest",
    "login.code": "Verification code",
    "login.codeHelp": "Enter the 6-digit code from your authenticator app. You can use a recovery code if you cannot access your phone.",
    "login.backPassword": "Back to password",
    "login.showPassword": "Show password",
    "login.hidePassword": "Hide password",
    "table.invalid": "Invalid QR",
    "table.invalidHelp": "Please scan the QR code on the table again.",
    "table.home": "Go to Home",
    "table.label": "TABLE {table}",
    "table.welcome": "Welcome! 👋",
    "table.help": "How would you like to continue? Sign in to earn rewards, or order immediately as a guest.",
    "table.signIn": "Sign In",
    "table.signInSub": "I am a member, earn rewards",
    "table.guest": "Continue as Guest",
    "table.guestSub": "Order without becoming a member",
    "table.note": "Your order will be served to Table {table}",
    "header.hello": "Hello,",
    "header.guest": "Guest",
    "header.friend": "Friend",
    "header.notifications": "Notifications",
    "header.cart": "Cart",
    "header.profile": "Profile",
    "header.callStaff": "Call Staff",
    "nav.home": "Home",
    "nav.campaigns": "Offers",
    "nav.orders": "Orders",
    "nav.points": "Rewards",
    "nav.profile": "Profile",
    "home.all": "All",
    "home.search": "Search the menu...",
    "home.sort": "Sorting options",
    "home.sortRecommended": "Recommended",
    "home.sortAsc": "Price: Low to High",
    "home.sortDesc": "Price: High to Low",
    "home.featured": "Popular Products",
    "home.products": "Products",
    "home.productCount": "{count} products",
    "home.noResult": "No results found for “{query}”.",
    "home.empty": "Menu items are waiting to be added by the restaurant.",
    "home.soldOut": "Sold Out",
    "home.addToCart": "Add {product} to cart",
    "staff.title": "Call Staff",
    "staff.order": "I want to order",
    "staff.orderSub": "Menu and ordering support",
    "staff.bill": "I want the bill",
    "staff.billSub": "Ask staff to come for payment",
    "staff.need": "I need something",
    "staff.needSub": "Napkins, cutlery or another request",
    "staff.clean": "Clean the table",
    "staff.cleanSub": "I would like the table cleaned",
    "staff.intro": "Choose what you need and the floor staff will be notified immediately.",
    "staff.waiting": "Your request was sent to the floor staff.",
    "staff.seen": "A staff member has seen your request and is coming.",
    "staff.done": "Your last request was completed.",
    "staff.notFound": "The request was closed because no guest was found at the table.",
    "staff.preparing": "Preparing...",
  },
};

const DilContext = createContext(null);

export function DilProvider({ children }) {
  const [dil, setDilState] = useState(() => localStorage.getItem("bp_dil") === "en" ? "en" : "tr");
  const setDil = (deger) => setDilState(deger === "en" ? "en" : "tr");
  useEffect(() => {
    localStorage.setItem("bp_dil", dil);
    document.documentElement.lang = dil;
  }, [dil]);
  const deger = useMemo(() => ({
    dil,
    setDil,
    t(anahtar, varsayilan, degiskenler = {}) {
      const metin = (dil === "en" ? SOZLUK.en[anahtar] : null) || varsayilan || anahtar;
      return Object.entries(degiskenler).reduce((sonuc, [ad, deger]) => sonuc.replaceAll(`{${ad}}`, String(deger)), metin);
    },
  }), [dil]);
  return <DilContext.Provider value={deger}>{children}</DilContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDil() {
  const context = useContext(DilContext);
  if (!context) throw new Error("useDil, DilProvider içinde kullanılmalı");
  return context;
}
