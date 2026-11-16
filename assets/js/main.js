// 共通スクリプト。失敗しても本文は表示されたままになるよう、隠す処理はすべてJS側で付ける。
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- オープニング（トップのみ・セッション中1回・スキップ可） ---------- */
  function opening() {
    if (!document.body.hasAttribute("data-opening") || reduce) return;
    try {
      if (sessionStorage.getItem("cj-opening")) return;
      sessionStorage.setItem("cj-opening", "1");
    } catch (e) { return; }
    var el = document.createElement("div");
    el.className = "opening";
    var previousFocus = document.activeElement;
    el.innerHTML = '<div><p class="opening-copy">身体を読み解く。<br>技術を、次の担い手へ。</p><p class="opening-mark">Conditioning Japan</p></div>';
    var skip = document.createElement("button");
    skip.type = "button";
    skip.className = "opening-skip";
    skip.textContent = "スキップ";
    el.appendChild(skip);
    document.body.appendChild(el);
    var done = false;
    function end() {
      if (done) return;
      done = true;
      if (document.activeElement === skip) previousFocus.focus();
      el.classList.add("is-done");
      setTimeout(function () { el.remove(); }, 600);
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") end(); }
    skip.addEventListener("click", end);
    el.addEventListener("click", end);
    document.addEventListener("keydown", onKey);
    setTimeout(end, 1400);
    skip.focus();
  }

  /* ---------- スマホのドロワーメニュー ---------- */
  function drawer() {
    var btn = document.querySelector("[data-menu-btn]");
    var panel = document.querySelector("[data-drawer]");
    if (!btn || !panel) return;
    var mq = window.matchMedia("(min-width: 1080px)");

    function focusables() {
      return Array.prototype.slice.call(panel.querySelectorAll("a[href], button:not([disabled])"));
    }
    function open() {
      panel.style.top = btn.closest("header").getBoundingClientRect().bottom + "px";
      panel.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-label", "メニューを閉じる");
      document.body.classList.add("is-locked");
      var f = focusables();
      if (f[0]) f[0].focus();
      document.addEventListener("keydown", onKey);
    }
    function close(restore) {
      if (panel.hidden) return;
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "メニューを開く");
      document.body.classList.remove("is-locked");
      document.removeEventListener("keydown", onKey);
      if (restore !== false) btn.focus();
    }
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      // ボタン＋メニュー内でフォーカスを循環させる
      var f = [btn].concat(focusables());
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
    }
    btn.addEventListener("click", function () { panel.hidden ? open() : close(); });
    panel.addEventListener("click", function (e) { if (e.target.closest("a")) close(false); });
    mq.addEventListener ? mq.addEventListener("change", function () { if (mq.matches) close(false); }) : null;
    window.addEventListener("resize", function () {
      if (!panel.hidden) panel.style.top = btn.closest("header").getBoundingClientRect().bottom + "px";
    });
    window.addEventListener("pageshow", function () { close(false); });
  }

  /* ---------- 講座の絞り込み ---------- */
  function filter() {
    var root = document.querySelector("[data-filter]");
    var list = document.querySelector("[data-course-list]");
    if (!root || !list) return;
    var items = Array.prototype.slice.call(list.querySelectorAll("[data-category]"));
    var status = document.querySelector("[data-filter-status]");
    var empty = document.querySelector("[data-filter-empty]");
    var buttons = Array.prototype.slice.call(root.querySelectorAll("[data-filter-btn]"));
    function apply(cat) {
      var n = 0;
      items.forEach(function (li) {
        var show = cat === "all" || li.getAttribute("data-category") === cat;
        li.hidden = !show;
        if (show) n++;
      });
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-filter-btn") === cat)); });
      var label = cat === "all" ? "全" + items.length + "講座" : root.querySelector('[data-filter-btn="' + cat + '"]').textContent + "：" + n + "講座";
      status.textContent = label + "を表示しています";
      if (n !== 0 && empty.contains(document.activeElement)) buttons[0].focus();
      empty.hidden = n !== 0;
    }
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-filter-btn]");
      if (b) apply(b.getAttribute("data-filter-btn"));
    });
  }

  /* ---------- 控えめな登場 ---------- */
  function reveal() {
    var els = document.querySelectorAll(".reveal");
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
    // 監視が働かない環境でも必ず表示する
    setTimeout(function () { els.forEach(function (el) { el.classList.add("is-in"); }); }, 2500);
  }

  function run(fn) { try { fn(); } catch (e) { if (window.console) console.error(e); } }
  [opening, drawer, filter, reveal].forEach(run);
})();
