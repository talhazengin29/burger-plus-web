(function () {
  "use strict";
  try {
    var kayitli = localStorage.getItem("masanpos-landing-tema") || localStorage.getItem("menule-landing-tema");
    var koyu = kayitli ? kayitli === "dark" : true;
    document.documentElement.classList.toggle("dark", koyu);
  } catch (_hata) {
    document.documentElement.classList.add("dark");
  }
})();
