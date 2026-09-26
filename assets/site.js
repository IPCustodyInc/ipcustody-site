/* IP Custody site script. No trackers, no network calls. */
(function () {
  "use strict";
  // Mobile navigation toggle
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Footer year
  var y = document.getElementById("year");
  if (y) { y.textContent = String(new Date().getFullYear()); }
})();
