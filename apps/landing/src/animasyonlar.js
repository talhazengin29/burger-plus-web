import { animate, hover, inView, stagger } from "motion";

const hareketAzalt = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const gorunecekler = Array.from(document.querySelectorAll(".fade-in-up"));

function dogrudanGoster() {
  gorunecekler.forEach((oge) => {
    oge.style.opacity = "1";
    oge.style.transform = "none";
  });
}

if (hareketAzalt) {
  dogrudanGoster();
} else {
  const navigasyon = document.querySelector("nav");
  if (navigasyon) {
    animate(navigasyon, { opacity: [0, 1], y: [-18, 0] }, { duration: 0.55, ease: "easeOut" });
    animate(
      navigasyon.querySelectorAll("a, button"),
      { opacity: [0, 1], y: [-8, 0] },
      { duration: 0.4, delay: stagger(0.045, { startDelay: 0.12 }), ease: "easeOut" },
    );
  }

  const hero = document.querySelector("header .fade-in-up");
  if (hero) {
    animate(hero, { opacity: [0, 1], y: [30, 0] }, { duration: 0.75, ease: [0.22, 1, 0.36, 1] });
    animate(
      hero.children,
      { opacity: [0, 1], y: [22, 0] },
      { duration: 0.65, delay: stagger(0.12, { startDelay: 0.18 }), ease: [0.22, 1, 0.36, 1] },
    );
  }

  document.querySelectorAll("section").forEach((bolum) => {
    const ogeler = Array.from(bolum.querySelectorAll(".fade-in-up"));
    if (!ogeler.length) return;

    inView(
      bolum,
      () => {
        animate(
          ogeler,
          { opacity: [0, 1], y: [34, 0], scale: [0.985, 1] },
          { duration: 0.62, delay: stagger(0.075), ease: [0.22, 1, 0.36, 1] },
        );
      },
      { amount: 0.12, margin: "0px 0px -8% 0px" },
    );
  });

  hover(".glass-panel", (oge) => {
    const kontrol = animate(oge, { y: -4 }, { duration: 0.2, ease: "easeOut" });
    return () => {
      kontrol.stop();
      animate(oge, { y: 0 }, { duration: 0.24, ease: "easeOut" });
    };
  });

  const dekorlar = document.querySelectorAll("body > div.pointer-events-none");
  if (dekorlar.length) {
    animate(
      dekorlar,
      { scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] },
      { duration: 9, repeat: Infinity, ease: "easeInOut", delay: stagger(1.2) },
    );
  }
}
