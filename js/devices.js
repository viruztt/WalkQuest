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

  const listeners = { data: new Set(), status: new Set(), log: new Set() };
  const emit = (k, v) => listeners[k].forEach((fn) => { try { fn(v); } catch (e) { console.error(e); } });

  const state = {
    kind: null, // 'ftms' | 'fitshow' | 'sim' | null
    name: '',
    connected: false,
    device: null,
    pollTimer: null,
    simTimer: null,
    sim: { speed: 0, warp: 1, distanceM: 0, elapsed: 0, last: 0 },
    lastSample: null
  };

  const hex = (dv) => Array.from(new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength)).map((b) => b.toString(16).padStart(2, '0')).join(' ');
  const log = (msg) => { emit('log', `[${new Date().toLocaleTimeString()}] ${msg}`); };

  function setStatus(connected, kind, name, note) {
    state.connected = connected; state.kind = kind; state.name = name || '';
    emit('status', { connected, kind, name: state.name, note: note || '' });
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
      log('Connected via FitShow protocol (experimental).');
      setStatus(true, 'fitshow', device.name || 'Treadmill', 'experimental');
      return;
    } catch (e) {
      log('FitShow not available: ' + e.message);
    }

    try { server.disconnect(); } catch (_) {}
    throw new Error('Connected, but the treadmill did not expose a supported data service. Open the Device log and send it over so support can be added.');
  }

  // ---------- Simulator ----------
  function startSim() {
    disconnect();
    const sim = state.sim;
    sim.distanceM = 0; sim.elapsed = 0; sim.last = performance.now();
    if (!sim.speed) sim.speed = 4;
    state.simTimer = setInterval(() => {
      const now = performance.now();
      const dt = ((now - sim.last) / 1000) * sim.warp;
      sim.last = now;
      if (sim.speed > 0) { sim.distanceM += (sim.speed / 3.6) * dt; sim.elapsed += dt; }
      sample({ speed: sim.speed, distanceM: sim.distanceM, elapsed: Math.round(sim.elapsed), kcal: null, steps: null, hr: null, incline: 0, warp: sim.warp, source: 'sim' });
    }, 250);
    log('Simulator started.');
    setStatus(true, 'sim', 'Simulator');
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
    get state() { return state; },
    _parse: { parseTreadmillData, parseFitShow }
  };
})();
