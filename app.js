/* Freewriting Studio. Everything is kept on this device, in the browser's own storage. */
(function () {
  'use strict';

  var KEY = 'freewritingStudio.v1';
  var DAY = 24 * 60 * 60 * 1000;
  var MODULES = window.FS_MODULES, TECHS = window.FS_TECHNIQUES;
  var TECH = {};
  TECHS.forEach(function (t) { TECH[t.id] = t; });

  /* ---------- storage ---------- */

  function blank() {
    return {
      version: 1,
      sessions: [],   // freewrites, one per sitting
      morning: [],    // one per day: { id, date, text, goal, secondsTaken, reached }
      prompts: {},    // "2026-11-22": prompt written the day before
      settings: { agreement: true, chime: true, lastGoal: {} },
      meta: { firstUse: Date.now(), lastExport: null, snooze: 0, tipDismissed: false }
    };
  }
  function tidy(d) {
    var b = blank();
    Object.keys(b).forEach(function (k) { if (d[k] == null) d[k] = b[k]; });
    ['settings', 'meta'].forEach(function (g) {
      Object.keys(b[g]).forEach(function (k) { if (d[g][k] === undefined) d[g][k] = b[g][k]; });
    });
    return d;
  }
  var db, storageOK = true;
  try {
    var raw = localStorage.getItem(KEY);
    db = raw ? tidy(JSON.parse(raw)) : blank();
  } catch (e) { db = blank(); storageOK = false; }

  var saveTimer = null, statusEl = null;
  function persist() {
    clearTimeout(saveTimer); saveTimer = null;
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
      if (statusEl) statusEl.textContent = 'Saved on this device';
    } catch (e) {
      storageOK = false;
      if (statusEl) statusEl.textContent = 'Could not save. Export your work now.';
      toast('Could not save on this device. Please export your work.');
    }
  }
  function save() {
    if (statusEl) statusEl.textContent = 'Saving...';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 400);
  }
  window.addEventListener('pagehide', function () { if (stopWriter) stopWriter(); if (saveTimer) persist(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && saveTimer) persist(); });
  if (navigator.storage && navigator.storage.persist) { navigator.storage.persist().catch(function () {}); }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  /* ---------- small helpers ---------- */

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else el.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { add(el, x); });
    else el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  function grow(t) {
    var y = window.scrollY;
    t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px';
    window.scrollTo(0, y);
  }
  function growAll(root) { Array.prototype.forEach.call(root.querySelectorAll('textarea'), grow); }
  function go(hash) { location.hash = hash; }
  function dateText(ts) {
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function firstLine(s, n) {
    s = (s || '').trim().split('\n')[0];
    return s.length > (n || 70) ? s.slice(0, n || 70) + '...' : s;
  }
  function countWords(s) { s = (s || '').trim(); return s ? s.split(/\s+/).length : 0; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function clockText(sec) {
    sec = Math.max(0, Math.round(sec));
    var hrs = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return (hrs ? hrs + ':' + pad2(m) : m) + ':' + pad2(s);
  }
  function minsText(sec) {
    var m = Math.round(sec / 60);
    return m < 1 ? 'under a minute' : m + (m === 1 ? ' minute' : ' minutes');
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }

  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  function modal(title, body, buttons) {
    var overlay = h('div', { class: 'overlay' });
    function close() { overlay.remove(); }
    var sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' }, h('h3', { class: 'serif' }, title), body);
    buttons.forEach(function (b) {
      sheet.appendChild(h('button', {
        class: 'btn' + (b.primary ? ' primary' : '') + (b.danger ? ' danger' : ''),
        onclick: function () { if (!b.run || b.run() !== false) close(); }
      }, b.label));
    });
    overlay.appendChild(sheet);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
    growAll(sheet);
    return close;
  }
  function confirmBox(title, text, yesLabel, yes, danger) {
    modal(title, h('p', null, text), [
      { label: yesLabel, primary: !danger, danger: danger, run: yes },
      { label: 'Cancel' }
    ]);
  }

  /* ---------- goals ---------- */

  function copyGoal(g) { return { mode: g.mode, minutes: g.minutes, words: g.words, endOn: g.endOn || 'first' }; }
  function defaultGoal(techId) {
    var saved = db.settings.lastGoal[techId];
    return copyGoal(saved || (TECH[techId] && TECH[techId].goal) || TECH.free.goal);
  }
  function phaseGoal(t, k) {
    var p = t.phases[k], saved = p.kind === 'write' && db.settings.lastGoal[t.id + ':' + k];
    return copyGoal(saved || { mode: 'time', minutes: p.minutes, words: p.minutes * 40, endOn: 'first' });
  }
  function newPass() { return { id: uid(), text: '', goal: defaultGoal('gradual'), secondsTaken: 0, reached: false, created: Date.now() }; }
  function goalText(g) {
    var t = plural(g.minutes, 'minute'), w = plural(g.words, 'word');
    if (g.mode === 'time') return t;
    if (g.mode === 'words') return w;
    return t + ' and ' + w + (g.endOn === 'last' ? ', both done' : ', whichever comes first');
  }
  function goalMet(g, seconds, words) {
    var t = seconds >= g.minutes * 60, w = words >= g.words;
    if (g.mode === 'time') return t;
    if (g.mode === 'words') return w;
    return g.endOn === 'last' ? (t && w) : (t || w);
  }

  /* ---------- sound and screen ---------- */

  var audio = null;
  function unlockAudio() {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
    } catch (e) { audio = null; }
  }
  function chime() {
    if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
    if (!db.settings.chime || !audio) return;
    try {
      [[660, 0], [880, 0.22]].forEach(function (n) {
        var o = audio.createOscillator(), g = audio.createGain(), at = audio.currentTime + n[1];
        o.type = 'sine'; o.frequency.value = n[0];
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
        o.connect(g); g.connect(audio.destination); o.start(at); o.stop(at + 1);
      });
    } catch (e) { /* no sound, the toast still shows */ }
  }
  var wake = null;
  function keepAwake(on) {
    if (on) {
      if (wake || !navigator.wakeLock) return;
      navigator.wakeLock.request('screen').then(function (l) { wake = l; l.addEventListener('release', function () { wake = null; }); }, function () {});
    } else if (wake) { wake.release().catch(function () {}); wake = null; }
  }

  /* ---------- the writing screen ---------- */

  var stopWriter = null;   // whatever screen has a timer running sets this, and leaving the screen calls it

  // The Freewriting Agreement: while locked() is true, nothing can be removed from the box.
  function guard(box, locked, onType) {
    var lastNote = 0;
    function blocked(e) {
      e.preventDefault();
      if (Date.now() - lastNote > 2500) { lastNote = Date.now(); toast('No deleting until the goal is reached. Keep going.'); }
    }
    box.addEventListener('beforeinput', function (e) {
      if (onType) onType();
      if (!locked()) return;
      var t = e.inputType || '';
      if (/^delete/.test(t) || t === 'historyUndo' || t === 'historyRedo') return blocked(e);
      if (t !== 'insertReplacementText' && box.selectionStart !== box.selectionEnd) return blocked(e);
    });
    box.addEventListener('keydown', function (e) {
      if (!locked()) return;
      if (e.key === 'Backspace' || e.key === 'Delete') blocked(e);
      else if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z' || e.key === 'x')) blocked(e);
    });
    box.addEventListener('cut', function (e) { if (locked()) blocked(e); });
    box.addEventListener('drop', function (e) { if (locked()) blocked(e); });
  }

  // rec: the saved object (a session or a morning entry). It needs text, goal, secondsTaken, reached.
  // opts: techId, seedLabel, seedHint, prompt, placeholder, readOnly, touch() called on every change.
  function writer(rec, opts) {
    var running = false, lastTick = 0, interval = null, lastSaved = 0;
    var sr = opts.seedRec || rec;   // where the seed and its restatements live
    if (!sr.restates) sr.restates = [];
    var started = !!rec.startedAt || rec.secondsTaken > 0 || (!opts.prefilled && !!(rec.text || '').trim());

    // goal picker, shown until the session starts
    var g = rec.goal;
    var picker = h('div', { class: 'goalpick' });
    function drawPicker() {
      picker.textContent = '';
      if (opts.timeOnly) g.mode = 'time';
      var seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Goal' });
      [['time', 'Time'], ['words', 'Words'], ['both', 'Both']].forEach(function (m) {
        seg.appendChild(h('button', { class: g.mode === m[0] ? 'on' : null, 'aria-pressed': g.mode === m[0] ? 'true' : 'false',
          onclick: function () { g.mode = m[0]; opts.touch(); drawPicker(); drawDash(); } }, m[1]));
      });
      function num(field, unit, max) {
        var inp = h('input', { type: 'number', inputmode: 'numeric', min: '1', max: String(max), value: String(g[field]), 'aria-label': unit });
        inp.addEventListener('input', function () {
          var v = parseInt(inp.value, 10);
          if (v > 0 && v <= max) { g[field] = v; opts.touch(); drawDash(); }
        });
        inp.addEventListener('blur', function () { inp.value = String(g[field]); });
        return h('label', { class: 'numfield' }, inp, h('span', null, unit));
      }
      var fields = h('div', { class: 'goalfields' },
        g.mode !== 'words' ? num('minutes', 'minutes', 600) : null,
        g.mode !== 'time' ? num('words', 'words', 50000) : null);
      var end = null;
      if (g.mode === 'both') {
        end = h('div', { class: 'ticks' }, [['first', 'Stop at whichever comes first'], ['last', 'Stop only when both are done']].map(function (o) {
          var r = h('input', { type: 'radio', name: 'endOn', checked: g.endOn === o[0] });
          r.addEventListener('change', function () { g.endOn = o[0]; opts.touch(); drawDash(); });
          return h('label', { class: 'tick' }, r, h('span', null, o[1]));
        }));
      }
      add(picker, [opts.timeOnly ? null : seg, fields, end]);
    }

    // seed line: an input before you start, pinned text after
    var seedWrap = h('div');
    var seedInput = null;
    function drawSeed() {
      seedWrap.textContent = '';
      if (opts.prompt) {
        seedWrap.appendChild(h('div', { class: 'seed' }, h('span', { class: 'seed-label' }, 'Today\'s prompt'), h('p', null, opts.prompt)));
      }
      if (!opts.seedLabel) return;
      if (!started && !opts.readOnly && !opts.seedFixed) {
        seedInput = h('input', { type: 'text', class: 'seedinput', value: sr.seed || '', placeholder: opts.seedHint || '', 'aria-label': opts.seedLabel });
        seedInput.addEventListener('input', function () { sr.seed = seedInput.value; opts.touch(); });
        add(seedWrap, [h('p', { class: 'field-label' }, opts.seedLabel), seedInput]);
        return;
      }
      seedInput = null;
      if (!(sr.seed || '').trim() && !sr.restates.length) {
        if (!opts.readOnly && !opts.seedFixed) seedWrap.appendChild(h('button', { class: 'link addseed', onclick: restate }, 'Add a seed'));
        return;
      }
      var card = h('div', { class: 'seed' }, h('span', { class: 'seed-label' }, opts.seedLabel));
      var now = sr.restates.length ? sr.restates[sr.restates.length - 1].text : sr.seed;
      card.appendChild(h('p', null, now));
      if (sr.restates.length) {
        var earlier = [sr.seed].concat(sr.restates.slice(0, -1).map(function (r) { return r.text; })).filter(function (s) { return (s || '').trim(); });
        if (earlier.length) card.appendChild(h('ol', { class: 'earlier' }, earlier.map(function (s) { return h('li', null, s); })));
      }
      if (!opts.readOnly) card.appendChild(h('button', { class: 'link', onclick: restate }, 'Restate'));
      seedWrap.appendChild(card);
    }
    function restate() {
      var inp = h('textarea', { class: 'small', placeholder: 'Say it a different way', 'aria-label': 'New wording' });
      modal('Restate it', h('div', null, h('p', { class: 'sub' }, 'The timer keeps running.'), inp), [
        { label: 'Use this wording', primary: true, run: function () {
          var v = inp.value.trim();
          if (!v) return false;
          if (!(sr.seed || '').trim()) sr.seed = v; else sr.restates.push({ text: v, at: Date.now() });
          opts.touch(); drawSeed(); box.focus();
        } },
        { label: 'Cancel', run: function () { box.focus(); } }
      ]);
      setTimeout(function () { inp.focus(); }, 50);
    }

    // dashboard: clock, words, bars, buttons
    var clock = h('span', { class: 'big' }), clockLabel = h('span', { class: 'lbl' });
    var wordsEl = h('span', { class: 'big' }), wordsLabel = h('span', { class: 'lbl' });
    var timeBar = h('i'), wordBar = h('i');
    var bars = h('div', { class: 'bars' }, h('div', { class: 'bar' }, timeBar), h('div', { class: 'bar' }, wordBar));
    var goBtn = h('button', { class: 'btn primary go' });
    var focusBtn = h('button', { class: 'link focusbtn', onclick: function () { setFocus(!document.body.classList.contains('focus')); } });
    var lockNote = h('p', { class: 'locknote' });
    var dash = h('div', { class: 'dash' },
      h('div', { class: 'readouts' },
        h('div', { class: 'readout' }, clock, clockLabel),
        h('div', { class: 'readout' }, wordsEl, wordsLabel)),
      bars,
      opts.readOnly ? null : h('div', { class: 'dashbtns' }, goBtn, focusBtn),
      lockNote);

    function setFocus(on) {
      document.body.classList.toggle('focus', on);
      focusBtn.textContent = on ? 'Exit focus' : 'Focus';
      if (on) box.focus();
    }
    function locked() { return db.settings.agreement && !rec.reached && !opts.readOnly && !opts.noLock; }

    function drawDash() {
      var n = countWords(rec.text), s = rec.secondsTaken || 0;
      var tMode = g.mode !== 'words', wMode = g.mode !== 'time';
      if (rec.reached || !tMode) { clock.textContent = clockText(s); clockLabel.textContent = rec.reached ? 'written' : 'so far'; }
      else { clock.textContent = clockText(g.minutes * 60 - s); clockLabel.textContent = 'left of ' + plural(g.minutes, 'minute'); }
      wordsEl.textContent = n.toLocaleString('en-IN');
      wordsLabel.textContent = wMode && !rec.reached ? 'of ' + g.words.toLocaleString('en-IN') + ' words' : (n === 1 ? 'word' : 'words');
      timeBar.parentNode.hidden = !tMode || rec.reached;
      wordBar.parentNode.hidden = !wMode || rec.reached;
      timeBar.style.width = Math.min(100, s / (g.minutes * 60) * 100) + '%';
      wordBar.style.width = Math.min(100, n / g.words * 100) + '%';
      if (rec.reached) goBtn.textContent = running ? 'Pause' : 'Keep writing';
      else goBtn.textContent = running ? 'Pause' : (started ? 'Continue' : 'Start');
      goBtn.classList.toggle('primary', !running);
      if (!focusBtn.textContent) focusBtn.textContent = 'Focus';
      lockNote.textContent = opts.readOnly ? '' : opts.noLock ? (rec.reached ? 'Time is up. Move on when you\'re ready.' : 'Editing is open in this phase.')
        : rec.reached ? 'Goal reached. Editing is open again.'
        : locked() ? 'No deleting until the goal is reached.' : '';
      dash.classList.toggle('running', running);
      dash.classList.toggle('done', !!rec.reached);
    }

    function tick() {
      var now = Date.now();
      rec.secondsTaken = (rec.secondsTaken || 0) + (now - lastTick) / 1000;
      lastTick = now;
      check();
      drawDash();
      if (now - lastSaved > 5000) { lastSaved = now; opts.touch(); }
    }
    function check() {
      if (rec.reached || !started) return;
      if (goalMet(g, rec.secondsTaken || 0, countWords(rec.text))) {
        rec.reached = true; rec.reachedAt = Date.now();
        chime(); toast(opts.noLock ? 'Time is up. Move on when you\'re ready.' : 'Goal reached. Keep going if you like.');
        if (opts.onReached) opts.onReached();
        opts.touch(); persist();
      }
    }
    function start() {
      if (running || opts.readOnly) return;
      unlockAudio();
      if (!started) {
        started = true; rec.startedAt = Date.now();
        db.settings.lastGoal[opts.techId] = copyGoal(g);
        picker.hidden = true; drawSeed();
      }
      running = true; lastTick = Date.now();
      interval = setInterval(tick, 250);
      keepAwake(true);
      drawDash(); opts.touch();
    }
    function pause() {
      if (!running) return;
      tick();
      running = false; clearInterval(interval); interval = null;
      keepAwake(false);
      drawDash(); persist();
    }
    goBtn.addEventListener('click', function () {
      if (running) pause(); else { start(); box.focus(); }
    });

    // the text itself
    var box = h('textarea', { class: 'writing', value: rec.text || '', placeholder: opts.placeholder || 'Start typing. The timer starts with you.',
      'aria-label': 'Your freewrite', spellcheck: 'false', autocapitalize: 'sentences' });
    if (opts.readOnly) box.readOnly = true;
    if (!opts.readOnly) guard(box, locked, function () { if (!running) start(); });
    box.addEventListener('input', function () {
      rec.text = box.value; grow(box);
      check(); drawDash(); opts.touch();
    });
    document.addEventListener('visibilitychange', onVis);
    function onVis() { if (!document.hidden && running) keepAwake(true); }

    picker.hidden = started || !!opts.readOnly;
    drawPicker(); drawSeed(); drawDash();

    stopWriter = function () {
      if (running) { tick(); running = false; clearInterval(interval); }
      keepAwake(false);
      document.removeEventListener('visibilitychange', onVis);
      document.body.classList.remove('focus');
      stopWriter = null;
      if (opts.leave) opts.leave();
    };
    return { el: h('div', { class: 'writer' }, picker, seedWrap, dash, box), box: box, start: start };
  }

  /* ---------- lookups ---------- */

  function techOf(s) { return TECH[s.technique] || TECH.free; }
  function sessionName(s) { return firstLine(s.seed, 60) || techOf(s).name; }
  // A session is one of four shapes: plain (text), phased (phases), Hot Seat (questions) or Gradual Sketch (passes).
  function mainText(s) {
    if (s.phases) {
      for (var i = s.phases.length - 1; i >= 0; i--) if ((s.phases[i].text || '').trim()) return s.phases[i].text;
      return '';
    }
    if (s.questions) return s.questions.map(function (q) { return q.a || ''; }).filter(function (a) { return a.trim(); }).join('\n\n');
    if (s.passes) return s.passes.map(function (p) { return p.text || ''; }).join('\n\n');
    return s.text || '';
  }
  function contentText(s) {
    var out = [s.text];
    (s.phases || []).forEach(function (p) { out.push(p.text); });
    (s.questions || []).forEach(function (q) { out.push(q.q, q.a); });
    (s.passes || []).forEach(function (p) { out.push(p.text); });
    return out.filter(Boolean).join('\n');
  }
  function totalSeconds(s) {
    var n = s.secondsTaken || 0;
    [s.phases, s.questions, s.passes].forEach(function (list) { (list || []).forEach(function (x) { n += x.secondsTaken || x.seconds || 0; }); });
    return n;
  }
  function isEmpty(s) { return !contentText(s).trim() && !(totalSeconds(s) > 1); }
  function finished(s) {
    if (s.phases) return !!s.done;
    if (s.questions) return !!(s.hs && s.hs.state === 'done');
    if (s.passes) return true;
    return !!s.reached;
  }
  function removeSession(s) { var k = db.sessions.indexOf(s); if (k >= 0) db.sessions.splice(k, 1); }
  function sorted(list) { return list.slice().sort(function (a, b) { return b.updated - a.updated; }); }
  function techNum(t) { return t.num || (t.n ? String(t.n) : ''); }
  function inModule(n) { return TECHS.filter(function (t) { return t.module === n; }); }

  function newSession(techId) {
    var t = TECH[techId] || TECH.free;
    var s = { id: uid(), technique: t.id, seed: t.seed || '', restates: [], created: Date.now(), updated: Date.now() };
    if (t.phases) {
      s.phases = t.phases.map(function (p, k) { return { name: p.name, kind: p.kind, goal: phaseGoal(t, k), text: '', secondsTaken: 0, reached: false }; });
      s.phaseIndex = 0;
    } else if (t.id === 'hotseat') {
      s.questions = []; s.hs = { minutes: (db.settings.lastGoal.hotseat || t.goal).minutes, index: 0, state: 'setup' };
    } else if (t.id === 'gradual') {
      s.passes = [newPass()];
    } else {
      s.goal = defaultGoal(t.id); s.text = ''; s.secondsTaken = 0; s.reached = false;
    }
    db.sessions.push(s); persist();
    go('s/' + s.id);
  }

  /* ---------- screens ---------- */

  var app = document.getElementById('app');
  function show() {
    statusEl = null;
    app.textContent = '';
    app.classList.remove('wide');
    for (var i = 0; i < arguments.length; i++) add(app, arguments[i]);
    growAll(app);
  }
  function backLink(hash, label) { return h('a', { class: 'back', href: '#' + hash }, '‹ ' + label); }
  function rowLink(hash, title, detail, count, num) {
    return h('li', null, h('a', { class: 'row', href: '#' + hash },
      num ? h('span', { class: 'num' }, num) : null,
      h('span', { class: 'grow' }, h('span', { class: 't' }, title), detail ? h('span', { class: 'd' }, detail) : null),
      count != null ? h('span', { class: 'n' }, count) : null,
      h('span', { class: 'chev' }, '›')));
  }
  function sessionRow(s, withTech) {
    var bits = [dateText(s.created), plural(countWords(mainText(s)), 'word')];
    if (withTech) bits.unshift(techOf(s).name);
    if (s.passes) bits.push(plural(s.passes.length, 'pass', 'passes'));
    if (!finished(s)) bits.push('unfinished');
    return rowLink('s/' + s.id, sessionName(s), bits.join(' · '));
  }

  function home() {
    var notes = [];
    if (!storageOK) {
      notes.push(h('div', { class: 'note' }, 'This browser is not letting Freewriting Studio save. If you are in Private Browsing, switch it off and open the app again.'));
    }
    var hasWork = totalItems(db) > 0;
    var since = Date.now() - (db.meta.lastExport || db.meta.firstUse);
    if (hasWork && since > 7 * DAY && Date.now() > (db.meta.snooze || 0)) {
      var ago = Math.floor(since / DAY);
      notes.push(h('div', { class: 'note' },
        db.meta.lastExport ? 'It has been ' + ago + ' days since you last exported your work.' : 'You have not exported your work yet.',
        ' An export is your safety copy.',
        h('button', { class: 'btn', onclick: exportAll }, 'Export now'),
        h('button', { class: 'link', onclick: function () { db.meta.snooze = Date.now() + DAY; persist(); route(); } }, 'Remind me tomorrow')));
    }
    var ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var installed = window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    if (ios && !installed && !db.meta.tipDismissed) {
      notes.push(h('div', { class: 'note' },
        'Tip: in Safari, tap the Share button, then "Add to Home Screen". Freewriting Studio then opens like an app, and the iPhone is far less likely to clear your saved work.',
        h('button', { class: 'link', onclick: function () { db.meta.tipDismissed = true; persist(); route(); } }, 'Got it')));
    }

    var open = sorted(db.sessions).filter(function (s) { return !finished(s) && !isEmpty(s) && Date.now() - s.updated < 3 * DAY; })[0];
    var today = dayKey(new Date());

    var results = h('div');
    var search = h('input', { type: 'search', class: 'search', value: searchText, placeholder: 'Search everything', 'aria-label': 'Search everything',
      oninput: function () { searchText = search.value; look(); } });
    function look() {
      var on = !!searchText.trim();
      rest.hidden = on; results.hidden = !on;
      if (on) searchResults(searchText, results);
    }
    var rest = h('div', null,
      h('button', { class: 'btn primary', onclick: function () { newSession('free'); } }, 'Start a freewrite'),
      open ? h('a', { class: 'btn', href: '#s/' + open.id }, 'Continue: ' + sessionName(open)) : null,
      notes,
      h('ul', { class: 'list gap' },
        rowLink('morning', 'Morning Freewrite', morningLine(today)),
        rowLink('saved', 'Saved freewrites', null, db.sessions.filter(function (s) { return !isEmpty(s); }).length)),
      h('h2', null, 'Techniques'),
      h('ul', { class: 'list' }, MODULES.map(function (m) {
        return rowLink('m/' + m.n, m.name, null, inModule(m.n).length, String(m.n));
      })),
      h('h2', null, 'More'),
      h('ul', { class: 'list' },
        rowLink('settings', 'Settings', db.settings.agreement ? 'No deleting during a freewrite: on' : 'No deleting during a freewrite: off'),
        rowLink('backup', 'Export and Import', db.meta.lastExport ? 'Last export ' + dateText(db.meta.lastExport) : 'Not exported yet')));
    show(h('p', { class: 'eyebrow' }, 'Notes on freewriting'), h('h1', null, 'Freewriting Studio'),
      h('p', { class: 'sub' }, 'Keep the pen moving. Fix it later.'),
      search, results, rest);
    look();
  }
  function morningLine(today) {
    var n = chain();
    if (written(today)) return 'Done today. Streak: ' + days(n);
    return 'Not written yet today' + (n ? '. Streak: ' + days(n) : '') + (db.prompts[today] ? '. A prompt is waiting' : '');
  }

  function moduleScreen(n) {
    var m = MODULES.filter(function (x) { return String(x.n) === String(n); })[0];
    if (!m) return home();
    show(backLink('', 'Home'), h('p', { class: 'eyebrow' }, 'Module ' + m.n), h('h1', null, m.name),
      h('ul', { class: 'list gap' }, inModule(m.n).map(function (t) {
        var c = db.sessions.filter(function (s) { return s.technique === t.id && !isEmpty(s); }).length;
        return rowLink('t/' + t.id, t.name, t.summary, c || null, techNum(t));
      })));
  }

  function techScreen(id) {
    var t = TECH[id];
    if (!t) return home();
    var past = sorted(db.sessions.filter(function (s) { return s.technique === t.id && !isEmpty(s); }));
    var action = null;
    if (t.kind === 'morning') action = h('a', { class: 'btn primary', href: '#morning' }, 'Open Morning Freewrite');
    else if (t.kind !== 'reference') action = h('button', { class: 'btn primary', onclick: function () { newSession(t.id); } }, 'Start');
    var goal = t.kind === 'reference' || t.phases || t.id === 'hotseat' || t.id === 'gradual' ? null : defaultGoal(t.id);
    var note = goal ? 'Goal: ' + goalText(goal) + '. You can change it before you start.'
      : t.phases ? plural(t.phases.reduce(function (a, p) { return a + p.minutes; }, 0), 'minute') + ' in all. Writing phases can be switched to a word goal before each one starts.'
      : t.id === 'hotseat' ? 'You write the questions first. The timer starts after.'
      : t.id === 'gradual' ? 'Each pass is ' + goalText(defaultGoal('gradual')) + '. Come back to the same sketch to add the next pass.' : null;
    show(t.module ? backLink('m/' + t.module, MODULES[t.module - 1].name) : backLink('', 'Home'),
      h('p', { class: 'eyebrow' }, t.module ? 'Module ' + t.module + ' · Exercise ' + techNum(t) : 'Freewriting'),
      h('h1', null, t.name),
      h('p', { class: 'sub' }, t.summary),
      h('p', { class: 'timing' }, h('span', { class: 'tag' + (t.timing.book ? ' book' : '') }, t.timing.book ? 'Book' : 'Suggested'), ' ', t.timing.text),
      h('h2', null, t.kind === 'reference' ? 'The moves' : 'How it works'),
      h('ol', { class: 'rules' }, t.how ? t.how.map(function (x) { return h('li', null, x); }) : null),
      t.phases ? [h('h2', null, 'Phases'), h('ol', { class: 'rules' }, t.phases.map(function (p) {
        return h('li', null, h('b', null, p.name), ' — ' + plural(p.minutes, 'minute') + (p.kind === 'write' ? '' : p.kind === 'mark' ? ', no typing' : ', editing allowed'));
      }))] : null,
      t.later ? h('div', { class: 'note' }, t.later) : null,
      h('div', { class: 'actions' }, action,
        note ? h('p', { class: 'status' }, note) : null),
      past.length ? [h('h2', null, 'Your freewrites (' + past.length + ')'), h('ul', { class: 'list' }, past.map(function (s) { return sessionRow(s, false); }))] : null);
  }

  function sessionScreen(id) {
    var s = db.sessions.filter(function (x) { return x.id === id; })[0];
    if (!s) return home();
    if (!s.restates) s.restates = [];
    var t = techOf(s);
    if (s.phases && t.phases) return phasedScreen(s, t);
    if (s.questions) return hotSeatScreen(s, t);
    if (s.passes) return gradualScreen(s, t);
    var status = h('p', { class: 'status' }, 'Saves by itself as you type');
    var w = writer(s, {
      techId: t.id, seedLabel: t.seedLabel || 'Seed (optional)', seedHint: t.seedHint,
      touch: function () { s.updated = Date.now(); save(); },
      leave: function () {
        if (isEmpty(s) && db.sessions.indexOf(s) >= 0) { db.sessions.splice(db.sessions.indexOf(s), 1); }
        persist();
      }
    });
    var back = t.id === 'free' ? backLink('', 'Home') : backLink('t/' + t.id, t.name);
    show(h('div', { class: 'chrome' }, back,
        h('p', { class: 'eyebrow' }, (t.module ? 'Exercise ' + techNum(t) + ' · ' : '') + dateText(s.created)),
        h('h1', { class: 'h1small' }, t.name)),
      w.el, status,
      h('div', { class: 'chrome foot' },
        h('button', { class: 'btn', onclick: function () { copyText(s.text); } }, 'Copy the text'),
        h('button', { class: 'btn', onclick: function () { exportOne(s); } }, 'Export as a text file'),
        h('p', { style: 'text-align:center' }, h('button', { class: 'link danger', onclick: function () {
          confirmBox('Delete this freewrite?', 'It will be removed from this device.', 'Delete it', function () {
            db.sessions = db.sessions.filter(function (x) { return x.id !== s.id; }); persist(); go(t.id === 'free' ? '' : 't/' + t.id);
          }, true);
        } }, 'Delete this freewrite'))));
    statusEl = status;
  }

  function sessionFoot(s, t, copyWhat) {
    return h('div', { class: 'chrome foot' },
      h('button', { class: 'btn', onclick: function () { copyText(copyWhat ? copyWhat() : mainText(s)); } }, 'Copy the text'),
      h('button', { class: 'btn', onclick: function () { exportOne(s); } }, 'Export as a text file'),
      h('p', { style: 'text-align:center' }, h('button', { class: 'link danger', onclick: function () {
        confirmBox('Delete this ' + (s.questions ? 'Hot Seat' : s.passes ? 'sketch' : 'freewrite') + '?', 'It will be removed from this device.', 'Delete it', function () {
          if (stopWriter) { var stop = stopWriter; stopWriter = null; stop(); }
          removeSession(s); persist(); go('t/' + t.id);
        }, true);
      } }, 'Delete')));
  }
  function textBlock(text, cls) { return h('div', { class: 'pintext' + (cls ? ' ' + cls : '') }, (text || '').trim() || h('span', { class: 'soft' }, 'Nothing written.')); }

  /* ---------- phased techniques: sketches and recipes ---------- */

  // Split a freewrite into passages to mark: by line, with long lines cut at sentence ends.
  function chunksOf(text) {
    var out = [];
    (text || '').split(/\n+/).forEach(function (para) {
      para = para.trim();
      if (!para) return;
      if (para.length <= 320) { out.push(para); return; }
      var sents = para.match(/[^.!?]+[.!?]+["'”’)\]]*\s*|[^.!?]+$/g) || [para];
      var buf = '';
      sents.forEach(function (x) {
        if (buf && (buf + x).length > 320) { out.push(buf.trim()); buf = ''; }
        buf += x;
      });
      if (buf.trim()) out.push(buf.trim());
    });
    return out;
  }
  function strongOf(m) { return (m.chunks || []).filter(function (c, k) { return m.flags[k] === 'strong'; }); }
  function discarded(t, upTo) {
    var d = {};
    t.phases.forEach(function (p, k) { if (k <= upTo && p.discards != null) d[p.discards] = true; });
    return d;
  }
  function enterPhase(s, t, i) {
    var p = t.phases[i], ph = s.phases[i];
    if (p.kind === 'mark' && !ph.chunks) {
      ph.chunks = [];
      p.markFrom.forEach(function (j) { ph.chunks = ph.chunks.concat(chunksOf(s.phases[j].text)); });
      ph.flags = {};
    }
    if (p.from != null && !ph.filled) {
      var text = s.phases[p.from].text || '';
      if (p.dropDead != null) {
        var m = s.phases[p.dropDead];
        if (m.chunks && m.chunks.length) text = m.chunks.filter(function (c, k) { return m.flags[k] !== 'dead'; }).join('\n\n');
      }
      ph.text = text; ph.filled = true;
    }
  }
  function pinnedPanel(s, t, i) {
    var p = t.phases[i], ph = s.phases[i], parts = [];
    if (p.pin != null) {
      var label = t.phases[p.pin].name;
      if (p.hidePin && !ph.reached) {
        parts.push(h('div', { class: 'pin' }, h('span', { class: 'seed-label' }, label),
          h('p', { class: 'soft facedown' }, 'Face-down. It turns over when you reach the goal.')));
      } else parts.push(h('div', { class: 'pin' }, h('span', { class: 'seed-label' }, label), textBlock(s.phases[p.pin].text)));
    }
    if (p.keep != null) {
      var strong = strongOf(s.phases[p.keep]);
      parts.push(h('div', { class: 'pin' }, h('span', { class: 'seed-label' }, 'Keep (' + strong.length + ')'),
        strong.length ? h('ul', { class: 'keep' }, strong.map(function (x) { return h('li', null, x); }))
          : h('p', { class: 'soft' }, 'Nothing was marked strong.')));
    }
    return parts.length ? h('aside', { class: 'pinned' }, parts) : null;
  }
  function earlierPhases(s, t, upTo, skipPinned) {
    var gone = discarded(t, upTo), items = [];
    for (var k = 0; k < upTo; k++) {
      var p = t.phases[k];
      if (p.kind === 'mark' || k === skipPinned) continue;
      var label = (k + 1) + '. ' + p.name + ' · ' + plural(countWords(s.phases[k].text), 'word') + (gone[k] ? ' · set aside' : '');
      items.push(h('details', { class: 'earlier-phase' }, h('summary', null, label), textBlock(s.phases[k].text)));
    }
    return items.length ? h('div', { class: 'chrome' }, h('h2', null, 'Earlier phases'), items) : null;
  }

  // A countdown for phases where you don't type (Reread and mark).
  function phaseClock(rec, opts) {
    var running = false, lastTick = 0, interval = null, lastSaved = 0;
    var clock = h('span', { class: 'big' }), lbl = h('span', { class: 'lbl' }), bar = h('i');
    var btn = h('button', { class: 'btn primary go' });
    var el = h('div', { class: 'dash' },
      h('div', { class: 'readouts' }, h('div', { class: 'readout' }, clock, lbl)),
      h('div', { class: 'bars' }, h('div', { class: 'bar' }, bar)),
      h('div', { class: 'dashbtns' }, btn));
    function draw() {
      var total = rec.goal.minutes * 60, s = rec.secondsTaken || 0;
      if (rec.reached) { clock.textContent = clockText(s); lbl.textContent = 'taken'; }
      else { clock.textContent = clockText(total - s); lbl.textContent = 'left of ' + plural(rec.goal.minutes, 'minute'); }
      bar.style.width = Math.min(100, s / total * 100) + '%';
      btn.textContent = running ? 'Pause' : (s > 0 ? 'Continue the timer' : 'Start the timer');
      btn.classList.toggle('primary', !running);
      el.classList.toggle('done', !!rec.reached);
    }
    function tick() {
      var now = Date.now();
      rec.secondsTaken = (rec.secondsTaken || 0) + (now - lastTick) / 1000; lastTick = now;
      if (!rec.reached && rec.secondsTaken >= rec.goal.minutes * 60) {
        rec.reached = true; chime(); toast('Time is up. Move on when you\'re ready.');
        if (opts.onReached) opts.onReached();
        opts.touch();
      }
      if (now - lastSaved > 5000) { lastSaved = now; opts.touch(); }
      draw();
    }
    function start() { if (running) return; unlockAudio(); running = true; lastTick = Date.now(); interval = setInterval(tick, 250); keepAwake(true); draw(); }
    function pause() { if (!running) return; tick(); running = false; clearInterval(interval); keepAwake(false); draw(); opts.touch(); }
    btn.addEventListener('click', function () { if (running) pause(); else start(); });
    draw();
    return { el: el, start: start, stop: function () { if (running) { tick(); running = false; clearInterval(interval); } keepAwake(false); } };
  }

  function markList(ph, touch, onFirst) {
    if (!ph.chunks.length) return h('p', { class: 'empty' }, 'There is nothing to mark: the freewrite is empty.');
    var count = h('p', { class: 'markcount' });
    function drawCount() {
      var st = 0, dd = 0;
      Object.keys(ph.flags).forEach(function (k) { if (ph.flags[k] === 'strong') st++; else if (ph.flags[k] === 'dead') dd++; });
      count.textContent = st + ' strong · ' + dd + ' dead weight · ' + (ph.chunks.length - st - dd) + ' unmarked';
    }
    var list = h('div', { class: 'chunks' }, ph.chunks.map(function (c, k) {
      var bs = h('button', { class: 'mark' }, 'Strong'), bd = h('button', { class: 'mark' }, 'Dead weight');
      var card = h('div', { class: 'chunk' }, h('p', null, c), h('div', { class: 'markbtns' }, bs, bd));
      function draw() {
        card.classList.toggle('is-strong', ph.flags[k] === 'strong');
        card.classList.toggle('is-dead', ph.flags[k] === 'dead');
        bs.setAttribute('aria-pressed', ph.flags[k] === 'strong' ? 'true' : 'false');
        bd.setAttribute('aria-pressed', ph.flags[k] === 'dead' ? 'true' : 'false');
      }
      function set(v) { onFirst(); if (ph.flags[k] === v) delete ph.flags[k]; else ph.flags[k] = v; draw(); drawCount(); touch(); }
      bs.addEventListener('click', function () { set('strong'); });
      bd.addEventListener('click', function () { set('dead'); });
      draw();
      return card;
    }));
    drawCount();
    return h('div', null, count, list);
  }

  function phasedScreen(s, t) {
    if (s.done) return phasedDone(s, t);
    var i = Math.min(s.phaseIndex || 0, t.phases.length - 1), p = t.phases[i], ph = s.phases[i];
    enterPhase(s, t, i);
    var last = i === t.phases.length - 1;
    var touch = function () { s.updated = Date.now(); save(); };
    var nextBtn = h('button', { class: 'btn next' + (ph.reached ? ' primary' : '') }, last ? 'Finish' : 'Next: ' + t.phases[i + 1].name + ' ›');
    nextBtn.addEventListener('click', function () {
      function goOn() {
        if (last) s.done = true; else s.phaseIndex = i + 1;
        s.updated = Date.now(); persist(); window.scrollTo(0, 0); route();
      }
      if (!ph.reached) confirmBox(last ? 'Finish before the time is up?' : 'Move on before the time is up?',
        'You won\'t come back to this phase. What you wrote is kept.', last ? 'Finish' : 'Move on', goOn);
      else goOn();
    });
    var pinWrap = h('div', { class: 'pinwrap' });
    function drawPin() { pinWrap.textContent = ''; add(pinWrap, pinnedPanel(s, t, i)); }
    drawPin();
    function reached() { nextBtn.classList.add('primary'); drawPin(); }
    var main;
    if (p.kind === 'mark') {
      var clock = phaseClock(ph, { touch: touch, onReached: reached });
      main = h('div', null, clock.el, markList(ph, touch, function () { clock.start(); }));
      stopWriter = function () { clock.stop(); stopWriter = null; persist(); };
    } else {
      main = writer(ph, {
        techId: t.id + ':' + i, seedRec: s, seedLabel: t.seedLabel || 'Seed (optional)', seedFixed: i > 0,
        prefilled: p.kind === 'edit', noLock: p.kind === 'edit', timeOnly: p.kind !== 'write',
        placeholder: p.kind === 'edit' ? 'Nothing carried over. Write here.' : undefined,
        touch: touch, onReached: reached,
        leave: function () { if (!(s.phaseIndex || 0) && isEmpty(s)) removeSession(s); persist(); }
      }).el;
    }
    var pinned = p.pin != null || p.keep != null;
    var status = h('p', { class: 'status' }, 'Saves by itself');
    var stepper = h('ol', { class: 'stepper' }, t.phases.map(function (q, k) {
      return h('li', { class: k < i ? 'past' : k === i ? 'now' : null }, h('b', null, k + 1), h('span', null, q.name), h('span', { class: 'mins' }, q.minutes + 'm'));
    }));
    show(h('div', { class: 'chrome' }, backLink('t/' + t.id, t.name),
        h('p', { class: 'eyebrow' }, t.name + ' · phase ' + (i + 1) + ' of ' + t.phases.length),
        h('h1', { class: 'h1small' }, p.name), stepper, p.hint ? h('p', { class: 'sub hintline' }, p.hint) : null),
      pinned ? h('div', { class: 'split' }, pinWrap, h('div', { class: 'splitmain' }, main)) : main,
      h('div', { class: 'nextwrap' }, nextBtn), status,
      earlierPhases(s, t, i, p.pin),
      sessionFoot(s, t));
    if (pinned) app.classList.add('wide');
    statusEl = status;
  }

  function phasedDone(s, t) {
    var lastPh = s.phases[s.phases.length - 1];
    var box = h('textarea', { class: 'writing final', value: lastPh.text || '', 'aria-label': t.result ? 'Your summary' : 'The finished piece' });
    box.addEventListener('input', function () { lastPh.text = box.value; s.updated = Date.now(); grow(box); save(); });
    var status = h('p', { class: 'status' }, 'Saved on this device');
    show(h('div', { class: 'chrome' }, backLink('t/' + t.id, t.name),
        h('p', { class: 'eyebrow' }, 'Finished · ' + dateText(s.created) + ' · ' + minsText(totalSeconds(s))),
        h('h1', { class: 'h1small' }, firstLine(s.seed, 60) || t.name),
        h('p', { class: 'sub' }, t.result || 'The finished piece. You can still edit it here.')),
      box, status,
      earlierPhases(s, t, s.phases.length - 1, null),
      sessionFoot(s, t));
    statusEl = status;
  }

  /* ---------- Hot Seat ---------- */

  function hotSeatScreen(s, t) {
    if (!s.hs) s.hs = { minutes: 1, index: 0, state: 'setup' };
    var touch = function () { s.updated = Date.now(); save(); };
    var head = h('div', { class: 'chrome' }, backLink('t/' + t.id, t.name),
      h('p', { class: 'eyebrow' }, 'Hot Seat · ' + dateText(s.created)));
    if (s.hs.state === 'setup') return hotSeatSetup(s, t, head, touch);
    if (s.hs.state === 'done' || s.hs.index >= s.questions.length) { s.hs.state = 'done'; return hotSeatDone(s, t, head); }
    return hotSeatRun(s, t, head, touch);
  }

  function hotSeatSetup(s, t, head, touch) {
    var list = h('div', { class: 'qlist' });
    var startBtn = h('button', { class: 'btn primary' }, 'Start the Hot Seat');
    function drawList(focusLast) {
      list.textContent = '';
      s.questions.forEach(function (q, k) {
        var ta = h('textarea', { class: 'small', value: q.q, placeholder: 'A pointed question', 'aria-label': 'Question ' + (k + 1) });
        ta.addEventListener('input', function () { q.q = ta.value; grow(ta); touch(); startBtn.disabled = !ready(); });
        var rm = h('button', { class: 'mini', 'aria-label': 'Remove question ' + (k + 1), onclick: function () { s.questions.splice(k, 1); touch(); drawList(); } }, '×');
        list.appendChild(h('div', { class: 'setrow' }, h('span', { class: 'setnum' }, k + 1), h('div', { class: 'grow' }, ta), h('div', { class: 'setbtns' }, rm)));
      });
      if (!s.questions.length) list.appendChild(h('p', { class: 'empty' }, 'No questions yet. Write your own, or start from a ready-made set.'));
      if (list.isConnected) growAll(list);
      startBtn.disabled = !ready();
      if (focusLast) { var all = list.querySelectorAll('textarea'); if (all.length) all[all.length - 1].focus(); }
    }
    function ready() { return s.questions.some(function (q) { return q.q.trim(); }); }
    function addQ(text) { s.questions.push({ q: text || '', a: '', seconds: 0 }); }
    startBtn.addEventListener('click', function () {
      s.questions = s.questions.filter(function (q) { return q.q.trim(); });
      s.hs.state = 'running'; s.hs.index = 0;
      db.settings.lastGoal.hotseat = { mode: 'time', minutes: s.hs.minutes, words: 100, endOn: 'first' };
      persist(); route();
    });
    var mins = h('input', { type: 'number', inputmode: 'numeric', min: '1', max: '30', value: String(s.hs.minutes), 'aria-label': 'Minutes for each question' });
    mins.addEventListener('input', function () { var v = parseInt(mins.value, 10); if (v > 0 && v <= 30) { s.hs.minutes = v; touch(); } });
    mins.addEventListener('blur', function () { mins.value = String(s.hs.minutes); });
    var topic = h('input', { type: 'text', class: 'seedinput', value: s.seed || '', placeholder: 'What the questions are about', 'aria-label': 'Topic' });
    topic.addEventListener('input', function () { s.seed = topic.value; touch(); });
    drawList();
    stopWriter = function () { stopWriter = null; if (isEmpty(s) && !(s.seed || '').trim()) removeSession(s); persist(); };
    show(head, h('h1', null, 'Write your questions'),
      h('p', { class: 'sub' }, 'Prepare them before any timer. Then each one gets its own countdown and moves on by itself.'),
      h('p', { class: 'field-label' }, 'Topic (optional)'), topic,
      h('p', { class: 'field-label' }, 'Questions'), list,
      h('button', { class: 'btn', onclick: function () { addQ(); touch(); drawList(true); } }, '+ Add a question'),
      (t.sets || []).map(function (set) {
        return h('button', { class: 'btn', onclick: function () { set.questions.forEach(addQ); touch(); drawList(); toast('Added ' + set.questions.length + ' questions'); } },
          '+ Add the set "' + set.name + '" (' + set.questions.length + ')');
      }),
      h('p', { class: 'field-label' }, 'Time for each question'),
      h('div', { class: 'goalfields' }, h('label', { class: 'numfield' }, mins, h('span', null, 'minutes'))),
      h('div', { class: 'actions' }, startBtn),
      sessionFoot(s, t));
  }

  function hotSeatRun(s, t, head, touch) {
    var k = s.hs.index, total = s.questions.length;
    var running = false, lastTick = 0, interval = null, lastSaved = 0;
    var counter = h('p', { class: 'eyebrow' }), qEl = h('p', { class: 'hsq' });
    var clock = h('span', { class: 'big' }), lbl = h('span', { class: 'lbl' }), bar = h('i');
    var goBtn = h('button', { class: 'btn primary go' });
    var nextBtn = h('button', { class: 'link' });
    var box = h('textarea', { class: 'writing hs', 'aria-label': 'Your answer', spellcheck: 'false', placeholder: 'Answer fast. No editing.' });
    function q() { return s.questions[k]; }
    function load() {
      counter.textContent = 'Question ' + (k + 1) + ' of ' + total;
      qEl.textContent = q().q;
      box.value = q().a || ''; grow(box);
      nextBtn.textContent = k === total - 1 ? 'Finish now' : 'Next question ›';
      draw();
    }
    function draw() {
      var limit = s.hs.minutes * 60, sec = q().seconds || 0;
      clock.textContent = clockText(limit - sec);
      lbl.textContent = 'left of ' + plural(s.hs.minutes, 'minute');
      bar.style.width = Math.min(100, sec / limit * 100) + '%';
      goBtn.textContent = running ? 'Pause' : (sec > 0 || k > 0 ? 'Continue' : 'Start');
      goBtn.classList.toggle('primary', !running);
      dash.classList.toggle('running', running);
    }
    function tick() {
      var now = Date.now();
      q().seconds = (q().seconds || 0) + (now - lastTick) / 1000; lastTick = now;
      if (now - lastSaved > 5000) { lastSaved = now; touch(); }
      if (q().seconds >= s.hs.minutes * 60) { q().seconds = s.hs.minutes * 60; advance(true); return; }
      draw();
    }
    function start() { if (running) return; unlockAudio(); running = true; lastTick = Date.now(); interval = setInterval(tick, 250); keepAwake(true); draw(); }
    function pause() { if (!running) return; tick(); running = false; clearInterval(interval); keepAwake(false); draw(); persist(); }
    function advance(auto) {
      if (auto) chime();
      k++; s.hs.index = k; touch();
      if (k >= total) {
        running = false; clearInterval(interval); keepAwake(false);
        s.hs.state = 'done'; persist(); stopWriter = null; route(); return;
      }
      lastTick = Date.now();
      if (auto) toast('Next question');
      load(); box.focus();
    }
    goBtn.addEventListener('click', function () { if (running) pause(); else { start(); box.focus(); } });
    nextBtn.addEventListener('click', function () { if (running) tick(); advance(false); });
    guard(box, function () { return db.settings.agreement; }, function () { if (!running) start(); });
    box.addEventListener('input', function () { q().a = box.value; grow(box); touch(); });
    var dash = h('div', { class: 'dash' },
      h('div', { class: 'readouts' }, h('div', { class: 'readout' }, clock, lbl)),
      h('div', { class: 'bars' }, h('div', { class: 'bar' }, bar)),
      h('div', { class: 'dashbtns' }, goBtn, nextBtn),
      h('p', { class: 'locknote' }, db.settings.agreement ? 'No deleting. When the time is up, the next question comes up by itself.' : 'When the time is up, the next question comes up by itself.'));
    load();
    stopWriter = function () { if (running) { tick(); running = false; clearInterval(interval); } keepAwake(false); stopWriter = null; persist(); };
    var status = h('p', { class: 'status' }, 'Saves by itself');
    show(head, counter, qEl, dash, box, status, sessionFoot(s, t));
    statusEl = status;
  }

  function hotSeatDone(s, t, head) {
    show(head, h('h1', { class: 'h1small' }, firstLine(s.seed, 60) || 'Hot Seat'),
      h('p', { class: 'sub' }, plural(s.questions.length, 'question') + ' · ' + plural(countWords(mainText(s)), 'word') + ' · ' + minsText(totalSeconds(s))),
      s.questions.map(function (q) { return h('div', { class: 'qa' }, h('p', { class: 'hsq small' }, q.q), textBlock(q.a)); }),
      h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: function () {
        var n = { id: uid(), technique: 'hotseat', seed: s.seed, restates: [], created: Date.now(), updated: Date.now(),
          questions: s.questions.map(function (q) { return { q: q.q, a: '', seconds: 0 }; }), hs: { minutes: s.hs.minutes, index: 0, state: 'setup' } };
        db.sessions.push(n); persist(); go('s/' + n.id);
      } }, 'Use these questions again')),
      sessionFoot(s, t, function () { return bodyMarkdown(s, t); }));
  }

  /* ---------- Gradual Sketch ---------- */

  function gapText(text) {
    var el = h('div', { class: 'pintext' });
    (text || '').split(/(\[[^\]\n]*\])/).forEach(function (part) {
      if (/^\[[^\]\n]*\]$/.test(part)) el.appendChild(h('mark', { class: 'gap' }, part));
      else if (part) el.appendChild(document.createTextNode(part));
    });
    if (!(text || '').trim()) el.appendChild(h('span', { class: 'soft' }, 'Nothing written.'));
    return el;
  }
  function gradualScreen(s, t) {
    var touch = function () { s.updated = Date.now(); save(); };
    var cur = s.passes[s.passes.length - 1];
    // Today's pass stays open until its goal is reached; a pass from an earlier day is finished as it stands.
    var active = cur && !cur.reached && dayKey(new Date(cur.created)) === dayKey(new Date()) ? cur : null;
    var earlier = active ? s.passes.slice(0, -1) : s.passes;
    var gaps = 0;
    s.passes.forEach(function (p) { gaps += ((p.text || '').match(/\[[^\]\n]*\]/g) || []).length; });
    var body;
    if (active) {
      body = writer(active, {
        techId: 'gradual', seedRec: s, seedLabel: t.seedLabel, seedFixed: s.passes.length > 1,
        placeholder: 'What you know so far. Put what you don\'t know in [square brackets].',
        touch: touch,
        leave: function () {
          if (isEmpty({ text: active.text, secondsTaken: active.secondsTaken }) && s.passes.length > 1) s.passes.pop();
          if (isEmpty(s)) removeSession(s);
          persist();
        }
      }).el;
    } else {
      body = h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: function () {
        s.passes.push(newPass()); persist(); route();
      } }, 'Add pass ' + (s.passes.length + 1)));
    }
    var status = h('p', { class: 'status' }, 'Saves by itself');
    show(h('div', { class: 'chrome' }, backLink('t/' + t.id, t.name),
        h('p', { class: 'eyebrow' }, 'Gradual Sketch · started ' + dateText(s.created)),
        h('h1', { class: 'h1small' }, firstLine(s.seed, 60) || t.name),
        h('p', { class: 'sub' }, plural(s.passes.length, 'pass', 'passes') + (gaps ? ' · ' + plural(gaps, 'gap') + ' marked in [brackets]' : ''))),
      earlier.map(function (p, k) {
        return h('div', { class: 'pass chrome' }, h('p', { class: 'seed-label' }, 'Pass ' + (k + 1) + ' · ' + dateText(p.created) + ' · ' + plural(countWords(p.text), 'word')), gapText(p.text));
      }),
      active ? h('p', { class: 'seed-label passlabel chrome' }, 'Pass ' + s.passes.length + ' · today') : null,
      body, status, sessionFoot(s, t));
    statusEl = status;
  }

  function savedScreen() {
    var list = sorted(db.sessions.filter(function (s) { return !isEmpty(s); }));
    show(backLink('', 'Home'), h('h1', null, 'Saved freewrites'),
      h('p', { class: 'sub' }, list.length ? 'Newest first. Morning Freewrites are kept on their own page.' : 'Nothing saved yet.'),
      list.length ? h('ul', { class: 'list' }, list.map(function (s) { return sessionRow(s, true); })) : null);
  }

  /* ---------- Morning Freewrite ---------- */

  function dayKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function keyDate(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function morningFor(k) { return db.morning.filter(function (m) { return m.date === k; })[0]; }
  function written(k) { var m = morningFor(k); return !!(m && (m.text || '').trim()); }
  function chain() {
    var d = new Date(), n = 0;
    if (!written(dayKey(d))) d.setDate(d.getDate() - 1);
    while (written(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function days(n) { return plural(n, 'day'); }

  function morningScreen(key) {
    var today = dayKey(new Date());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key || '') || key > today) key = today;
    var isToday = key === today;
    var entry = morningFor(key);
    if (!isToday && !entry) { key = today; isToday = true; entry = morningFor(key); }
    var date = keyDate(key);
    if (!entry) entry = { id: 'm' + key, date: key, text: '', goal: defaultGoal('morning'), secondsTaken: 0, reached: false, restates: [], created: Date.now(), updated: Date.now() };
    if (!entry.goal) entry.goal = defaultGoal('morning');
    if (!entry.restates) entry.restates = [];
    var chainEl = h('p', { class: 'sub' });
    function drawChain() {
      var n = chain();
      chainEl.textContent = n ? 'Streak: ' + days(n) + '. Don\'t break it.' : 'No streak yet. Today starts one.';
    }
    var hadText = written(key);
    var w = writer(entry, {
      techId: 'morning', readOnly: !isToday, prompt: db.prompts[key],
      placeholder: 'First thing, before anything else. Anything at all.',
      touch: function () {
        entry.updated = Date.now();
        if (db.morning.indexOf(entry) < 0 && ((entry.text || '').trim() || entry.secondsTaken > 1)) db.morning.push(entry);
        save();
        var now = written(key);
        if (now !== hadText) { hadText = now; drawChain(); drawCal(); }
      },
      leave: function () { persist(); }
    });

    // tomorrow's prompt
    var tmr = new Date(); tmr.setDate(tmr.getDate() + 1);
    var tKey = dayKey(tmr);
    var promptBox = h('textarea', { class: 'small', value: db.prompts[tKey] || '', placeholder: 'A question, an image or a line to start from tomorrow',
      'aria-label': 'Tomorrow\'s prompt' });
    promptBox.addEventListener('input', function () {
      var v = promptBox.value;
      if (v.trim()) db.prompts[tKey] = v; else delete db.prompts[tKey];
      grow(promptBox); save();
    });

    // calendar
    var shown = new Date(date.getFullYear(), date.getMonth(), 1);
    var cal = h('div', { class: 'cal' });
    function drawCal() {
      cal.textContent = '';
      var now = new Date(), thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      var next = h('button', { class: 'mini', 'aria-label': 'Next month', onclick: function () { shown.setMonth(shown.getMonth() + 1); drawCal(); } }, '›');
      if (shown >= thisMonth) next.disabled = true;
      cal.appendChild(h('div', { class: 'cal-head' },
        h('button', { class: 'mini', 'aria-label': 'Previous month', onclick: function () { shown.setMonth(shown.getMonth() - 1); drawCal(); } }, '‹'),
        h('b', null, shown.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })), next));
      var grid = h('div', { class: 'cal-grid' });
      ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(function (d) { grid.appendChild(h('span', { class: 'dow' }, d)); });
      var lead = (shown.getDay() + 6) % 7;
      for (var i = 0; i < lead; i++) grid.appendChild(h('span'));
      var count = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate();
      for (var d = 1; d <= count; d++) {
        var k = dayKey(new Date(shown.getFullYear(), shown.getMonth(), d));
        var done = written(k), cls = 'day' + (done ? ' done' : '') + (k === today ? ' today' : '') + (k === key ? ' open' : '');
        if (done || k === today) {
          grid.appendChild(h('a', { class: cls, href: '#morning/' + k,
            'aria-label': keyDate(k).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) + (done ? ', written' : ', today') }, d));
        } else grid.appendChild(h('span', { class: cls }, d));
      }
      cal.appendChild(grid);
    }
    drawChain(); drawCal();
    var status = h('p', { class: 'status' }, isToday ? 'Saves by itself as you type' : 'Saved on this device');
    show(h('div', { class: 'chrome' }, backLink('', 'Home'), h('h1', null, 'Morning Freewrite'),
        h('p', { class: 'eyebrow dateline' }, date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })),
        isToday ? chainEl : h('p', { class: 'sub' }, h('a', { href: '#morning' }, 'Back to today'))),
      w.el, status,
      h('div', { class: 'chrome' },
        isToday ? [h('h2', null, 'Tomorrow\'s prompt'),
          h('p', { class: 'hint' }, 'Optional. It shows at the top of tomorrow\'s page.'), promptBox] : null,
        h('h2', null, 'The streak'),
        h('p', { class: 'hint' }, 'Each day you write gets crossed off. Tap a crossed-off day to read it.'),
        cal));
    statusEl = status;
  }

  /* ---------- Settings ---------- */

  function settingsScreen() {
    function toggle(key, title, text) {
      var c = h('input', { type: 'checkbox', checked: db.settings[key] });
      c.addEventListener('change', function () { db.settings[key] = c.checked; persist(); toast('Saved'); });
      return h('label', { class: 'tick setting' }, c, h('span', null, h('b', null, title), h('span', { class: 'd' }, text)));
    }
    show(backLink('', 'Home'), h('h1', null, 'Settings'),
      h('div', { class: 'ticks' },
        toggle('agreement', 'No deleting during a freewrite',
          'Backspace, Delete, Cut and Undo do nothing until the goal is reached, as in the Freewriting Agreement. Editing opens again once you reach it.'),
        toggle('chime', 'Chime when the goal is reached', 'A soft two-note sound. On iPhone the ring/silent switch can mute it.')),
      h('h2', null, 'Goals'),
      h('p', null, 'Each technique remembers the goal you last used with it. You can change it on the writing screen before you start.'));
  }

  /* ---------- Search ---------- */

  var searchText = '';
  function snippet(text, q) {
    var flat = String(text || '').replace(/\s+/g, ' ');
    var at = flat.toLowerCase().indexOf(q);
    if (at < 0) return null;
    var from = Math.max(0, at - 40), to = Math.min(flat.length, at + q.length + 60);
    return (from ? '...' : '') + flat.slice(from, to) + (to < flat.length ? '...' : '');
  }
  function firstHit(list, q) {
    for (var i = 0; i < list.length; i++) { var sn = snippet(list[i], q); if (sn) return sn; }
    return null;
  }
  function searchResults(text, results) {
    var q = text.trim().toLowerCase();
    results.textContent = '';
    var total = 0;
    function block(title, rows) {
      if (!rows.length) return;
      total += rows.length;
      add(results, [h('h2', null, title + ' (' + rows.length + ')'), h('ul', { class: 'list' }, rows)]);
    }
    function hits(items, words, link, label) {
      var rows = [];
      items.forEach(function (it) { var sn = firstHit(words(it), q); if (sn) rows.push(rowLink(link(it), label(it), sn)); });
      return rows;
    }
    block('Freewrites', hits(sorted(db.sessions.filter(function (s) { return !isEmpty(s); })),
      function (s) { return [s.seed, contentText(s)].concat((s.restates || []).map(function (r) { return r.text; })); },
      function (s) { return 's/' + s.id; }, function (s) { return sessionName(s) + ' · ' + dateText(s.created); }));
    block('Morning Freewrite', hits(db.morning.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }),
      function (m) { return [m.text, db.prompts[m.date]]; }, function (m) { return 'morning/' + m.date; }, function (m) { return dateText(keyDate(m.date)); }));
    block('Techniques', hits(TECHS, function (t) { return [t.name, t.summary].concat(t.how || []); },
      function (t) { return 't/' + t.id; }, function (t) { return t.name; }));
    if (!total) results.appendChild(h('p', { class: 'empty' }, 'Nothing found for "' + text.trim() + '".'));
  }

  /* ---------- Export and Import ---------- */

  function stamp() { var d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function shareFile(fname, payload, type, done) {
    function download() {
      var url = URL.createObjectURL(new Blob([payload], { type: type }));
      var a = h('a', { href: url, download: fname });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      done();
    }
    var touch = navigator.maxTouchPoints > 1;
    try {
      var file = new File([payload], fname, { type: type });
      if (touch && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file] }).then(done, function (err) {
          if (err && err.name === 'AbortError') return;
          download();
        });
        return;
      }
    } catch (e) { /* fall through to a plain download */ }
    download();
  }
  function exportAll() {
    if (saveTimer) persist();
    var fname = 'freewriting-studio-' + stamp() + '.json';
    var payload = JSON.stringify({ app: 'freewriting-studio', version: 1, exported: new Date().toISOString(), data: db }, null, 1);
    shareFile(fname, payload, 'application/json', function () { db.meta.lastExport = Date.now(); persist(); toast('Export made: ' + fname); route(); });
  }
  function exportOne(s) {
    var t = techOf(s);
    var lines = ['# ' + sessionName(s), '',
      t.name + ' · ' + dateText(s.created), '',
      (s.goal ? 'Goal: ' + goalText(s.goal) + (s.reached ? ' (reached)' : ' (not reached)') + '. ' : '') +
        plural(countWords(mainText(s)), 'word') + ' in ' + minsText(totalSeconds(s)) + '.', ''];
    if ((s.seed || '').trim()) lines.push('**' + (t.seedLabel || 'Seed') + ':** ' + s.seed.trim());
    (s.restates || []).forEach(function (r, i) { lines.push('**Restated ' + (i + 1) + ':** ' + r.text); });
    lines.push('', '---', '', bodyMarkdown(s, t), '');
    var slug = sessionName(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'freewrite';
    shareFile(slug + '-' + stamp() + '.md', lines.join('\n'), 'text/markdown', function () { toast('Exported'); });
  }
  function bodyMarkdown(s, t) {
    if (s.phases) {
      var out = [];
      if (s.done) out.push('## ' + (t.result ? 'Summary' : 'Finished piece'), '', (mainText(s) || '').trim(), '');
      s.phases.forEach(function (p, k) {
        if (s.done && k === s.phases.length - 1) return;
        out.push('## ' + (k + 1) + '. ' + p.name, '');
        if (p.kind === 'mark') {
          (p.chunks || []).forEach(function (c, j) { if (p.flags[j]) out.push('- **' + (p.flags[j] === 'strong' ? 'Strong' : 'Dead weight') + ':** ' + c); });
        } else out.push((p.text || '').trim());
        out.push('');
      });
      return out.join('\n').trim();
    }
    if (s.questions) return s.questions.map(function (q) { return '**' + q.q.trim() + '**\n\n' + (q.a || '').trim(); }).join('\n\n');
    if (s.passes) return s.passes.map(function (p, k) { return '## Pass ' + (k + 1) + ' · ' + dateText(p.created) + '\n\n' + (p.text || '').trim(); }).join('\n\n');
    return (s.text || '').trim();
  }
  function copyText(text) {
    if (!(text || '').trim()) { toast('Nothing to copy yet'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Copied'); }, function () { toast('Could not copy'); });
    } else toast('Could not copy');
  }

  var LISTS = ['sessions', 'morning'];
  function morningCount(d) { return d.morning.filter(function (m) { return (m.text || '').trim(); }).length; }
  function totalItems(d) { return d.sessions.filter(function (s) { return !isEmpty(s); }).length + morningCount(d); }
  function countsText(d) {
    return plural(d.sessions.filter(function (s) { return !isEmpty(s); }).length, 'freewrite') + ' and ' +
      plural(morningCount(d), 'morning freewrite');
  }
  function importFile(file) {
    var reader = new FileReader();
    reader.onerror = function () { toast('Could not read that file'); };
    reader.onload = function () {
      var incoming;
      try {
        var parsed = JSON.parse(reader.result);
        if (!parsed || parsed.app !== 'freewriting-studio' || !parsed.data || !Array.isArray(parsed.data.sessions)) throw new Error('not ours');
        incoming = tidy(parsed.data);
      } catch (e) {
        modal('That is not a Freewriting Studio export', h('p', null, 'Nothing has been changed. Choose a file whose name starts with "freewriting-studio-" and ends in ".json".'), [{ label: 'OK', primary: true }]);
        return;
      }
      var here = totalItems(db);
      var when = h('p', { class: 'sub' }, 'The file holds ' + countsText(incoming) + '.');
      function mergeIn() {
        LISTS.forEach(function (k) {
          var byId = {};
          db[k].forEach(function (x) { byId[x.id] = x; });
          incoming[k].forEach(function (x) {
            var mine = byId[x.id];
            if (!mine) db[k].push(x);
            else if ((x.updated || 0) > (mine.updated || 0)) db[k][db[k].indexOf(mine)] = x;
          });
        });
        Object.keys(incoming.prompts).forEach(function (k) { if (!db.prompts[k]) db.prompts[k] = incoming.prompts[k]; });
        persist(); toast('Import added'); go('');
      }
      function replaceAll() {
        var meta = db.meta, settings = db.settings;
        db = incoming; db.meta = meta; db.settings = settings;
        persist(); toast('Import complete'); go('');
      }
      if (!here) {
        modal('Import this file?', when, [{ label: 'Import', primary: true, run: replaceAll }, { label: 'Cancel' }]);
        return;
      }
      modal('Import this file?', h('div', null, when,
        h('p', null, 'This device already has ' + countsText(db) + '.'),
        h('p', null, '"Add" keeps everything here and brings in what is in the file. Where the same item is in both, the more recently edited one is kept.')), [
        { label: 'Add to what is here', primary: true, run: mergeIn },
        { label: 'Replace everything here', danger: true, run: function () {
          setTimeout(function () {
            confirmBox('Replace everything on this device?', 'All ' + countsText(db) + ' on this device will be wiped and replaced by the file. This cannot be undone.', 'Yes, replace everything', replaceAll, true);
          }, 0);
        } },
        { label: 'Cancel' }
      ]);
    };
    reader.readAsText(file);
  }

  function backupScreen() {
    var picker = h('input', { type: 'file', accept: '.json,application/json', hidden: 'hidden' });
    picker.addEventListener('change', function () { if (picker.files[0]) importFile(picker.files[0]); picker.value = ''; });
    show(backLink('', 'Home'), h('h1', null, 'Export and Import'),
      h('p', { class: 'sub' }, 'Your writing lives only on this device. An export is one file holding all of it.'),
      h('p', null, db.meta.lastExport ? 'Last export: ' + dateText(db.meta.lastExport) + '.' : 'You have not exported yet.'),
      h('button', { class: 'btn primary', onclick: exportAll }, 'Export my work'),
      h('button', { class: 'btn', onclick: function () { picker.click(); } }, 'Import a file'),
      picker,
      h('div', { class: 'note' },
        h('p', null, 'To move work between phone and Mac: export on one, send the file to the other (AirDrop, email or Files), then import it there.'),
        h('p', null, 'Importing never wipes anything without asking you first.'),
        h('p', { style: 'margin:0' }, 'On iPhone, Safari can clear a website\'s saved work after about a week of not opening it. Use "Add to Home Screen" and export every week.')));
  }

  /* ---------- routing ---------- */

  function route() {
    if (stopWriter) stopWriter();
    document.querySelectorAll('.overlay').forEach(function (o) { o.remove(); });
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    var a = parts[0], b = parts[1];
    window.scrollTo(0, 0);
    if (a === 'm') return moduleScreen(b);
    if (a === 't') return techScreen(b);
    if (a === 's') return sessionScreen(b);
    if (a === 'morning') return morningScreen(b);
    if (a === 'saved') return savedScreen();
    if (a === 'settings') return settingsScreen();
    if (a === 'backup') return backupScreen();
    home();
  }
  window.addEventListener('hashchange', function () { if (saveTimer) persist(); route(); });
  route();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
