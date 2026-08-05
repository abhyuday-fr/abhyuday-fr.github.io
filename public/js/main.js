(function () {
  "use strict";

  /* ---------- Theme toggle (Macchiato <-> Latte), persisted ---------- */
  var root = document.documentElement;
  var STORAGE_KEY = "macchiato-theme";

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
  }

  var toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme") === "latte" ? "latte" : "macchiato";
      var next = current === "macchiato" ? "latte" : "macchiato";
      applyTheme(next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    });
  }

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("site-nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
      var expanded = nav.classList.contains("is-open");
      navToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
  }

  /* ---------- Reading progress bar ---------- */
  var progress = document.getElementById("reading-progress");
  if (progress) {
    var onScroll = function () {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progress.style.width = pct + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Code block headers + copy buttons ---------- */
  document.querySelectorAll(".highlight").forEach(function (block) {
    var pre = block.querySelector("pre");
    if (!pre) return;

    var header = document.createElement("div");
    header.className = "code-block-header";

    var dots = document.createElement("span");
    dots.className = "dots";
    dots.innerHTML = "<span></span><span></span><span></span>";

    var lang = document.createElement("span");
    lang.className = "lang";
    var langAttr = block.getAttribute("data-lang") || "";
    lang.textContent = langAttr;

    var left = document.createElement("span");
    left.style.display = "inline-flex";
    left.style.alignItems = "center";
    left.style.gap = "0.6rem";
    left.appendChild(dots);
    left.appendChild(lang);

    var copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.type = "button";
    copyBtn.textContent = "copy";
    copyBtn.addEventListener("click", function () {
      var code = pre.innerText;
      navigator.clipboard.writeText(code).then(function () {
        copyBtn.textContent = "copied";
        copyBtn.classList.add("copied");
        setTimeout(function () {
          copyBtn.textContent = "copy";
          copyBtn.classList.remove("copied");
        }, 1600);
      });
    });

    header.appendChild(left);
    header.appendChild(copyBtn);
    block.insertBefore(header, pre);
  });
})();
