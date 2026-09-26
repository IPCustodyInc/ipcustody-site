/* IP Custody Prior Art Search launcher. Runs entirely in the browser.
   It never sends your query anywhere itself: it only builds links to public
   search sites, which receive the query when you open them. */
(function () {
  "use strict";
  var input = document.getElementById("pa-q");
  var form = document.getElementById("pa-form");
  if (!input || !form) { return; }
  var status = document.getElementById("pa-status");
  var links = Array.prototype.slice.call(document.querySelectorAll("a.engine[data-engine]"));
  var logEl = document.getElementById("pa-log");
  var logDl = document.getElementById("pa-log-dl");
  var logClear = document.getElementById("pa-log-clear");
  var log = [];

  function looksLikeUrl(q) {
    return /^\S+\.\S+$/.test(q) || /^https?:\/\//i.test(q);
  }

  // Build the URL for one engine. Exposed for testing as window.ipcPriorArtUrl.
  function buildUrl(a, q) {
    var kind = a.getAttribute("data-kind");
    var tpl = a.getAttribute("data-template");
    var landing = a.getAttribute("data-landing");
    q = (q || "").trim();
    if (!q || kind === "landing") { return landing; }
    if (tpl === "branddb") {
      var structure = JSON.stringify({ boolean: "AND", bricks: [{ key: "brandName", value: q, strategy: "Simple" }] });
      return "https://branddb.wipo.int/en/similarname/results?sort=" + encodeURIComponent("score desc") +
        "&start=0&rows=30&asStructure=" + encodeURIComponent(structure);
    }
    if (tpl === "wayback") {
      return looksLikeUrl(q) ? "https://web.archive.org/web/*/" + encodeURIComponent(q.replace(/^https?:\/\//i, "")) : landing;
    }
    return tpl.split("{q}").join(encodeURIComponent(q));
  }

  function update() {
    var q = input.value;
    links.forEach(function (a) { a.href = buildUrl(a, q); });
  }

  function say(msg) { if (status) { status.textContent = msg; } }

  function copy(text, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { say(okMsg); }, function () { say("Couldn't copy automatically. Select the search box text and copy it."); });
    } else {
      say("Select the search box text and copy it.");
    }
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function localStamp(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }

  function renderLog() {
    logEl.innerHTML = "";
    if (!log.length) {
      var li0 = document.createElement("li"); li0.className = "muted"; li0.textContent = "No searches opened yet.";
      logEl.appendChild(li0);
    }
    log.forEach(function (e) {
      var li = document.createElement("li");
      li.textContent = e.time + " · " + e.engine + " · \u201C" + e.query + "\u201D";
      logEl.appendChild(li);
    });
    logDl.disabled = logClear.disabled = !log.length;
  }

  links.forEach(function (a) {
    a.addEventListener("click", function () {
      var q = input.value.trim();
      a.href = buildUrl(a, q);
      var name = a.querySelector(".eng-name").textContent;
      if (!q) { say("Opened " + name + ". Tip: type keywords above first to search directly."); return; }
      var kind = a.getAttribute("data-kind");
      var isLanding = a.href === a.getAttribute("data-landing");
      log.push({ time: localStamp(new Date()), engine: name, query: q, url: a.href });
      renderLog();
      if (kind === "landing" || isLanding) {
        copy(q, "Query copied. Paste it into the search box on " + name + ".");
      } else {
        say("Opened " + name + " in a new tab.");
      }
    });
  });

  input.addEventListener("input", update);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    update();
    var q = input.value.trim();
    if (q && window.history && history.replaceState) {
      history.replaceState(null, "", "?q=" + encodeURIComponent(q));
    }
    say(q ? "Links updated for \u201C" + q + "\u201D. Choose a database below." : "Type some keywords first.");
  });
  document.getElementById("pa-copy").addEventListener("click", function () {
    var q = input.value.trim();
    if (!q) { say("Type some keywords first."); return; }
    copy(q, "Query copied to your clipboard.");
  });

  logDl.addEventListener("click", function () {
    var lines = ["Prior-art search log (generated locally by the IP Custody Prior Art Search page)",
      "Time zone: " + (Intl.DateTimeFormat().resolvedOptions().timeZone || "local"),
      "Times are from this device's clock. This log is a personal record, not a legal opinion.", ""];
    log.forEach(function (e, i) {
      lines.push((i + 1) + ". " + e.time + " | " + e.engine + " | " + e.query);
      lines.push("   " + e.url);
    });
    var blob = new Blob([lines.join("\r\n") + "\r\n"], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var tmp = document.createElement("a");
    tmp.href = url; tmp.download = "prior-art-search-log.txt";
    document.body.appendChild(tmp); tmp.click(); tmp.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });
  logClear.addEventListener("click", function () { log = []; renderLog(); say("Search log cleared."); });

  // Prefill from ?q=
  try {
    var q0 = new URLSearchParams(window.location.search).get("q");
    if (q0) { input.value = q0.slice(0, 500); }
  } catch (err) { /* older browser: ignore */ }
  update();
  window.ipcPriorArtUrl = function (engineId, q) {
    var a = document.querySelector('a.engine[data-engine="' + engineId + '"]');
    return a ? buildUrl(a, q) : null;
  };
})();
