/* WalkQuest data sources: Bluetooth treadmill (FTMS + FitShow fallback) and a simulator.
   Every source emits samples: { speed (km/h), distanceM (cumulative, or null), elapsed (s or null),
   kcal, steps, hr, incline, warp } */
(function () {
  const FTMS = 0x1826;
  const TREADMILL_DATA = 0x2acd;
  const FTMS_FEATURE = 0x2acc;
  const FITSHOW = 0xfff0;
  const FITSHOW_NOTIFY = 0xfff1;
  const FITSHOW_WRITE = 0xfff2;
  const FTMS_CONTROL_POINT = 0x2ad9;
  const FTMS_STATUS = 0x2ada;
  const FTMS_SPEED_RANGE = 0x2ad4;
  const CP_RESULTS = { 1: 'success', 2: 'not supported', 3: 'invalid value', 4: 'operation failed', 5: 'control not permitted' };

  const listeners = { data: new Set(), status: new Set(), log: new Set(), control: new Set() };
  const emit = (k, v) => listeners[k].forEach((fn) => { try { fn(v); } catch (e) { console.error(e); } });

  const state = {
    kind: null, // 'ftms' | 'fitshow' | 'sim' | null
    name: '',
    connected: false,
    device: null,
    pollTimer: null,
    simTimer: null,
    sim: { speed: 0, warp: 1, distanceM: 0, elapsed: 0, last: 0 },
    lastSample: null,
    // speed control
    canControl: false, controlKind: null, canStart: false,
    range: { min: 0.5, max: 20, inc: 0.1 },
    cp: null, cpQueue: Promise.resolve(), cpPending: null, hasControl: false, fsWrite: null
  };

  const hex = (dv) => Array.from(new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength)).map((b) => b.toString(16).padStart(2, '0')).join(' ');
  const log = (msg) => { emit('log', `[${new Date().toLocaleTimeString()}] ${msg}`); };

  function setStatus(connected, kind, name, note) {
    state.connected = connected; state.kind = kind; state.name = name || '';
    if (!connected) { state.canControl = false; state.controlKind = null; state.canStart = false; state.cp = null; state.hasControl = false; state.fsWrite = null; }
    emit('status', { connected, kind, name: state.name, note: note || '', canControl: state.canControl });
  }

  function sample(s) {
    state.lastSample = s;
    emit('data', s);
  }

  // ---------- FTMS Treadmill Data parser (Bluetooth SIG spec) ----------
  function parseTreadmillData(dv) {
    let i = 0;
    const flags = dv.getUint16(i, true); i += 2;
    const out = { speed: null, distanceM: null, elapsed: null, kcal: null, steps: null, hr: null, incline: null };
    if (!(flags & 0x0001)) { out.speed = dv.getUint16(i, true) / 100; i += 2; } // bit0=0 → speed present
    if (flags & 0x0002) i += 2; // average speed
    if (flags & 0x0004) { out.distanceM = dv.getUint16(i, true) + (dv.getUint8(i + 2) << 16); i += 3; }
    if (flags & 0x0008) { out.incline = dv.getInt16(i, true) / 10; i += 4; } // incline + ramp angle
    if (flags & 0x0010) i += 4; // elevation gain
    if (flags & 0x0020) i += 1; // instantaneous pace
    if (flags & 0x0040) i += 1; // average pace
    if (flags & 0x0080) { const e = dv.getUint16(i, true); if (e !== 0xffff) out.kcal = e; i += 5; }
    if (flags & 0x0100) { const h = dv.getUint8(i); if (h) out.hr = h; i += 1; }
    if (flags & 0x0200) i += 1; // MET
    if (flags & 0x0400) { out.elapsed = dv.getUint16(i, true); i += 2; }
    return { flags, ...out };
  }

  // ---------- FitShow proprietary protocol (used by many folding walking pads) ----------
  // Frame: 0x02 <cmd...> <xor checksum> 0x03. Status poll is 02 51 51 03.
  function parseFitShow(dv) {
    const b = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
    if (b.length < 4 || b[0] !== 0x02 || b[1] !== 0x51) return null;
    const status = b[2];
    if (status !== 0x03 || b.length < 13) return { speed: 0, distanceM: null, elapsed: null, status };
    return {
      status,
      speed: b[3] / 10,
      incline: b[4],
      elapsed: b[5] | (b[6] << 8),
      distanceM: b[7] | (b[8] << 8),
      kcal: (b[9] | (b[10] << 8)) / 10,
      steps: b[11] | (b[12] << 8)
    };
  }

  function bluetoothAvailability() {
    if (!('bluetooth' in navigator)) {
      return { ok: false, reason: 'This browser has no Web Bluetooth. Use Chrome or Edge on Windows, macOS, Android or ChromeOS (Safari and Firefox do not support it).' };
    }
    if (!window.isSecureContext) {
      return { ok: false, reason: 'Web Bluetooth needs a secure page. Open WalkQuest from https:// or http://localhost.' };
    }
    return { ok: true };
  }

  async function connectTreadmill({ showAll = false } = {}) {
    const av = bluetoothAvailability();
    if (!av.ok) throw new Error(av.reason);
    await disconnect();
    const optionalServices = [FTMS, FITSHOW, 0x180a, 0x180f, 0xffe0, 0xfff0];
    const opts = showAll
      ? { acceptAllDevices: true, optionalServices }
      : {
          filters: [
            { services: [FTMS] },
            { namePrefix: 'ZenRun' }, { namePrefix: 'Zen' }, { namePrefix: 'inSPORT' },
            { namePrefix: 'FS-' }, { namePrefix: 'FitShow' }, { namePrefix: 'WalkingPad' }, { namePrefix: 'Treadmill' }
          ],
          optionalServices
        };
    log(`Requesting device (${showAll ? 'all devices' : 'treadmill filter'})…`);
    const device = await navigator.bluetooth.requestDevice(opts);
    state.device = device;
    device.addEventListener('gattserverdisconnected', () => {
      log('Treadmill disconnected.');
      clearInterval(state.pollTimer);
      setStatus(false, null, '', 'Disconnected');
    });
    log(`Selected "${device.name || 'unnamed device'}". Connecting…`);
    const server = await device.gatt.connect();

    // List what the treadmill exposes, so unknown models can be diagnosed.
    try {
      const services = await server.getPrimaryServices();
      log('Services: ' + services.map((s) => s.uuid.slice(4, 8)).join(', '));
    } catch (e) { log('Could not list services: ' + e.message); }

    // 1) Standard FTMS
    try {
      const svc = await server.getPrimaryService(FTMS);
      try {
        const feat = await (await svc.getCharacteristic(FTMS_FEATURE)).readValue();
        log('FTMS features: ' + hex(feat));
      } catch (_) { /* optional */ }
      const ch = await svc.getCharacteristic(TREADMILL_DATA);
      ch.addEventListener('characteristicvaluechanged', (ev) => {
        const dv = ev.target.value;
        try {
          const p = parseTreadmillData(dv);
          if (window.WQ_DEBUG) log('FTMS ' + hex(dv));
          sample({ ...p, warp: 1, source: 'ftms' });
        } catch (e) { log('FTMS parse error: ' + e.message + ' raw=' + hex(dv)); }
      });
      await ch.startNotifications();
      await setupFtmsControl(svc);
      log('Connected via FTMS (Fitness Machine Service). Start walking!');
      setStatus(true, 'ftms', device.name || 'Treadmill');
      return;
    } catch (e) {
      log('FTMS not available: ' + e.message);
    }

    // 2) FitShow fallback (experimental)
    try {
      const svc = await server.getPrimaryService(FITSHOW);
      const notify = await svc.getCharacteristic(FITSHOW_NOTIFY);
      const write = await svc.getCharacteristic(FITSHOW_WRITE);
      notify.addEventListener('characteristicvaluechanged', (ev) => {
        const dv = ev.target.value;
        const p = parseFitShow(dv);
        if (window.WQ_DEBUG || !p) log('FitShow ' + hex(dv));
        if (p) sample({ ...p, warp: 1, source: 'fitshow' });
      });
      await notify.startNotifications();
      const poll = new Uint8Array([0x02, 0x51, 0x51, 0x03]);
      state.pollTimer = setInterval(() => {
        (write.writeValueWithoutResponse ? write.writeValueWithoutResponse(poll) : write.writeValue(poll)).catch(() => {});
      }, 1000);
      state.fsWrite = write; state.canControl = true; state.controlKind = 'fitshow'; state.canStart = false;
      state.range = { min: 1, max: 6, inc: 0.1 };
      log('Connected via FitShow protocol (experimental). Speed control is experimental too.');
      setStatus(true, 'fitshow', device.name || 'Treadmill', 'experimental');
      return;
    } catch (e) {
      log('FitShow not available: ' + e.message);
    }

    try { server.disconnect(); } catch (_) {}
    throw new Error('Connected, but the treadmill did not expose a supported data service. Open the Device log and send it over so support can be added.');
  }

  // ---------- Speed control: FTMS Control Point ----------
  async function setupFtmsControl(svc) {
    try {
      const cp = await svc.getCharacteristic(FTMS_CONTROL_POINT);
      cp.addEventListener('characteristicvaluechanged', (ev) => {
        const b = new Uint8Array(ev.target.value.buffer, ev.target.value.byteOffset, ev.target.value.byteLength);
        if (b[0] === 0x80 && state.cpPending && state.cpPending.op === b[1]) { const p = state.cpPending; state.cpPending = null; p.resolve(b[2]); }
      });
      await cp.startNotifications(); // FTMS uses indications; Web Bluetooth subscribes to whichever is offered
      state.cp = cp;
      try {
        const r = await (await svc.getCharacteristic(FTMS_SPEED_RANGE)).readValue();
        state.range = { min: r.getUint16(0, true) / 100, max: r.getUint16(2, true) / 100, inc: Math.max(0.1, r.getUint16(4, true) / 100) };
        log(`Speed range: ${state.range.min}–${state.range.max} km/h, step ${state.range.inc}`);
      } catch (_) { log('Speed range not reported; using 0.5–20 km/h.'); }
      try {
        const st = await svc.getCharacteristic(FTMS_STATUS);
        st.addEventListener('characteristicvaluechanged', (ev) => {
          const dv = ev.target.value, op = dv.getUint8(0);
          if (op === 0xff) { state.hasControl = false; log('Treadmill took back control.'); }
          if (op === 0x05 && dv.byteLength >= 3) emit('control', { type: 'target', speed: dv.getUint16(1, true) / 100 });
          if (op === 0x02) emit('control', { type: 'stopped' });
          if (op === 0x04) emit('control', { type: 'started' });
          if (window.WQ_DEBUG) log('FTMS status ' + hex(dv));
        });
        await st.startNotifications();
      } catch (_) { /* optional */ }
      state.canControl = true; state.controlKind = 'ftms'; state.canStart = true;
      log('Speed control available (FTMS control point).');
    } catch (e) {
      log('No speed control on this treadmill: ' + e.message);
    }
  }
  function cpWrite(bytes) {
    const run = () => new Promise((resolve, reject) => {
      if (!state.cp) return reject(new Error('Treadmill is not connected'));
      const timer = setTimeout(() => { state.cpPending = null; reject(new Error('Treadmill did not answer')); }, 4000);
      state.cpPending = { op: bytes[0], resolve: (code) => { clearTimeout(timer); resolve(code); } };
      const data = new Uint8Array(bytes);
      (state.cp.writeValueWithResponse ? state.cp.writeValueWithResponse(data) : state.cp.writeValue(data))
        .catch((e) => { clearTimeout(timer); state.cpPending = null; reject(e); });
    });
    const p = state.cpQueue.then(run, run);
    state.cpQueue = p.catch(() => {});
    return p;
  }
  async function ftmsCommand(bytes, label) {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (!state.hasControl) {
        const r = await cpWrite([0x00]);
        if (r !== 1) throw new Error(`Treadmill refused remote control (${CP_RESULTS[r] || r})`);
        state.hasControl = true;
      }
      const r = await cpWrite(bytes);
      if (r === 1) { log(`${label}: OK`); return; }
      if (r === 5 && attempt === 0) { state.hasControl = false; continue; }
      throw new Error(`${label} failed: ${CP_RESULTS[r] || r}`);
    }
  }
  // FitShow frames: 0x02 <payload> <xor of payload> 0x03
  function fsFrame(payload) { const x = payload.reduce((a, b) => a ^ b, 0); return new Uint8Array([0x02, ...payload, x, 0x03]); }
  async function fsSend(payload, label) {
    if (!state.fsWrite) throw new Error('Treadmill is not connected');
    const f = fsFrame(payload);
    await (state.fsWrite.writeValueWithoutResponse ? state.fsWrite.writeValueWithoutResponse(f) : state.fsWrite.writeValue(f));
    log(`${label}: sent ${hex(new DataView(f.buffer))}`);
  }

  const clampSpeed = (v, max) => {
    const hi = Math.min(state.range.max, max || state.range.max);
    const lo = state.range.min;
    return Math.round(Math.max(lo, Math.min(hi, v)) * 10) / 10;
  };
  async function setSpeed(kmh, maxAllowed) {
    const v = clampSpeed(kmh, maxAllowed);
    if (state.kind === 'sim') { state.sim.speed = v; emit('control', { type: 'target', speed: v }); return v; }
    if (!state.canControl) throw new Error('This treadmill does not accept speed commands');
    if (state.controlKind === 'ftms') { const c = Math.round(v * 100); await ftmsCommand([0x02, c & 0xff, c >> 8], `Set speed ${v.toFixed(1)} km/h`); }
    else await fsSend([0x53, 0x02, Math.round(v * 10), 0x00], `Set speed ${v.toFixed(1)} km/h`);
    emit('control', { type: 'target', speed: v });
    return v;
  }
  async function startBelt() {
    if (state.kind === 'sim') { if (state.sim.speed < 0.5) state.sim.speed = 3; emit('control', { type: 'target', speed: state.sim.speed }); return; }
    if (state.controlKind === 'ftms') return ftmsCommand([0x07], 'Start belt');
    throw new Error('Start the belt with the remote or the treadmill button.');
  }
  async function stopBelt() {
    if (state.kind === 'sim') { state.sim.speed = 0; emit('control', { type: 'target', speed: 0 }); return; }
    if (state.controlKind === 'ftms') return ftmsCommand([0x08, 0x01], 'Stop belt');
    if (state.controlKind === 'fitshow') return fsSend([0x53, 0x03], 'Stop belt');
    throw new Error('This treadmill does not accept remote commands');
  }

  // ---------- Simulator ----------
  function startSim() {
    disconnect();
    const sim = state.sim;
    sim.distanceM = 0; sim.elapsed = 0; sim.last = performance.now();
    sim.speed = 0;
    state.simTimer = setInterval(() => {
      const now = performance.now();
      const dt = ((now - sim.last) / 1000) * sim.warp;
      sim.last = now;
      if (sim.speed > 0) { sim.distanceM += (sim.speed / 3.6) * dt; sim.elapsed += dt; }
      sample({ speed: sim.speed, distanceM: sim.distanceM, elapsed: Math.round(sim.elapsed), kcal: null, steps: null, hr: null, incline: 0, warp: sim.warp, source: 'sim' });
    }, 250);
    log('Simulator started.');
    state.range = { min: 0.5, max: 8, inc: 0.1 };
    setStatus(true, 'sim', 'Simulator');
    state.canControl = true; state.controlKind = 'sim'; state.canStart = true;
    emit('status', { connected: true, kind: 'sim', name: 'Simulator', canControl: true });
  }
  function setSim(patch) { Object.assign(state.sim, patch); }

  async function disconnect() {
    clearInterval(state.pollTimer); state.pollTimer = null;
    clearInterval(state.simTimer); state.simTimer = null;
    if (state.device && state.device.gatt && state.device.gatt.connected) {
      try { state.device.gatt.disconnect(); } catch (_) {}
    }
    state.device = null;
    if (state.connected) setStatus(false, null, '', 'Disconnected');
  }

  window.WQDevice = {
    on: (k, fn) => listeners[k].add(fn),
    connectTreadmill, startSim, setSim, disconnect, bluetoothAvailability,
    setSpeed, startBelt, stopBelt,
    get state() { return state; },
    _parse: { parseTreadmillData, parseFitShow, fsFrame },
    _setupFtmsControl: setupFtmsControl
  };
})();
