import { useRef, useEffect } from "react";

/*
  Fareyle tıkla-sürükle yatay kaydırma.
  Telefonda parmakla kaydırılan şeritler, bilgisayarda sol tık basılı tutup
  sürükleyerek kaydırılabilir olur. Dokunmatik cihazlarda zaten native scroll
  çalıştığı için bu sadece fare (pointer) için devreye girer.

  Kullanım:
    const ref = useSuruklenebilir();
    <div ref={ref} className="chip-satir"> ... </div>
*/
export function useSuruklenebilir() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let basili = false;
    let baslangicX = 0;
    let baslangicScroll = 0;
    let hareketEtti = false;

    const basla = (e) => {
      // Sadece fare sol tuşu; dokunmatik zaten native kayar
      if (e.pointerType === "touch") return;
      basili = true;
      hareketEtti = false;
      baslangicX = e.clientX;
      baslangicScroll = el.scrollLeft;
      el.classList.add("suruklorken");
    };

    const hareket = (e) => {
      if (!basili) return;
      const fark = e.clientX - baslangicX;
      if (Math.abs(fark) > 3) hareketEtti = true;
      el.scrollLeft = baslangicScroll - fark;
    };

    const bitir = () => {
      basili = false;
      el.classList.remove("suruklorken");
    };

    // Sürükleme sırasında yanlışlıkla tıklama tetiklenmesin
    const tiklamaEngelle = (e) => {
      if (hareketEtti) {
        e.preventDefault();
        e.stopPropagation();
        hareketEtti = false;
      }
    };

    el.addEventListener("pointerdown", basla);
    window.addEventListener("pointermove", hareket);
    window.addEventListener("pointerup", bitir);
    el.addEventListener("click", tiklamaEngelle, true);

    return () => {
      el.removeEventListener("pointerdown", basla);
      window.removeEventListener("pointermove", hareket);
      window.removeEventListener("pointerup", bitir);
      el.removeEventListener("click", tiklamaEngelle, true);
    };
  }, []);

  return ref;
}
