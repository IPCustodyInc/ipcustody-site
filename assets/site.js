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

  // In-browser SHA-256 demo (adapted from the Seven-Day prototype demo.html).
  // Everything happens locally with the Web Crypto API. Nothing is uploaded.
  var demo = document.getElementById("hash-demo");
  if (!demo) { return; }

  var fileInput = document.getElementById("demo-file");
  var drop = document.getElementById("demo-drop");
  var textInput = document.getElementById("demo-text");
  var textBtn = document.getElementById("demo-text-btn");
  var out = document.getElementById("demo-hash");
  var meta = document.getElementById("demo-meta");
  var copyBtn = document.getElementById("demo-copy");
  var status = document.getElementById("demo-status");

  var hasCrypto = !!(window.crypto && window.crypto.subtle && window.crypto.subtle.digest);
  if (!hasCrypto) {
    status.textContent = "Your browser does not expose the Web Crypto API on this page (it needs HTTPS or localhost). The demo is unavailable here.";
    return;
  }

  function toHex(buf) {
    var bytes = new Uint8Array(buf), hex = "";
    for (var i = 0; i < bytes.length; i++) { hex += bytes[i].toString(16).padStart(2, "0"); }
    return hex;
  }
  function fmtSize(n) {
    if (n < 1024) { return n + " bytes"; }
    if (n < 1048576) { return (n / 1024).toFixed(1) + " KB"; }
    return (n / 1048576).toFixed(1) + " MB";
  }
  function show(hex, label) {
    out.textContent = hex;
    meta.textContent = label + " · computed " + new Date().toLocaleString() + " (your device clock; not a blockchain timestamp)";
    copyBtn.disabled = false;
    status.textContent = "Done. The fingerprint was computed on your device. Nothing was uploaded.";
  }
  function hashBuffer(buf, label) {
    status.textContent = "Hashing locally…";
    return window.crypto.subtle.digest("SHA-256", buf).then(function (d) { show(toHex(d), label); })
      .catch(function () { status.textContent = "Hashing failed in this browser."; });
  }
  function hashFile(file) {
    if (!file) { return; }
    if (file.size > 1024 * 1024 * 1024) {
      status.textContent = "That file is larger than 1 GB. Please try a smaller file for this demo.";
      return;
    }
    status.textContent = "Reading file locally…";
    var reader = new FileReader();
    reader.onload = function () { hashBuffer(reader.result, "File: " + file.name + " (" + fmtSize(file.size) + ")"); };
    reader.onerror = function () { status.textContent = "Could not read that file."; };
    reader.readAsArrayBuffer(file);
  }

  fileInput.addEventListener("change", function () { hashFile(fileInput.files[0]); });
  ["dragenter", "dragover"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); });
  });
  drop.addEventListener("drop", function (e) {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) { hashFile(e.dataTransfer.files[0]); }
  });
  textBtn.addEventListener("click", function () {
    var bytes = new TextEncoder().encode(textInput.value);
    hashBuffer(bytes, "Text (" + bytes.length + " UTF-8 bytes)");
  });
  copyBtn.addEventListener("click", function () {
    var txt = out.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { status.textContent = "Fingerprint copied to your clipboard."; },
        function () { status.textContent = "Copy failed. Select the fingerprint and copy it manually."; });
    } else {
      status.textContent = "Select the fingerprint and copy it manually.";
    }
  });
})();
