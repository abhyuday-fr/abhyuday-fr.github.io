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

  /* ---------- Nav overflow ("⋯" menu) ---------- */
  (function () {
    var nav = document.getElementById("site-nav");
    var burger = document.getElementById("nav-toggle");
    var themeBtn = document.getElementById("theme-toggle");
    if (!nav) return;
    var inner = nav.closest(".site-header__inner");
    var brand = inner ? inner.querySelector(".brand") : null;
    if (!inner || !brand) return;

    var links = Array.prototype.slice.call(nav.querySelectorAll("a"));

    var more = document.createElement("div");
    more.className = "nav-more";
    more.hidden = true;
    more.innerHTML =
      '<button type="button" class="nav-more__btn" aria-label="More sections" aria-expanded="false">&#8943;</button>' +
      '<div class="nav-more__menu"></div>';
    nav.appendChild(more);
    var btn = more.querySelector(".nav-more__btn");
    var menu = more.querySelector(".nav-more__menu");

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = more.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function () {
      more.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    });

    function layout() {
      // reset: everything back in the bar
      links.forEach(function (a) { nav.insertBefore(a, more); });
      more.hidden = true;
      more.classList.remove("is-open", "has-current");

      if (window.matchMedia("(max-width: 640px)").matches) return; // hamburger handles mobile

      var avail = inner.clientWidth - brand.offsetWidth
        - (themeBtn ? themeBtn.offsetWidth : 0) - 48;

      var i = links.length;
      while (nav.offsetWidth > avail && i > 0) {
        more.hidden = false;               // reserve room for the ⋯ button
        i--;
        menu.insertBefore(links[i], menu.firstChild);
      }
      if (menu.querySelector('[aria-current="page"]')) more.classList.add("has-current");
    }

    layout();
    var t;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(layout, 80); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  })();

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