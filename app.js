/* المعجم الثلاثي — app.js (vanilla JS, no build step required) */

(function () {
  "use strict";

  const ICON = {
    x: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    heart: (filled) => `<svg width="17" height="17" viewBox="0 0 24 24" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.5 4.04 3 5.5l7 7Z"/></svg>`,
    volume: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
    sparkles: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8L4 11l5.8 1.9L12 19l1.9-5.8L20 11l-5.8-2.2L12 3z"/></svg>',
    rotate: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
    check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    shuffle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
  };

  const STAR_DIVIDER = `<div class="star-divider"><span class="star-line"></span>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2.6 8.2L23 9l-6.6 5.3L18.5 23 12 18l-6.5 5 2.1-8.7L1 9l8.4-.8z"/></svg>
  <span class="star-line"></span></div>`;

  /* ---------- STATE ---------- */
  const state = {
    tab: "dict",
    query: "",
    unit: "সব শব্দ",
    unitMenuOpen: false,
    favorites: new Set(JSON.parse(localStorage.getItem("mt_favorites") || "[]")),
    visibleCount: 40,
    practiceMode: null,
    flash: null,
    quiz: null,
  };

  const UNIT_ORDER = [];
  const UNIT_COUNTS = {};
  (function buildUnits() {
    const seen = new Set();
    DICTIONARY.forEach((e) => {
      if (!seen.has(e.u)) {
        seen.add(e.u);
        UNIT_ORDER.push(e.u);
      }
      UNIT_COUNTS[e.u] = (UNIT_COUNTS[e.u] || 0) + 1;
    });
  })();

  function saveFavorites() {
    localStorage.setItem("mt_favorites", JSON.stringify(Array.from(state.favorites)));
  }

  function toggleFav(id) {
    if (state.favorites.has(id)) state.favorites.delete(id);
    else state.favorites.add(id);
    saveFavorites();
    render();
  }

  function speakArabic(text) {
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ar-SA";
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  function shuffleArr(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function getFiltered() {
    let list = DICTIONARY;
    if (state.unit !== "সব শব্দ") list = list.filter((e) => e.u === state.unit);
    const q = state.query.trim();
    if (q) {
      const qLower = q.toLowerCase();
      list = list.filter(
        (e) => e.a.includes(q) || e.b.toLowerCase().includes(qLower) || e.e.toLowerCase().includes(qLower)
      );
    }
    return list;
  }

  function wordCardHTML(e) {
    const isFav = state.favorites.has(e.i);
    return `
      <div class="word-card" data-id="${e.i}">
        <div class="word-card-top">
          <button class="icon-btn fav-btn${isFav ? " active" : ""}" data-action="fav" data-id="${e.i}" aria-label="প্রিয় তালিকায় যোগ করুন">${ICON.heart(isFav)}</button>
          <div class="arabic-word" lang="ar" dir="rtl">${esc(e.a)}</div>
          <button class="icon-btn speak-btn" data-action="speak" data-text="${esc(e.a)}" aria-label="উচ্চারণ শুনুন">${ICON.volume}</button>
        </div>
        <div class="word-card-divider"></div>
        <div class="word-card-bottom">
          <div class="bn-word">${esc(e.b)}</div>
          <div class="en-word">${esc(e.e)}</div>
        </div>
      </div>`;
  }

  function emptyStateHTML(text) {
    return `<div class="empty-state">${STAR_DIVIDER}<p>${esc(text)}</p></div>`;
  }

  function renderHeader() {
    document.getElementById("total-count").textContent = DICTIONARY.length;
    document.getElementById("search-input").value = state.query;
    document.getElementById("clear-search").classList.toggle("show", !!state.query);
    document.getElementById("unit-bar").style.display = state.tab === "dict" ? "block" : "none";
    document.getElementById("unit-toggle-label").textContent = state.unit;
    document.getElementById("unit-toggle-count").textContent =
      state.unit === "সব শব্দ" ? DICTIONARY.length : UNIT_COUNTS[state.unit] || 0;
    document.getElementById("unit-chevron").classList.toggle("open", state.unitMenuOpen);
  }

  function renderUnitMenu() {
    const backdrop = document.getElementById("unit-menu-backdrop");
    backdrop.classList.toggle("open", state.unitMenuOpen && state.tab === "dict");
    if (!state.unitMenuOpen) return;
    const list = document.getElementById("unit-menu-list");
    let html = `
      <button class="unit-row${state.unit === "সব শব্দ" ? " selected" : ""}" data-unit="সব শব্দ">
        <span class="radio-dot"></span><span class="unit-row-label">সব শব্দ</span>
        <span class="unit-row-count">${DICTIONARY.length}</span>
      </button>`;
    UNIT_ORDER.forEach((u) => {
      html += `
      <button class="unit-row${state.unit === u ? " selected" : ""}" data-unit="${esc(u)}">
        <span class="radio-dot"></span><span class="unit-row-label">${esc(u)}</span>
        <span class="unit-row-count">${UNIT_COUNTS[u]}</span>
      </button>`;
    });
    list.innerHTML = html;
  }

  function renderDict() {
    const list = getFiltered();
    const shown = list.slice(0, state.visibleCount);
    const el = document.getElementById("view-dict");
    let html = `<div class="result-line"><span>${list.length} টি ফলাফল পাওয়া গেছে</span>`;
    if (state.unit !== "সব শব্দ") html += `<span class="result-unit"> · ${esc(state.unit)}</span>`;
    html += `</div>`;
    if (list.length === 0) {
      html += emptyStateHTML("কোনো শব্দ খুঁজে পাওয়া যায়নি। বানান পরীক্ষা করে আবার চেষ্টা করুন।");
    } else {
      html += `<div class="card-grid">${shown.map(wordCardHTML).join("")}</div>`;
      if (state.visibleCount < list.length) {
        html += `<button class="load-more-btn" id="load-more">আরও শব্দ দেখুন (${list.length - state.visibleCount} বাকি)</button>`;
      }
    }
    el.innerHTML = html;
  }

  function renderFav() {
    const favList = DICTIONARY.filter((e) => state.favorites.has(e.i));
    const el = document.getElementById("view-fav");
    let html = `<div class="result-line"><span>${favList.length} টি প্রিয় শব্দ</span></div>`;
    if (favList.length === 0) {
      html += emptyStateHTML("এখনো কোনো শব্দ প্রিয় তালিকায় যোগ করা হয়নি। শব্দের পাশের হৃদয় চিহ্নে চাপ দিন।");
    } else {
      html += `<div class="card-grid">${favList.map(wordCardHTML).join("")}</div>`;
    }
    el.innerHTML = html;
  }

  function currentPool() {
    return state.unit === "সব শব্দ" ? DICTIONARY : DICTIONARY.filter((e) => e.u === state.unit);
  }

  function renderPractice() {
    const el = document.getElementById("view-practice");
    const pool = currentPool();

    if (pool.length < 4) {
      el.innerHTML = `<div class="view-pad">${emptyStateHTML("অনুশীলনের জন্য পর্যাপ্ত শব্দ নেই। অন্য ইউনিট নির্বাচন করুন।")}</div>`;
      return;
    }
    if (state.practiceMode === "flash") return renderFlashcard(el, pool);
    if (state.practiceMode === "quiz") return renderQuiz(el, pool);

    el.innerHTML = `
      <div class="view-pad practice-intro">
        <div class="practice-hero">${ICON.sparkles}
          <h2>অনুশীলন</h2>
          <p>${state.unit === "সব শব্দ" ? "সমস্ত শব্দভান্ডার" : esc(state.unit)} থেকে ${pool.length} টি শব্দ নিয়ে অনুশীলন করুন</p>
        </div>
        <button class="mode-card" id="start-flash">
          <div class="mode-card-icon">${ICON.rotate}</div>
          <div class="mode-card-text"><h3>ফ্ল্যাশকার্ড</h3><p>শব্দ দেখে অর্থ মনে করার চেষ্টা করুন, তারপর উল্টিয়ে মিলিয়ে নিন</p></div>
        </button>
        <button class="mode-card" id="start-quiz">
          <div class="mode-card-icon">${ICON.check}</div>
          <div class="mode-card-text"><h3>কুইজ মোড</h3><p>সঠিক বাংলা অর্থ বেছে নিয়ে নিজেকে যাচাই করুন</p></div>
        </button>
      </div>`;
  }

  function renderFlashcard(el, pool) {
    if (!state.flash) {
      state.flash = { deck: shuffleArr(pool), idx: 0, revealed: false, known: 0, unknown: 0 };
    }
    const f = state.flash;
    const done = f.idx >= f.deck.length;

    if (done) {
      el.innerHTML = `
        <div class="view-pad practice-mode">
          <div class="practice-topbar"><button class="text-btn" id="exit-practice">← ফিরে যান</button></div>
          <div class="practice-summary">
            ${STAR_DIVIDER}
            <h3>সেশন শেষ!</h3>
            <div class="summary-stats">
              <div class="stat-pill good">জানতাম ${f.known}</div>
              <div class="stat-pill bad">জানতাম না ${f.unknown}</div>
            </div>
            <button class="mode-card restart-btn" id="restart-flash">${ICON.shuffle} আবার শুরু করুন</button>
          </div>
        </div>`;
      return;
    }

    const card = f.deck[f.idx];
    el.innerHTML = `
      <div class="view-pad practice-mode">
        <div class="practice-topbar">
          <button class="text-btn" id="exit-practice">← ফিরে যান</button>
          <span class="practice-progress">${Math.min(f.idx + 1, f.deck.length)} / ${f.deck.length}</span>
        </div>
        <div class="flashcard" id="flashcard">
          ${
            !f.revealed
              ? `<div class="flash-face">
                  <div class="flash-arabic" dir="rtl" lang="ar">${esc(card.a)}</div>
                  <p class="flash-hint">অর্থ দেখতে ট্যাপ করুন</p>
                  <button class="icon-btn speak-btn-lg" id="flash-speak" data-text="${esc(card.a)}">${ICON.volume}</button>
                 </div>`
              : `<div class="flash-face">
                  <div class="flash-bn">${esc(card.b)}</div>
                  <div class="flash-en">${esc(card.e)}</div>
                 </div>`
          }
        </div>
        ${
          f.revealed
            ? `<div class="flash-actions">
                <button class="know-btn no" id="flash-no">${ICON.x} জানতাম না</button>
                <button class="know-btn yes" id="flash-yes">${ICON.check} জানতাম</button>
               </div>`
            : ""
        }
      </div>`;
  }

  function renderQuiz(el, pool) {
    if (!state.quiz) {
      const deck = shuffleArr(pool).slice(0, Math.min(15, pool.length));
      state.quiz = { deck, idx: 0, selected: null, score: 0, options: null };
    }
    const q = state.quiz;
    const done = q.idx >= q.deck.length;

    if (done) {
      const pct = Math.round((q.score / q.deck.length) * 100);
      el.innerHTML = `
        <div class="view-pad practice-mode">
          <div class="practice-topbar"><button class="text-btn" id="exit-practice">← ফিরে যান</button></div>
          <div class="practice-summary">
            ${STAR_DIVIDER}
            <h3>কুইজ শেষ!</h3>
            <p class="quiz-score-text">আপনি ${q.deck.length} টির মধ্যে ${q.score} টি সঠিক উত্তর দিয়েছেন</p>
            <div class="summary-stats"><div class="stat-pill good">${pct}% সঠিক</div></div>
            <button class="mode-card restart-btn" id="restart-quiz">${ICON.shuffle} আবার শুরু করুন</button>
          </div>
        </div>`;
      return;
    }

    const current = q.deck[q.idx];
    if (!q.options) {
      const wrong = shuffleArr(pool.filter((e) => e.i !== current.i)).slice(0, 3);
      q.options = shuffleArr([current, ...wrong]);
    }

    el.innerHTML = `
      <div class="view-pad practice-mode">
        <div class="practice-topbar">
          <button class="text-btn" id="exit-practice">← ফিরে যান</button>
          <span class="practice-progress">${q.idx + 1} / ${q.deck.length}</span>
        </div>
        <div class="quiz-card">
          <p class="quiz-label">এই শব্দের সঠিক অর্থ কোনটি?</p>
          <div class="quiz-arabic" dir="rtl" lang="ar">${esc(current.a)}</div>
          <button class="icon-btn speak-btn-lg quiz-speak" id="quiz-speak" data-text="${esc(current.a)}">${ICON.volume}</button>
          <div class="quiz-options">
            ${q.options
              .map((opt) => {
                let cls = "quiz-option";
                if (q.selected != null) {
                  if (opt.i === current.i) cls += " correct";
                  else if (opt.i === q.selected) cls += " wrong";
                }
                return `<button class="${cls}" data-opt="${opt.i}" ${q.selected != null ? "disabled" : ""}>${esc(opt.b)}</button>`;
              })
              .join("")}
          </div>
          ${q.selected != null ? `<button class="load-more-btn quiz-next" id="quiz-next">${q.idx + 1 === q.deck.length ? "ফলাফল দেখুন" : "পরবর্তী"}</button>` : ""}
        </div>
      </div>`;
  }

  function render() {
    renderHeader();
    renderUnitMenu();
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));

    if (state.tab === "dict") {
      document.getElementById("view-dict").classList.add("active");
      document.getElementById("nav-dict").classList.add("active");
      renderDict();
    } else if (state.tab === "fav") {
      document.getElementById("view-fav").classList.add("active");
      document.getElementById("nav-fav").classList.add("active");
      renderFav();
    } else if (state.tab === "practice") {
      document.getElementById("view-practice").classList.add("active");
      document.getElementById("nav-practice").classList.add("active");
      renderPractice();
    }
  }

  document.addEventListener("click", (ev) => {
    const t = ev.target;

    const favBtn = t.closest('[data-action="fav"]');
    if (favBtn) return toggleFav(Number(favBtn.dataset.id));

    const speakBtn = t.closest('[data-action="speak"]');
    if (speakBtn) return speakArabic(speakBtn.dataset.text);

    if (t.closest("#load-more")) {
      state.visibleCount += 40;
      return renderDict();
    }
    if (t.closest("#clear-search")) {
      state.query = "";
      document.getElementById("search-input").value = "";
      state.visibleCount = 40;
      return render();
    }
    if (t.closest("#unit-toggle")) {
      state.unitMenuOpen = !state.unitMenuOpen;
      renderHeader();
      return renderUnitMenu();
    }
    if (t.id === "unit-menu-backdrop") {
      state.unitMenuOpen = false;
      renderHeader();
      return renderUnitMenu();
    }
    if (t.closest("#close-unit-menu")) {
      state.unitMenuOpen = false;
      renderHeader();
      return renderUnitMenu();
    }
    const unitRow = t.closest(".unit-row");
    if (unitRow) {
      state.unit = unitRow.dataset.unit;
      state.unitMenuOpen = false;
      state.visibleCount = 40;
      state.flash = null;
      state.quiz = null;
      state.practiceMode = null;
      return render();
    }
    const navBtn = t.closest(".nav-btn");
    if (navBtn) {
      state.tab = navBtn.dataset.tab;
      return render();
    }
    if (t.closest("#start-flash")) {
      state.practiceMode = "flash";
      state.flash = null;
      return render();
    }
    if (t.closest("#start-quiz")) {
      state.practiceMode = "quiz";
      state.quiz = null;
      return render();
    }
    if (t.closest("#exit-practice")) {
      state.practiceMode = null;
      state.flash = null;
      state.quiz = null;
      return render();
    }
    if (t.closest("#restart-flash")) {
      state.flash = null;
      return render();
    }
    if (t.closest("#restart-quiz")) {
      state.quiz = null;
      return render();
    }
    if (t.closest("#flash-speak")) {
      return speakArabic(t.closest("#flash-speak").dataset.text);
    }
    if (t.closest("#flashcard")) {
      if (state.flash) {
        state.flash.revealed = !state.flash.revealed;
        return render();
      }
    }
    if (t.closest("#flash-yes")) {
      state.flash.known++;
      state.flash.revealed = false;
      state.flash.idx++;
      return render();
    }
    if (t.closest("#flash-no")) {
      state.flash.unknown++;
      state.flash.revealed = false;
      state.flash.idx++;
      return render();
    }
    if (t.closest("#quiz-speak")) {
      return speakArabic(t.closest("#quiz-speak").dataset.text);
    }
    const quizOpt = t.closest(".quiz-option");
    if (quizOpt && state.quiz && state.quiz.selected == null) {
      const optId = Number(quizOpt.dataset.opt);
      state.quiz.selected = optId;
      const current = state.quiz.deck[state.quiz.idx];
      if (optId === current.i) state.quiz.score++;
      return render();
    }
    if (t.closest("#quiz-next")) {
      state.quiz.idx++;
      state.quiz.selected = null;
      state.quiz.options = null;
      return render();
    }
  });

  let searchDebounce;
  document.getElementById("search-input").addEventListener("input", (ev) => {
    clearTimeout(searchDebounce);
    const val = ev.target.value;
    searchDebounce = setTimeout(() => {
      state.query = val;
      state.visibleCount = 40;
      render();
    }, 120);
    document.getElementById("clear-search").classList.toggle("show", !!val);
  });

  /* ---------- PWA INSTALL PROMPT ---------- */
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const banner = document.getElementById("install-banner");
    if (banner && !localStorage.getItem("mt_install_dismissed")) {
      banner.classList.add("show");
    }
  });
  const installBtn = document.getElementById("install-btn");
  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      document.getElementById("install-banner").classList.remove("show");
    });
  }
  const dismissBtn = document.getElementById("dismiss-install");
  if (dismissBtn) {
    dismissBtn.addEventListener("click", () => {
      localStorage.setItem("mt_install_dismissed", "1");
      document.getElementById("install-banner").classList.remove("show");
    });
  }

  /* ---------- SERVICE WORKER ---------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(function () {});
    });
  }

  /* ---------- INIT ---------- */
  render();
})();
