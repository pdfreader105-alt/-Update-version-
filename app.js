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
    clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    flag: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
    grid: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
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
    examSetup: { count: 40, customCount: "", minutes: 30, customMinutes: "", source: "all", selectedUnits: [] },
    exam: null,
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

    if (state.practiceMode === "flash" || state.practiceMode === "quiz") {
      if (pool.length < 4) {
        el.innerHTML = `<div class="view-pad">${emptyStateHTML("অনুশীলনের জন্য পর্যাপ্ত শব্দ নেই। অন্য ইউনিট নির্বাচন করুন।")}</div>`;
        return;
      }
      if (state.practiceMode === "flash") return renderFlashcard(el, pool);
      return renderQuiz(el, pool);
    }
    if (state.practiceMode === "examSetup") return renderExamSetup(el);
    if (state.practiceMode === "exam") return renderExam(el);
    if (state.practiceMode === "examResult") return renderExamResult(el);

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
        <button class="mode-card" id="start-exam-setup">
          <div class="mode-card-icon">${ICON.clock}</div>
          <div class="mode-card-text"><h3>পরীক্ষা মোড</h3><p>টাইমার সহ ৪০/৫০টি বা কাস্টম সংখ্যক MCQ প্রশ্নের পূর্ণাঙ্গ পরীক্ষা দিন</p></div>
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

  /* ============ EXAM MODE ============ */
  function getExamSourcePool(setup) {
    if (setup.source === "current") return currentPool();
    if (setup.source === "custom") {
      if (!setup.selectedUnits.length) return [];
      return DICTIONARY.filter((e) => setup.selectedUnits.includes(e.u));
    }
    return DICTIONARY;
  }

  function renderExamSetup(el) {
    const setup = state.examSetup;
    const pool = getExamSourcePool(setup);
    const countPresets = [40, 50];
    const minutePresets = [20, 30, 40];

    el.innerHTML = `
      <div class="view-pad practice-mode">
        <div class="practice-topbar">
          <button class="text-btn" id="exit-practice">← ফিরে যান</button>
        </div>
        <div class="practice-hero" style="padding-top:2px;">${ICON.clock}
          <h2>পরীক্ষা মোড</h2>
          <p>নিজের মতো করে পরীক্ষা সাজিয়ে নিন</p>
        </div>

        <div class="exam-setup-block">
          <div class="exam-setup-label">প্রশ্ন সংখ্যা</div>
          <div class="exam-chip-row">
            ${countPresets
              .map(
                (c) =>
                  `<button class="exam-chip${setup.count === c && !setup.customCount ? " selected" : ""}" data-count="${c}">${c} টি</button>`
              )
              .join("")}
            <input type="number" class="exam-custom-input" id="custom-count" placeholder="কাস্টম" min="4" max="${DICTIONARY.length}" value="${esc(setup.customCount)}" />
          </div>

          <div class="exam-setup-label">সময়সীমা</div>
          <div class="exam-chip-row">
            ${minutePresets
              .map(
                (m) =>
                  `<button class="exam-chip${setup.minutes === m && !setup.customMinutes ? " selected" : ""}" data-minutes="${m}">${m} মিনিট</button>`
              )
              .join("")}
            <input type="number" class="exam-custom-input" id="custom-minutes" placeholder="কাস্টম" min="1" max="180" value="${esc(setup.customMinutes)}" />
          </div>

          <div class="exam-setup-label">প্রশ্নের উৎস</div>
          <div class="exam-source-list">
            <button class="unit-row${setup.source === "all" ? " selected" : ""}" data-source="all">
              <span class="radio-dot"></span><span class="unit-row-label">সব ইউনিট (${DICTIONARY.length})</span>
            </button>
            <button class="unit-row${setup.source === "current" ? " selected" : ""}" data-source="current">
              <span class="radio-dot"></span><span class="unit-row-label">বর্তমান নির্বাচিত ইউনিট — ${esc(state.unit)} (${currentPool().length})</span>
            </button>
            <button class="unit-row${setup.source === "custom" ? " selected" : ""}" data-source="custom">
              <span class="radio-dot"></span><span class="unit-row-label">নির্দিষ্ট ইউনিট বাছাই করুন ${setup.source === "custom" ? `(${pool.length})` : ""}</span>
            </button>
          </div>

          ${setup.source === "custom" ? renderUnitCheckboxes(setup) : ""}

          <button class="load-more-btn exam-start-btn" id="begin-exam">পরীক্ষা শুরু করুন</button>
          <p class="exam-hint">${pool.length > 0 ? `${pool.length} টি শব্দের পুল থেকে প্রশ্ন তৈরি হবে` : "অন্তত একটি ইউনিট বেছে নিন"}</p>
        </div>
      </div>`;
  }

  function renderUnitCheckboxes(setup) {
    return `<div class="exam-unit-checks">
      ${UNIT_ORDER.map((u) => {
        const checked = setup.selectedUnits.includes(u);
        return `<label class="exam-check-row">
          <input type="checkbox" data-unit-check="${esc(u)}" ${checked ? "checked" : ""} />
          <span>${esc(u)} (${UNIT_COUNTS[u]})</span>
        </label>`;
      }).join("")}
    </div>`;
  }

  function effectiveCount() {
    const s = state.examSetup;
    const n = s.customCount ? parseInt(s.customCount, 10) : s.count;
    return Number.isFinite(n) && n > 0 ? n : 40;
  }
  function effectiveMinutes() {
    const s = state.examSetup;
    const n = s.customMinutes ? parseInt(s.customMinutes, 10) : s.minutes;
    return Number.isFinite(n) && n > 0 ? n : 30;
  }

  function startExam() {
    const setup = state.examSetup;
    const srcPool = getExamSourcePool(setup);
    if (srcPool.length < 4) {
      alert("পর্যাপ্ত শব্দ নেই। অন্তত একটি ইউনিট নির্বাচন করুন যেখানে কমপক্ষে ৪টি শব্দ আছে।");
      return;
    }
    const requestedCount = effectiveCount();
    const count = Math.min(requestedCount, srcPool.length);
    const shuffled = shuffleArr(srcPool).slice(0, count);

    const questions = shuffled.map((entry) => {
      const wrongSourcePool = srcPool.length >= 4 ? srcPool : DICTIONARY;
      const wrong = shuffleArr(wrongSourcePool.filter((e) => e.i !== entry.i)).slice(0, 3);
      const options = shuffleArr([entry, ...wrong]);
      return { entry, options, selected: null, flagged: false };
    });

    const timeLimitSec = effectiveMinutes() * 60;
    state.exam = {
      questions,
      idx: 0,
      timeLimitSec,
      remainingSec: timeLimitSec,
      startedAt: Date.now(),
      navOpen: false,
      timerId: null,
      submitted: false,
    };
    state.practiceMode = "exam";
    render();
    startExamTimer();
  }

  function startExamTimer() {
    stopExamTimer();
    const exam = state.exam;
    if (!exam) return;
    exam.timerId = setInterval(() => {
      if (!state.exam) return;
      state.exam.remainingSec--;
      if (state.exam.remainingSec <= 0) {
        state.exam.remainingSec = 0;
        updateExamTimerDisplay();
        submitExam(true);
        return;
      }
      updateExamTimerDisplay();
    }, 1000);
  }

  function stopExamTimer() {
    if (state.exam && state.exam.timerId) {
      clearInterval(state.exam.timerId);
      state.exam.timerId = null;
    }
  }

  function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function updateExamTimerDisplay() {
    const exam = state.exam;
    if (!exam) return;
    const timerEl = document.getElementById("exam-timer-text");
    if (timerEl) {
      timerEl.textContent = fmtTime(exam.remainingSec);
      const lowTime = exam.remainingSec <= 60;
      timerEl.parentElement.classList.toggle("low-time", lowTime);
    }
    const barEl = document.getElementById("exam-timer-bar");
    if (barEl) {
      const pct = Math.max(0, (exam.remainingSec / exam.timeLimitSec) * 100);
      barEl.style.width = pct + "%";
    }
  }

  function renderExam(el) {
    const exam = state.exam;
    if (!exam) return;
    const q = exam.questions[exam.idx];
    const answeredCount = exam.questions.filter((x) => x.selected != null).length;

    el.innerHTML = `
      <div class="exam-wrap">
        <div class="exam-topbar">
          <div class="exam-timer${exam.remainingSec <= 60 ? " low-time" : ""}">
            ${ICON.clock}<span id="exam-timer-text">${fmtTime(exam.remainingSec)}</span>
          </div>
          <button class="exam-nav-btn" id="open-exam-nav">${ICON.grid} ${exam.idx + 1}/${exam.questions.length}</button>
          <button class="exam-submit-btn" id="submit-exam">জমা দিন</button>
        </div>
        <div class="exam-timer-track"><div class="exam-timer-bar" id="exam-timer-bar" style="width:${(exam.remainingSec / exam.timeLimitSec) * 100}%"></div></div>

        <div class="view-pad exam-body">
          <div class="quiz-card">
            <div class="exam-q-head">
              <p class="quiz-label">প্রশ্ন ${exam.idx + 1} — এই শব্দের সঠিক অর্থ কোনটি?</p>
              <button class="icon-btn flag-btn${q.flagged ? " active" : ""}" id="toggle-flag">${ICON.flag}</button>
            </div>
            <div class="quiz-arabic" dir="rtl" lang="ar">${esc(q.entry.a)}</div>
            <button class="icon-btn speak-btn-lg quiz-speak" id="exam-speak" data-text="${esc(q.entry.a)}">${ICON.volume}</button>
            <div class="quiz-options">
              ${q.options
                .map(
                  (opt) =>
                    `<button class="quiz-option${q.selected === opt.i ? " picked" : ""}" data-exam-opt="${opt.i}">${esc(opt.b)}</button>`
                )
                .join("")}
            </div>
          </div>

          <div class="exam-footer-nav">
            <button class="text-btn" id="exam-prev" ${exam.idx === 0 ? "disabled" : ""}>← আগের প্রশ্ন</button>
            <span class="exam-answered-count">${answeredCount}/${exam.questions.length} উত্তর দেওয়া হয়েছে</span>
            <button class="text-btn" id="exam-next" ${exam.idx === exam.questions.length - 1 ? "disabled" : ""}>পরের প্রশ্ন →</button>
          </div>
        </div>

        ${exam.navOpen ? renderExamNavGrid(exam) : ""}
      </div>`;
  }

  function renderExamNavGrid(exam) {
    return `
      <div class="unit-menu-backdrop open" id="exam-nav-backdrop">
        <div class="unit-menu exam-nav-menu">
          <div class="unit-menu-header">
            <span>প্রশ্ন তালিকা</span>
            <button class="icon-btn" id="close-exam-nav">${ICON.x}</button>
          </div>
          <div class="exam-nav-legend">
            <span><i class="dot answered"></i> উত্তর দেওয়া</span>
            <span><i class="dot flagged"></i> চিহ্নিত</span>
            <span><i class="dot"></i> বাকি</span>
          </div>
          <div class="exam-nav-grid">
            ${exam.questions
              .map((q, i) => {
                let cls = "exam-nav-cell";
                if (i === exam.idx) cls += " current";
                if (q.selected != null) cls += " answered";
                if (q.flagged) cls += " flagged";
                return `<button class="${cls}" data-goto="${i}">${i + 1}</button>`;
              })
              .join("")}
          </div>
        </div>
      </div>`;
  }

  function submitExam(auto) {
    const exam = state.exam;
    if (!exam || exam.submitted) return;
    const unanswered = exam.questions.filter((q) => q.selected == null).length;
    if (!auto && unanswered > 0) {
      const ok = confirm(`${unanswered} টি প্রশ্নের উত্তর দেওয়া হয়নি। তারপরও জমা দিতে চান?`);
      if (!ok) return;
    }
    stopExamTimer();
    exam.submitted = true;
    exam.endedAt = Date.now();
    state.practiceMode = "examResult";
    render();
  }

  function renderExamResult(el) {
    const exam = state.exam;
    if (!exam) return;
    const total = exam.questions.length;
    const correct = exam.questions.filter((q) => q.selected === q.entry.i).length;
    const wrong = exam.questions.filter((q) => q.selected != null && q.selected !== q.entry.i).length;
    const skipped = total - correct - wrong;
    const pct = Math.round((correct / total) * 100);
    const timeUsedSec = exam.timeLimitSec - exam.remainingSec;

    el.innerHTML = `
      <div class="view-pad practice-mode">
        <div class="practice-topbar"><button class="text-btn" id="exit-practice">← ফিরে যান</button></div>
        <div class="practice-summary">
          ${STAR_DIVIDER}
          <h3>পরীক্ষা শেষ!</h3>
          <p class="quiz-score-text">আপনি ${total} টির মধ্যে ${correct} টি সঠিক উত্তর দিয়েছেন</p>
          <div class="summary-stats">
            <div class="stat-pill good">${pct}% সঠিক</div>
            <div class="stat-pill bad">${wrong} টি ভুল</div>
            <div class="stat-pill neutral">${skipped} টি বাদ</div>
          </div>
          <p class="exam-time-used">ব্যবহৃত সময়: ${fmtTime(timeUsedSec)} / ${fmtTime(exam.timeLimitSec)}</p>
          <button class="mode-card" id="review-exam">${ICON.grid}<div class="mode-card-text"><h3>উত্তর পর্যালোচনা করুন</h3><p>প্রতিটি প্রশ্নের সঠিক ও আপনার উত্তর দেখুন</p></div></button>
          <button class="mode-card restart-btn" id="retake-exam">${ICON.shuffle} নতুন পরীক্ষা সাজান</button>
        </div>
        <div id="exam-review-area"></div>
      </div>`;
  }

  function renderExamReview() {
    const exam = state.exam;
    const area = document.getElementById("exam-review-area");
    if (!exam || !area) return;
    area.innerHTML = `<div class="card-grid exam-review-list">
      ${exam.questions
        .map((q, i) => {
          const yourAnswer = q.options.find((o) => o.i === q.selected);
          const isCorrect = q.selected === q.entry.i;
          const isSkipped = q.selected == null;
          return `<div class="word-card exam-review-card">
            <div class="exam-review-top">
              <span class="exam-review-num">প্রশ্ন ${i + 1}</span>
              <span class="exam-review-status ${isSkipped ? "skipped" : isCorrect ? "correct" : "wrong"}">
                ${isSkipped ? "বাদ দেওয়া" : isCorrect ? "সঠিক" : "ভুল"}
              </span>
            </div>
            <div class="arabic-word" dir="rtl" lang="ar" style="text-align:center;margin:8px 0;">${esc(q.entry.a)}</div>
            <div class="exam-review-answers">
              <div class="bn-word">সঠিক উত্তর: ${esc(q.entry.b)}</div>
              ${!isSkipped && !isCorrect ? `<div class="en-word exam-wrong-answer">আপনার উত্তর: ${esc(yourAnswer ? yourAnswer.b : "")}</div>` : ""}
            </div>
          </div>`;
        })
        .join("")}
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
    if (unitRow && unitRow.dataset.unit !== undefined) {
      state.unit = unitRow.dataset.unit;
      state.unitMenuOpen = false;
      state.visibleCount = 40;
      state.flash = null;
      state.quiz = null;
      stopExamTimer();
      state.exam = null;
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
    if (t.closest("#start-exam-setup")) {
      state.practiceMode = "examSetup";
      return render();
    }
    if (t.closest("#exit-practice")) {
      stopExamTimer();
      state.practiceMode = null;
      state.flash = null;
      state.quiz = null;
      state.exam = null;
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

    /* ---- EXAM SETUP ---- */
    const countChip = t.closest("[data-count]");
    if (countChip) {
      state.examSetup.count = Number(countChip.dataset.count);
      state.examSetup.customCount = "";
      return renderExamSetup(document.getElementById("view-practice"));
    }
    const minuteChip = t.closest("[data-minutes]");
    if (minuteChip) {
      state.examSetup.minutes = Number(minuteChip.dataset.minutes);
      state.examSetup.customMinutes = "";
      return renderExamSetup(document.getElementById("view-practice"));
    }
    const sourceBtn = t.closest("[data-source]");
    if (sourceBtn) {
      state.examSetup.source = sourceBtn.dataset.source;
      return renderExamSetup(document.getElementById("view-practice"));
    }
    if (t.closest("#begin-exam")) {
      return startExam();
    }

    /* ---- EXAM RUNNER ---- */
    if (t.closest("#exam-speak")) {
      return speakArabic(t.closest("#exam-speak").dataset.text);
    }
    const examOpt = t.closest("[data-exam-opt]");
    if (examOpt && state.exam) {
      const exam = state.exam;
      exam.questions[exam.idx].selected = Number(examOpt.dataset.examOpt);
      return renderExam(document.getElementById("view-practice"));
    }
    if (t.closest("#toggle-flag") && state.exam) {
      const exam = state.exam;
      exam.questions[exam.idx].flagged = !exam.questions[exam.idx].flagged;
      return renderExam(document.getElementById("view-practice"));
    }
    if (t.closest("#exam-prev") && state.exam) {
      if (state.exam.idx > 0) state.exam.idx--;
      return renderExam(document.getElementById("view-practice"));
    }
    if (t.closest("#exam-next") && state.exam) {
      if (state.exam.idx < state.exam.questions.length - 1) state.exam.idx++;
      return renderExam(document.getElementById("view-practice"));
    }
    if (t.closest("#open-exam-nav") && state.exam) {
      state.exam.navOpen = true;
      return renderExam(document.getElementById("view-practice"));
    }
    if (t.closest("#close-exam-nav") && state.exam) {
      state.exam.navOpen = false;
      return renderExam(document.getElementById("view-practice"));
    }
    if (t.id === "exam-nav-backdrop" && state.exam) {
      state.exam.navOpen = false;
      return renderExam(document.getElementById("view-practice"));
    }
    const gotoBtn = t.closest("[data-goto]");
    if (gotoBtn && state.exam) {
      state.exam.idx = Number(gotoBtn.dataset.goto);
      state.exam.navOpen = false;
      return renderExam(document.getElementById("view-practice"));
    }
    if (t.closest("#submit-exam")) {
      return submitExam(false);
    }

    /* ---- EXAM RESULT ---- */
    if (t.closest("#review-exam")) {
      return renderExamReview();
    }
    if (t.closest("#retake-exam")) {
      state.exam = null;
      state.practiceMode = "examSetup";
      return render();
    }
  });

  /* ---- EXAM SETUP: checkboxes + custom number inputs (delegated 'change'/'input') ---- */
  document.addEventListener("change", (ev) => {
    const cb = ev.target.closest("[data-unit-check]");
    if (cb) {
      const u = cb.dataset.unitCheck;
      const idx = state.examSetup.selectedUnits.indexOf(u);
      if (cb.checked && idx === -1) state.examSetup.selectedUnits.push(u);
      if (!cb.checked && idx !== -1) state.examSetup.selectedUnits.splice(idx, 1);
      renderExamSetup(document.getElementById("view-practice"));
    }
  });

  document.addEventListener("input", (ev) => {
    if (ev.target.id === "custom-count") {
      state.examSetup.customCount = ev.target.value;
      document.querySelectorAll("[data-count]").forEach((b) => b.classList.remove("selected"));
    }
    if (ev.target.id === "custom-minutes") {
      state.examSetup.customMinutes = ev.target.value;
      document.querySelectorAll("[data-minutes]").forEach((b) => b.classList.remove("selected"));
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
