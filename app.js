(function () {
  // ---------- constants ----------
  // Adding ?demo=1 to the address shows made-up sample habits in a SEPARATE store, so
  // screenshots never touch (or show) your real data.
  var DEMO = /[?&]demo=1/.test(location.search);
  var STORAGE_KEY = DEMO ? 'habit-tracker-demo-state' : 'habit-tracker-state-v1'; // habits, check-ins, categories, notes, settings
  var LAST_BACKUP_KEY = 'habit-tracker-last-backup';
  var VIEW_KEY = 'habit-tracker-view';          // which view you last picked (new, separate key)
  var COLORS = ['#5fb3c9', '#d9776f', '#6a9fd8', '#9a8bd6', '#6fbf93', '#d4a85a', '#cf7fa8', '#94a3b8'];
  var FALLBACK_COLOR = '#94a3b8';
  // Older versions used other palettes. On load those colors are swapped for the current ones
  // (only the color text changes, and it only happens for the exact old values).
  var LEGACY_COLORS = { '#8fa998': '#6fbf93', '#d9a566': '#d4a85a', '#7b93b0': '#6a9fd8', '#c68a7c': '#d9776f', '#9689b0': '#9a8bd6', '#6fa8a0': '#5fb3c9', '#4fd1e8': '#5fb3c9', '#f0726a': '#d9776f', '#5aa9f0': '#6a9fd8', '#a78bfa': '#9a8bd6', '#6ee7a0': '#6fbf93', '#f5b94a': '#d4a85a', '#f472b6': '#cf7fa8' };
  var NUDGE_KEY = 'habit-tracker-nudge-until';
  var WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var FILTER_KEY = 'habit-tracker-filter';      // which category chip is selected (new, separate key)
  var DEFAULT_WEEKS = 12;                       // heat map range if you never change it
  var MIN_WEEKS = 1, MAX_WEEKS = 156;           // custom range limits (156 weeks = 3 years)
  var FIT_MAX_WEEKS = 26;                       // up to here the heat map fills the card; beyond it scrolls sideways
  var RANGE_PRESETS = [['4 weeks', 4], ['12 weeks', 12], ['6 months', 26], ['1 year', 52]];
  var ICON_PX = 96;                             // uploaded icon photos are cropped square and shrunk to this size

  // Streak badges, checked from the biggest down (icon = a Lucide icon name from icons.js).
  // Weekly habits count weeks, so they use weeks x 7.
  var MILESTONES = [
    { days: 365, icon: 'trophy' }, { days: 100, icon: 'crown' }, { days: 30, icon: 'gem' },
    { days: 7, icon: 'zap' }, { days: 3, icon: 'flame' }, { days: 1, icon: 'sprout' }
  ];

  var EMOJIS = ['\uD83D\uDCDA','\u270F\uFE0F','\uD83D\uDCBB','\uD83C\uDFAF','\uD83D\uDCAA','\uD83C\uDFC3','\uD83D\uDEB4','\uD83E\uDDD8',
                '\uD83E\uDD57','\uD83D\uDCA7','\uD83D\uDE34','\uD83E\uDDE0','\uD83C\uDFA8','\uD83C\uDFB8','\uD83C\uDFB9','\uD83E\uDDF9',
                '\uD83D\uDECF\uFE0F','\uD83E\uDEA5','\uD83D\uDC8A','\uD83C\uDF31','\uD83D\uDC36','\u2600\uFE0F','\uD83C\uDF19','\uD83D\uDE4F',
                '\uD83D\uDCDD','\uD83D\uDCB0','\uD83D\uDCF5','\uD83C\uDF4E','\uD83E\uDD66','\uD83D\uDEBF','\uD83C\uDFAE','\u2764\uFE0F'];

  var DB_NAME = DEMO ? 'habit-tracker-demo-db' : 'habit-tracker-db';
  var DB_VERSION = 1;
  var PHOTO_STORE = 'photos';
  var MAX_DIM = 1280; // px, longest side after compression
  var JPEG_QUALITY = 0.72;

  var ICONS = {
    check: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    camera: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1.1-1.6a1 1 0 0 1 .8-.4h4.8a1 1 0 0 1 .8.4L16.3 6h1.2A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.4"/></svg>',
    cards: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><rect x="3" y="4" width="4.5" height="4.5" rx="1.3"/><rect x="9.75" y="4" width="4.5" height="4.5" rx="1.3"/><rect x="16.5" y="4" width="4.5" height="4.5" rx="1.3"/><rect x="3" y="9.75" width="4.5" height="4.5" rx="1.3"/><rect x="9.75" y="9.75" width="4.5" height="4.5" rx="1.3"/><rect x="16.5" y="9.75" width="4.5" height="4.5" rx="1.3"/><rect x="3" y="15.5" width="4.5" height="4.5" rx="1.3"/><rect x="9.75" y="15.5" width="4.5" height="4.5" rx="1.3"/><rect x="16.5" y="15.5" width="4.5" height="4.5" rx="1.3"/></svg>',
    checklist: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 7l1.8 1.8L8.5 5.5M3.5 16.5l1.8 1.8 3.2-3.3M12.5 7.5H20.5M12.5 17H20.5"/></svg>',
    compact: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6.5h16M4 12h16M4 17.5h16"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="2.5"/><circle cx="8" cy="17" r="2.5"/></svg>',
    chart: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 19v-6M12 19V5M18 19v-9"/></svg>',
    upload: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V5M7.5 9.5L12 5l4.5 4.5M5 19h14"/></svg>'
  };

  // habits[].categoryId / icon / iconImage and categories / settings are new in Phase 1b;
  // load() fills in defaults, so data saved by older versions keeps working untouched.
  var state = { habits: [], checkins: {}, categories: [], settings: { heatmapWeeks: DEFAULT_WEEKS }, notes: {}, rest: {} }; // checkins[habitId] = { 'YYYY-MM-DD': true }
  var photos = {}; // { 'habitId|YYYY-MM-DD': 'data:image/jpeg;base64,...' }
  var view = 'cards'; // 'cards' | 'checklist' | 'compact'
  var fx = { pop: null, swap: true }; // one-shot animation flags, cleared after each render
  var shownPct = 0; // progress bar width last drawn, so it can animate to the new value
  var scrollLocked = false, lockedY = 0;
  var filter = 'all'; // 'all' | a category id | 'none' (uncategorized)
  var modal = null; // { kind: 'habit'|'category'|'settings'|'day'|'gallery'|'stats'|'archived', mode: 'add'|'edit', draft: {...}, returnTo?: 'settings' }
  var ready = false;
  var photosReady = false;

  // ---------- date helpers ----------
  function toKey(d) {
    var y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
    return y + '-' + m + '-' + day;
  }
  function todayKey() { return toKey(new Date()); }
  function addDays(d, n) { var r = new Date(d); r.setDate(r.getDate() + n); return r; }
  function startOfWeek(d) { var r = new Date(d); var day = r.getDay(); return addDays(r, -day); }

  function isScheduled(habit, date) {
    if (habit.frequency.type === 'daily') return true;
    if (habit.frequency.type === 'weekdays') return habit.frequency.days.indexOf(date.getDay()) !== -1;
    if (habit.frequency.type === 'weekly') return true; // any day counts toward the weekly quota
    return true;
  }

  function isDone(habit, dateKey) {
    return !!(state.checkins[habit.id] && state.checkins[habit.id][dateKey]);
  }

  function isRest(habit, dateKey) {
    return !!(state.rest[habit.id] && state.rest[habit.id][dateKey]);
  }
  function getNote(habitId, dateKey) { return (state.notes[habitId] && state.notes[habitId][dateKey]) || ''; }
  function setNote(habitId, dateKey, text) {
    if (!state.notes[habitId]) state.notes[habitId] = {};
    if (text.trim()) state.notes[habitId][dateKey] = text; else delete state.notes[habitId][dateKey];
    save();
  }
  // Only today and the 6 days before it can be changed; older days are view-only
  function inEditWindow(dateKey) {
    var p = dateKey.split('-');
    var t = new Date(); t.setHours(0, 0, 0, 0);
    var diff = Math.round((t - new Date(+p[0], +p[1] - 1, +p[2])) / 86400000);
    return diff >= 0 && diff <= 6;
  }

  function photoKey(habitId, dateKey) { return habitId + '|' + dateKey; }
  function getPhoto(habitId, dateKey) { return photos[photoKey(habitId, dateKey)]; }

  // ---------- streak computation ----------
  function computeStreak(habit) {
    var today = new Date();
    if (habit.frequency.type === 'weekly') {
      // consecutive weeks meeting target, most recent first (current week is in-progress, counted if already met)
      var target = habit.frequency.target;
      var streak = 0;
      var weekStart = startOfWeek(today);
      var w = weekStart;
      var first = true;
      while (true) {
        var count = 0;
        for (var i = 0; i < 7; i++) {
          var d = addDays(w, i);
          if (d > today) continue;
          if (isDone(habit, toKey(d))) count++;
        }
        var met = count >= target;
        if (first) {
          // current week: only breaks streak if week is over (i.e. never for current week) — count if met so far
          if (met) { streak++; } // else streak stays 0 for now, but don't break since week isn't done
          first = false;
        } else {
          if (met) streak++; else break;
        }
        w = addDays(w, -7);
        if (streak > 260) break; // safety cap (~5 years)
        // stop scanning past habit creation
        if (w < new Date(habit.createdAt)) break;
      }
      return streak;
    } else {
      // daily or weekdays: walk back from today (or yesterday if today not done/not required yet)
      var streakD = 0;
      var cursor = new Date(today);
      // if today is scheduled and not done, start checking from yesterday instead (don't break streak mid-day)
      if (isScheduled(habit, cursor) && !isDone(habit, toKey(cursor))) {
        cursor = addDays(cursor, -1);
      }
      while (cursor >= new Date(habit.createdAt) - 86400000) {
        if (isScheduled(habit, cursor)) {
          if (isDone(habit, toKey(cursor))) {
            streakD++;
          } else if (!isRest(habit, toKey(cursor))) {
            break;
          }
        }
        cursor = addDays(cursor, -1);
        if (streakD > 3650) break;
      }
      return streakD;
    }
  }

  function frequencyLabel(f) {
    if (f.type === 'daily') return 'Every day';
    if (f.type === 'weekdays') return f.days.map(function(d){return WEEKDAYS[d];}).join(', ');
    if (f.type === 'weekly') return f.target + 'x per week';
    return '';
  }

  // ---------- color + icon helpers ----------
  function safeColor(c) { return /^#[0-9a-fA-F]{6}$/.test(c || '') ? c : FALLBACK_COLOR; }
  function rgbOf(hex) {
    var n = parseInt(hex.slice(1), 16);
    return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }
  // Each habit's card/row gets these two CSS variables; the stylesheet does the rest.
  function colorVars(habit) {
    var c = safeColor(habit.color);
    return '--c:' + c + ';--c-rgb:' + rgbOf(c);
  }
  // Emoji the user picked, or the first letter of the name
  function habitIcon(habit) {
    var icon = (habit.icon || '').trim();
    if (icon && icon.indexOf('i:') !== 0) return icon; // 'i:name' means a line icon, handled in tileEl
    var first = Array.from(habit.name || '?')[0] || '?';
    return first.toUpperCase();
  }
  // Line icons live in icons.js (Lucide). A habit stores one as 'i:name', e.g. 'i:dumbbell'.
  function lucideSvg(name, size) {
    var inner = (window.HT_ICONS || {})[name];
    if (!inner) return '';
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }

  // Square icon for a habit or category: uploaded photo, else line icon, else emoji/letter
  function tileEl(item, extraClass) {
    var t = el('span', { class: 'tile' + (extraClass ? ' ' + extraClass : '') });
    var iconName = (item.icon || '').indexOf('i:') === 0 ? item.icon.slice(2) : '';
    if (item.iconImage) t.appendChild(el('img', { src: item.iconImage, alt: '' }));
    else if (iconName && lucideSvg(iconName, 24)) t.innerHTML = lucideSvg(iconName, 24); // fixed strings from icons.js, not user input
    else t.textContent = habitIcon(item);
    return t;
  }

  function clampWeeks(n) {
    n = Math.round(Number(n));
    if (!isFinite(n)) return DEFAULT_WEEKS;
    return Math.max(MIN_WEEKS, Math.min(MAX_WEEKS, n));
  }

  function findCategory(id) {
    return state.categories.find(function(c) { return c.id === id; });
  }

  // Which badge a streak has earned, and the next one to aim for
  function streakInfo(habit, streak) {
    var weekly = habit.frequency.type === 'weekly';
    var days = weekly ? streak * 7 : streak;
    var tier = null, next = null;
    for (var i = 0; i < MILESTONES.length; i++) {
      if (days >= MILESTONES[i].days) { tier = MILESTONES[i]; break; }
      next = MILESTONES[i];
    }
    return { weekly: weekly, tier: tier, next: next };
  }

  // ---------- persistence ----------
  // Habits and check-ins are stored in localStorage, on-device, so the app works fully offline
  // and never depends on a network connection.
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Save failed', e);
      alert('Could not save — your device storage may be full.');
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.habits) state = parsed;
      }
    } catch (e) { console.error('Load failed', e); }
    // Defaults for data saved by older versions
    if (!state.checkins) state.checkins = {};
    if (!state.notes) state.notes = {};   // notes[habitId]['YYYY-MM-DD'] = text (new in Phase 2)
    if (!state.rest) state.rest = {};     // rest[habitId]['YYYY-MM-DD'] = true: a day off that keeps the streak
    if (!Array.isArray(state.categories)) state.categories = [];
    if (!state.settings) state.settings = {};
    state.settings.heatmapWeeks = clampWeeks(state.settings.heatmapWeeks || DEFAULT_WEEKS);
    var recolored = false;
    state.habits.forEach(function(h) {
      var upgraded = LEGACY_COLORS[(h.color || '').toLowerCase()];
      if (upgraded) { h.color = upgraded; recolored = true; }
    });
    if (recolored) save();
    if (DEMO && !state.habits.length) seedDemo();
    try {
      var v = localStorage.getItem(VIEW_KEY);
      if (v === 'cards' || v === 'checklist' || v === 'compact') view = v;
      var f = localStorage.getItem(FILTER_KEY);
      if (f === 'none' || (f && findCategory(f))) filter = f;
    } catch (e) {}
    ready = true;
    render();
  }

  function setFilter(f) {
    filter = f;
    fx.swap = true;
    haptic();
    try { localStorage.setItem(FILTER_KEY, f); } catch (e) {}
    render();
  }

  function setView(v) {
    view = v;
    fx.swap = true;
    haptic();
    try { localStorage.setItem(VIEW_KEY, v); } catch (e) {}
    render();
  }

  // ---------- photo persistence (IndexedDB) ----------
  // Photos live in IndexedDB instead of localStorage: it's a real on-device
  // database with a much larger quota (typically capped only by your phone's
  // free space, not a fixed few-MB ceiling). Each photo is its own record, so
  // saving one new photo never has to rewrite everything that came before it.
  var dbPromise = null;
  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function(resolve, reject) {
      if (!window.indexedDB) { reject(new Error('IndexedDB unavailable')); return; }
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function() {
        req.result.createObjectStore(PHOTO_STORE);
      };
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function() { reject(req.error); };
    });
    return dbPromise;
  }

  function idbPut(key, value) {
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(PHOTO_STORE, 'readwrite');
        tx.objectStore(PHOTO_STORE).put(value, key);
        tx.oncomplete = function() { resolve(); };
        tx.onerror = function() { reject(tx.error); };
      });
    });
  }

  function idbDelete(key) {
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(PHOTO_STORE, 'readwrite');
        tx.objectStore(PHOTO_STORE).delete(key);
        tx.oncomplete = function() { resolve(); };
        tx.onerror = function() { reject(tx.error); };
      });
    });
  }

  function idbGetAll() {
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(PHOTO_STORE, 'readonly');
        var store = tx.objectStore(PHOTO_STORE);
        var keysReq = store.getAllKeys();
        var valsReq = store.getAll();
        tx.oncomplete = function() { resolve({ keys: keysReq.result, values: valsReq.result }); };
        tx.onerror = function() { reject(tx.error); };
      });
    });
  }

  function loadPhotos() {
    idbGetAll().then(function(res) {
      var map = {};
      for (var i = 0; i < res.keys.length; i++) map[res.keys[i]] = res.values[i];
      photos = map;
      photosReady = true;
      render();
    }).catch(function(e) {
      console.error('Photo load failed', e);
      photosReady = true;
      render();
    });
  }

  function savePhoto(key, dataUrl) {
    idbPut(key, dataUrl).catch(function(e) {
      console.error('Photo save failed', e);
      alert('Could not save that photo. Your device storage may be full.');
    });
  }

  // Burn the time the photo was added into its bottom-left corner. A photo added later for a
  // past day (or picked from the library) shows when it was added here, not when it was shot.
  function stampTime(ctx, w, h) {
    var text = new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    var size = Math.max(14, Math.round(w / 40));
    var pad = Math.round(size * 0.6);
    ctx.font = '600 ' + size + 'px -apple-system, system-ui, sans-serif';
    var boxW = ctx.measureText(text).width + pad * 2;
    var boxH = size + pad;
    var x = pad, y = h - pad - boxH;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + pad, y + boxH / 2);
  }

  // Downscale + compress an image file to a data URL before storing.
  function compressImage(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var w = img.width, h = img.height;
        var scale = Math.min(1, MAX_DIM / Math.max(w, h));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        stampTime(ctx, canvas.width, canvas.height);
        callback(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.onerror = function() { callback(null); };
      img.src = e.target.result;
    };
    reader.onerror = function() { callback(null); };
    reader.readAsDataURL(file);
  }

  function attachPhoto(habitId, dateKey, file, markDone) {
    compressImage(file, function(dataUrl) {
      if (!dataUrl) { alert('Could not read that image.'); return; }
      var key = photoKey(habitId, dateKey);
      photos[key] = dataUrl;
      savePhoto(key, dataUrl);
      if (markDone) setDone(habitId, dateKey, true); // a "photo required" habit counts once its photo exists
      render();
    });
  }

  // Deleting the photo of a "photo required" habit also un-checks that day.
  function deletePhoto(habitId, dateKey) {
    var habit = state.habits.find(function(h) { return h.id === habitId; });
    var key = photoKey(habitId, dateKey);
    delete photos[key];
    idbDelete(key).catch(function(e) { console.error('Photo delete failed', e); });
    if (habit && habit.photoRequired && isDone(habit, dateKey)) setDone(habitId, dateKey, false);
    render();
  }

  // ---------- mutations ----------
  function addHabit(draft) {
    var habit = {
      id: 'h_' + Date.now() + '_' + Math.floor(Math.random()*1000),
      name: draft.name.trim(),
      subtitle: draft.subtitle.trim(),
      icon: draft.icon.trim(),
      iconImage: draft.iconImage || '',
      categoryId: draft.categoryId || '',
      photoRequired: !!draft.photoRequired,
      color: draft.color,
      frequency: draft.frequency,
      createdAt: new Date().toISOString(),
      archived: false
    };
    state.habits.push(habit);
    state.checkins[habit.id] = {};
    save();
  }

  function updateHabit(id, draft) {
    var h = state.habits.find(function(x){return x.id===id;});
    if (!h) return;
    h.name = draft.name.trim();
    h.subtitle = draft.subtitle.trim();
    h.icon = draft.icon.trim();
    h.iconImage = draft.iconImage || '';
    h.categoryId = draft.categoryId || '';
    h.photoRequired = !!draft.photoRequired;
    h.color = draft.color;
    h.frequency = draft.frequency;
    save();
  }

  function saveCategory(draft) {
    var name = draft.name.trim();
    if (draft.id) {
      var c = findCategory(draft.id);
      if (!c) return;
      c.name = name; c.icon = draft.icon.trim(); c.iconImage = draft.iconImage || '';
    } else {
      state.categories.push({
        id: 'c_' + Date.now() + '_' + Math.floor(Math.random()*1000),
        name: name, icon: draft.icon.trim(), iconImage: draft.iconImage || ''
      });
    }
    save();
  }

  // Deleting a category never deletes habits: they just become uncategorized.
  function deleteCategory(id) {
    state.categories = state.categories.filter(function(c) { return c.id !== id; });
    state.habits.forEach(function(h) { if (h.categoryId === id) h.categoryId = ''; });
    if (filter === id) { filter = 'all'; try { localStorage.setItem(FILTER_KEY, 'all'); } catch (e) {} }
    save();
  }

  function setHeatmapWeeks(n) {
    state.settings.heatmapWeeks = clampWeeks(n);
    save();
  }

  function archiveHabit(id) {
    var h = state.habits.find(function(x){return x.id===id;});
    if (h) h.archived = true;
    save();
  }

  function setDone(id, key, val) {
    if (!state.checkins[id]) state.checkins[id] = {};
    if (val) {
      state.checkins[id][key] = true;
      fx.pop = id;
      if (state.rest[id]) delete state.rest[id][key]; // a day is either done or a rest day
    } else {
      delete state.checkins[id][key];
    }
    save();
  }

  function setRest(id, key, val) {
    if (!state.rest[id]) state.rest[id] = {};
    if (val) {
      state.rest[id][key] = true;
      if (state.checkins[id]) delete state.checkins[id][key];
    } else {
      delete state.rest[id][key];
    }
    save();
  }

  // One rule for every check button (card, list, day sheet).
  // "Photo required" habits only count once a photo is attached, so checking one opens the camera.
  function handleCheck(habit, key) {
    haptic();
    var hasPhoto = !!getPhoto(habit.id, key);
    if (isDone(habit, key)) {
      if (habit.photoRequired && hasPhoto && !confirm('Un-check this day? Its photo will be deleted too.')) return;
      setDone(habit.id, key, false);
      if (habit.photoRequired && hasPhoto) deletePhoto(habit.id, key); else {
        render();
        showToast('Unchecked.', 'Undo', function() { setDone(habit.id, key, true); render(); });
      }
      return;
    }
    if (habit.photoRequired && !hasPhoto) { triggerPhotoPicker(habit.id, key, true); return; }
    setDone(habit.id, key, true);
    render();
  }

  // ---------- rendering helpers ----------
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function(k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function(c) { if (c) e.appendChild(c); });
    return e;
  }

  // Icons are fixed strings defined above (never user input), so innerHTML is safe here.
  function iconEl(name) {
    var s = document.createElement('span');
    s.className = 'ico';
    s.innerHTML = ICONS[name];
    return s;
  }

  function makeStreakChip(habit, streak) {
    if (streak <= 0) return null;
    var info = streakInfo(habit, streak);
    var unit = info.weekly ? 'week' : 'day';
    var title = streak + ' ' + unit + (streak === 1 ? '' : 's') + ' streak';
    if (info.next) {
      var need = info.weekly ? Math.ceil(info.next.days / 7) : info.next.days;
      title += '. Next badge at ' + need + ' ' + unit + 's.';
    }
    var chip = el('span', { class: 'chip', title: title, 'aria-label': title });
    if (info.tier) {
      var badge = document.createElement('span');
      badge.className = 'ico';
      badge.innerHTML = lucideSvg(info.tier.icon, 14);
      chip.appendChild(badge);
    }
    chip.appendChild(document.createTextNode(streak + (info.weekly ? 'w' : 'd')));
    return chip;
  }

  function makeCheckBtn(habit) {
    var doneToday = isDone(habit, todayKey());
    var restToday = isRest(habit, todayKey());
    // A habit can be checked off even on a day it is not scheduled (a bonus day). Only a rest day blocks it.
    var scheduled = isScheduled(habit, new Date());
    var available = !restToday;
    var label = restToday ? 'Rest day' : doneToday ? 'Mark not done' : !scheduled ? 'Mark done (not scheduled today)' : 'Mark done';
    var btn = el('button', {
      class: 'check-btn' + (doneToday ? ' done' : '') + (doneToday && fx.pop === habit.id ? ' pop' : '') + ((!scheduled || restToday) && !doneToday ? ' dim' : ''),
      'aria-label': habit.name + ': ' + label,
      'aria-pressed': doneToday ? 'true' : 'false',
      onclick: function() { if (available || doneToday) handleCheck(habit, todayKey()); }
    });
    btn.appendChild(iconEl('check')); // faint when not done, so the button reads as a check
    return btn;
  }

  function makePhotoControl(habit) {
    var todayPhoto = getPhoto(habit.id, todayKey());
    if (todayPhoto) {
      var viewBtn = el('button', {
        class: 'photo-btn filled',
        'aria-label': "View today's photo for " + habit.name,
        onclick: function() { openDay(habit.id, todayKey()); }
      });
      viewBtn.appendChild(el('img', { src: todayPhoto, alt: '' }));
      return viewBtn;
    }
    var addBtn = el('button', {
      class: 'photo-btn',
      'aria-label': 'Add a photo for ' + habit.name,
      onclick: function() { triggerPhotoPicker(habit.id, todayKey(), habit.photoRequired && !isDone(habit, todayKey())); }
    });
    addBtn.appendChild(iconEl('camera'));
    return addBtn;
  }

  // The tappable left part of a habit: optional icon tile + title (+ subtitle and streak).
  // Tapping it opens the edit sheet.
  function makeInfo(habit, streak, opts) {
    var textCol = el('span', { class: 'text' }, [ el('span', { class: 'title', text: habit.name }) ]);

    if (opts.detail) {
      var sub = (habit.subtitle || '').trim();
      var freq = frequencyLabel(habit.frequency);
      textCol.appendChild(el('span', { class: 'sub', text: sub || freq }));
      var meta = el('span', { class: 'meta' });
      var chip = makeStreakChip(habit, streak);
      if (chip) meta.appendChild(chip);
      if (sub) meta.appendChild(el('span', { class: 'freq', text: freq }));
      if (meta.childNodes.length) textCol.appendChild(meta);
    }

    var kids = [];
    if (opts.tile) kids.push(tileEl(habit));
    kids.push(textCol);

    return el('button', {
      class: 'info',
      'aria-label': 'Edit ' + habit.name,
      onclick: function() { openModal('edit', habit); }
    }, kids);
  }

  // ---------- heat map ----------
  // Month names above the columns for ranges of 8+ weeks. Each label sits in the
  // column where a new month starts and lets its text spill over the columns after it.
  function renderMonthLabels(start, weeks, cols) {
    var row = el('div', { class: 'months', style: 'grid-template-columns:' + cols, 'aria-hidden': 'true' });
    var prev = -1;
    for (var c = 0; c < weeks; c++) {
      var d = addDays(start, c * 7);
      var m = d.getMonth();
      if (m === prev) continue;
      prev = m;
      // skip a label with no room: a month that ends right away, or one at the far right edge
      var endsAtOnce = (c === 0 && addDays(start, 7).getMonth() !== m);
      if (endsAtOnce || c > weeks - 3) continue;
      var label = d.toLocaleDateString(undefined, { month: 'short' });
      if (weeks > 52 && m === 0) label += ' \u2019' + String(d.getFullYear()).slice(2);
      row.appendChild(el('span', { style: 'grid-column:' + (c + 1), text: label }));
    }
    return row;
  }

  // Up to FIT_MAX_WEEKS the grid fills the card width. Longer ranges use fixed-size
  // cells and scroll sideways (starting at today, on the right).
  function renderHeatmap(habit) {
    var weeks = state.settings.heatmapWeeks;
    var scrolls = weeks > FIT_MAX_WEEKS;
    var cols = 'repeat(' + weeks + ', ' + (scrolls ? '10px' : '1fr') + ')';
    var days = weeks * 7;
    var today = new Date();
    var start = addDays(startOfWeek(today), -(weeks - 1) * 7);

    var inner = el('div', { class: 'heatmap-inner' });
    if (weeks >= 8) inner.appendChild(renderMonthLabels(start, weeks, cols));
    var grid = el('div', {
      class: 'heatmap',
      style: 'grid-template-columns:' + cols,
      role: 'img',
      'aria-label': 'Check-ins for ' + habit.name + ' over the last ' + weeks + ' weeks'
    });
    for (var i = 0; i < days; i++) {
      var d = addDays(start, i);
      if (d > today) {
        grid.appendChild(el('div', { class: 'cell', style: 'visibility:hidden' }));
        continue;
      }
      var key = toKey(d);
      var scheduled = isScheduled(habit, d);
      var done = isDone(habit, key);
      var hasPhoto = !!getPhoto(habit.id, key);
      var cls = 'cell tap' + (!scheduled ? ' off' : '') + (done ? ' done' : '') + (isRest(habit, key) ? ' rest' : '') + (key === todayKey() ? ' today' : '') + (done && key === todayKey() && fx.pop === habit.id ? ' pop' : '') + (hasPhoto ? ' has-photo' : '');
      var title = key + (done ? ' — done' : '') + (isRest(habit, key) ? ' — rest day' : '') + (hasPhoto ? ' — photo attached' : '');
      var cell = el('div', { class: cls, title: title });
      cell.addEventListener('click', function(hid, dk) {
        return function() { openDay(hid, dk); };
      }(habit.id, key));
      grid.appendChild(cell);
    }
    inner.appendChild(grid);
    return el('div', { class: 'heatmap-wrap' + (scrolls ? ' scrolls' : '') }, [inner]);
  }

  // ---------- the three views ----------
  function renderCard(habit) {
    var streak = computeStreak(habit);
    var card = el('article', { class: 'card', style: colorVars(habit) });
    card.appendChild(el('div', { class: 'card-top' }, [
      makeInfo(habit, streak, { tile: true, detail: true }),
      makePhotoControl(habit),
      makeCheckBtn(habit)
    ]));
    card.appendChild(renderHeatmap(habit));
    return card;
  }

  // Checklist: big check on the left, like a to-do list
  function renderChecklistRow(habit) {
    var streak = computeStreak(habit);
    return el('div', { class: 'row', style: colorVars(habit) }, [
      makeCheckBtn(habit),
      makeInfo(habit, streak, { tile: false, detail: true }),
      makePhotoControl(habit)
    ]);
  }

  // Compact: one tight line per habit
  function renderCompactRow(habit) {
    var streak = computeStreak(habit);
    return el('div', { class: 'row compact', style: colorVars(habit) }, [
      makeInfo(habit, streak, { tile: true, detail: false }),
      makeStreakChip(habit, streak),
      makePhotoControl(habit),
      makeCheckBtn(habit)
    ]);
  }

  // Each card gets its position so the entrance animation can ripple down the list
  function stagger(list) {
    Array.prototype.forEach.call(list.children, function(child, i) { child.style.setProperty('--i', Math.min(i, 8)); });
    return list;
  }

  function renderList(activeHabits) {
    var list = el('div', { class: 'list list-' + view + (fx.swap ? ' swap' : '') });
    if (view === 'cards') {
      activeHabits.forEach(function(h) { list.appendChild(renderCard(h)); });
      return stagger(list);
    }
    var today = new Date();
    var key = todayKey();
    var todo = [], finished = [], off = [];
    activeHabits.forEach(function(h) {
      if (isDone(h, key)) finished.push(h);
      else if (isScheduled(h, today) && !isRest(h, key)) todo.push(h);
      else off.push(h);
    });
    var render1 = view === 'checklist' ? renderChecklistRow : renderCompactRow;
    todo.concat(finished).forEach(function(h) { list.appendChild(render1(h)); });
    if (off.length) {
      list.appendChild(el('h2', { class: 'group-label', text: 'Off today' }));
      off.forEach(function(h) { list.appendChild(render1(h)); });
    }
    return stagger(list);
  }

  function renderTopbar() {
    var settingsBtn = el('button', { class: 'icon-btn', 'aria-label': 'Settings', onclick: openSettings });
    settingsBtn.appendChild(iconEl('sliders'));
    var statsBtn = el('button', { class: 'icon-btn', 'aria-label': 'Stats', onclick: function() { modal = { kind: 'stats' }; render(); } });
    statsBtn.appendChild(iconEl('chart'));
    var addBtn = el('button', { class: 'add-btn', 'aria-label': 'New habit', onclick: function(){ openModal('add', null); } });
    addBtn.appendChild(iconEl('plus'));
    return el('header', { class: 'topbar' }, [
      el('div', {}, [
        el('h1', { text: 'Today' }),
        el('p', { class: 'date', text: new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) })
      ]),
      el('div', { class: 'topbar-actions' }, [settingsBtn, statsBtn, addBtn])
    ]);
  }

  function matchesFilter(h) {
    if (filter === 'all') return true;
    var hasCat = !!(h.categoryId && findCategory(h.categoryId));
    if (filter === 'none') return !hasCat;
    return h.categoryId === filter;
  }

  // Category chips: tap one to show only its habits. The "+" makes a new category.
  function renderChips(activeHabits) {
    var row = el('div', { class: 'chips', role: 'group', 'aria-label': 'Filter by category' });
    function chip(label, key, item) {
      var b = el('button', {
        class: 'filter-chip',
        'aria-pressed': filter === key ? 'true' : 'false',
        onclick: function() { if (filter !== key) setFilter(key); }
      });
      if (item) b.appendChild(tileEl(item));
      b.appendChild(el('span', { text: label }));
      return b;
    }
    if (state.categories.length) {
      row.appendChild(chip('All', 'all', null));
      state.categories.forEach(function(c) { row.appendChild(chip(c.name, c.id, c)); });
      var hasLoose = activeHabits.some(function(h) { return !(h.categoryId && findCategory(h.categoryId)); });
      if (hasLoose) row.appendChild(chip('Uncategorized', 'none', null));
    }
    row.appendChild(el('button', {
      class: 'filter-chip add',
      'aria-label': 'New category',
      text: state.categories.length ? '+' : '+ New category',
      onclick: function() { openCategory(null, null); }
    }));
    return row;
  }

  // The bar starts at its old width and grows to the new one, because the whole screen is
  // rebuilt on every change and a rebuilt element would otherwise just appear at the new width.
  function makeBarFill(pct) {
    var fill = el('span', { class: pct === 100 ? 'full' : '', style: 'width:' + shownPct + '%' });
    shownPct = pct;
    requestAnimationFrame(function() { requestAnimationFrame(function() { fill.style.width = pct + '%'; }); });
    return fill;
  }

  function renderProgress(activeHabits) {
    var today = new Date();
    var scheduledToday = activeHabits.filter(function(h){ return isScheduled(h, today) && !isRest(h, todayKey()); });
    var doneToday = scheduledToday.filter(function(h){ return isDone(h, todayKey()); });
    var pct = scheduledToday.length ? Math.round(doneToday.length / scheduledToday.length * 100) : 0;

    var text = el('div', { class: 'progress-text' });
    if (scheduledToday.length) {
      text.innerHTML = '<strong>' + doneToday.length + ' of ' + scheduledToday.length + '</strong> done today';
    } else {
      text.textContent = 'Nothing scheduled today';
    }
    return el('div', { class: 'progress' }, [
      text,
      el('div', { class: 'bar' }, [ makeBarFill(pct) ])
    ]);
  }

  function renderViewPill() {
    var pill = el('nav', { class: 'view-pill', 'aria-label': 'Change view' });
    [['cards', 'Heat map cards'], ['checklist', 'Checklist'], ['compact', 'Compact list']].forEach(function(v) {
      var b = el('button', {
        'aria-label': v[1],
        'aria-pressed': view === v[0] ? 'true' : 'false',
        onclick: function() { if (view !== v[0]) setView(v[0]); }
      });
      b.appendChild(iconEl(v[0]));
      pill.appendChild(b);
    });
    return pill;
  }

  // While a sheet is open the page behind it must not scroll. Fixing the body in place (and
  // remembering where it was) is the reliable way to do that on iPhone.
  function syncScrollLock(y) {
    var style = document.body.style;
    if (modal && !scrollLocked) {
      lockedY = y;
      style.position = 'fixed'; style.top = (-y) + 'px'; style.left = '0'; style.right = '0';
      scrollLocked = true;
    } else if (!modal && scrollLocked) {
      style.position = ''; style.top = ''; style.left = ''; style.right = '';
      scrollLocked = false;
      window.scrollTo(0, lockedY);
    }
  }

  function render() {
    var app = document.getElementById('app');
    // The screen is rebuilt on every change, so remember scroll positions and put them back
    var oldSheet = app.querySelector('.modal');
    var oldIconList = app.querySelector('.icon-list');
    if (oldIconList && modal) modal.iconScroll = oldIconList.scrollTop;
    var sheetTop = oldSheet ? oldSheet.scrollTop : 0;
    var keepSheetScroll = !!(modal && modal.shown); // a freshly opened sheet starts at the top
    var pageY = scrollLocked ? lockedY : window.pageYOffset;
    app.innerHTML = '';

    if (!ready || !photosReady) {
      app.appendChild(el('div', { class: 'loading', text: 'Loading your habits…' }));
      return;
    }

    app.appendChild(renderTopbar());
    if (DEMO) app.appendChild(el('div', { class: 'demo-banner', text: 'Demo data for screenshots. Your real habits are not touched.' }));

    var activeHabits = state.habits.filter(function(h){ return !h.archived; });

    if (activeHabits.length === 0) {
      app.appendChild(el('div', { class: 'empty' }, [
        el('div', { class: 'empty-mark' }),
        el('p', { text: 'No habits yet. Start with one small thing you want to stick to. You can add more later.' }),
        el('button', { class: 'btn btn-primary', text: 'Add your first habit', onclick: function(){ openModal('add', null); } })
      ]));
    } else {
      var nudge = renderBackupNudge();
      if (nudge) app.appendChild(nudge);
      app.appendChild(renderChips(activeHabits));
      var shown = activeHabits.filter(matchesFilter);
      if (shown.length) {
        app.appendChild(renderProgress(shown));
        app.appendChild(renderList(shown));
      } else {
        app.appendChild(el('div', { class: 'empty small' }, [ el('p', { text: 'No habits in this category yet. Edit a habit to move it here.' }) ]));
      }
      app.appendChild(renderViewPill());
    }

    if (modal) {
      app.appendChild(modal.kind === 'settings' ? renderSettingsSheet()
        : modal.kind === 'category' ? renderCategorySheet()
        : modal.kind === 'day' ? renderDaySheet()
        : modal.kind === 'gallery' ? renderGallerySheet()
        : modal.kind === 'stats' ? renderStatsSheet()
        : modal.kind === 'archived' ? renderArchivedSheet()
        : renderHabitSheet());
    }

    // Long heat maps scroll sideways; start them scrolled to today (the right edge)
    var wraps = app.querySelectorAll('.heatmap-wrap.scrolls');
    for (var k = 0; k < wraps.length; k++) wraps[k].scrollLeft = wraps[k].scrollWidth;

    var newSheet = app.querySelector('.modal');
    if (newSheet && keepSheetScroll) newSheet.scrollTop = sheetTop;
    var newIconList = app.querySelector('.icon-list');
    if (newIconList && modal && modal.iconScroll) newIconList.scrollTop = modal.iconScroll;
    syncScrollLock(pageY);
    if (!scrollLocked) window.scrollTo(0, pageY);
    fx.pop = null; fx.swap = false;
  }

  // ---------- photo picker ----------
  var pendingPhoto = null; // { habitId, dateKey, markDone }
  var fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  // No 'capture' attribute on purpose: iPhone then offers Take Photo, Photo Library or Choose File.
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', function(e) {
    var file = e.target.files && e.target.files[0];
    fileInput.value = '';
    if (file && pendingPhoto) attachPhoto(pendingPhoto.habitId, pendingPhoto.dateKey, file, pendingPhoto.markDone);
  });
  // The picker tells us when it was closed without a photo, so we can say what happened.
  fileInput.addEventListener('cancel', function() {
    showToast(pendingPhoto && pendingPhoto.markDone ? 'No photo added, so this habit was not checked.' : 'No photo added.');
  });
  document.body.appendChild(fileInput);

  function triggerPhotoPicker(habitId, dateKey, markDone) {
    pendingPhoto = { habitId: habitId, dateKey: dateKey, markDone: !!markDone };
    fileInput.click();
  }

  // Haptics: Android vibrates. iPhone Safari has no vibration API, but toggling a hidden
  // "switch" checkbox makes iOS 17.4+ tick. Best-effort: older iPhones simply stay silent.
  var hapticLabel = document.createElement('label');
  hapticLabel.setAttribute('aria-hidden', 'true');
  hapticLabel.style.cssText = 'position:fixed;left:-200px;top:0;opacity:0;pointer-events:none';
  var hapticSwitch = document.createElement('input');
  hapticSwitch.type = 'checkbox';
  hapticSwitch.setAttribute('switch', '');
  hapticSwitch.tabIndex = -1;
  hapticLabel.appendChild(hapticSwitch);
  document.body.appendChild(hapticLabel);
  function haptic() {
    try {
      if (navigator.vibrate) navigator.vibrate(10);
      else hapticLabel.click();
    } catch (e) {}
  }

  // A message at the bottom of the screen, optionally with one action such as Undo
  var toastTimer = null;
  function showToast(message, actionLabel, action) {
    var old = document.querySelector('.toast');
    if (old) old.remove();
    var kids = [ el('span', { text: message }) ];
    var t = el('div', { class: 'toast', role: 'status' }, kids);
    if (actionLabel && action) {
      t.appendChild(el('button', { class: 'toast-action', text: actionLabel, onclick: function() { t.remove(); action(); } }));
    }
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { t.remove(); }, actionLabel ? 7000 : 5000);
  }

  // ---------- sheets (habit, category, settings) ----------
  function openModal(mode, habit) {
    var draft;
    if (mode === 'edit' && habit) {
      draft = {
        id: habit.id,
        name: habit.name,
        subtitle: habit.subtitle || '',
        icon: habit.icon || '',
        iconImage: habit.iconImage || '',
        categoryId: (habit.categoryId && findCategory(habit.categoryId)) ? habit.categoryId : '',
        photoRequired: !!habit.photoRequired,
        color: safeColor(habit.color),
        frequency: JSON.parse(JSON.stringify(habit.frequency))
      };
    } else {
      // A new habit starts in the category you are currently viewing
      var preset = (filter !== 'all' && filter !== 'none') ? filter : '';
      draft = { id: null, name: '', subtitle: '', icon: '', iconImage: '', categoryId: preset, photoRequired: false, color: COLORS[0], frequency: { type: 'daily' } };
    }
    modal = { kind: 'habit', mode: mode, draft: draft };
    render();
  }

  function openCategory(cat, returnTo) {
    var draft = cat
      ? { id: cat.id, name: cat.name, icon: cat.icon || '', iconImage: cat.iconImage || '' }
      : { id: null, name: '', icon: '', iconImage: '' };
    modal = { kind: 'category', mode: cat ? 'edit' : 'add', draft: draft, returnTo: returnTo };
    render();
  }

  function openSettings() { modal = { kind: 'settings', customOpen: false }; render(); }

  // The sheet slides away first, then the app state changes
  function closeModal() {
    var overlay = document.querySelector('.overlay');
    if (overlay && !overlay.classList.contains('leaving')) {
      overlay.classList.add('leaving');
      setTimeout(finishClose, 260);
      return;
    }
    finishClose();
  }

  function finishClose() {
    var back = modal && modal.returnTo;
    if (back === 'settings') modal = { kind: 'settings', customOpen: false };
    else if (back === 'gallery') modal = { kind: 'gallery', habitId: modal.habitId };
    else modal = null;
    render();
  }

  function textField(label, value, placeholder, onInput, extra) {
    var input = el('input', { type: 'text', placeholder: placeholder });
    if (extra) Object.keys(extra).forEach(function(k) { input.setAttribute(k, extra[k]); });
    input.value = value;
    input.addEventListener('input', function(e) { onInput(e.target.value); });
    return { input: input, field: el('div', { class: 'field' }, [ el('label', { text: label }), input ]) };
  }

  // ---- icon picker: emoji grid, your own emoji, or an uploaded photo ----
  var iconInput = document.createElement('input');
  iconInput.type = 'file';
  iconInput.accept = 'image/*';
  iconInput.style.display = 'none';
  var iconTarget = null; // the draft that is waiting for a photo
  iconInput.addEventListener('change', function(e) {
    var file = e.target.files && e.target.files[0];
    iconInput.value = '';
    if (!file || !iconTarget) return;
    compressIcon(file, function(dataUrl) {
      if (!dataUrl) { alert('Could not read that image.'); return; }
      iconTarget.iconImage = dataUrl;
      render();
    });
  });
  document.body.appendChild(iconInput);

  // Crop to a centered square and shrink, so an icon photo only costs a few KB
  function compressIcon(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var side = Math.min(img.width, img.height);
        var canvas = document.createElement('canvas');
        canvas.width = ICON_PX;
        canvas.height = ICON_PX;
        canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, ICON_PX, ICON_PX);
        callback(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = function() { callback(null); };
      img.src = e.target.result;
    };
    reader.onerror = function() { callback(null); };
    reader.readAsDataURL(file);
  }

  function renderIconPicker(draft, color) {
    var hasEmoji = draft.icon && draft.icon.indexOf('i:') !== 0;
    var tab = modal.iconTab || (hasEmoji && !draft.iconImage ? 'emoji' : 'icon');
    var preview = el('div', { class: 'picker-preview', style: colorVars({ color: color }) }, [ tileEl(draft, 'big') ]);

    var uploadBtn = el('button', { class: 'btn', onclick: function() { iconTarget = draft; iconInput.click(); } });
    uploadBtn.appendChild(iconEl('upload'));
    uploadBtn.appendChild(document.createTextNode(draft.iconImage ? ' Change photo' : ' Upload photo'));
    var actions = el('div', { class: 'picker-actions' }, [uploadBtn]);
    if (draft.iconImage) {
      actions.appendChild(el('button', { class: 'btn btn-text', text: 'Remove photo', onclick: function() { draft.iconImage = ''; render(); } }));
    } else if (draft.icon) {
      actions.appendChild(el('button', { class: 'btn btn-text', text: 'Remove icon', onclick: function() { draft.icon = ''; render(); } }));
    }

    var tabs = el('div', { class: 'segmented picker-tabs', role: 'group', 'aria-label': 'Icon type' });
    [['icon', 'Icon'], ['emoji', 'Emoji']].forEach(function(t) {
      tabs.appendChild(el('button', {
        class: 'seg' + (tab === t[0] ? ' on' : ''),
        'aria-pressed': tab === t[0] ? 'true' : 'false',
        text: t[1],
        onclick: function() { modal.iconTab = t[0]; modal.iconScroll = 0; render(); }
      }));
    });

    var body;
    if (tab === 'icon') {
      var search = el('input', { type: 'text', placeholder: 'Search icons', 'aria-label': 'Search icons' });
      var list = el('div', { class: 'icon-list' });
      (window.HT_ICON_GROUPS || []).forEach(function(g) {
        var grid = el('div', { class: 'icon-grid' });
        g[1].forEach(function(name) {
          var selected = !draft.iconImage && draft.icon === 'i:' + name;
          var b = el('button', {
            class: 'pick-btn' + (selected ? ' selected' : ''),
            'data-name': name,
            'data-group': g[0].toLowerCase(),
            'aria-label': name.replace(/-/g, ' '),
            'aria-pressed': selected ? 'true' : 'false',
            onclick: function() { draft.icon = selected ? '' : 'i:' + name; draft.iconImage = ''; render(); }
          });
          b.innerHTML = lucideSvg(name, 22);
          grid.appendChild(b);
        });
        list.appendChild(el('div', { class: 'icon-group' }, [ el('p', { class: 'icon-group-title', text: g[0] }), grid ]));
      });
      // Searching only hides and shows buttons (no re-render), so the keyboard stays open.
      // The search text and scroll position are remembered when the sheet redraws after a tap.
      function applyFilter(text) {
        var raw = text.trim().toLowerCase(), dashed = raw.replace(/\s+/g, '-');
        Array.prototype.forEach.call(list.querySelectorAll('.icon-group'), function(group) {
          var any = false;
          Array.prototype.forEach.call(group.querySelectorAll('button'), function(b) {
            var show = !raw || b.getAttribute('data-name').indexOf(dashed) !== -1 || b.getAttribute('data-group').indexOf(raw) !== -1;
            b.hidden = !show;
            if (show) any = true;
          });
          group.hidden = !any;
        });
      }
      search.value = modal.iconSearch || '';
      applyFilter(search.value);
      search.addEventListener('input', function(e) { modal.iconSearch = e.target.value; applyFilter(e.target.value); });
      body = el('div', {}, [ el('div', { class: 'picker-custom' }, [ search ]), list ]);
    } else {
      var grid2 = el('div', { class: 'emoji-grid' });
      EMOJIS.forEach(function(emoji) {
        var selected = !draft.iconImage && draft.icon === emoji;
        grid2.appendChild(el('button', {
          class: 'emoji-btn' + (selected ? ' selected' : ''),
          text: emoji,
          'aria-label': 'Use emoji ' + emoji,
          'aria-pressed': selected ? 'true' : 'false',
          onclick: function() { draft.icon = selected ? '' : emoji; draft.iconImage = ''; render(); }
        }));
      });
      var custom = el('input', { type: 'text', placeholder: 'Or type your own emoji', maxlength: '8', 'aria-label': 'Type your own emoji' });
      custom.value = EMOJIS.indexOf(draft.icon) === -1 && draft.icon.indexOf('i:') !== 0 ? draft.icon : '';
      custom.addEventListener('input', function(e) { draft.icon = e.target.value; draft.iconImage = ''; });
      custom.addEventListener('change', function() { render(); });
      body = el('div', {}, [ grid2, el('div', { class: 'picker-custom' }, [ custom ]) ]);
    }

    return el('div', { class: 'field' }, [
      el('label', { text: 'Icon (optional)' }),
      el('div', { class: 'picker-top' }, [ preview, actions ]),
      tabs,
      body
    ]);
  }

  // ---- habit sheet ----
  function renderHabitSheet() {
    var draft = modal.draft;

    var nameF = textField('Habit name', draft.name, 'e.g. Read 10 pages', function(v){ draft.name = v; });
    var subF = textField('Subtitle (optional)', draft.subtitle, 'e.g. before bed, no phone', function(v){ draft.subtitle = v; });

    // Show the habit's current color too, in case it came from an older palette
    var swatches = COLORS.slice();
    if (swatches.indexOf(draft.color) === -1) swatches.unshift(draft.color);
    var colorRow = el('div', { class: 'color-row' });
    swatches.forEach(function(c) {
      colorRow.appendChild(el('button', {
        class: 'color-swatch' + (draft.color === c ? ' selected' : ''),
        style: 'background:' + c,
        'aria-label': 'Color ' + c,
        'aria-pressed': draft.color === c ? 'true' : 'false',
        onclick: function() { draft.color = c; render(); }
      }));
    });

    var freqSelect = el('select', {}, []);
    [['daily','Every day'],['weekdays','Specific days'],['weekly','X times per week']].forEach(function(opt) {
      var o = el('option', { value: opt[0], text: opt[1] });
      if (draft.frequency.type === opt[0]) o.selected = true;
      freqSelect.appendChild(o);
    });
    freqSelect.addEventListener('change', function(e) {
      var t = e.target.value;
      if (t === 'daily') draft.frequency = { type: 'daily' };
      else if (t === 'weekdays') draft.frequency = { type: 'weekdays', days: draft.frequency.days || [1,2,3,4,5] };
      else draft.frequency = { type: 'weekly', target: draft.frequency.target || 3 };
      render();
    });

    var freqDetail = null;
    if (draft.frequency.type === 'weekdays') {
      freqDetail = el('div', { class: 'weekday-row' });
      WEEKDAYS.forEach(function(label, idx) {
        var active = draft.frequency.days.indexOf(idx) !== -1;
        freqDetail.appendChild(el('button', {
          class: 'weekday-chip' + (active ? ' active' : ''),
          text: label,
          'aria-pressed': active ? 'true' : 'false',
          onclick: function() {
            var days = draft.frequency.days;
            var pos = days.indexOf(idx);
            if (pos === -1) days.push(idx); else days.splice(pos,1);
            render();
          }
        }));
      });
    } else if (draft.frequency.type === 'weekly') {
      freqDetail = el('div', { class: 'stepper' }, [
        el('button', { text: '−', 'aria-label': 'Fewer days', onclick: function(){ if (draft.frequency.target > 1) { draft.frequency.target--; render(); } } }),
        el('span', { text: draft.frequency.target + ' days a week' }),
        el('button', { text: '+', 'aria-label': 'More days', onclick: function(){ if (draft.frequency.target < 7) { draft.frequency.target++; render(); } } })
      ]);
    }

    var fields = [ nameF.field, subF.field ];

    if (state.categories.length) {
      var catSelect = el('select', {}, [ el('option', { value: '', text: 'None' }) ]);
      state.categories.forEach(function(c) {
        var o = el('option', { value: c.id, text: c.name });
        if (draft.categoryId === c.id) o.selected = true;
        catSelect.appendChild(o);
      });
      catSelect.addEventListener('change', function(e) { draft.categoryId = e.target.value; });
      fields.push(el('div', { class: 'field' }, [ el('label', { text: 'Category' }), catSelect ]));
    }

    fields.push(renderIconPicker(draft, draft.color));
    fields.push(el('div', { class: 'field' }, [ el('label', { text: 'Color' }), colorRow ]));
    fields.push(el('button', {
      class: 'switch-row',
      'aria-pressed': draft.photoRequired ? 'true' : 'false',
      onclick: function() { draft.photoRequired = !draft.photoRequired; render(); }
    }, [ el('span', { text: 'Require a photo to check off' }), el('span', { class: 'switch' }) ]));
    fields.push(el('div', { class: 'field' }, [ el('label', { text: 'Frequency' }), freqSelect ]));
    if (freqDetail) fields.push(el('div', { class: 'field' }, [ freqDetail ]));

    if (modal.mode === 'edit') {
      var photoCount = Object.keys(photos).filter(function(k) { return k.indexOf(draft.id + '|') === 0; }).length;
      if (photoCount) {
        fields.push(el('button', { class: 'btn gallery-btn', text: 'View photos (' + photoCount + ')',
          onclick: function() { modal = { kind: 'gallery', habitId: draft.id }; render(); } }));
      }
    }

    var saveBtn = el('button', {
      class: 'btn btn-primary',
      text: modal.mode === 'add' ? 'Add habit' : 'Save changes',
      onclick: function() {
        if (!draft.name.trim()) { nameF.input.focus(); return; }
        if (draft.frequency.type === 'weekdays' && draft.frequency.days.length === 0) return;
        if (modal.mode === 'add') addHabit(draft); else updateHabit(draft.id, draft);
        closeModal();
      }
    });
    var cancelBtn = el('button', { class: 'btn', text: 'Cancel', onclick: closeModal });

    var actions = el('div', { class: 'modal-actions' }, [
      modal.mode === 'edit'
        ? el('button', { class: 'btn btn-text', text: 'Archive', onclick: function() {
          var archivedId = draft.id;
          archiveHabit(archivedId);
          closeModal();
          showToast('Habit archived.', 'Undo', function() { restoreHabit(archivedId); render(); });
        } })
        : el('span', {}),
      el('div', { class: 'modal-actions-right' }, [cancelBtn, saveBtn])
    ]);

    return sheet(modal.mode === 'add' ? 'New habit' : 'Edit habit', fields.concat([actions]));
  }

  // ---- category sheet ----
  function renderCategorySheet() {
    var draft = modal.draft;
    var nameF = textField('Category name', draft.name, 'e.g. Study, Fitness, Health', function(v){ draft.name = v; });

    var saveBtn = el('button', {
      class: 'btn btn-primary',
      text: modal.mode === 'add' ? 'Add category' : 'Save changes',
      onclick: function() {
        if (!draft.name.trim()) { nameF.input.focus(); return; }
        saveCategory(draft);
        closeModal();
      }
    });
    var left = el('span', {});
    if (modal.mode === 'edit') {
      left = el('button', { class: 'btn btn-text', text: 'Delete', onclick: function() {
        if (confirm('Delete "' + draft.name + '"? Its habits are kept and move to Uncategorized.')) {
          deleteCategory(draft.id);
          closeModal();
        }
      }});
    }
    var actions = el('div', { class: 'modal-actions' }, [
      left,
      el('div', { class: 'modal-actions-right' }, [ el('button', { class: 'btn', text: 'Cancel', onclick: closeModal }), saveBtn ])
    ]);

    return sheet(modal.mode === 'add' ? 'New category' : 'Edit category', [ nameF.field, renderIconPicker(draft, '#f1efe9'), actions ]);
  }

  // ---- settings sheet ----
  function renderSettingsSheet() {
    var weeks = state.settings.heatmapWeeks;
    var isPreset = RANGE_PRESETS.some(function(p) { return p[1] === weeks; });
    var customOpen = modal.customOpen || !isPreset;

    var range = el('div', { class: 'weekday-row' });
    RANGE_PRESETS.forEach(function(p) {
      var active = !customOpen && weeks === p[1];
      range.appendChild(el('button', {
        class: 'weekday-chip' + (active ? ' active' : ''),
        text: p[0],
        'aria-pressed': active ? 'true' : 'false',
        onclick: function() { modal.customOpen = false; setHeatmapWeeks(p[1]); render(); }
      }));
    });
    range.appendChild(el('button', {
      class: 'weekday-chip' + (customOpen ? ' active' : ''),
      text: 'Custom',
      'aria-pressed': customOpen ? 'true' : 'false',
      onclick: function() { modal.customOpen = true; render(); }
    }));

    var rangeField = el('div', { class: 'field' }, [ el('label', { text: 'Heat map range (all habits)' }), range ]);
    if (customOpen) {
      var num = el('input', { type: 'text', inputmode: 'numeric', pattern: '[0-9]*', 'aria-label': 'Number of weeks' });
      num.value = String(weeks);
      num.addEventListener('change', function(e) { setHeatmapWeeks(e.target.value); render(); });
      rangeField.appendChild(el('div', { class: 'custom-range' }, [
        num,
        el('span', { text: 'weeks (' + MIN_WEEKS + ' to ' + MAX_WEEKS + ')' })
      ]));
    }

    var catList = el('div', { class: 'cat-list' });
    state.categories.forEach(function(c) {
      var count = state.habits.filter(function(h) { return !h.archived && h.categoryId === c.id; }).length;
      catList.appendChild(el('button', { class: 'cat-row', onclick: function() { openCategory(c, 'settings'); } }, [
        tileEl(c),
        el('span', { class: 'cat-name', text: c.name }),
        el('span', { class: 'cat-count', text: count + (count === 1 ? ' habit' : ' habits') })
      ]));
    });
    if (!state.categories.length) {
      catList.appendChild(el('p', { class: 'hint', text: 'No categories yet. Make one to group your habits.' }));
    }
    var catField = el('div', { class: 'field' }, [
      el('label', { text: 'Categories' }),
      catList,
      el('button', { class: 'btn', text: 'Add category', onclick: function() { openCategory(null, 'settings'); } })
    ]);

    var badgeRow = el('div', { class: 'badge-row' });
    MILESTONES.slice().reverse().forEach(function(m) {
      var item = el('span', { class: 'badge-item' });
      var ic = document.createElement('span');
      ic.className = 'ico';
      ic.innerHTML = lucideSvg(m.icon, 18);
      item.appendChild(ic);
      item.appendChild(document.createTextNode(m.days + (m.days === 1 ? ' day' : ' days')));
      badgeRow.appendChild(item);
    });
    var badgeField = el('div', { class: 'field' }, [ el('label', { text: 'Streak badges' }), badgeRow ]);

    var done = el('div', { class: 'modal-actions' }, [ el('span', {}), el('button', { class: 'btn btn-primary', text: 'Done', onclick: closeModal }) ]);
    var last = null;
    try { last = localStorage.getItem(LAST_BACKUP_KEY); } catch (e) {}
    var lastText = last ? 'Last backup: ' + new Date(last).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) + '.' : 'No backup yet.';
    var backupField = el('div', { class: 'field' }, [
      el('label', { text: 'Backup' }),
      el('p', { class: 'hint backup-hint', text: lastText + ' Your habits and photos live only on this phone, and iPhone can clear a web app\u2019s data when storage runs low. Export a backup now and then and keep the file in Files or iCloud.' }),
      el('div', { class: 'day-photo-actions' }, [
        el('button', { class: 'btn', text: 'Export backup', onclick: exportBackup }),
        el('button', { class: 'btn', text: 'Restore from file', onclick: function() { restoreInput.click(); } })
      ])
    ]);
    var archivedCount = state.habits.filter(function(h) { return h.archived; }).length;
    var parts = [ rangeField, catField ];
    if (archivedCount) {
      parts.push(el('div', { class: 'field' }, [
        el('label', { text: 'Archived habits' }),
        el('button', { class: 'btn', text: 'Manage archived (' + archivedCount + ')', onclick: function() { modal = { kind: 'archived', returnTo: 'settings' }; render(); } })
      ]));
    }
    return sheet('Settings', parts.concat([ backupField, badgeField, done ]));
  }

  // ---- day view: one habit on one day (check-in, photo, note, rest day) ----
  function openDay(habitId, dateKey, returnTo) {
    haptic();
    modal = { kind: 'day', habitId: habitId, dateKey: dateKey, returnTo: returnTo };
    render();
  }

  function renderDaySheet() {
    var habit = state.habits.find(function(h) { return h.id === modal.habitId; });
    if (!habit) { modal = null; return el('div', {}); }
    var key = modal.dateKey;
    var canEdit = inEditWindow(key);
    var done = isDone(habit, key), rest = isRest(habit, key), photo = getPhoto(habit.id, key);
    var p = key.split('-');
    var dateLabel = new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    var kids = [ el('p', { class: 'hint day-date', text: dateLabel }) ];

    if (canEdit) {
      var status = done ? 'done' : rest ? 'rest' : 'none';
      var segs = el('div', { class: 'segmented day-seg', role: 'group', 'aria-label': 'Status for this day', style: colorVars(habit) });
      [['none', 'Not done'], ['done', 'Done'], ['rest', 'Rest day']].forEach(function(opt) {
        var on = status === opt[0];
        segs.appendChild(el('button', {
          class: 'seg seg-' + opt[0] + (on ? ' on' : ''),
          'aria-pressed': on ? 'true' : 'false',
          text: opt[1],
          onclick: function() {
            if (on) return;
            if (opt[0] === 'done') { if (rest) setRest(habit.id, key, false); handleCheck(habit, key); }
            else if (opt[0] === 'rest') { setRest(habit.id, key, true); render(); }
            else if (done) handleCheck(habit, key);
            else { setRest(habit.id, key, false); render(); }
          }
        }));
      });
      kids.push(segs);
    } else {
      kids.push(el('p', { class: 'hint', text: (done ? 'Done' : rest ? 'Rest day' : 'Not done') + '. Days older than a week are view-only.' }));
    }

    var photoBox = el('div', { class: 'day-photo' });
    if (photo) photoBox.appendChild(el('img', { src: photo, alt: 'Photo for ' + habit.name + ' on ' + dateLabel }));
    else photoBox.appendChild(el('p', { class: 'hint', text: habit.photoRequired && canEdit ? 'This habit needs a photo to count.' : 'No photo for this day.' }));
    kids.push(photoBox);

    var photoActions = el('div', { class: 'day-photo-actions' });
    if (canEdit) {
      photoActions.appendChild(el('button', { class: 'btn', text: photo ? 'Replace photo' : 'Add photo',
        onclick: function() { triggerPhotoPicker(habit.id, key, habit.photoRequired && !done); } }));
    }
    if (photo) {
      photoActions.appendChild(el('button', { class: 'btn', text: 'Delete photo', onclick: function() {
        var msg = habit.photoRequired && done ? 'Delete this photo? The day will be un-checked, because this habit needs a photo.' : 'Delete this photo?';
        if (confirm(msg)) deletePhoto(habit.id, key);
      } }));
    }
    if (photoActions.childNodes.length) kids.push(photoActions);

    if (canEdit) {
      var note = el('textarea', { rows: '3', placeholder: 'Add a note (optional)', 'aria-label': 'Note' });
      note.value = getNote(habit.id, key);
      note.addEventListener('input', function(e) { setNote(habit.id, key, e.target.value); });
      kids.push(el('div', { class: 'field' }, [ el('label', { text: 'Note' }), note ]));
    } else if (getNote(habit.id, key)) {
      kids.push(el('p', { class: 'day-note', text: getNote(habit.id, key) }));
    }

    kids.push(el('div', { class: 'modal-actions' }, [ el('span', {}), el('button', { class: 'btn btn-primary', text: 'Close', onclick: closeModal }) ]));
    return sheet(habit.name, kids);
  }

  // ---- gallery: every photo for one habit, newest first ----
  function renderGallerySheet() {
    var habit = state.habits.find(function(h) { return h.id === modal.habitId; });
    if (!habit) { modal = null; return el('div', {}); }
    var prefix = habit.id + '|';
    var days = Object.keys(photos).filter(function(k) { return k.indexOf(prefix) === 0; })
      .map(function(k) { return k.slice(prefix.length); }).sort().reverse();
    var kids = [];
    if (days.length) {
      var grid = el('div', { class: 'gallery' });
      days.forEach(function(dk) {
        var p = dk.split('-');
        var label = new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        grid.appendChild(el('button', { class: 'gallery-item', 'aria-label': 'Open photo from ' + label, onclick: function() { openDay(habit.id, dk, 'gallery'); } }, [
          el('img', { src: photos[prefix + dk], alt: '' }),
          el('span', { text: label })
        ]));
      });
      kids.push(grid);
    } else {
      kids.push(el('p', { class: 'hint', text: 'No photos yet.' }));
    }
    kids.push(el('div', { class: 'modal-actions' }, [ el('span', {}), el('button', { class: 'btn btn-primary', text: 'Close', onclick: closeModal }) ]));
    return sheet(habit.name + ' photos', kids);
  }

  // ---- archived habits: bring one back, or delete it for good ----
  function restoreHabit(id) {
    var h = state.habits.find(function(x) { return x.id === id; });
    if (h) h.archived = false;
    save();
  }

  function deleteHabitForever(id) {
    state.habits = state.habits.filter(function(h) { return h.id !== id; });
    delete state.checkins[id]; delete state.notes[id]; delete state.rest[id];
    Object.keys(photos).forEach(function(k) {
      if (k.indexOf(id + '|') === 0) { delete photos[k]; idbDelete(k).catch(function() {}); }
    });
    save();
  }

  function renderArchivedSheet() {
    var items = state.habits.filter(function(h) { return h.archived; });
    var kids = [];
    if (!items.length) kids.push(el('p', { class: 'hint', text: 'No archived habits.' }));
    items.forEach(function(h) {
      kids.push(el('div', { class: 'cat-row archived-row', style: colorVars(h) }, [
        tileEl(h),
        el('span', { class: 'cat-name', text: h.name }),
        el('button', { class: 'btn btn-text', text: 'Restore', onclick: function() { restoreHabit(h.id); render(); } }),
        el('button', { class: 'btn btn-text', text: 'Delete', onclick: function() {
          if (confirm('Delete "' + h.name + '" with all its check-ins, notes and photos? This cannot be undone.')) { deleteHabitForever(h.id); render(); }
        } })
      ]));
    });
    kids.push(el('div', { class: 'modal-actions' }, [ el('span', {}), el('button', { class: 'btn btn-primary', text: 'Close', onclick: closeModal }) ]));
    return sheet('Archived habits', kids);
  }

  // Gentle reminder when there is no backup yet, or the last one is over a month old
  function renderBackupNudge() {
    if (DEMO) return null;
    var last = null;
    try {
      var until = localStorage.getItem(NUDGE_KEY);
      if (until && Date.now() < Number(until)) return null;
      last = localStorage.getItem(LAST_BACKUP_KEY);
    } catch (e) { return null; }
    if (last && Date.now() - Date.parse(last) < 30 * 86400000) return null;
    return el('div', { class: 'nudge' }, [
      el('p', { text: last ? 'It has been over a month since your last backup.' : 'Back up your habits. They live only on this phone.' }),
      el('div', { class: 'nudge-actions' }, [
        el('button', { class: 'btn btn-primary', text: 'Back up now', onclick: exportBackup }),
        el('button', { class: 'btn btn-text', text: 'Later', onclick: function() {
          try { localStorage.setItem(NUDGE_KEY, String(Date.now() + 7 * 86400000)); } catch (e) {}
          render();
        } })
      ])
    ]);
  }

  // Shared bottom-sheet shell
  function sheet(title, children) {
    var enter = !modal.shown; // animate only when a sheet first opens, not on every re-render inside it
    modal.shown = true;
    var grab = el('div', { class: 'sheet-grab', 'aria-hidden': 'true' }, [ el('span', {}) ]);
    var heading = el('h2', { text: title });
    var box = el('div', { class: 'modal' + (enter ? ' enter' : ''), role: 'dialog', 'aria-modal': 'true' }, [ grab, heading ].concat(children));
    var overlay = el('div', { class: 'overlay' + (enter ? ' enter' : ''), onclick: function(e){ if (e.target === overlay) closeModal(); } }, [box]);
    enableDragToClose(box, overlay, [grab, heading]);
    return overlay;
  }

  // Drag a sheet down by its handle or title to close it. Past about 110px, or with a quick
  // flick, it slides away; otherwise it springs back. The dark backdrop fades as you drag.
  function enableDragToClose(box, overlay, handles) {
    var startY = 0, dy = 0, startTime = 0, dragging = false;
    function begin(e) {
      dragging = true; dy = 0; startY = e.clientY; startTime = Date.now();
      box.style.animation = 'none';
      box.style.transition = 'none';
      try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
    }
    function move(e) {
      if (!dragging) return;
      dy = Math.max(0, e.clientY - startY); // dragging up does nothing
      box.style.transform = 'translateY(' + dy + 'px)';
      overlay.style.background = 'rgba(0,0,0,' + (0.65 * (1 - Math.min(1, dy / 420))).toFixed(3) + ')';
    }
    function end() {
      if (!dragging) return;
      dragging = false;
      var speed = dy / Math.max(1, Date.now() - startTime); // pixels per millisecond
      if (dy > 110 || (speed > 0.6 && dy > 40)) {
        haptic();
        box.style.transition = 'transform 0.22s ease-in';
        overlay.style.transition = 'background 0.22s ease-in';
        box.style.transform = 'translateY(100%)';
        overlay.style.background = 'rgba(0,0,0,0)';
        setTimeout(finishClose, 220);
      } else {
        box.style.transition = 'transform 0.4s var(--spring)';
        overlay.style.transition = 'background 0.3s ease';
        box.style.transform = '';
        overlay.style.background = '';
      }
    }
    handles.forEach(function(h) {
      h.addEventListener('pointerdown', begin);
      h.addEventListener('pointermove', move);
      h.addEventListener('pointerup', end);
      h.addEventListener('pointercancel', end);
    });
  }

  // ---------- backup and restore ----------
  // One .json file holds everything: habits, check-ins, notes, categories, settings and photos.
  function buildBackup() {
    return {
      app: 'habit-tracker', version: 1, exportedAt: new Date().toISOString(),
      data: { habits: state.habits, checkins: state.checkins, categories: state.categories, settings: state.settings, notes: state.notes, rest: state.rest },
      photos: photos
    };
  }

  // On iPhone the share sheet ("Save to Files", AirDrop, iCloud) is the reliable way to hand
  // a file out of a home-screen app. Where it is missing we fall back to a normal download.
  function exportBackup() {
    var json = JSON.stringify(buildBackup());
    var name = 'habit-tracker-backup-' + todayKey() + '.json';
    function remember() {
      try { localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString()); } catch (e) {}
      render();
    }
    function download() {
      var url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      var a = el('a', { href: url, download: name });
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function() { URL.revokeObjectURL(url); }, 4000);
      remember();
    }
    var file = null;
    try { file = new File([json], name, { type: 'application/json' }); } catch (e) {}
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'Habit Tracker backup' }).then(remember).catch(function(e) {
        if (e && e.name !== 'AbortError') download(); // AbortError = you closed the share sheet
      });
    } else {
      download();
    }
  }

  // Check a backup file thoroughly and rebuild clean objects from it.
  // Nothing in the app is changed until this succeeds and you confirm.
  function validateBackup(raw) {
    if (!raw || raw.app !== 'habit-tracker' || !raw.data || !Array.isArray(raw.data.habits)) {
      throw new Error('This is not a Habit Tracker backup file.');
    }
    var DATE = /^\d{4}-\d{2}-\d{2}$/;
    var str = function(v) { return typeof v === 'string' ? v : ''; };
    var img = function(v) { return typeof v === 'string' && v.indexOf('data:image/') === 0 ? v : ''; };
    var rawSettings = raw.data.settings || {};
    var data = { habits: [], checkins: {}, categories: [], settings: { heatmapWeeks: clampWeeks(rawSettings.heatmapWeeks || DEFAULT_WEEKS) }, notes: {}, rest: {} };

    (Array.isArray(raw.data.categories) ? raw.data.categories : []).forEach(function(c) {
      if (c && str(c.id) && str(c.name)) data.categories.push({ id: c.id, name: c.name, icon: str(c.icon), iconImage: img(c.iconImage) });
    });
    raw.data.habits.forEach(function(h) {
      var f = h && h.frequency, freq;
      if (!h || !str(h.id) || !str(h.name) || !f) throw new Error('A habit in the file is damaged.');
      if (f.type === 'daily') freq = { type: 'daily' };
      else if (f.type === 'weekdays' && Array.isArray(f.days)) freq = { type: 'weekdays', days: f.days.filter(function(n) { return Number.isInteger(n) && n >= 0 && n <= 6; }) };
      else if (f.type === 'weekly') freq = { type: 'weekly', target: Math.max(1, Math.min(7, Math.round(Number(f.target)) || 3)) };
      else throw new Error('A habit in the file is damaged.');
      data.habits.push({
        id: h.id, name: h.name, subtitle: str(h.subtitle), icon: str(h.icon), iconImage: img(h.iconImage),
        categoryId: str(h.categoryId), photoRequired: !!h.photoRequired, color: safeColor(h.color), frequency: freq,
        createdAt: isNaN(Date.parse(h.createdAt)) ? new Date().toISOString() : h.createdAt, archived: !!h.archived
      });
    });
    ['checkins', 'notes', 'rest'].forEach(function(name) {
      var src = raw.data[name] || {};
      Object.keys(src).forEach(function(hid) {
        if (hid === '__proto__') return;
        var inner = src[hid] || {}, out = {};
        Object.keys(inner).forEach(function(day) {
          if (!DATE.test(day)) return;
          if (name === 'notes') { if (typeof inner[day] === 'string' && inner[day]) out[day] = inner[day]; }
          else if (inner[day]) out[day] = true;
        });
        data[name][hid] = out;
      });
    });
    var photosOut = {}, rawPhotos = raw.photos || {};
    Object.keys(rawPhotos).forEach(function(k) {
      var parts = k.split('|');
      if (parts.length === 2 && DATE.test(parts[1]) && img(rawPhotos[k])) photosOut[k] = rawPhotos[k];
    });
    return { data: data, photos: photosOut };
  }

  function applyBackup(clean) {
    // Photos first (add the new ones, then drop the ones not in the backup); the rest of the data
    // is swapped in only after that worked, so a failure never leaves a half-restored state.
    idbGetAll().then(function(res) {
      var stale = res.keys.filter(function(k) { return !(k in clean.photos); });
      return Promise.all(Object.keys(clean.photos).map(function(k) { return idbPut(k, clean.photos[k]); }))
        .then(function() { return Promise.all(stale.map(idbDelete)); });
    }).then(function() {
      state = clean.data;
      photos = clean.photos;
      save();
      filter = 'all';
      modal = null;
      render();
      showToast('Backup restored.');
    }).catch(function(e) {
      console.error('Restore failed', e);
      alert('Restore failed. Nothing was lost from the backup file, so you can try again.');
    });
  }

  var restoreInput = document.createElement('input');
  restoreInput.type = 'file';
  restoreInput.accept = 'application/json,.json';
  restoreInput.style.display = 'none';
  restoreInput.addEventListener('change', function(e) {
    var file = e.target.files && e.target.files[0];
    restoreInput.value = '';
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function() {
      try {
        var raw;
        try { raw = JSON.parse(reader.result); } catch (parseError) { throw new Error('That file is not a valid backup.'); }
        var clean = validateBackup(raw);
        var when = isNaN(Date.parse(raw.exportedAt)) ? 'an unknown date' : new Date(raw.exportedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
        var msg = 'Replace everything on this phone with this backup?\n\nBackup from ' + when + ': ' + clean.data.habits.length +
          ' habits, ' + Object.keys(clean.photos).length + ' photos.\n\nExport a backup first if you are not sure.';
        if (confirm(msg)) applyBackup(clean);
      } catch (err) {
        alert(err && err.message ? err.message : 'Could not read that file.');
      }
    };
    reader.onerror = function() { alert('Could not read that file.'); };
    reader.readAsText(file);
  });
  document.body.appendChild(restoreInput);

  // ---------- stats ----------
  var LONG_DAYS = ['Sundays','Mondays','Tuesdays','Wednesdays','Thursdays','Fridays','Saturdays'];

  // First day the habit has data: its creation day, or an earlier backfilled check-in
  function habitStart(habit) {
    var start = new Date(habit.createdAt);
    start.setHours(0, 0, 0, 0);
    var keys = Object.keys(state.checkins[habit.id] || {}).sort();
    if (keys.length) {
      var p = keys[0].split('-');
      var first = new Date(+p[0], +p[1] - 1, +p[2]);
      if (first < start) start = first;
    }
    return start;
  }

  function bestStreak(habit) {
    var today = new Date(), start = habitStart(habit), best = 0, run = 0, d, k;
    if (habit.frequency.type === 'weekly') {
      var w = startOfWeek(start), thisWeek = startOfWeek(today);
      while (w <= thisWeek) {
        var n = 0;
        for (var i = 0; i < 7; i++) { d = addDays(w, i); if (d <= today && isDone(habit, toKey(d))) n++; }
        if (n >= habit.frequency.target) { run++; if (run > best) best = run; }
        else if (w < thisWeek) run = 0; // the current week is still in progress, so it cannot break the run
        w = addDays(w, 7);
      }
      return best;
    }
    for (d = new Date(start); d <= today; d = addDays(d, 1)) {
      k = toKey(d);
      if (isDone(habit, k)) { run++; if (run > best) best = run; }
      else if (isScheduled(habit, d) && !isRest(habit, k) && k !== todayKey()) run = 0;
    }
    return best;
  }

  // Share of scheduled days done in the last 30 days (weekly habits: last 4 weeks vs target)
  function recentRate(habit) {
    var today = new Date(), start = habitStart(habit), done = 0, total = 0, i, d, k;
    if (habit.frequency.type === 'weekly') {
      for (i = 0; i < 28; i++) if (isDone(habit, toKey(addDays(today, -i)))) done++;
      return Math.min(100, Math.round(done / (habit.frequency.target * 4) * 100));
    }
    for (i = 0; i < 30; i++) {
      d = addDays(today, -i);
      if (d < start) break;
      k = toKey(d);
      if (isDone(habit, k)) { done++; total++; }
      else if (isScheduled(habit, d) && !isRest(habit, k) && i > 0) total++; // today does not count as missed yet
    }
    return total ? Math.round(done / total * 100) : null;
  }

  function mostMissedWeekday(habit) {
    if (habit.frequency.type === 'weekly') return null;
    var today = new Date(), start = habitStart(habit), misses = [0,0,0,0,0,0,0], i, d, k;
    for (i = 1; i <= 90; i++) {
      d = addDays(today, -i);
      if (d < start) break;
      k = toKey(d);
      if (isScheduled(habit, d) && !isDone(habit, k) && !isRest(habit, k)) misses[d.getDay()]++;
    }
    var worst = misses.indexOf(Math.max.apply(null, misses));
    return misses[worst] >= 3 ? LONG_DAYS[worst] : null;
  }

  function statBlock(label, value) {
    return el('div', { class: 'stat' }, [ el('span', { class: 'stat-value', text: value }), el('span', { class: 'stat-label', text: label }) ]);
  }

  function renderStatsSheet() {
    var active = state.habits.filter(function(h) { return !h.archived; });
    var kids = [];
    if (!active.length) {
      kids.push(el('p', { class: 'hint', text: 'Add a habit and check it off a few times to see stats here.' }));
    } else {
      var totalChecks = active.reduce(function(sum, h) { return sum + Object.keys(state.checkins[h.id] || {}).length; }, 0);
      kids.push(el('div', { class: 'stat-grid' }, [
        statBlock('Habits', String(active.length)),
        statBlock('Check-ins', String(totalChecks)),
        statBlock('Photos', String(Object.keys(photos).length))
      ]));
      active.forEach(function(h) {
        var weekly = h.frequency.type === 'weekly', unit = weekly ? 'w' : 'd';
        var rate = recentRate(h), missed = mostMissedWeekday(h);
        var box = el('div', { class: 'stat-habit', style: colorVars(h) }, [
          el('div', { class: 'stat-head' }, [ tileEl(h), el('span', { class: 'title', text: h.name }) ]),
          el('div', { class: 'stat-grid' }, [
            statBlock('Streak', computeStreak(h) + unit),
            statBlock('Best', bestStreak(h) + unit),
            statBlock(weekly ? 'Last 4 weeks' : 'Last 30 days', rate === null ? 'n/a' : rate + '%')
          ])
        ]);
        if (missed) box.appendChild(el('p', { class: 'hint', text: 'Most missed: ' + missed + '.' }));
        kids.push(box);
      });
    }
    kids.push(el('div', { class: 'modal-actions' }, [ el('span', {}), el('button', { class: 'btn btn-primary', text: 'Close', onclick: closeModal }) ]));
    return sheet('Stats', kids);
  }

  // ---------- demo data (?demo=1) ----------
  function seedDemo() {
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var created = addDays(new Date(), -150).toISOString();
    state.categories = [
      { id: 'c_study', name: 'Study', icon: 'i:graduation-cap', iconImage: '' },
      { id: 'c_fit', name: 'Fitness', icon: 'i:dumbbell', iconImage: '' },
      { id: 'c_mind', name: 'Mind', icon: 'i:brain', iconImage: '' }
    ];
    var defs = [
      ['Read 20 pages', 'a chapter before bed', 'i:book-open', '#5fb3c9', 'c_study', 0.8, { type: 'daily' }],
      ['Workout', 'strength or a run', 'i:dumbbell', '#d9776f', 'c_fit', 0.6, { type: 'daily' }],
      ['Meditate', '10 quiet minutes', 'i:flower-2', '#9a8bd6', 'c_mind', 0.7, { type: 'daily' }],
      ['Practice guitar', '', 'i:guitar', '#d4a85a', 'c_study', 0.55, { type: 'weekdays', days: [1, 2, 3, 4, 5] }]
    ];
    state.habits = []; state.checkins = {};
    defs.forEach(function(def, n) {
      var id = 'demo_' + n, marks = {};
      state.habits.push({ id: id, name: def[0], subtitle: def[1], icon: def[2], iconImage: '', categoryId: def[4], photoRequired: false, color: def[3], frequency: def[6], createdAt: created, archived: false });
      for (var i = 0; i < 150; i++) {
        var d = addDays(new Date(), -i);
        if (isScheduled(state.habits[n], d) && (rnd() < def[5] || (n === 0 && i < 6))) marks[toKey(d)] = true;
      }
      state.checkins[id] = marks;
    });
    save();
  }

  // ---------- init ----------
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(function() {}); // best-effort; ignored where unsupported
  }
  if (!window.localStorage) {
    document.getElementById('app').innerHTML = '<div class="error-box">This browser does not support on-device storage.</div>';
  } else {
    load();
    loadPhotos();
  }
})();

// Register the service worker so the app shell is cached and works offline
// after the first successful load.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('service-worker.js').catch(function(e) {
      console.error('Service worker registration failed', e);
    });
  });
}
