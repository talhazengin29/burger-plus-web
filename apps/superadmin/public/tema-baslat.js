(function () {
  "use strict";
  try {
    var kayitli = localStorage.getItem("bp-superadmin-tema");
    var koyu = kayitli ? kayitli === "dark" : true;
    document.documentElement.classList.toggle("dark", koyu);
  } catch {
    document.documentElement.classList.add("dark");
  }
})();
