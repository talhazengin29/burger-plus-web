/* Ortak ikonlar — tek dosyada, her ekran buradan çeker.
   Renk `currentColor` ile geldiği için CSS'ten kontrol edilebilir. */

const s = { width: 24, height: 24, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

export const IconHome = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
);

export const IconTag = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M20.6 13.4 12 22l-9-9V4a1 1 0 0 1 1-1h8z" /><circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" /></svg>
);

export const IconStar = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8 6.2 21.9l1.1-6.5L2.6 9.8l6.5-.9z" /></svg>
);

export const IconUser = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
);

export const IconCutlery = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M5 3v7a2 2 0 0 0 2 2v9M9 3v7a2 2 0 0 1-2 2M15 3c-1.5 1-2 3-2 5s.5 3 2 3v10" /></svg>
);

export const IconBell = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
);

export const IconMenu = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
);

export const IconQr = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M20 14v.01M14 20v.01M17 20h4M20 17v4" /></svg>
);

export const IconShop = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M3 9l1.5-5h15L21 9M3 9v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9M3 9h18M8 9v3a2 2 0 0 0 8 0V9" /></svg>
);

export const IconTicket = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z" /><path d="M12 6v2M12 12v2M12 16v2" strokeDasharray="0.1 3" /></svg>
);

export const IconChevron = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M9 6l6 6-6 6" /></svg>
);

export const IconEdit = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
);

export const IconPin = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
);

export const IconReceipt = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3z" /><path d="M8 8h8M8 12h8" /></svg>
);

export const IconCard = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
);

export const IconHelp = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3M12 17v.01" /></svg>
);

export const IconLogout = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
);

export const IconClock = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);

export const IconInvite = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 8h5M19.5 5.5v5" /></svg>
);

export const IconGift = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v9h14v-9M12 8v13M12 8S9 3 6.5 5.5 12 8 12 8zM12 8s3-5 5.5-2.5S12 8 12 8z" /></svg>
);

export const IconMoon = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
);

export const IconPlus = (p) => (
  <svg viewBox="0 0 24 24" {...s} strokeWidth={2.5} {...p}><path d="M12 5v14M5 12h14" /></svg>
);

export const IconMinus = (p) => (
  <svg viewBox="0 0 24 24" {...s} strokeWidth={2.5} {...p}><path d="M5 12h14" /></svg>
);

export const IconBag = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M6 7h12l1 13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
);

export const IconTrash = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /></svg>
);

export const IconCheck = (p) => (
  <svg viewBox="0 0 24 24" {...s} strokeWidth={2.5} {...p}><path d="M5 13l4 4L19 7" /></svg>
);

export const IconBack = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M15 18l-6-6 6-6" /></svg>
);

export const IconUsers = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 5.5a3 3 0 0 1 0 5.8M18 20c0-2.2-.8-3.8-2-5" /></svg>
);

export const IconWallet = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H5a2 2 0 0 0-2 2z" /><path d="M3 9h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="16" cy="14" r="1.3" fill="currentColor" stroke="none" /></svg>
);

export const IconGoogle = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
    <path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2H12v4h5.6a4.8 4.8 0 0 1-2 3.2v2.6h3.3c1.9-1.8 3-4.4 3-7.8z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.3-2.6c-.9.6-2 1-3.3 1a5.7 5.7 0 0 1-5.4-4H3.2v2.6A10 10 0 0 0 12 22z" />
    <path fill="#FBBC05" d="M6.6 14a6 6 0 0 1 0-3.8V7.6H3.2a10 10 0 0 0 0 8.8z" />
    <path fill="#EA4335" d="M12 6.4c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.2 7.6l3.4 2.6c.8-2.4 3-4 5.4-4z" />
  </svg>
);

export const IconApple = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...p}>
    <path d="M17 12.5c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8zM14.8 5.6c.6-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.1 1.8-1 2.9 1.1.1 2.2-.6 2.8-1.4z" />
  </svg>
);
