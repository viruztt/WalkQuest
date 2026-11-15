/* WalkQuest main app: storage, game logic, UI. Plain JS, no build step. */
(function () {
  const MAPS = window.WQ_MAPS;
  const scenery = window.WQ_SCENERY;
  const Dev = window.WQDevice;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ================= Storage =================
  const KEY = 'walkquest.v1';
  const SETTINGS = ['weightKg', 'maxSpeed', 'sound', 'unlockAll', 'encountersOn', 'stopOnEnd', 'startOnBegin'];
  const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  // Each browser gets its own id, so its XP can be added to the other devices' XP when syncing.
  const DEVICE = (() => { try { let d = localStorage.getItem('walkquest.device'); if (!d) { d = newId(); localStorage.setItem('walkquest.device', d); } return d; } catch (_) { return newId(); } })();
  const defaults = () => ({
    version: 1,
    epoch: newId(),   // changes when progress is erased or a backup restored, so other devices take that copy
    settingsAt: 0,    // when settings last changed (newest wins when syncing)
    profile: { xp: 0, weightKg: 75, maxSpeed: 6, sound: true, unlockAll: false, encountersOn: true, stopOnEnd: true, startOnBegin: true, encounterWins: 0, encounterTotal: 0 },
    counters: {},     // deviceId -> { xp, wins, total }: each device only adds to its own; the profile shows the sums
    progress: {},     // mapId -> { distanceM, completions, landmarks: [idx], runCollect: [idx], t: last change }
    collection: {},   // "mapId:idx" -> ISO date first found
    achievements: {}, // id -> ISO date
    codex: {},        // "mapId:idx" -> ISO date landmark first discovered
    bounties: {},     // "YYYY-MM-DD" -> ISO date completed
    history: []       // walk records
  });
  const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
  function sumCounters(x) {
    const t = { xp: 0, wins: 0, total: 0 };
    for (const c of Object.values(x.counters)) for (const k in t) t[k] += Math.max(0, +c[k] || 0);
    return t;
  }
  function applyCounters(x) { const t = sumCounters(x); x.profile.xp = t.xp; x.profile.encounterWins = t.wins; x.profile.encounterTotal = t.total; }
  function normalize(d) {
    const x = Object.assign(defaults(), isObj(d) ? d : {});
    x.profile = Object.assign(defaults().profile, isObj(x.profile) ? x.profile : {});
    for (const k of ['counters', 'progress', 'collection', 'achievements', 'codex', 'bounties']) if (!isObj(x[k])) x[k] = {};
    if (!Array.isArray(x.history)) x.history = [];
    // Saves from before syncing only kept totals in the profile: give them to this device.
    const t = sumCounters(x), extra = { xp: x.profile.xp - t.xp, wins: x.profile.encounterWins - t.wins, total: x.profile.encounterTotal - t.total };
    if (extra.xp > 0 || extra.wins > 0 || extra.total > 0) {
      const c = (x.counters[DEVICE] = Object.assign({ xp: 0, wins: 0, total: 0 }, x.counters[DEVICE]));
      for (const k in extra) if (extra[k] > 0) c[k] += extra[k];
    }
    applyCounters(x);
    // Settings changed before syncing existed beat another device's untouched defaults.
    if (!x.settingsAt && SETTINGS.some((k) => x.profile[k] !== defaults().profile[k])) x.settingsAt = 1;
    for (const [mid, pr] of Object.entries(x.progress)) for (const i of pr.landmarks || []) { x.codex[`${mid}:${i}`] = x.codex[`${mid}:${i}`] || new Date().toISOString(); }
    return x;
  }
  let db;
  try { db = normalize(JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch (_) { db = normalize({}); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (_) {} syncChanged(); };
  const prog = (id) => (db.progress[id] = db.progress[id] || { distanceM: 0, completions: 0, landmarks: [], runCollect: [], t: 0 });
  const touch = (p) => { p.t = Date.now(); return p; };
  const myCounter = () => (db.counters[DEVICE] = db.counters[DEVICE] || { xp: 0, wins: 0, total: 0 });
  function bump(k, n = 1) { myCounter()[k] += n; applyCounters(db); }
  function setPref(k, v) { db.profile[k] = v; db.settingsAt = Date.now(); save(); }
  // Sync bookkeeping (the sync code itself is further down): server revision we last saw,
  // whether this device has changes the server doesn't have yet, and a pending replace.
  const SYNC_KEY = 'walkquest.sync';
  let meta;
  try { meta = JSON.parse(localStorage.getItem(SYNC_KEY) || '{}') || {}; } catch (_) { meta = {}; }
  const saveMeta = () => { try { localStorage.setItem(SYNC_KEY, JSON.stringify(meta)); } catch (_) {} };
  const sync = { mode: /^https?:$/.test(location.protocol) ? 'starting' : 'off', busy: false, again: false, timer: null, edits: 0, error: '' };

  // ================= Derived stats =================
  const levelFor = (xp) => Math.floor(Math.sqrt(xp / 120)) + 1;
  const xpForLevel = (lvl) => 120 * (lvl - 1) * (lvl - 1);
  const RANKS = ['Wanderer', 'Scout', 'Pathfinder', 'Ranger', 'Adventurer', 'Veteran', 'Champion', 'Hero', 'Legend', 'Mythic'];
  const rankFor = (lvl) => RANKS[Math.min(RANKS.length - 1, Math.floor((lvl - 1) / 3))];
  const totalKm = () => db.history.reduce((a, h) => a + h.distanceM, 0) / 1000;
  const dayKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  function streak() {
    const days = new Set(db.history.filter((h) => h.distanceM >= 200).map((h) => dayKey(h.date)));
    let n = 0; const d = new Date();
    if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1); // streak survives until end of today
    while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function bestStreak() {
    const days = Array.from(new Set(db.history.filter((h) => h.distanceM >= 200).map((h) => dayKey(h.date)))).sort();
    let best = 0, cur = 0, prev = null;
    for (const k of days) {
      const t = new Date(k + 'T12:00:00').getTime();
      cur = prev && Math.round((t - prev) / 864e5) === 1 ? cur + 1 : 1;
      best = Math.max(best, cur); prev = t;
    }
    return best;
  }
  const isUnlocked = (m) => db.profile.unlockAll || totalKm() + (session ? session.distanceM / 1000 : 0) >= m.unlockKm;
  const totalCollectibles = MAPS.reduce((a, m) => a + m.collectibles.length, 0);
  const totalLandmarks = MAPS.reduce((a, m) => a + m.landmarks.length, 0);
  // Sights: short flavour texts spread evenly between landmarks.
  function sightsOf(m) {
    if (m._sights) return m._sights;
    const list = m.sights || [], n = list.length;
    m._sights = list.map(([icon, text], i) => {
      let at = 0.03 + ((i + 0.5) / n) * 0.94;
      if (m.landmarks.some((lm) => Math.abs(lm.at - at) < 0.02)) at += 0.025;
      return { icon, text, at: Math.min(0.985, at) };
    });
    return m._sights;
  }

  // ================= Daily bounty =================
  const BOUNTIES = [
    { id: 'km15', icon: '🥾', text: 'Walk 1.5 km today', goal: 1.5, unit: 'km', val: (t) => t.km },
    { id: 'km25', icon: '🥾', text: 'Walk 2.5 km today', goal: 2.5, unit: 'km', val: (t) => t.km },
    { id: 'km4', icon: '🦿', text: 'Walk 4 km today', goal: 4, unit: 'km', val: (t) => t.km },
    { id: 'min20', icon: '⏱️', text: 'Walk for 20 minutes today', goal: 20, unit: 'min', val: (t) => t.min },
    { id: 'min40', icon: '⌛', text: 'Walk for 40 minutes today', goal: 40, unit: 'min', val: (t) => t.min },
    { id: 'esc2', icon: '💨', text: 'Escape 2 encounters today', goal: 2, unit: '', val: (t) => t.won },
    { id: 'loot2', icon: '🎒', text: 'Pick up 2 collectibles today', goal: 2, unit: '', val: (t) => t.items },
    { id: 'lm4', icon: '📍', text: 'Reach 4 landmarks today', goal: 4, unit: '', val: (t) => t.landmarks }
  ];
  function bountyToday() {
    const k = dayKey(new Date());
    let h = 0; for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return BOUNTIES[h % BOUNTIES.length];
  }
  function todayStats() {
    const k = dayKey(new Date());
    const t = { km: 0, min: 0, won: 0, items: 0, landmarks: 0 };
    for (const h of db.history) if (dayKey(h.date) === k) { t.km += h.distanceM / 1000; t.min += h.movingS / 60; t.won += h.won || 0; t.items += h.items || 0; t.landmarks += h.landmarks || 0; }
    if (session && !session.done) { t.km += session.distanceM / 1000; t.min += session.movingS / 60; t.won += session.encounters.won; t.items += session.items.length; t.landmarks += session.landmarks.length; }
    return t;
  }
  function checkBounty() {
    const k = dayKey(new Date());
    if (db.bounties[k]) return;
    const b = bountyToday();
    if (b.val(todayStats()) >= b.goal) {
      db.bounties[k] = new Date().toISOString(); save();
      addXp(150, true); SFX.clear();
      toast('📜', 'Daily bounty complete!', `${b.text}. +150 XP`, 'gold');
      if (session) feed('📜', `Daily bounty complete: ${esc(b.text)} <span class="pill">+150 XP</span>`, 'good', true);
    }
  }
  function renderBounty() {
    const el = $('#bounty'); if (!el) return;
    const b = bountyToday(), v = b.val(todayStats()), done = !!db.bounties[dayKey(new Date())];
    const shown = b.unit === 'km' ? `${Math.min(v, b.goal).toFixed(1)} / ${b.goal} km` : b.unit === 'min' ? `${Math.floor(Math.min(v, b.goal))} / ${b.goal} min` : `${Math.min(v, b.goal)} / ${b.goal}`;
    const n = Object.keys(db.bounties).length;
    el.innerHTML = `<div class="bounty-icon">${done ? '✅' : b.icon}</div>
      <div class="bounty-main"><div class="bounty-label">Daily bounty · +150 XP</div><div class="bounty-text">${esc(b.text)}</div>
      <div class="minibar"><i style="width:${Math.min(100, (v / b.goal) * 100)}%"></i></div></div>
      <div class="bounty-side">${done ? '<b>Done!</b>' : shown}<span class="muted">${n} completed</span></div>`;
    el.classList.toggle('done', done);
  }

  // ================= Achievements =================
  const ACH = [
    { id: 'first-steps', icon: '👣', name: 'First Steps', desc: 'Finish your first walk.', test: (c) => c.walks >= 1 },
    { id: 'km-1', icon: '🥾', name: 'Warmed Up', desc: 'Walk 1 km in total.', test: (c) => c.km >= 1 },
    { id: 'km-10', icon: '🗺️', name: 'Explorer', desc: 'Walk 10 km in total.', test: (c) => c.km >= 10 },
    { id: 'km-42', icon: '🏅', name: 'Marathoner', desc: 'Walk 42.2 km in total.', test: (c) => c.km >= 42.195 },
    { id: 'km-100', icon: '💯', name: 'Centurion', desc: 'Walk 100 km in total.', test: (c) => c.km >= 100 },
    { id: 'km-500', icon: '🌍', name: 'World Walker', desc: 'Walk 500 km in total.', test: (c) => c.km >= 500 },
    { id: 'walk-3', icon: '🚶', name: 'Long Haul', desc: 'Walk 3 km in one go.', test: (c) => c.bestWalkKm >= 3 },
    { id: 'walk-5', icon: '🏃', name: 'Five Alive', desc: 'Walk 5 km in one go.', test: (c) => c.bestWalkKm >= 5 },
    { id: 'walk-10', icon: '🦿', name: 'Iron Legs', desc: 'Walk 10 km in one go.', test: (c) => c.bestWalkKm >= 10 },
    { id: 'time-30', icon: '⏱️', name: 'Half Hour Hero', desc: 'Walk 30 minutes in one go.', test: (c) => c.bestWalkMin >= 30 },
    { id: 'time-60', icon: '⌛', name: 'Hour of Power', desc: 'Walk 60 minutes in one go.', test: (c) => c.bestWalkMin >= 60 },
    { id: 'streak-3', icon: '🔥', name: 'On Fire', desc: 'Walk 3 days in a row.', test: (c) => c.bestStreak >= 3 },
    { id: 'streak-7', icon: '📅', name: 'Weekly Warrior', desc: 'Walk 7 days in a row.', test: (c) => c.bestStreak >= 7 },
    { id: 'streak-30', icon: '🗓️', name: 'Unstoppable', desc: 'Walk 30 days in a row.', test: (c) => c.bestStreak >= 30 },
    { id: 'clear-1', icon: '🏆', name: 'Quest Complete', desc: 'Finish any map.', test: (c) => c.clears >= 1 },
    { id: 'clear-all', icon: '👑', name: 'Completionist', desc: 'Finish every map.', test: (c) => c.mapsCleared >= MAPS.length },
    { id: 'loot-10', icon: '🎒', name: 'Hoarder', desc: 'Find 10 collectibles.', test: (c) => c.items >= 10 },
    { id: 'loot-all', icon: '🧳', name: 'Curator', desc: 'Find every collectible.', test: (c) => c.items >= totalCollectibles },
    { id: 'escape-1', icon: '💨', name: 'Close Call', desc: 'Escape your first encounter.', test: (c) => c.wins >= 1 },
    { id: 'escape-10', icon: '🛡️', name: 'Survivor', desc: 'Escape 10 encounters.', test: (c) => c.wins >= 10 },
    { id: 'night-owl', icon: '🦉', name: 'Night Owl', desc: 'Finish a walk after 22:00.', test: (c) => c.night },
    { id: 'early-bird', icon: '🐦', name: 'Early Bird', desc: 'Finish a walk before 07:00.', test: (c) => c.early },
    { id: 'brisk', icon: '⚡', name: 'Brisk Walker', desc: 'Average 5.5 km/h over at least 1 km.', test: (c) => c.brisk },
    { id: 'level-10', icon: '🌟', name: 'Seasoned', desc: 'Reach level 10.', test: (c) => c.level >= 10 },
    { id: 'level-20', icon: '💫', name: 'Living Legend', desc: 'Reach level 20.', test: (c) => c.level >= 20 },
    { id: 'clear-3', icon: '🎖️', name: 'Globetrotter', desc: 'Finish 3 different maps.', test: (c) => c.mapsCleared >= 3 },
    { id: 'clear-6', icon: '🗺️', name: 'Cartographer', desc: 'Finish 6 different maps.', test: (c) => c.mapsCleared >= 6 },
    { id: 'codex-20', icon: '📜', name: 'Sightseer', desc: 'Discover 20 landmarks.', test: (c) => c.codex >= 20 },
    { id: 'codex-all', icon: '📚', name: 'Loremaster', desc: 'Discover every landmark in every world.', test: (c) => c.codex >= totalLandmarks },
    { id: 'bounty-1', icon: '📌', name: 'Bounty Hunter', desc: 'Complete a daily bounty.', test: (c) => c.bounties >= 1 },
    { id: 'bounty-10', icon: '🎯', name: 'Contractor', desc: 'Complete 10 daily bounties.', test: (c) => c.bounties >= 10 },
    { id: 'km-21', icon: '🥈', name: 'Half Marathon', desc: 'Walk 21.1 km in total.', test: (c) => c.km >= 21.1 },
    { id: 'walk-15', icon: '🐉', name: 'Abyss Walker', desc: 'Walk 15 km in one go.', test: (c) => c.bestWalkKm >= 15 }
  ];
  function achContext() {
    const h = db.history;
    return {
      walks: h.length, km: totalKm(),
      bestWalkKm: Math.max(0, ...h.map((x) => x.distanceM / 1000)),
      bestWalkMin: Math.max(0, ...h.map((x) => x.movingS / 60)),
      bestStreak: bestStreak(),
      clears: Object.values(db.progress).reduce((a, p) => a + p.completions, 0),
      mapsCleared: MAPS.filter((m) => (db.progress[m.id] || {}).completions > 0).length,
      items: Object.keys(db.collection).length,
      wins: db.profile.encounterWins,
      night: h.some((x) => new Date(x.date).getHours() >= 22),
      early: h.some((x) => new Date(x.date).getHours() < 7),
      brisk: h.some((x) => x.distanceM >= 1000 && x.distanceM / 1000 / (x.movingS / 3600) >= 5.5),
      level: levelFor(db.profile.xp),
      codex: Object.keys(db.codex).length,
      bounties: Object.keys(db.bounties).length
    };
  }
  function checkAchievements() {
    const c = achContext(); const fresh = [];
    for (const a of ACH) if (!db.achievements[a.id] && a.test(c)) { db.achievements[a.id] = new Date().toISOString(); fresh.push(a); }
    if (fresh.length) save();
    return fresh;
  }

  // ================= Sound =================
  let actx = null;
  function beep(notes) {
    if (!db.profile.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      let t = actx.currentTime;
      for (const [f, d, type] of notes) {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type || 'square'; o.frequency.value = f;
        g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d); t += d * 0.9;
      }
    } catch (_) {}
  }
  const SFX = {
    landmark: () => beep([[523, 0.1], [659, 0.1], [784, 0.18]]),
    loot: () => beep([[988, 0.07], [1319, 0.15]]),
    danger: () => beep([[220, 0.18, 'sawtooth'], [196, 0.18, 'sawtooth'], [220, 0.25, 'sawtooth']]),
    win: () => beep([[523, 0.1], [784, 0.1], [1047, 0.25]]),
    lose: () => beep([[330, 0.15, 'triangle'], [262, 0.3, 'triangle']]),
    clear: () => beep([[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.12], [784, 0.12], [1047, 0.4]]),
    level: () => beep([[440, 0.08], [554, 0.08], [659, 0.08], [880, 0.3]])
  };

  // ================= Toasts =================
  function toast(icon, title, body, kind = '') {
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = `<div class="toast-icon">${icon}</div><div><div class="toast-title">${esc(title)}</div>${body ? `<div class="toast-body">${esc(body)}</div>` : ''}</div>`;
    el.addEventListener('click', () => { el.classList.add('out'); setTimeout(() => el.remove(), 400); });
    $('#toasts').appendChild(el);
    setTimeout(() => el.classList.add('out'), 5200);
    setTimeout(() => el.remove(), 5800);
  }

  // ================= Formatting =================
  const fmtKm = (m, d = 2) => (m / 1000).toFixed(d);
  const fmtTime = (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`; };
  const fmtPace = (kmh) => (kmh > 0.3 ? fmtTime(3600 / kmh) : '–:––');
  const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  // ================= Header / profile =================
  function renderHeader() {
    const xp = db.profile.xp, lvl = levelFor(xp);
    const a = xpForLevel(lvl), b = xpForLevel(lvl + 1);
    $('#lvl').textContent = lvl;
    $('#rank').textContent = rankFor(lvl);
    $('#xpbar').style.width = `${((xp - a) / (b - a)) * 100}%`;
    $('#xpline').style.width = `${((xp - a) / (b - a)) * 100}%`;
    $('#xptext').textContent = `${xp - a} / ${b - a} XP`;
    $('#streak').textContent = streak();
    $('#totalkm').textContent = totalKm().toFixed(1);
  }
  function addXp(n, why) {
    if (n <= 0) return;
    const before = levelFor(db.profile.xp);
    bump('xp', n);
    if (session) session.xp += n;
    const after = levelFor(db.profile.xp);
    if (after > before) { const r = rankFor(after); toast('🆙', `Level ${after}!`, r !== rankFor(before) ? `New rank: ${r}.` : `${xpForLevel(after + 1) - db.profile.xp} XP to the next level.`, 'gold'); SFX.level(); }
    save(); renderHeader();
    if (why) floatXp(n);
  }
  function floatXp(n) {
    const el = document.createElement('div'); el.className = 'xpfloat'; el.textContent = `+${n} XP`;
    const host = $('#mapwrap'); if (!host) return; host.appendChild(el); setTimeout(() => el.remove(), 1600);
  }

  // ================= Device panel =================
  const devLog = [];
  Dev.on('log', (line) => { devLog.push(line); if (devLog.length > 200) devLog.shift(); const el = $('#devlog'); if (el) { el.textContent = devLog.join('\n'); el.scrollTop = el.scrollHeight; } });
  Dev.on('status', () => renderDevice());
  function renderDevice() {
    const st = Dev.state;
    const av = Dev.bluetoothAvailability();
    $$('.devstatus').forEach((el) => {
      el.className = 'devstatus ' + (st.connected ? 'on' : 'off');
      el.innerHTML = st.connected ? `<span class="dot"></span>${esc(st.name)}${st.kind === 'fitshow' ? ' (beta)' : ''}` : '<span class="dot"></span>Not connected';
    });
    $('#btn-connect').disabled = !av.ok;
    $('#btn-connect-all').disabled = !av.ok;
    $('#bt-warning').hidden = av.ok;
    $('#bt-warning').textContent = av.ok ? '' : av.reason;
    $('#btn-disconnect').hidden = !st.connected;
    $$('.simonly').forEach((el) => (el.hidden = st.kind !== 'sim'));
    if (!st.connected) targetSpeed = null;
    renderSpeedCtl();
    updateStartButton();
  }

  // ================= Speed control =================
  let targetSpeed = null, sendTimer = null, sending = false;
  const maxAllowed = () => Math.min(db.profile.maxSpeed, Dev.state.range.max);
  const beltMoving = () => (live.speed || 0) > 0.2;
  const inWalk = () => !!(session && !session.done);
  // Speed control belongs to a quest: shown during a walk, or (to slow down / stop) whenever the
  // belt is moving. The belt is only started from inside a quest (Begin quest, or Start belt
  // while a walk is on and the belt is stopped).
  function speedCtlActive() { const st = Dev.state; return st.connected && st.canControl && (inWalk() || beltMoving()); }
  function renderSpeedCtl() {
    const st = Dev.state, on = speedCtlActive(), moving = beltMoving();
    $$('.speedctl').forEach((el) => {
      el.hidden = !on;
      if (!on) return;
      $('.spd-val', el).textContent = targetSpeed == null ? '–' : targetSpeed.toFixed(1);
      $('.spd-kind', el).innerHTML = `<span class="beltstate ${moving ? 'on' : ''}">${moving ? `Belt running · ${(live.speed || 0).toFixed(1)} km/h` : 'Belt stopped'}</span>${st.controlKind === 'fitshow' ? ' · experimental' : st.controlKind === 'sim' ? ' · simulator' : ''}`;
      const canStartHere = st.canStart && inWalk() && !moving;
      $('.spd-start', el).hidden = !canStartHere;
      const max = maxAllowed();
      const presets = [2, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8].filter((v) => v <= max && v >= st.range.min);
      const key = presets.join(',') + '|' + targetSpeed;
      if (el.dataset.key !== key) {
        el.dataset.key = key;
        $('.spd-presets', el).innerHTML = presets.map((v) => `<button class="btn small ${targetSpeed === v ? 'active' : ''}" data-spdset="${v}">${v.toFixed(1)}</button>`).join('');
      }
      $('.spd-note', el).textContent = `Capped at ${max.toFixed(1)} km/h (change in Settings). Keyboard: Up/Down arrows change speed, Esc stops the belt.`;
    });
    const wt = $('#wb-target'); if (wt) wt.textContent = targetSpeed == null ? '–' : targetSpeed.toFixed(1);
    const mb = $('#enc-match');
    if (mb) mb.hidden = !on || !(session && session.encounter) || session.encounter.target > maxAllowed();
  }
  function queueSpeed(v) {
    const max = maxAllowed();
    targetSpeed = Math.round(Math.max(Dev.state.range.min, Math.min(max, v)) * 10) / 10;
    renderSpeedCtl();
    clearTimeout(sendTimer);
    sendTimer = setTimeout(sendSpeed, 350); // let quick taps add up before sending
  }
  async function sendSpeed() {
    if (sending) { sendTimer = setTimeout(sendSpeed, 200); return; }
    sending = true;
    const v = targetSpeed;
    try { if (v != null) await Dev.setSpeed(v, maxAllowed()); }
    catch (e) { toast('⚠️', 'Speed not changed', e.message || String(e), 'bad'); }
    finally { sending = false; sendTimer = null; }
  }
  function nudgeSpeed(delta) {
    const base = targetSpeed != null ? targetSpeed : Math.max(live.speed || 0, Dev.state.range.min);
    queueSpeed(base + delta);
  }
  async function belt(action) {
    try {
      if (action === 'stop') { clearTimeout(sendTimer); sendTimer = null; targetSpeed = null; await Dev.stopBelt(); toast('🛑', 'Stopping belt', ''); }
      else { await Dev.startBelt(); toast('▶️', 'Starting belt', 'It will start slowly. Set your speed once it moves.'); }
    } catch (e) { toast('⚠️', action === 'stop' ? 'Could not stop the belt' : 'Could not start the belt', (e.message || String(e)) + (action === 'stop' ? ' Use the treadmill\'s own stop button.' : ''), 'bad'); }
    renderSpeedCtl();
  }
  Dev.on('control', (c) => {
    if (c.type === 'target' && !sendTimer && !sending) targetSpeed = c.speed || null;
    if (c.type === 'stopped') targetSpeed = null;
    renderSpeedCtl();
  });
  async function connect(showAll) {
    try {
      await Dev.connectTreadmill({ showAll });
      toast('📡', 'Treadmill connected', 'Readings will appear as soon as the belt moves.');
    } catch (e) {
      if (e && e.name === 'NotFoundError') return; // user cancelled the chooser
      toast('⚠️', 'Could not connect', e.message || String(e), 'bad');
    }
  }

  // ================= Live readings =================
  let live = { speed: 0, distanceM: null, elapsed: null, kcal: null, steps: null, hr: null, warp: 1 };
  let lastTickAt = 0;
  Dev.on('data', (s) => {
    const now = performance.now();
    const dt = lastTickAt ? Math.min(5, (now - lastTickAt) / 1000) * (s.warp || 1) : 0;
    lastTickAt = now;
    const prev = live;
    live = { ...live, ...Object.fromEntries(Object.entries(s).filter(([, v]) => v !== null && v !== undefined)) };
    if (s.speed === null || s.speed === undefined) live.speed = prev.speed;
    if (session && !session.done) tick(s, dt);
    renderHud();
    renderSpeedCtl();
  });

  // ================= Session (a walk) =================
  let session = null;
  let currentMap = null;

  function openMap(mapId) {
    currentMap = MAPS.find((m) => m.id === mapId);
    if (!currentMap || !isUnlocked(currentMap)) return;
    show('journey');
    buildMapSvg();
    renderJourneyIdle();
  }

  function startWalk() {
    if (!Dev.state.connected) { toast('📡', 'Connect first', 'Connect your treadmill or start the simulator.'); return; }
    const m = currentMap, p = prog(m.id);
    if (p.distanceM >= m.km * 1000) { p.distanceM = 0; p.landmarks = []; p.runCollect = []; }
    session = {
      mapId: m.id, startedAt: new Date().toISOString(), startProgressM: p.distanceM,
      distanceM: 0, movingS: 0, xp: 0, lastDist: null, kmAwarded: 0,
      landmarks: [], items: [], encounters: { won: 0, lost: 0 }, encounter: null,
      nextEncounterM: 300 + Math.random() * 300, kcalStart: null, steps0: null, done: false, completed: false
    };
    if (!p.landmarks.includes(0)) { p.landmarks.push(0); }
    touch(p); save();
    requestWakeLock();
    beep([[392, 0.1], [523, 0.15]]);
    if (!db.codex[`${m.id}:0`]) db.codex[`${m.id}:0`] = new Date().toISOString();
    if (session.startProgressM === 0) {
      feed(m.landmarks[0].icon, `<b>${esc(m.landmarks[0].name)}</b>: ${esc(m.landmarks[0].lore)}`, 'lore', true);
      if (m.intro) feed('📖', esc(m.intro), 'lore', true);
    } else feed('🔖', `You pick up the trail at ${fmtKm(session.startProgressM)} km.`, 'lore');
    document.body.classList.add('walking');
    if (db.profile.startOnBegin && Dev.state.connected && Dev.state.canControl && Dev.state.canStart && !beltMoving()) belt('start');
    else if (Dev.state.connected && !Dev.state.canStart && !beltMoving()) toast('▶️', 'Start the belt', 'Use the treadmill remote to start walking.');
    renderJourneyActive();
  }

  function tick(s, dt) {
    const m = MAPS.find((x) => x.id === session.mapId), p = prog(m.id);
    const speed = live.speed || 0;
    // distance delta: prefer treadmill odometer, otherwise integrate speed
    let d = 0;
    if (s.distanceM !== null && s.distanceM !== undefined) {
      if (session.lastDist === null) d = 0;
      else if (s.distanceM < session.lastDist) d = s.distanceM < 50 ? s.distanceM : 0; // treadmill reset
      else d = s.distanceM - session.lastDist;
      const plausible = (Math.max(speed, 8) / 3.6) * Math.max(dt, 1) + 30;
      if (d > plausible) d = 0;
      session.lastDist = s.distanceM;
    } else {
      d = (speed / 3.6) * dt;
    }
    if (speed > 0.2) session.movingS += dt;
    if (s.kcal != null) { if (session.kcalStart === null) session.kcalStart = s.kcal; session.kcalDev = s.kcal - session.kcalStart; }
    if (s.steps != null) { if (session.steps0 === null) session.steps0 = s.steps; session.steps = s.steps - session.steps0; }
    if (d <= 0) { encounterTick(speed, dt); return; }

    const len = m.km * 1000;
    const before = session.startProgressM + session.distanceM;
    session.distanceM += d;
    const after = Math.min(len, session.startProgressM + session.distanceM);
    p.distanceM = after; touch(p);

    // XP for every 100 m walked (10 XP)
    const hundreds = Math.floor(session.distanceM / 100);
    if (hundreds > session.kmAwarded) { addXp((hundreds - session.kmAwarded) * 10); session.kmAwarded = hundreds; }

    // landmarks
    m.landmarks.forEach((lm, i) => {
      const at = lm.at * len;
      if (at > before && at <= after && !p.landmarks.includes(i)) {
        p.landmarks.push(i); session.landmarks.push(i);
        if (!db.codex[`${m.id}:${i}`]) db.codex[`${m.id}:${i}`] = new Date().toISOString();
        if (i !== m.landmarks.length - 1) {
          toast(lm.icon, lm.name, lm.lore, 'lore'); SFX.landmark(); addXp(25, true);
          feed(lm.icon, `<b>${esc(lm.name)}</b>: ${esc(lm.lore)}`, 'lore', true);
        }
      }
    });
    // collectibles
    m.collectibles.forEach((c, i) => {
      const at = c.at * len;
      if (at > before && at <= after && !p.runCollect.includes(i)) {
        p.runCollect.push(i);
        const key = `${m.id}:${i}`;
        const isNew = !db.collection[key];
        if (isNew) db.collection[key] = new Date().toISOString();
        session.items.push({ i, isNew });
        toast(c.icon, isNew ? `New item: ${c.name}` : `Found again: ${c.name}`, c.lore, 'gold');
        SFX.loot(); addXp(isNew ? 40 : 10, true);
        feed(c.icon, `Picked up <b>${esc(c.name)}</b>${isNew ? ' <span class="pill">NEW</span>' : ''}`, 'loot', true);
      }
    });
    // sights
    sightsOf(m).forEach((sg) => {
      const at = sg.at * len;
      if (at > before && at <= after) { feed(sg.icon, esc(sg.text), 'sight', true); flashSight(sg); }
    });
    save();

    encounterTick(speed, dt);
    checkBounty();

    if (after >= len && !session.completed) completeMap(m);
  }

  // ---------- Encounters (speed challenges) ----------
  function encounterTick(speed, dt) {
    const m = MAPS.find((x) => x.id === session.mapId);
    if (!db.profile.encountersOn || session.completed) return;
    const e = session.encounter;
    if (!e) {
      if (session.distanceM >= session.nextEncounterM && session.startProgressM + session.distanceM < m.km * 1000 - 150) {
        const avg = session.movingS > 30 ? (session.distanceM / 1000) / (session.movingS / 3600) : speed;
        const base = Math.max(speed, avg);
        const target = Math.min(db.profile.maxSpeed, Math.max(2.5, Math.ceil((base + 0.4) * 2) / 2));
        const pick = m.encounters[Math.floor(Math.random() * m.encounters.length)];
        session.encounter = { ...pick, target, need: 60, held: 0, left: 120 };
        bump('total'); save();
        SFX.danger();
        feed(pick.icon, `${esc(pick.text)} Hold <b>${target.toFixed(1)} km/h</b> for 60 s.`, 'danger', true);
      }
      return;
    }
    if (speed >= e.target - 0.05) e.held += dt;
    e.left -= dt;
    if (e.held >= e.need) {
      session.encounter = null; session.encounters.won++; bump('wins');
      session.nextEncounterM = session.distanceM + 400 + Math.random() * 400;
      SFX.win(); addXp(60, true); toast('💨', 'You escaped!', '+60 XP for outpacing the danger.', 'good');
      feed('💨', 'You escaped. Heart still pounding.', 'good');
    } else if (e.left <= 0) {
      session.encounter = null; session.encounters.lost++;
      session.nextEncounterM = session.distanceM + 400 + Math.random() * 400;
      SFX.lose(); addXp(5); toast('😵', 'It caught up with you…', 'You shake it off and keep going. Next time!', 'bad');
      feed('😵', 'It caught up. You shook it off, bruised but walking.', 'danger');
    }
    save();
  }

  function completeMap(m) {
    const p = prog(m.id);
    session.completed = true; p.completions++; touch(p);
    const bonus = Math.round(100 * m.km);
    const last = m.landmarks[m.landmarks.length - 1];
    SFX.clear(); addXp(bonus, true);
    toast('🏆', `${m.name} cleared!`, `${last.lore} +${bonus} XP`, 'gold');
    feed('🏆', `<b>${esc(last.name)}</b>: ${esc(last.lore)} <span class="pill">CLEARED</span>`, 'good', true);
    session.encounter = null;
    save();
    renderJourneyActive();
  }

  function endWalk() {
    if (!session) return;
    if (db.profile.stopOnEnd && Dev.state.connected && Dev.state.canControl && (live.speed || 0) > 0.2) belt('stop');
    const m = MAPS.find((x) => x.id === session.mapId);
    session.done = true;
    const rec = {
      id: Date.now().toString(36) + DEVICE.slice(0, 3), date: new Date().toISOString(), startedAt: session.startedAt, mapId: m.id,
      distanceM: Math.round(session.distanceM), movingS: Math.round(session.movingS), xp: session.xp,
      kcal: Math.round(session.kcalDev != null && session.kcalDev > 0 ? session.kcalDev : estKcal(session.distanceM)),
      steps: session.steps || null, items: session.items.length, landmarks: session.landmarks.length,
      won: session.encounters.won, lost: session.encounters.lost, completed: session.completed,
      source: Dev.state.kind
    };
    const s = session;
    if (rec.distanceM >= 50) db.history.unshift(rec);
    save();
    session.done = true; checkBounty();
    const fresh = rec.distanceM >= 50 ? checkAchievements() : [];
    fresh.forEach((a) => addXp(50));
    session = null;
    syncNow();
    document.body.classList.remove('walking');
    $('#walkbar').hidden = true;
    releaseWakeLock();
    showSummary(rec, s, m, fresh);
    renderHeader();
    renderJourneyIdle();
  }
  const estKcal = (m) => 0.53 * db.profile.weightKg * (m / 1000);

  // ================= Wake lock =================
  let wakeLock = null;
  async function requestWakeLock() { try { wakeLock = await navigator.wakeLock.request('screen'); } catch (_) {} }
  function releaseWakeLock() { try { wakeLock && wakeLock.release(); } catch (_) {} wakeLock = null; }
  document.addEventListener('visibilitychange', () => { if (session && document.visibilityState === 'visible') requestWakeLock(); });

  // ================= Map SVG =================
  let pathEl, pathLen = 1, shownFrac = 0;
  function buildMapSvg() {
    const m = currentMap, t = m.theme;
    const svg = $('#mapsvg');
    svg.innerHTML = `${scenery(m, 'journey')}
      <path d="${m.route}" fill="none" stroke="${t.pathEdge}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>
      <path id="route" d="${m.route}" fill="none" stroke="${t.path}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 14" opacity=".9"/>
      <path id="routeDone" d="${m.route}" fill="none" stroke="${t.accent}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
      <g id="markers"></g>
      ${t.fog ? `<defs><radialGradient id="fogG" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="190"><stop offset=".3" stop-color="${t.fogColor || (m.id === 'ember-wastes' ? '#1a0d0a' : '#c9ccc5')}" stop-opacity="0"/><stop offset="1" stop-color="${t.fogColor || (m.id === 'ember-wastes' ? '#1a0d0a' : '#c9ccc5')}" stop-opacity="${t.fogOpacity || (m.id === 'ember-wastes' ? 0.6 : 0.68)}"/></radialGradient></defs><rect class="fog" width="1000" height="600" fill="url(#fogG)"/>` : ''}
      <g id="avatar"><circle r="22" fill="${t.accent}" opacity=".25" class="pulse"/><circle r="13" fill="#fff" stroke="${t.accent}" stroke-width="4"/><text text-anchor="middle" dy="5" font-size="14">🚶</text></g>`;
    pathEl = $('#route');
    pathLen = pathEl.getTotalLength();
    $('#routeDone').setAttribute('stroke-dasharray', `0 ${pathLen}`);
    shownFrac = Math.min(1, prog(m.id).distanceM / (m.km * 1000));
    renderMarkers();
    placeAvatar(shownFrac);
    $('#journey-title').textContent = m.name;
    $('#journey-genre').textContent = `${m.genre} · ${m.km} km`;
    document.documentElement.style.setProperty('--map-accent', t.accent);
    $('#feed').innerHTML = '';
  }
  function renderMarkers() {
    const m = currentMap, p = prog(m.id), g = $('#markers'); if (!g) return;
    let s = '';
    m.collectibles.forEach((c, i) => {
      if (p.runCollect.includes(i)) return;
      const pt = pathEl.getPointAtLength(c.at * pathLen);
      s += `<g transform="translate(${pt.x},${pt.y})" class="sparkle"><text text-anchor="middle" dy="6" font-size="18" fill="#fff6a8">✦</text></g>`;
    });
    m.landmarks.forEach((lm, i) => {
      const pt = pathEl.getPointAtLength(lm.at * pathLen);
      const seen = p.landmarks.includes(i);
      const last = i === m.landmarks.length - 1;
      s += `<g transform="translate(${pt.x},${pt.y})" class="lm ${seen ? 'seen' : ''}" data-lm="${i}">
        <circle r="${last ? 24 : 20}" fill="${seen ? '#fff' : 'rgba(0,0,0,.55)'}" stroke="${m.theme.accent}" stroke-width="3"/>
        <text text-anchor="middle" dy="7" font-size="${last ? 22 : 19}" ${seen ? '' : 'opacity=".55"'}>${lm.icon}</text>
        ${seen ? `<text class="lmlabel" text-anchor="middle" y="${pt.y < 70 ? 44 : -30}" font-size="15">${esc(lm.name)}</text>` : ''}
      </g>`;
    });
    g.innerHTML = s;
  }
  function placeAvatar(frac) {
    if (!pathEl) return;
    const pt = pathEl.getPointAtLength(frac * pathLen);
    $('#avatar').setAttribute('transform', `translate(${pt.x},${pt.y})`);
    $('#routeDone').setAttribute('stroke-dasharray', `${frac * pathLen} ${pathLen}`);
    const fg = $('#fogG'); if (fg) { fg.setAttribute('cx', pt.x); fg.setAttribute('cy', pt.y); }
  }
  let markersDirty = 0;
  function frame() {
    if (currentMap && pathEl && $('#screen-journey').classList.contains('active')) {
      const target = Math.min(1, prog(currentMap.id).distanceM / (currentMap.km * 1000));
      const diff = target - shownFrac;
      shownFrac = Math.abs(diff) < 0.0002 ? target : shownFrac + diff * 0.08;
      placeAvatar(shownFrac);
      if (++markersDirty % 20 === 0) renderMarkers();
    }
    requestAnimationFrame(frame);
  }

  // ================= Journey UI =================
  function feed(icon, html, kind = '', isHtml = false) {
    const el = document.createElement('div');
    el.className = 'feeditem ' + kind;
    el.innerHTML = `<span class="fi">${icon}</span><span>${isHtml ? html : html}</span>`;
    const f = $('#feed'); f.prepend(el);
    while (f.children.length > 40) f.lastChild.remove();
  }
  function updateStartButton() {
    const b = $('#btn-start'); if (!b) return;
    b.disabled = !Dev.state.connected;
    $('#start-hint').textContent = Dev.state.connected ? '' : 'Connect your treadmill (or start the simulator) to begin.';
  }
  function renderJourneyIdle() {
    if (!currentMap) return;
    const m = currentMap, p = prog(m.id), len = m.km * 1000;
    const cleared = p.distanceM >= len;
    $('#idle-panel').hidden = false; $('#active-panel').hidden = true;
    $('#btn-start').textContent = cleared ? '⟲ Replay quest' : p.distanceM > 0 ? `▶ Continue (${fmtKm(p.distanceM)} / ${m.km} km)` : '▶ Begin quest';
    $('#btn-restart').hidden = !(p.distanceM > 0 && !cleared);
    $('#idle-tagline').textContent = m.tagline;
    $('#idle-intro').textContent = m.intro || '';
    $('#idle-meta').innerHTML = `${m.landmarks.length} landmarks · ${m.collectibles.length} collectibles · ~${Math.round((m.km / 4) * 60)} min at 4 km/h${p.completions ? ` · cleared ${p.completions}×` : ''}`;
    updateStartButton();
    renderProgress();
  }
  function renderJourneyActive() {
    $('#idle-panel').hidden = true; $('#active-panel').hidden = false;
    renderHud();
  }
  function renderProgress() {
    if (!currentMap) return;
    const m = currentMap, p = prog(m.id), len = m.km * 1000;
    const frac = Math.min(1, p.distanceM / len);
    $('#progfill').style.width = `${frac * 100}%`;
    $('#progtext').textContent = `${fmtKm(p.distanceM)} / ${m.km.toFixed(1)} km`;
    const next = m.landmarks.find((lm) => lm.at * len > p.distanceM + 0.5);
    $('#nextlm').innerHTML = next ? `Next: ${next.icon} <b>${next === m.landmarks[m.landmarks.length - 1] ? esc(next.name) : '???'}</b> in ${Math.max(0, Math.round(next.at * len - p.distanceM))} m` : '🏆 Quest complete';
    renderNowPassing(m, p, len);
    renderRouteList(m, p, len);
    $('#progticks').innerHTML = m.landmarks.map((lm, i) => `<span style="left:${lm.at * 100}%" class="${p.landmarks.includes(i) ? 'hit' : ''}"></span>`).join('');
  }
  function renderHud() {
    $('#hud-speed').textContent = (live.speed || 0).toFixed(1);
    $('#home-speed').textContent = (live.speed || 0).toFixed(1);
    if (!currentMap) return;
    if (session) {
      $('#hud-dist').textContent = fmtKm(session.distanceM);
      $('#hud-time').textContent = fmtTime(session.movingS);
      const avg = session.movingS > 5 ? (session.distanceM / 1000) / (session.movingS / 3600) : 0;
      $('#hud-pace').textContent = fmtPace(live.speed);
      $('#hud-avg').textContent = avg.toFixed(1);
      $('#hud-kcal').textContent = Math.round(session.kcalDev > 0 ? session.kcalDev : estKcal(session.distanceM));
      $('#hud-steps').textContent = session.steps != null ? session.steps : '–';
      $('#hud-xp').textContent = session.xp;
      const wb = $('#walkbar');
      wb.hidden = false;
      wb.classList.toggle('noctl', !(Dev.state.connected && Dev.state.canControl));
      $('#wb-speed').textContent = (live.speed || 0).toFixed(1);
      $('#wb-dist').textContent = fmtKm(session.distanceM);
      $('#wb-time').textContent = fmtTime(session.movingS);
      const e = session.encounter, box = $('#encounter');
      if (e) {
        box.hidden = false;
        const ok = (live.speed || 0) >= e.target - 0.05;
        box.className = 'encounter ' + (ok ? 'ok' : 'warn');
        $('#enc-icon').textContent = e.icon;
        $('#enc-text').textContent = e.text;
        $('#enc-target').textContent = `${ok ? 'Holding' : 'Speed up to'} ${e.target.toFixed(1)} km/h · ${Math.ceil(e.need - e.held)} s to escape · ${Math.ceil(e.left)} s left`;
        $('#enc-bar').style.width = `${(e.held / e.need) * 100}%`;
      } else box.hidden = true;
      renderSpeedCtl();
      $('#paused').hidden = !(live.speed < 0.2 && !session.completed);
      $('#btn-end').textContent = session.completed ? '🏁 Finish & save' : '■ End walk';
    }
    renderProgress();
  }

  // ---------- what you're passing ----------
  function renderNowPassing(m, p, len) {
    const d = p.distanceM;
    let li = 0; m.landmarks.forEach((lm, i) => { if (lm.at * len <= d + 0.5) li = i; });
    const last = m.landmarks[li], next = m.landmarks[li + 1];
    const sights = sightsOf(m).filter((sg) => sg.at * len <= d + 0.5);
    const sg = sights[sights.length - 1];
    const key = `${m.id}|${li}|${sights.length}`;
    const el = $('#nowpassing'); if (!el || el.dataset.key === key) return;
    el.dataset.key = key;
    const nextName = next ? (p.landmarks.includes(li + 1) || li + 1 === m.landmarks.length - 1 ? next.name : '???') : null;
    el.innerHTML = `<div class="np-area"><span class="np-label">${d >= len ? 'Arrived at' : d > 0 ? 'Leaving' : 'Starting at'}</span> ${last.icon} <b>${esc(last.name)}</b>${next && d < len ? ` <span class="muted">→ heading for ${next.icon} ${esc(nextName)}</span>` : ''}</div>
      <div class="np-lore">${esc(last.lore)}</div>
      ${sg && d < len ? `<div class="np-sight"><span>${sg.icon}</span><span>${esc(sg.text)}</span></div>` : ''}`;
  }
  function flashSight() { const el = $('#nowpassing'); if (el) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } }
  function renderRouteList(m, p, len) {
    const el = $('#routelist'); if (!el) return;
    const nextIdx = m.landmarks.findIndex((lm) => lm.at * len > p.distanceM + 0.5);
    const key = `${m.id}|${p.landmarks.join(',')}|${nextIdx}|${Math.floor(p.distanceM / 50)}`;
    if (el.dataset.key === key) return;
    el.dataset.key = key;
    el.innerHTML = m.landmarks.map((lm, i) => {
      const seen = p.landmarks.includes(i) || db.codex[`${m.id}:${i}`];
      const reached = p.landmarks.includes(i);
      const isLast = i === m.landmarks.length - 1;
      const dist = lm.at * len - p.distanceM;
      const status = reached ? '✓' : i === nextIdx ? `${Math.round(dist)} m` : `${(lm.at * m.km).toFixed(1)} km`;
      return `<button class="rl ${reached ? 'reached' : ''} ${i === nextIdx ? 'next' : ''}" data-lore="${i}" ${seen ? '' : 'data-locked'}>
        <span class="rl-icon">${seen || isLast ? lm.icon : '❔'}</span>
        <span class="rl-name">${seen || isLast ? esc(lm.name) : 'Undiscovered'}</span>
        <span class="rl-status">${status}</span></button>`;
    }).join('');
  }
  function showLore(m, i) {
    const lm = m.landmarks[i];
    if (!db.codex[`${m.id}:${i}`]) { toast('❔', 'Not discovered yet', 'Walk there to find out what it is.'); return; }
    $('#modal-body').innerHTML = `<div class="sum-head"><div class="sum-icon">${lm.icon}</div><div><h2>${esc(lm.name)}</h2><div class="muted">${esc(m.name)} · ${(lm.at * m.km).toFixed(1)} km</div></div></div>
      <p class="lore-big">${esc(lm.lore)}</p>
      <p class="muted small">Discovered ${fmtDate(db.codex[`${m.id}:${i}`])}</p>
      <div class="row end"><button class="btn primary" data-close>Close</button></div>`;
    $('#modal').hidden = false;
  }

  // ================= Summary modal =================
  function showSummary(rec, s, m, fresh) {
    const avg = rec.movingS > 0 ? (rec.distanceM / 1000) / (rec.movingS / 3600) : 0;
    $('#modal-body').innerHTML = `
      <div class="sum-head"><div class="sum-icon">${rec.completed ? '🏆' : '🚩'}</div>
        <div><h2>${rec.completed ? 'Quest complete!' : 'Walk saved'}</h2><div class="muted">${esc(m.name)}</div></div></div>
      ${rec.distanceM < 50 ? '<p class="muted">That walk was under 50 m, so it was not added to your journal.</p>' : ''}
      <div class="sum-grid">
        <div><b>${fmtKm(rec.distanceM)}</b><span>km</span></div>
        <div><b>${fmtTime(rec.movingS)}</b><span>time</span></div>
        <div><b>${avg.toFixed(1)}</b><span>avg km/h</span></div>
        <div><b>${rec.kcal}</b><span>kcal</span></div>
        <div><b>+${rec.xp + fresh.length * 50}</b><span>XP</span></div>
        <div><b>${rec.won}/${rec.won + rec.lost}</b><span>escapes</span></div>
      </div>
      ${s.items.length ? `<h3>Loot</h3><div class="chips">${s.items.map(({ i, isNew }) => `<span class="chip">${m.collectibles[i].icon} ${esc(m.collectibles[i].name)}${isNew ? ' <em>new</em>' : ''}</span>`).join('')}</div>` : ''}
      ${fresh.length ? `<h3>Achievements unlocked</h3><div class="chips">${fresh.map((a) => `<span class="chip gold">${a.icon} ${esc(a.name)}</span>`).join('')}</div>` : ''}
      ${!rec.completed ? `<p class="muted">Progress on this map is saved: ${fmtKm(prog(m.id).distanceM)} of ${m.km} km. Pick up where you left off next time.</p>` : ''}
      <div class="row end"><button class="btn primary" data-close>Nice!</button></div>`;
    $('#modal').hidden = false;
    fresh.forEach((a, k) => setTimeout(() => toast(a.icon, `Achievement: ${a.name}`, a.desc, 'gold'), 400 + k * 600));
  }

  // ================= Home: maps =================
  let mapFilter = 'all';
  const FILTERS = { all: () => true, short: (m) => m.km <= 3, medium: (m) => m.km > 3 && m.km <= 7, long: (m) => m.km > 7 };
  function renderMaps() {
    const tk = totalKm();
    renderBounty();
    $$('[data-filter]').forEach((b) => b.classList.toggle('active', b.dataset.filter === mapFilter));
    const list = MAPS.slice().sort((a, b) => a.unlockKm - b.unlockKm || a.km - b.km).filter(FILTERS[mapFilter]);
    $('#maps').innerHTML = list.map((m) => {
      const p = db.progress[m.id] || { distanceM: 0, completions: 0 };
      const unlocked = isUnlocked(m);
      const frac = Math.min(1, p.distanceM / (m.km * 1000));
      const found = m.collectibles.filter((_, i) => db.collection[`${m.id}:${i}`]).length;
      return `<button class="mapcard ${unlocked ? '' : 'locked'}" data-map="${m.id}" ${unlocked ? '' : 'disabled'} style="--accent:${m.theme.accent}">
        <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${scenery(m, 'card')}
          <path d="${m.route}" fill="none" stroke="${m.theme.pathEdge}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="${m.route}" fill="none" stroke="${m.theme.path}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="mapcard-km">${m.km} km</div>
        ${p.completions ? `<div class="mapcard-clear">🏆 ×${p.completions}</div>` : ''}
        <div class="mapcard-body">
          <div class="mapcard-genre">${esc(m.genre)}</div>
          <div class="mapcard-name">${esc(m.name)}</div>
          <div class="mapcard-tag">${esc(m.tagline)}</div>
          <div class="mapcard-foot"><div class="minibar"><i style="width:${frac * 100}%"></i></div><span>${found}/${m.collectibles.length} ✦</span></div>
        </div>
        ${unlocked ? '' : `<div class="lock"><div>🔒</div><div>Walk ${m.unlockKm} km in total to unlock</div><div class="muted">${Math.max(0, m.unlockKm - tk).toFixed(1)} km to go</div></div>`}
      </button>`;
    }).join('');
  }

  // ================= Trophies, collection, journal =================
  function renderTrophies() {
    const c = achContext();
    const got = ACH.filter((a) => db.achievements[a.id]).length;
    $('#ach-count').textContent = `${got} / ${ACH.length}`;
    $('#achievements').innerHTML = ACH.map((a) => {
      const d = db.achievements[a.id];
      return `<div class="ach ${d ? 'got' : ''}"><div class="ach-icon">${d ? a.icon : '🔒'}</div><div><div class="ach-name">${esc(a.name)}</div><div class="ach-desc">${esc(a.desc)}</div>${d ? `<div class="ach-date">${fmtDate(d)}</div>` : ''}</div></div>`;
    }).join('');
    $('#records').innerHTML = `
      <div><b>${c.km.toFixed(1)}</b><span>total km</span></div>
      <div><b>${c.walks}</b><span>walks</span></div>
      <div><b>${c.bestWalkKm.toFixed(2)}</b><span>longest walk km</span></div>
      <div><b>${fmtTime(c.bestWalkMin * 60)}</b><span>longest walk</span></div>
      <div><b>${streak()}</b><span>current streak</span></div>
      <div><b>${c.bestStreak}</b><span>best streak</span></div>
      <div><b>${c.clears}</b><span>quests cleared</span></div>
      <div><b>${db.profile.encounterWins}</b><span>escapes</span></div>`;
  }
  function renderCollection() {
    const found = Object.keys(db.collection).length;
    $('#col-count').textContent = `${found} / ${totalCollectibles}`;
    $('#collection').innerHTML = MAPS.map((m) => `<div class="colmap"><h3>${esc(m.name)}</h3><div class="colgrid">${m.collectibles.map((c, i) => {
      const d = db.collection[`${m.id}:${i}`];
      return `<div class="colitem ${d ? 'got' : ''}" title="${d ? esc(c.lore) : 'Not found yet'}"><div class="ci">${d ? c.icon : '❔'}</div><div class="cn">${d ? esc(c.name) : '???'}</div>${d ? `<div class="cl">${esc(c.lore)}</div>` : ''}</div>`;
    }).join('')}</div></div>`).join('');
  }
  function renderCodex() {
    const n = Object.keys(db.codex).length;
    $('#codex-count').textContent = `${n} / ${totalLandmarks}`;
    const list = MAPS.slice().sort((a, b) => a.unlockKm - b.unlockKm || a.km - b.km);
    $('#codex').innerHTML = list.map((m) => {
      const found = m.landmarks.filter((_, i) => db.codex[`${m.id}:${i}`]).length;
      return `<details class="codexmap" style="--accent:${m.theme.accent}" ${found ? 'open' : ''}>
        <summary><b>${esc(m.name)}</b> <span class="muted">${esc(m.genre)} · ${found}/${m.landmarks.length} discovered</span></summary>
        ${found && m.intro ? `<p class="codex-intro">${esc(m.intro)}</p>` : ''}
        <div class="codexlist">${m.landmarks.map((lm, i) => {
          const d = db.codex[`${m.id}:${i}`];
          return `<div class="codexitem ${d ? 'got' : ''}"><div class="ci">${d ? lm.icon : '❔'}</div><div><div class="cn">${d ? esc(lm.name) : '???'} <span class="muted small">${(lm.at * m.km).toFixed(1)} km</span></div><div class="cl">${d ? esc(lm.lore) : 'Walk this route to discover it.'}</div></div></div>`;
        }).join('')}</div></details>`;
    }).join('');
  }
  function renderJournal() {
    // last 7 weeks heatmap
    const byDay = {};
    db.history.forEach((h) => { const k = dayKey(h.date); byDay[k] = (byDay[k] || 0) + h.distanceM; });
    const cells = []; const d = new Date(); d.setDate(d.getDate() - 48);
    for (let i = 0; i < 49; i++) {
      const k = dayKey(d), km = (byDay[k] || 0) / 1000;
      const lvl = km === 0 ? 0 : km < 1 ? 1 : km < 3 ? 2 : km < 5 ? 3 : 4;
      cells.push(`<i class="h${lvl}" title="${k}: ${km.toFixed(2)} km"></i>`);
      d.setDate(d.getDate() + 1);
    }
    $('#heatmap').innerHTML = cells.join('');
    // weekly total
    const weekAgo = Date.now() - 7 * 864e5;
    const wk = db.history.filter((h) => new Date(h.date).getTime() >= weekAgo);
    $('#week').innerHTML = `This week: <b>${(wk.reduce((a, h) => a + h.distanceM, 0) / 1000).toFixed(1)} km</b> in <b>${wk.length}</b> walks · <b>${fmtTime(wk.reduce((a, h) => a + h.movingS, 0))}</b> moving`;
    $('#history').innerHTML = db.history.length ? db.history.map((h) => {
      const m = MAPS.find((x) => x.id === h.mapId) || { name: h.mapId, theme: { accent: '#888' } };
      const avg = h.movingS ? (h.distanceM / 1000) / (h.movingS / 3600) : 0;
      return `<div class="hist" style="--accent:${m.theme.accent}"><div class="hist-date">${fmtDate(h.date)}<br><span class="muted">${new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
        <div class="hist-main"><b>${esc(m.name)}</b>${h.completed ? ' 🏆' : ''}<div class="muted">${fmtKm(h.distanceM)} km · ${fmtTime(h.movingS)} · ${avg.toFixed(1)} km/h · ${h.kcal} kcal${h.steps ? ` · ${h.steps} steps` : ''}</div></div>
        <div class="hist-xp">+${h.xp} XP</div></div>`;
    }).join('') : '<p class="muted">No walks yet. Pick a quest and start walking!</p>';
  }
  function renderSettings() {
    $('#set-weight').value = db.profile.weightKg;
    $('#set-max').value = db.profile.maxSpeed;
    $('#set-sound').checked = db.profile.sound;
    $('#set-enc').checked = db.profile.encountersOn;
    $('#set-stopend').checked = db.profile.stopOnEnd;
    $('#set-startbegin').checked = db.profile.startOnBegin;
    $('#set-unlock').checked = db.profile.unlockAll;
    renderSyncStatus();
  }

  // ================= Sync with the WalkQuest server =================
  // When the app is served by server.py, progress is also kept on the server, so a walk on
  // the computer shows up on the phone and the other way round. Devices merge instead of
  // overwriting each other: walks, finds, places and trophies are combined, XP adds up, and
  // on each map the most recent progress wins. With no server (a local file or a plain
  // static host) everything simply stays in this browser, as before.
  const API = 'api/state';
  // JSON with sorted keys, to tell whether two copies really differ.
  const canon = (v) => JSON.stringify(v, (k, x) => (isObj(x) ? Object.keys(x).sort().reduce((o, key) => ((o[key] = x[key]), o), {}) : x));
  const earliest = (a, b) => { const o = Object.assign({}, b); for (const [k, v] of Object.entries(a)) if (!o[k] || v < o[k]) o[k] = v; return o; };
  function mergeDocs(a, b, keepMap) { // a: this device, b: the server's copy
    const prefs = (a.settingsAt || 0) > (b.settingsAt || 0) ? a : b;
    const out = Object.assign({}, b, { epoch: b.epoch, settingsAt: prefs.settingsAt || 0, profile: Object.assign({}, b.profile) });
    for (const k of SETTINGS) out.profile[k] = prefs.profile[k];
    out.counters = {};
    for (const id of new Set([...Object.keys(a.counters), ...Object.keys(b.counters)])) {
      const x = a.counters[id] || {}, y = b.counters[id] || {};
      out.counters[id] = { xp: Math.max(+x.xp || 0, +y.xp || 0), wins: Math.max(+x.wins || 0, +y.wins || 0), total: Math.max(+x.total || 0, +y.total || 0) };
    }
    for (const k of ['collection', 'achievements', 'codex', 'bounties']) out[k] = earliest(a[k], b[k]);
    out.progress = {};
    for (const id of new Set([...Object.keys(a.progress), ...Object.keys(b.progress)])) {
      const x = a.progress[id], y = b.progress[id];
      let w = !x ? y : !y ? x : id === keepMap ? x
        : (x.t || 0) !== (y.t || 0) ? ((x.t || 0) > (y.t || 0) ? x : y)
        : (x.distanceM || 0) > (y.distanceM || 0) ? x : y;
      w = JSON.parse(JSON.stringify(w));
      if (x && y) w.completions = Math.max(x.completions || 0, y.completions || 0);
      out.progress[id] = w;
    }
    const walks = new Map();
    for (const h of [...b.history, ...a.history]) if (h && h.id && !walks.has(h.id)) walks.set(h.id, h);
    out.history = [...walks.values()].sort((p, q) => (p.date < q.date ? 1 : p.date > q.date ? -1 : p.id < q.id ? 1 : p.id > q.id ? -1 : 0));
    applyCounters(out);
    return out;
  }
  function syncChanged() {
    sync.edits++;
    if (!meta.dirty) { meta.dirty = true; saveMeta(); }
    scheduleSync(session ? 20000 : 2500); // during a walk, send at most every 20 s
  }
  function scheduleSync(ms) {
    if (sync.mode === 'off' || sync.timer) return;
    sync.timer = setTimeout(() => { sync.timer = null; syncNow(); }, ms);
  }
  async function api(method, body, keepalive) {
    const res = await fetch(API, {
      method, cache: 'no-store', keepalive: !!keepalive,
      headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined
    });
    // A static host answers with a page or a 404 page, not JSON: then there is no server to sync with.
    if (!(res.headers.get('Content-Type') || '').includes('json')) { const e = new Error('no sync server'); e.noServer = true; throw e; }
    return { status: res.status, data: await res.json() };
  }
  // Fold the server's copy into ours.
  function integrate(remote) {
    meta.rev = remote.rev;
    if (!remote.doc) { meta.dirty = true; return; } // server has nothing yet: send ours
    const theirs = normalize(remote.doc);
    const before = canon(db), walksBefore = db.history.length, xpBefore = db.profile.xp;
    const keep = session ? session.mapId : null;
    let next, replaced = false;
    if (meta.epoch && theirs.epoch !== meta.epoch && theirs.epoch !== db.epoch) {
      // Progress was erased or a backup restored on another device: take that copy.
      next = theirs; replaced = true;
      if (keep && db.progress[keep]) next.progress[keep] = db.progress[keep];
    } else next = mergeDocs(db, theirs, keep);
    db = next;
    meta.epoch = db.epoch;
    meta.dirty = canon(db) !== canon(theirs); // we still have something the server doesn't
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (_) {}
    if (canon(db) !== before) {
      if (replaced) toast('🔄', 'Progress replaced', 'It was erased or restored from a backup on another device.');
      else if (db.history.length > walksBefore || db.profile.xp > xpBefore) toast('🔄', 'Synced', 'Walks and XP from your other devices are here now.');
      refreshAfterSync();
    }
  }
  function refreshAfterSync() {
    renderHeader();
    if (session) return;
    const r = { home: renderMaps, trophies: renderTrophies, collection: renderCollection, journal: renderJournal, codex: renderCodex, settings: renderSettings }[currentScreen];
    if (r) r();
    if (currentScreen === 'journey' && currentMap) { shownFrac = Math.min(1, prog(currentMap.id).distanceM / (currentMap.km * 1000)); placeAvatar(shownFrac); renderMarkers(); renderJourneyIdle(); }
  }
  async function syncNow() {
    if (sync.mode === 'off') return;
    if (sync.busy) { sync.again = true; return; }
    if (sync.timer) { clearTimeout(sync.timer); sync.timer = null; }
    sync.busy = true;
    try {
      for (let tries = 0; tries < 5; tries++) {
        if (meta.force) { // erase / restore: replace what the server has
          const r = await api('PUT', { baseRev: meta.rev || 0, doc: db, force: true });
          if (r.status !== 200) throw new Error(r.data.error || `HTTP ${r.status}`);
          Object.assign(meta, { rev: r.data.rev, epoch: db.epoch, force: false, dirty: false });
          break;
        }
        if (!meta.dirty) {
          const r = await api('GET');
          if (r.status !== 200) throw new Error(r.data.error || `HTTP ${r.status}`);
          if (r.data.rev !== meta.rev || !r.data.doc) integrate(r.data);
          if (!meta.dirty) break;
          continue;
        }
        const edits = sync.edits;
        const r = await api('PUT', { baseRev: meta.rev || 0, doc: db });
        if (r.status === 200) { meta.rev = r.data.rev; meta.epoch = db.epoch; meta.dirty = sync.edits !== edits; break; }
        if (r.status === 409) { integrate(r.data); continue; } // another device saved first
        throw new Error(r.data.error || `HTTP ${r.status}`);
      }
      meta.at = Date.now();
      sync.mode = 'ok'; sync.error = '';
      if (sync.manual) toast('🔄', 'Synced', 'Your progress is up to date on the server.');
    } catch (e) {
      sync.mode = e.noServer ? 'off' : 'offline'; sync.error = e.message;
      if (sync.manual) toast('⚠️', e.noServer ? 'No sync server' : 'Sync failed', e.noServer ? 'This copy of WalkQuest is not running on the WalkQuest server.' : 'Progress is saved here and will sync when the server is reachable.', 'bad');
    } finally {
      sync.busy = false; sync.manual = false;
      saveMeta(); renderSyncStatus();
      if (sync.again) { sync.again = false; syncNow(); }
      else if (meta.dirty && sync.mode === 'ok') scheduleSync(session ? 20000 : 2500);
    }
  }
  // Leaving the page or switching apps: send unsent progress right away, without waiting for an answer.
  function flushSync() {
    if (sync.mode === 'off' || sync.busy || !(meta.dirty || meta.force)) return;
    const body = { baseRev: meta.rev || 0, doc: db, force: !!meta.force };
    const big = JSON.stringify(body).length > 60000; // browsers cap keepalive requests at 64 KB
    const edits = sync.edits;
    api('PUT', body, !big).then((r) => {
      if (r.status === 200) { Object.assign(meta, { rev: r.data.rev, epoch: db.epoch, force: false, dirty: sync.edits !== edits }); saveMeta(); }
    }).catch(() => {});
  }
  function renderSyncStatus() {
    const el = $('#sync-status'); if (!el) return;
    const when = meta.at ? new Date(meta.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const text = {
      off: '💾 Saved in this browser only. Open WalkQuest from the WalkQuest server (server.py) on each device to sync them.',
      starting: '🔄 Connecting to the server…',
      ok: `✅ Synced with the server${when ? ` at ${when}` : ''}. Walks, XP and finds are shared with your other devices.`,
      offline: '📴 Can\'t reach the server right now. Progress is saved here and syncs when it\'s back.'
    }[sync.mode];
    el.textContent = text;
    el.className = 'sync-status ' + sync.mode;
    const b = $('#btn-sync'); if (b) b.hidden = sync.mode === 'off';
  }

  // ================= Navigation =================
  const ORDER = ['home', 'codex', 'collection', 'trophies', 'journal', 'settings', 'journey'];
  let currentScreen = 'home';
  function show(screen) {
    const dir = ORDER.indexOf(screen) >= ORDER.indexOf(currentScreen) ? 'wq-fwd' : 'wq-back';
    const same = screen === currentScreen;
    currentScreen = screen;
    $$('.screen').forEach((s) => {
      s.classList.toggle('active', s.id === 'screen-' + screen);
      s.classList.remove('wq-fwd', 'wq-back');
      if (!same && s.id === 'screen-' + screen) { void s.offsetWidth; s.classList.add(dir); }
    });
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === screen));
    if (screen === 'home') renderMaps();
    if (screen === 'trophies') renderTrophies();
    if (screen === 'collection') renderCollection();
    if (screen === 'journal') renderJournal();
    if (screen === 'codex') renderCodex();
    if (screen === 'settings') renderSettings();
    window.scrollTo(0, 0);
  }

  // ================= Phone niceties =================
  // Bottom sheets: drag down from the top of the sheet to close it.
  function sheetSwipe() {
    const card = $('#modal-body');
    let y0 = null, dy = 0;
    card.addEventListener('touchstart', (e) => { if (card.scrollTop > 0 || !window.matchMedia('(max-width: 700px)').matches) { y0 = null; return; } y0 = e.touches[0].clientY; dy = 0; card.style.transition = 'none'; }, { passive: true });
    card.addEventListener('touchmove', (e) => {
      if (y0 === null) return;
      dy = Math.max(0, e.touches[0].clientY - y0);
      card.style.transform = dy ? `translateY(${dy}px)` : '';
    }, { passive: true });
    card.addEventListener('touchend', () => {
      if (y0 === null) return;
      card.style.transition = 'transform .2s ease-out';
      if (dy > 90) { card.style.transform = 'translateY(100%)'; setTimeout(() => { $('#modal').hidden = true; card.style.transform = ''; card.style.transition = ''; }, 200); }
      else card.style.transform = '';
      y0 = null;
    });
  }
  // Keep a copy of the app so the installed app opens at once and works without a connection.
  function registerWorker() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // ================= Wire up =================
  function init() {
    sheetSwipe();
    registerWorker();
    document.addEventListener('click', (e) => {
      const lmEl = e.target.closest('#mapsvg [data-lm], #routelist [data-lore]');
      if (lmEl && currentMap) { showLore(currentMap, +(lmEl.dataset.lm ?? lmEl.dataset.lore)); return; }
      const f = e.target.closest('[data-filter]');
      if (f) { mapFilter = f.dataset.filter; renderMaps(); return; }
      if (e.target.id === 'modal') { $('#modal').hidden = true; return; }
      const t = e.target.closest('[data-tab],[data-map],[data-close]');
      if (!t) return;
      if (t.dataset.tab) {
        if (session && !confirmLeave()) return;
        show(t.dataset.tab);
      }
      if (t.dataset.map) openMap(t.dataset.map);
      if (t.hasAttribute('data-close')) { $('#modal').hidden = true; }
    });
    $('#btn-connect').onclick = () => connect(false);
    $('#btn-connect-all').onclick = () => connect(true);
    $('#btn-sim').onclick = () => { Dev.startSim(); toast('🕹️', 'Simulator on', 'Pick a quest and press Begin: the simulated belt starts at 3 km/h. 10× and 60× speed up time for testing.'); };
    $('#btn-disconnect').onclick = () => Dev.disconnect();
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-spd],[data-spdset],[data-belt],#enc-match');
      if (!b) return;
      if (b.dataset.spd) nudgeSpeed(+b.dataset.spd);
      else if (b.dataset.spdset) queueSpeed(+b.dataset.spdset);
      else if (b.dataset.belt) belt(b.dataset.belt);
      else if (b.id === 'enc-match' && session && session.encounter) queueSpeed(session.encounter.target);
    });
    document.addEventListener('keydown', (e) => {
      if (!Dev.state.connected || !Dev.state.canControl) return;
      if (e.target.closest && e.target.closest('input, textarea, select')) return;
      if (e.key !== 'Escape' && !speedCtlActive()) return;
      if (e.key === 'Escape') { e.preventDefault(); belt('stop'); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); nudgeSpeed(e.shiftKey ? 0.5 : 0.1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); nudgeSpeed(e.shiftKey ? -0.5 : -0.1); }
    });
    $('#btn-start').onclick = startWalk;
    $('#btn-restart').onclick = () => { const p = prog(currentMap.id); p.distanceM = 0; p.landmarks = []; p.runCollect = []; touch(p); save(); shownFrac = 0; renderMarkers(); renderJourneyIdle(); };
    $('#btn-end').onclick = () => { if (session.completed || confirm('End this walk? Your progress on the map is kept.')) endWalk(); };
    $('#btn-back').onclick = () => { if (session && !confirmLeave()) return; show('home'); };
    $$('[data-warp]').forEach((b) => (b.onclick = () => { Dev.setSim({ warp: +b.dataset.warp }); $$('[data-warp]').forEach((x) => x.classList.toggle('active', x === b)); }));
    $('#set-weight').onchange = (e) => { setPref('weightKg', Math.max(30, Math.min(250, +e.target.value || 75))); };
    $('#set-max').onchange = (e) => { setPref('maxSpeed', Math.max(3, Math.min(20, +e.target.value || 6))); renderSpeedCtl(); };
    $('#set-sound').onchange = (e) => { setPref('sound', e.target.checked); };
    $('#set-enc').onchange = (e) => { setPref('encountersOn', e.target.checked); };
    $('#set-stopend').onchange = (e) => { setPref('stopOnEnd', e.target.checked); };
    $('#set-startbegin').onchange = (e) => { setPref('startOnBegin', e.target.checked); };
    $('#set-unlock').onchange = (e) => { setPref('unlockAll', e.target.checked); };
    $('#set-debug').onchange = (e) => { window.WQ_DEBUG = e.target.checked; };
    $('#btn-export').onclick = () => {
      const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `walkquest-backup-${dayKey(new Date())}.json`; a.click();
    };
    $('#file-import').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { const data = JSON.parse(await f.text()); if (!data.profile || !Array.isArray(data.history)) throw new Error('Not a WalkQuest backup'); db = normalize(data); db.epoch = newId(); meta.force = true; saveMeta(); save(); syncNow(); toast('📥', 'Backup restored', `${db.history.length} walks loaded.`); renderHeader(); renderSettings(); }
      catch (err) { toast('⚠️', 'Import failed', err.message, 'bad'); }
    };
    $('#btn-reset').onclick = () => {
      const msg = sync.mode === 'off' ? 'Erase ALL WalkQuest progress on this browser? This cannot be undone.' : 'Erase ALL WalkQuest progress, here and on your other devices? This cannot be undone.';
      if (confirm(msg)) { db = normalize({}); meta.force = true; saveMeta(); save(); syncNow(); renderHeader(); renderSettings(); toast('🧹', 'Progress erased', ''); }
    };
    $('#btn-sync').onclick = () => { sync.manual = true; syncNow(); };
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow(); else flushSync(); });
    window.addEventListener('pagehide', flushSync);
    window.addEventListener('online', () => syncNow());
    setInterval(() => { if (document.visibilityState === 'visible') syncNow(); }, 60000);
    window.addEventListener('beforeunload', (e) => { if (session && session.distanceM > 20) { e.preventDefault(); e.returnValue = ''; } });

    renderHeader();
    renderDevice();
    show('home');
    requestAnimationFrame(frame);
    syncNow();
  }
  function confirmLeave() {
    if (!session) return true;
    if (!confirm('You are mid-walk. End the walk and save it?')) return false;
    endWalk(); return true;
  }

  window.WalkQuest = { get db() { return db; }, get session() { return session; }, get sync() { return Object.assign({}, sync, { meta }); }, syncNow, mergeDocs };
  document.addEventListener('DOMContentLoaded', init);
})();
