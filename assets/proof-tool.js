/* IP Custody Hash & Proof Tool. Everything runs locally with the Web Crypto API.
   No network requests are made: files are read in memory and receipts are
   generated in the browser and saved to your device. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  if (!$("pt-create")) { return; }
  var TOOL_URL = "https://ipcustodyinc.github.io/ipcustody-site/proof-tool.html";
  var MAX = 1024 * 1024 * 1024;
  var hasCrypto = !!(window.crypto && window.crypto.subtle && window.crypto.subtle.digest);
  var cryptoNote = $("pt-crypto");
  if (!hasCrypto) {
    var msg = "Your browser doesn't allow the Web Crypto API on this page (it needs HTTPS or localhost), so hashing is unavailable here.";
    cryptoNote.textContent = msg; $("pt-status").textContent = msg;
    ["pt-text-btn", "pv-check"].forEach(function (id) { $(id).disabled = true; });
    return;
  }

  function toHex(buf) {
    var b = new Uint8Array(buf), h = "";
    for (var i = 0; i < b.length; i++) { h += (b[i] < 16 ? "0" : "") + b[i].toString(16); }
    return h;
  }
  function fmtSize(n) {
    if (n < 1024) { return n + " bytes"; }
    if (n < 1048576) { return (n / 1024).toFixed(1) + " KB (" + n + " bytes)"; }
    return (n / 1048576).toFixed(1) + " MB (" + n + " bytes)";
  }
  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(new Error("read")); };
      r.readAsArrayBuffer(file);
    });
  }
  function sha256(bytes) { return window.crypto.subtle.digest("SHA-256", bytes).then(toHex); }
  function tz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "local"; } catch (e) { return "local"; } }
  function normHash(s) {
    s = (s || "").trim().toLowerCase().replace(/^sha-?256[:=\s]*/, "").replace(/[\s:]/g, "");
    return /^[0-9a-f]{64}$/.test(s) ? s : null;
  }
  function download(name, text, type) {
    var blob = new Blob([text], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function setupDrop(dropId, inputId, onFile) {
    var drop = $(dropId), input = $(inputId);
    input.addEventListener("change", function () { if (input.files[0]) { onFile(input.files[0]); } });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) { onFile(f); }
    });
  }

  /* ---------- Create ---------- */
  var current = null; // {hash, input:{...}, at: Date}
  var status = $("pt-status");
  function kv(pairs) {
    var dl = $("pt-meta"); dl.innerHTML = "";
    pairs.forEach(function (p) {
      var dt = document.createElement("dt"); dt.textContent = p[0];
      var dd = document.createElement("dd"); dd.textContent = p[1];
      dl.appendChild(dt); dl.appendChild(dd);
    });
  }
  function showResult(hash, inputInfo) {
    var at = new Date();
    current = { hash: hash, input: inputInfo, at: at };
    $("pt-hash").textContent = hash;
    var desc = inputInfo.kind === "file" ? "File: " + inputInfo.name + " · " + fmtSize(inputInfo.size_bytes) : "Text · " + inputInfo.utf8_bytes + " UTF-8 bytes";
    kv([["Input", desc], ["Computed (device time)", at.toLocaleString() + " (" + tz() + ")"], ["Algorithm", "SHA-256"]]);
    ["pt-copy", "pt-dl-json", "pt-dl-txt"].forEach(function (id) { $(id).disabled = false; });
    status.textContent = "Done. Computed on your device; nothing was uploaded.";
  }
  function hashFileForCreate(file) {
    if (file.size > MAX) { status.textContent = "That file is larger than 1 GB. Please use a smaller file."; return; }
    status.textContent = "Reading and hashing locally…";
    readFile(file).then(sha256).then(function (h) {
      showResult(h, { kind: "file", name: file.name, size_bytes: file.size, type: file.type || "unknown",
        last_modified_local: file.lastModified ? new Date(file.lastModified).toLocaleString() : "unknown" });
    }).catch(function () { status.textContent = "Couldn't read or hash that file."; });
  }
  setupDrop("pt-drop", "pt-file", hashFileForCreate);
  $("pt-text-btn").addEventListener("click", function () {
    var text = $("pt-text").value;
    if (!text) { status.textContent = "Type or paste some text first."; return; }
    var bytes = new TextEncoder().encode(text);
    sha256(bytes).then(function (h) { showResult(h, { kind: "text", utf8_bytes: bytes.length }); });
  });
  $("pt-copy").addEventListener("click", function () {
    if (!current) { return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(current.hash).then(function () { status.textContent = "Hash copied to your clipboard."; },
        function () { status.textContent = "Copy failed. Select the hash and copy it manually."; });
    } else { status.textContent = "Select the hash and copy it manually."; }
  });

  var NOTICE = "NOT a blockchain timestamp and NOT an IP Custody certificate. Self-generated on the user's own device by the free IP Custody Hash & Proof Tool. The time comes from the device clock and has not been independently verified. Not a registration and not legal advice.";
  function receiptObject() {
    var c = current, inp = {};
    for (var k in c.input) { if (Object.prototype.hasOwnProperty.call(c.input, k)) { inp[k] = c.input[k]; } }
    if (inp.kind === "text") { inp.note = "The text itself is not included in this receipt."; }
    return {
      receipt_type: "Self-generated SHA-256 hash receipt",
      important_notice: NOTICE,
      algorithm: "SHA-256",
      hash_hex: c.hash,
      input: inp,
      title: $("pt-label").value.trim() || null,
      notes: $("pt-notes").value.trim() || null,
      computed_at_local: c.at.toLocaleString(),
      computed_at_utc_iso: c.at.toISOString(),
      device_time_zone: tz(),
      time_source: "device clock (unverified)",
      generated_by: "IP Custody Hash & Proof Tool (runs locally in the browser; no network requests)",
      tool_url: TOOL_URL,
      how_to_verify: "Re-hash the original, unchanged file with SHA-256 (for example in the Verify section of the tool, or with 'shasum -a 256 FILE' / 'certutil -hashfile FILE SHA256') and compare the result with hash_hex."
    };
  }
  function receiptText(r) {
    var L = [];
    L.push("SELF-GENERATED SHA-256 HASH RECEIPT");
    L.push("===================================");
    L.push("IMPORTANT: This is NOT a blockchain timestamp and NOT an IP Custody certificate.");
    L.push("It was generated on your own device by the free IP Custody Hash & Proof Tool.");
    L.push("The time below comes from your device clock and has not been independently verified.");
    L.push("It is not a registration and not legal advice.");
    L.push("");
    L.push("Algorithm:            SHA-256");
    L.push("Hash (hex):           " + r.hash_hex);
    if (r.input.kind === "file") {
      L.push("Input:                File \"" + r.input.name + "\"");
      L.push("File size:            " + r.input.size_bytes + " bytes");
      L.push("File type:            " + r.input.type);
      L.push("File last modified:   " + r.input.last_modified_local + " (as reported by the device)");
    } else {
      L.push("Input:                Text, " + r.input.utf8_bytes + " UTF-8 bytes (text not included)");
    }
    if (r.title) { L.push("Title:                " + r.title); }
    if (r.notes) { L.push("Notes:                " + r.notes.replace(/\r?\n/g, " / ")); }
    L.push("Computed at (local):  " + r.computed_at_local + " (" + r.device_time_zone + ")");
    L.push("Computed at (UTC):    " + r.computed_at_utc_iso);
    L.push("Time source:          device clock (unverified)");
    L.push("Tool:                 " + r.tool_url);
    L.push("");
    L.push("How to verify later:");
    L.push(r.how_to_verify);
    return L.join("\r\n") + "\r\n";
  }
  function baseName() { return "ipcustody-self-generated-hash-receipt-" + current.hash.slice(0, 12); }
  $("pt-dl-json").addEventListener("click", function () {
    if (!current) { return; }
    download(baseName() + ".json", JSON.stringify(receiptObject(), null, 2) + "\n", "application/json");
    status.textContent = "Receipt (.json) saved to your device.";
  });
  $("pt-dl-txt").addEventListener("click", function () {
    if (!current) { return; }
    download(baseName() + ".txt", receiptText(receiptObject()), "text/plain;charset=utf-8");
    status.textContent = "Receipt (.txt) saved to your device.";
  });

  /* ---------- Verify ---------- */
  var vFile = null;
  var result = $("pv-result");
  function setResult(cls, text) { result.className = "verify-result" + (cls ? " " + cls : ""); result.textContent = text; }
  setupDrop("pv-drop", "pv-file", function (f) { vFile = f; setResult("", "Selected: " + f.name + " (" + fmtSize(f.size) + "). Press Compare."); });
  $("pv-receipt").addEventListener("change", function () {
    var f = $("pv-receipt").files[0];
    if (!f) { return; }
    var r = new FileReader();
    r.onload = function () {
      try {
        var obj = JSON.parse(r.result);
        var h = normHash(obj.hash_hex || obj.sha256 || obj.hash || "");
        if (!h) { throw new Error("no hash"); }
        $("pv-expected").value = h;
        setResult("", "Loaded the hash from " + f.name + ". Now choose the file and press Compare.");
      } catch (e) { setResult("bad", "That file doesn't look like a receipt with a SHA-256 hash."); }
    };
    r.readAsText(f);
  });
  $("pv-check").addEventListener("click", function () {
    var expected = normHash($("pv-expected").value);
    if (!expected) { setResult("bad", "Paste a valid SHA-256 hash: 64 characters, 0-9 and a-f."); return; }
    var job;
    if (vFile) {
      if (vFile.size > MAX) { setResult("bad", "That file is larger than 1 GB."); return; }
      setResult("", "Hashing locally…");
      job = readFile(vFile).then(sha256);
    } else if ($("pv-text").value) {
      job = sha256(new TextEncoder().encode($("pv-text").value));
    } else { setResult("bad", "Choose a file or enter text to check."); return; }
    job.then(function (h) {
      $("pv-computed").textContent = h;
      if (h === expected) {
        setResult("match", "\u2713 MATCH. This input has exactly the same SHA-256 fingerprint as the expected hash, so it is byte-for-byte identical to what was hashed.");
      } else {
        setResult("nomatch", "\u2717 NO MATCH. The fingerprints differ, so this is not the same file or text (even a one-byte change or a re-saved copy gives a different hash).");
      }
    }).catch(function () { setResult("bad", "Couldn't read or hash that input."); });
  });
  $("pv-reset").addEventListener("click", function () {
    vFile = null; $("pv-file").value = ""; $("pv-receipt").value = ""; $("pv-text").value = ""; $("pv-expected").value = "";
    $("pv-computed").textContent = "\u2014";
    setResult("", "Choose a file or text and paste a hash, then press Compare.");
  });
})();
