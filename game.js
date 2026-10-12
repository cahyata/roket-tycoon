'use strict';
/* ROKET Tycoon - game.js */
const SAVE_KEY = 'roket_tycoon_v1';
const DAY_SEC = 20;

const fmt = n => Math.floor(n).toLocaleString('id-ID');
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

// ---------- Data ----------
const FAC = {
  pad:     {n: 'Launch Pad',        i: '🛰️', base: 30000, max: 5, d: 'Level menentukan kelas mesin terbesar yang bisa diluncurkan, dan +0,5% keandalan per level.'},
  hangar:  {n: 'Hangar',            i: '🏭', base: 20000, max: 6, d: 'Kapasitas penyimpanan roket = level hangar.'},
  lab:     {n: 'Lab Riset',         i: '🔬', base: 25000, max: 6, d: 'Menghasilkan Poin Riset (RP). Setiap ilmuwan menambah output.'},
  fuel:    {n: 'Pabrik Bahan Bakar',i: '⛽', base: 22000, max: 6, d: 'Produksi bahan bakar per detik dan kapasitas tangki penyimpanan.'},
  control: {n: 'Control Center',    i: '📡', base: 35000, max: 5, d: 'Keandalan +1% per level, lebih banyak kontrak tersedia, kapasitas staf.'},
};
const facCost = (k, lvl) => Math.round(FAC[k].base * Math.pow(1.85, lvl - 1));

const STAFF = {
  eng:  {n: 'Insinyur',  i: '🛠️', hire: 8000, sal: 400, d: '+0,4% keandalan peluncuran (maks +8%).'},
  sci:  {n: 'Ilmuwan',   i: '🧪', hire: 9000, sal: 450, d: 'Menambah RP per detik dari lab.'},
  tech: {n: 'Teknisi',   i: '🔧', hire: 6000, sal: 300, d: '+0,8% pendapatan kontrak (maks +24%) dan mempercepat produksi bahan bakar.'},
};

const ENGINES = {
  e1: {n: 'Kestrel-1',  thrust: 40,  rel: .86, cost: 20000,  tier: 1, tech: null,    fuel: 1.0,  rec: 0},
  e2: {n: 'Merlin-X',   thrust: 90,  rel: .90, cost: 60000,  tier: 2, tech: 'prop1', fuel: .85,  rec: .15},
  e3: {n: 'Raptor-S',   thrust: 180, rel: .94, cost: 180000, tier: 3, tech: 'prop2', fuel: .70,  rec: .40},
  e4: {n: 'Ion-Nova',   thrust: 350, rel: .97, cost: 500000, tier: 4, tech: 'prop3', fuel: .55,  rec: .60},
};
const TANKS = {
  t1: {n: 'Tangki Kecil',   cap: 30,  cost: 8000,  tech: null},
  t2: {n: 'Tangki Menengah',cap: 70,  cost: 25000, tech: 'str1'},
  t3: {n: 'Tangki Besar',   cap: 150, cost: 80000, tech: 'str2'},
};
const GUIDE = {
  g1: {n: 'Navigasi Dasar',   bonus: 0,    cost: 5000,   tech: null},
  g2: {n: 'Navigasi Lanjut',  bonus: .04,  cost: 30000,  tech: 'avi1'},
  g3: {n: 'AI Guidance',      bonus: .08,  cost: 120000, tech: 'avi2'},
};
const CAPSULE_COST = 40000;

const TECH = {
  prop1: {n: 'Mesin Merlin-X',    c: 30,  r: [],        d: 'Membuka mesin Merlin-X (butuh Pad Lv2).'},
  prop2: {n: 'Mesin Raptor-S',    c: 120, r: ['prop1'], d: 'Membuka mesin Raptor-S (butuh Pad Lv3).'},
  prop3: {n: 'Mesin Ion-Nova',    c: 400, r: ['prop2'], d: 'Membuka mesin Ion-Nova (butuh Pad Lv4).'},
  str1:  {n: 'Tangki Menengah',   c: 25,  r: [],        d: 'Membuka Tangki Menengah.'},
  str2:  {n: 'Tangki Besar',      c: 100, r: ['str1'],  d: 'Membuka Tangki Besar.'},
  avi1:  {n: 'Navigasi Lanjut',   c: 30,  r: [],        d: 'Membuka panduan Navigasi Lanjut (+4% keandalan).'},
  avi2:  {n: 'AI Guidance',       c: 130, r: ['avi1'],  d: 'Membuka AI Guidance (+8% keandalan).'},
  life1: {n: 'Kapsul Awak',       c: 80,  r: ['str1'],  d: 'Membuka misi berawak dan kapsul awak.'},
  eco1:  {n: 'Negosiasi Kontrak', c: 60,  r: [],        d: 'Hadiah kontrak +15%.'},
  eco2:  {n: 'Kemitraan Global',  c: 200, r: ['eco1'],  d: 'Hadiah kontrak +30% tambahan.'},
  lab1:  {n: 'Metode Riset',      c: 50,  r: [],        d: 'Output RP +25%.'},
  fuel1: {n: 'Efisiensi Bahan Bakar', c: 70, r: [],     d: 'Pemakaian bahan bakar peluncuran -25%.'},
};

const MISSION_TYPES = {
  sat:   {n: 'Satelit', i: '🛰️', mass: [20, 60, 120, 220], base: 28000},
  cargo: {n: 'Kargo ISS', i: '📦', mass: [70, 140, 260, 360], base: 24000},
  crew:  {n: 'Misi Awak', i: '👩‍🚀', mass: [90, 180, 300, 380], base: 42000},
};
const CLIENTS = ['SatKom Nusantara', 'AgroSat', 'Samudra Telkom', 'Bumi Observasi', 'Garuda Space', 'Kemitraan ASEAN', 'Nusa Dirgantara', 'Cakrawala Corp', 'Orbit Mandiri', 'Teknologi Khatulistiwa'];

// ---------- State ----------
let S;
function newState() {
  return {
    v: 1, money: 120000, rp: 0, fuel: 40, rep: 0, day: 1, dayT: 0,
    fac: {pad: 1, hangar: 1, lab: 1, fuel: 1, control: 1},
    staff: {eng: 0, sci: 1, tech: 0},
    tech: {}, rockets: [], contracts: [], log: [],
    stats: {ok: 0, fail: 0, earned: 0}, nextId: 1, last: Date.now(), tab: 'base',
  };
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY + (AUTH.user ? '_' + AUTH.user : ''));
    if (raw) { S = Object.assign(newState(), JSON.parse(raw)); return true; }
  } catch (e) {}
  S = newState();
  return false;
}
function save() {
  try { S.last = Date.now(); localStorage.setItem(SAVE_KEY + (AUTH.user ? '_' + AUTH.user : ''), JSON.stringify(S)); } catch (e) {}
  if (AUTH.token) api('PUT', '/api/save', {save: S}).catch(() => {});
}
// ---------- Akun ----------
const AUTH = {token: null, user: null};
try { AUTH.token = localStorage.getItem('roket_token'); AUTH.user = localStorage.getItem('roket_user'); } catch (e) {}
// Mode tanpa server (index.html dibuka langsung): akun & progres disimpan di IndexedDB browser.
const LOCAL_MODE = location.protocol === 'file:';
const idb = (() => { let p; return () => p || (p = new Promise((ok, no) => {
  const q = indexedDB.open('roket_db', 1);
  q.onupgradeneeded = () => { q.result.createObjectStore('users', {keyPath: 'username'}); q.result.createObjectStore('sessions'); };
  q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); })); })();
const idbDo = async (store, mode, fn) => { const d = await idb(); return new Promise((ok, no) => { const r = fn(d.transaction(store, mode).objectStore(store)); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }); };
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
async function pbkdf(pw, salt) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 150000, hash: 'SHA-256'}, k, 256));
}
const fail = (status, message) => Object.assign(new Error(message), {status});
async function localApi(method, url, data) {
  const tok = (AUTH.token || '').replace(/^L-/, '');
  if (url === '/api/register' || url === '/api/login') {
    const n = String((data || {}).username || '').trim().toLowerCase(), pw = String((data || {}).password || '');
    let u = await idbDo('users', 'readonly', s => s.get(n));
    if (url === '/api/register') {
      if (!/^[a-z0-9_]{3,20}$/.test(n)) throw fail(400, 'Username 3-20 karakter: huruf, angka, underscore.');
      if (pw.length < 6) throw fail(400, 'Password minimal 6 karakter.');
      if (u) throw fail(409, 'Username sudah dipakai.');
      const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
      u = {username: n, salt, hash: await pbkdf(pw, salt), save: null};
      await idbDo('users', 'readwrite', s => s.put(u));
    } else if (!u || (await pbkdf(pw, u.salt)) !== u.hash) throw fail(401, 'Username atau password salah.');
    const token = 'L-' + hex(crypto.getRandomValues(new Uint8Array(24)));
    await idbDo('sessions', 'readwrite', s => s.put(u.username, token));
    return {token, username: u.username};
  }
  const name = await idbDo('sessions', 'readonly', s => s.get(tok));
  if (!name) throw fail(401, 'Belum login.');
  if (url === '/api/me') return {username: name};
  if (url === '/api/logout') { await idbDo('sessions', 'readwrite', s => s.delete(tok)); return {ok: true}; }
  const u = await idbDo('users', 'readonly', s => s.get(name));
  if (url === '/api/save' && method === 'GET') return {save: u.save || null};
  if (url === '/api/save' && method === 'PUT') { u.save = JSON.parse(JSON.stringify(data.save)); await idbDo('users', 'readwrite', s => s.put(u)); return {ok: true}; }
  throw fail(404, 'Tidak ditemukan');
}
async function api(method, url, data) {
  if (LOCAL_MODE) return localApi(method, url, data);
  const r = await fetch(url, {method, headers: Object.assign({'Content-Type': 'application/json'}, AUTH.token ? {Authorization: 'Bearer ' + AUTH.token} : {}), body: data ? JSON.stringify(data) : undefined});
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'Gagal'), {status: r.status});
  return j;
}

// ---------- Derived ----------
const staffCap = () => 2 + S.fac.control * 2 + S.fac.lab;
const staffCount = () => S.staff.eng + S.staff.sci + S.staff.tech;
const fuelMax = () => 60 * S.fac.fuel * S.fac.fuel + 40;
const fuelRate = () => 0.35 * S.fac.fuel * (1 + S.staff.tech * 0.05);
const rpRate = () => (0.15 * S.fac.lab + S.staff.sci * 0.25 * (1 + S.fac.lab * 0.1)) * (S.tech.lab1 ? 1.25 : 1);
const salary = () => Object.keys(STAFF).reduce((a, k) => a + S.staff[k] * STAFF[k].sal, 0);
const rewardMul = () => (1 + Math.min(S.staff.tech * 0.008, 0.24)) * (1 + (S.tech.eco1 ? .15 : 0) + (S.tech.eco2 ? .3 : 0));
const fuelUse = r => Math.ceil(TANKS[r.tank].cap * ENGINES[r.engine].fuel * (S.tech.fuel1 ? .75 : 1));
const rocketCap = r => Math.round(ENGINES[r.engine].thrust * 0.6 + TANKS[r.tank].cap * 1.2);
const rocketCost = (e, t, g, cap) => ENGINES[e].cost + TANKS[t].cost + GUIDE[g].cost + (cap ? CAPSULE_COST : 0);
const unlocked = o => !o.tech || S.tech[o.tech];
function relParts(r, m) {
  const P = [['Mesin ' + ENGINES[r.engine].n, ENGINES[r.engine].rel]];
  if (GUIDE[r.guide].bonus) P.push(['Panduan ' + GUIDE[r.guide].n, GUIDE[r.guide].bonus]);
  P.push(['Control Center Lv' + S.fac.control, S.fac.control * 0.01]);
  P.push(['Launch Pad Lv' + S.fac.pad, S.fac.pad * 0.005]);
  if (S.staff.eng) P.push(['Insinyur ×' + S.staff.eng, Math.min(S.staff.eng * 0.004, 0.08)]);
  if ((S.failStreak || 0) > 0) P.push(['Belajar dari kegagalan', Math.min(S.failStreak * 0.05, 0.1)]);
  if (m) {
    const load = m.mass / rocketCap(r);
    P.push(['Beban muatan ' + Math.round(load * 100) + '%', -load * 0.06]);
    if (m.type === 'crew') P.push(['Misi awak', -0.03]);
    if (m.tier > 1) P.push(['Misi tier ' + m.tier, -(m.tier - 1) * 0.01]);
  }
  return P;
}
function reliability(r, m) {
  return Math.max(0.05, Math.min(0.99, relParts(r, m).reduce((a, p) => a + p[1], 0)));
}
const relText = (r, m) => relParts(r, m).map(p => `${p[0]}: ${p[1] >= 0 ? '+' : ''}${(p[1] * 100).toFixed(1)}%`).join('<br>');

// ---------- Contracts ----------
// Biaya roket termurah yang sanggup membawa muatan (semua komponen dihitung, panduan dasar).
function minRocketCost(mass, crew) {
  let best = Infinity;
  for (const e of Object.values(ENGINES)) for (const t of Object.values(TANKS)) {
    if (Math.round(e.thrust * 0.6 + t.cap * 1.2) >= mass) best = Math.min(best, e.cost + t.cost + GUIDE.g1.cost + (crew ? CAPSULE_COST : 0));
  }
  return best;
}
const maxTierNow = () => 1 + (S.rep >= 6) + (S.rep >= 16) + (S.rep >= 30);
const TIER_PREMIUM = [1, 1.1, 1.2, 1.35];
function genContract() {
  const maxTier = maxTierNow();
  const type = pick(Object.keys(MISSION_TYPES).filter(t => t !== 'crew' || S.tech.life1));
  const tier = 1 + Math.floor(Math.random() * maxTier);
  const mt = MISSION_TYPES[type];
  const mass = Math.round(mt.mass[tier - 1] * rnd(.85, 1.1));
  // hadiah = biaya roket termurah untuk muatan itu + margin 40-60%
  const reward = Math.round(minRocketCost(mass, type === 'crew') * rnd(1.4, 1.6) * TIER_PREMIUM[tier - 1] / 100) * 100;
  return {id: S.nextId++, type, tier, mass, reward, rp: Math.round(6 * tier * rnd(.8, 1.3)),
          client: pick(CLIENTS), left: 6 + Math.floor(Math.random() * 6)};
}
function refreshContracts() {
  const slots = 2 + S.fac.control;
  while (S.contracts.length < slots) S.contracts.push(genContract());
  // kontrak tier tertinggi yang terbuka selalu terlihat agar jalur upgrade terasa
  const mt = maxTierNow();
  if (mt > 1 && !S.contracts.some(c => c.tier >= mt)) {
    const c = genContract(); c.tier = mt;
    const mtp = MISSION_TYPES[c.type]; c.mass = Math.round(mtp.mass[mt - 1] * rnd(.85, 1.05));
    c.reward = Math.round(minRocketCost(c.mass, c.type === 'crew') * rnd(1.4, 1.6) * TIER_PREMIUM[mt - 1] / 100) * 100; c.rp = 6 * mt;
    S.contracts[S.contracts.length - 1] = c;
  }
  // selalu ada satelit kecil yang bisa dikerjakan roket termurah
  if (!S.contracts.some(c => c.type === 'sat' && c.mass <= 50)) {
    S.contracts[0] = {id: S.nextId++, type: 'sat', tier: 1, mass: 25, reward: 50000, rp: 6, client: 'Program Kampus Nusantara', left: 10};
  }
}

// ---------- Catatan keuangan harian (untuk grafik Markas) ----------
function fin(kind, n) {
  if (!S.fin) S.fin = [];
  let d = S.fin[S.fin.length - 1];
  if (!d || d.day !== S.day) { d = {day: S.day, inc: 0, exp: 0}; S.fin.push(d); if (S.fin.length > 14) S.fin.shift(); }
  d[kind] += Math.round(n);
}

// ---------- Log / toast ----------
function addLog(t) { S.log.unshift(`Hari ${S.day}: ${t}`); S.log.length = Math.min(S.log.length, 60); }
function toast(t) {
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = t;
  document.getElementById('toast-box').appendChild(d); setTimeout(() => d.remove(), 4000);
}

// ---------- Tick ----------
function advance(sec) {
  S.fuel = Math.min(fuelMax(), S.fuel + fuelRate() * sec);
  S.rp += rpRate() * sec;
  S.dayT += sec;
  let dayChanged = false;
  while (S.dayT >= DAY_SEC) {
    S.dayT -= DAY_SEC; S.day++; dayChanged = true;
    const sal = salary();
    S.money -= sal; fin('exp', sal);
    S.contracts.forEach(c => c.left--);
    const expired = S.contracts.filter(c => c.left <= 0).length;
    S.contracts = S.contracts.filter(c => c.left > 0);
    if (expired) { addLog(`${expired} kontrak kedaluwarsa.`); }
    if (Math.random() < .5) S.contracts.push(genContract());
    refreshContracts();
    if (S.money < 0) { S.rep = Math.max(0, S.rep - 1); }
    if (stuck()) toast('Uang & roket habis! Buka tab Misi: uji statis atau hibah darurat.');
  }
  return dayChanged;
}
function tick() {
  const dc = advance(1);
  updateTop();
  if (dc) render();
  else updateLive();
}

// ---------- Actions ----------
function buildFac(k) {
  const lvl = S.fac[k]; if (lvl >= FAC[k].max) return;
  const c = facCost(k, lvl + 1); if (S.money < c) return;
  S.money -= c; fin('exp', c); S.fac[k]++; addLog(`${FAC[k].n} ditingkatkan ke Lv${S.fac[k]}.`); toast(`${FAC[k].n} → Lv${S.fac[k]}`);
  if (k === 'control') refreshContracts();
  render(); save();
}
function hire(k) {
  if (staffCount() >= staffCap() || S.money < STAFF[k].hire) return;
  S.money -= STAFF[k].hire; fin('exp', STAFF[k].hire); S.staff[k]++; toast(`${STAFF[k].n} direkrut`); render(); save();
}
function fire(k) { if (S.staff[k] > 0) { S.staff[k]--; render(); save(); } }
function research(id) {
  const t = TECH[id];
  if (S.tech[id] || S.rp < t.c || !t.r.every(x => S.tech[x])) return;
  S.rp -= t.c; S.tech[id] = true; addLog(`Riset selesai: ${t.n}.`); toast(`Riset selesai: ${t.n}`); render(); save();
}
function buildRocket() {
  const cap = document.getElementById('b-cap') && document.getElementById('b-cap').checked;
  makeRocket(val('b-engine'), val('b-tank'), val('b-guide'), cap);
}
function makeRocket(e, t, g, cap) {
  const cost = rocketCost(e, t, g, cap);
  if (ENGINES[e].tier > S.fac.pad) return toast(`Mesin ${ENGINES[e].n} butuh Launch Pad Lv${ENGINES[e].tier}. Upgrade pad dulu.`);
  if (S.rockets.length >= S.fac.hangar) return toast('Hanger penuh. Upgrade hangar.');
  if (S.money < cost) return toast('Uang tidak cukup.');
  S.money -= cost; fin('exp', cost);
  const r = {id: S.nextId++, engine: e, tank: t, guide: g, capsule: !!cap};
  r.name = `${ENGINES[e].n}-${r.id}`;
  S.rockets.push(r); addLog(`Roket ${r.name} dirakit.`); toast(`Roket ${r.name} siap`);
  render(); save();
}
// Roket termurah (komponen yang sudah terbuka) yang cukup untuk muatan tertentu.
function cheapestFor(mass, crew) {
  let best = null;
  for (const [e, E] of Object.entries(ENGINES)) for (const [t, T] of Object.entries(TANKS)) {
    if (!unlocked(E) || !unlocked(T) || E.tier > S.fac.pad) continue;
    if (Math.round(E.thrust * 0.6 + T.cap * 1.2) < mass) continue;
    const cost = rocketCost(e, t, 'g1', crew);
    if (!best || cost < best.cost) best = {e, t, cost};
  }
  return best;
}
function quickBuild(cid) {
  const c = cid ? S.contracts.find(x => x.id === cid) : null;
  const b = cheapestFor(c ? c.mass : 0, c && c.type === 'crew');
  if (!b) return toast('Belum ada komponen yang cukup. Riset atau upgrade pad dulu.');
  makeRocket(b.e, b.t, 'g1', c && c.type === 'crew');
}

function scrap(id) {
  const r = S.rockets.find(x => x.id === id); if (!r) return;
  const refund = Math.round(rocketCost(r.engine, r.tank, r.guide, r.capsule) * .4); S.money += refund; fin('inc', refund);
  S.rockets = S.rockets.filter(x => x.id !== id); render(); save();
}
const CHEAPEST = () => ENGINES.e1.cost + TANKS.t1.cost + GUIDE.g1.cost;
const stuck = () => S.money < CHEAPEST() && S.rockets.length === 0;
function staticTest() {
  const wait = 15000 - (Date.now() - (S.testAt || 0));
  if (wait > 0) return toast(`Tim uji masih bersiap, tunggu ${Math.ceil(wait / 1000)} dtk.`);
  const gain = 2000 + S.fac.pad * 500 + S.staff.eng * 200;
  S.money += gain; fin('inc', gain); S.testAt = Date.now(); toast(`Uji statis selesai: +${fmt(gain)}`); updateTop(); save();
}
function emergencyGrant() {
  if (!stuck()) return toast('Hibah hanya untuk saat uang dan roket habis.');
  const wait = 3 * DAY_SEC - ((S.day - (S.grantDay || -99)) * DAY_SEC - S.dayT);
  if (S.grantDay && S.day - S.grantDay < 3) return toast('Hibah baru bisa diajukan lagi dalam beberapa hari.');
  const target = CHEAPEST() + 10000;
  fin('inc', target - Math.max(S.money, 0)); S.money = target; S.grantDay = S.day;
  addLog(`Hibah darurat pemerintah diterima: uang jadi ${fmt(S.money)}.`); toast('Hibah darurat diterima!'); render(); save();
}
const val = id => document.getElementById(id).value;

let launching = false;
function launch(cid, rocketId) {
  if (launching) return;
  const c = S.contracts.find(x => x.id === cid);
  const sel = document.getElementById('sel-' + cid);
  const rid = rocketId || (sel ? +sel.value : 0);
  const r = S.rockets.find(x => x.id === rid);
  if (!c || !r) return toast('Pilih roket dulu.');
  if (rocketCap(r) < c.mass) return toast('Daya angkut roket kurang.');
  if (c.type === 'crew' && !r.capsule) return toast('Butuh roket dengan kapsul awak.');
  if (ENGINES[r.engine].tier > S.fac.pad) return toast('Launch pad terlalu rendah untuk mesin ini.');
  const need = fuelUse(r);
  if (S.fuel < need) return toast(`Bahan bakar kurang (butuh ${need}).`);
  S.fuel -= need;
  S.rockets = S.rockets.filter(x => x.id !== r.id);
  S.contracts = S.contracts.filter(x => x.id !== c.id);
  const p = reliability(r, c);
  const ok = Math.random() < p;
  animateLaunch(r, c, p, ok, relText(r, c));
}
function animateLaunch(r, c, p, ok, info) {
  launching = true;
  const ov = document.getElementById('launch-overlay'), tx = document.getElementById('launch-text'), cl = document.getElementById('launch-close');
  const sky = ov.querySelector('.sky');
  ov.classList.remove('hidden'); cl.classList.add('hidden'); sky.className = 'sky';
  const rk = document.getElementById('launch-rocket'); rk.style.animation = 'none'; void rk.offsetWidth; rk.style.animation = '';
  let n = 3; tx.innerHTML = `<b>${r.name}</b> · peluang sukses <b>${Math.round(p * 100)}%</b><br><span class="mut" style="font-size:13px">${info}</span><br>T-${n}`;
  const iv = setInterval(() => {
    n--;
    if (n > 0) { tx.lastChild.textContent = `T-${n}`; return; }
    clearInterval(iv);
    tx.textContent = 'Lepas landas! 🔥';
    sky.classList.add(ok ? 'go' : 'go');
    setTimeout(() => finishLaunch(r, c, ok, tx, cl, sky), ok ? 3200 : 1700);
  }, 700);
}
function finishLaunch(r, c, ok, tx, cl, sky) {
  const cost = rocketCost(r.engine, r.tank, r.guide, r.capsule), fuel = fuelUse(r);
  const row = (a, b, cls) => `<tr><td style="text-align:left;padding-right:14px">${a}</td><td style="text-align:right" class="${cls || ''}">${b}</td></tr>`;
  let net, rows, gainNow = 0;
  if (ok) {
    const gain = Math.round(c.reward * rewardMul());
    S.money += gain; fin('inc', gain); S.rp += c.rp; S.rep += c.tier; S.stats.ok++; S.failStreak = 0; S.stats.earned += gain;
    const refund = Math.round(cost * ENGINES[r.engine].rec); S.money += refund; if (refund) fin('inc', refund);
    net = gain + refund - cost; gainNow = gain;
    rows = row('Pendapatan kontrak', '+' + fmt(gain), 'ok') + row('Biaya roket', '-' + fmt(cost), 'bad') + (refund ? row('Pemulihan booster ' + Math.round(ENGINES[r.engine].rec * 100) + '%', '+' + fmt(refund), 'ok') : '') + row('Bahan bakar terpakai', fmt(fuel) + ' BBM') + row('<b>Laba bersih</b>', `<b>${net >= 0 ? '+' : ''}${fmt(net)}</b>`, net >= 0 ? 'ok' : 'bad');
    tx.innerHTML = `✅ <b>Berhasil!</b> ${MISSION_TYPES[c.type].n} untuk ${c.client}<br>+🔬 ${c.rp} RP · +⭐ ${c.tier}<table style="margin:8px auto;font-size:14px">${rows}</table><span class="mut" style="font-size:12px">Margin ${Math.round(net / cost * 100)}% di atas biaya roket. Gaji staf dibayar terpisah per hari.</span>`;
    addLog(`SUKSES ${MISSION_TYPES[c.type].n} (${c.client}): pendapatan ${fmt(gain)}, laba bersih ${fmt(net)}.`);
  } else {
    const repair = 4000 * S.fac.pad;
    S.money -= repair; fin('exp', repair); S.rep = Math.max(0, S.rep - 2); S.stats.fail++; S.failStreak = (S.failStreak || 0) + 1;
    net = -(cost + repair);
    rows = row('Pendapatan kontrak', '0') + row('Roket hilang', '-' + fmt(cost), 'bad') + row('Perbaikan pad', '-' + fmt(repair), 'bad') + row('<b>Laba bersih</b>', `<b>${fmt(net)}</b>`, 'bad');
    tx.innerHTML = `💥 <b>Gagal!</b> ${r.name} meledak di udara. -⭐ 2<table style="margin:8px auto;font-size:14px">${rows}</table>`;
    addLog(`GAGAL ${MISSION_TYPES[c.type].n} (${c.client}): roket hilang, rugi ${fmt(-net)}.`);
    sky.classList.add('boom');
  }
  S.stats.net = (S.stats.net || 0) + net;
  if (ok) { S.stats.streak = (S.stats.streak || 0) + 1; S.stats.maxStreak = Math.max(S.stats.maxStreak || 0, S.stats.streak); S.stats.bestGain = Math.max(S.stats.bestGain || 0, gainNow); S.stats.bestNet = Math.max(S.stats.bestNet || -Infinity, net); } else S.stats.streak = 0;
  (S.history = S.history || []).unshift({day: S.day, type: c.type, client: c.client, ok, net, rocket: r.name});
  S.history.length = Math.min(S.history.length, 12);
  cl.classList.remove('hidden');
  refreshContracts(); updateTop(); save();
}

// ---------- Rendering ----------
const TABS = [['base', '🏠 Markas'], ['fac', '🏗️ Fasilitas'], ['staff', '👥 Staf'], ['tech', '🔬 Riset'], ['hangar', '🛠️ Hanger'], ['mis', '🎯 Misi'], ['log', '📜 Log']];
function updateTop() {
  const $ = id => document.getElementById(id);
  $('s-money').textContent = fmt(S.money); $('s-money').className = S.money < 0 ? 'bad' : '';
  $('s-rp').textContent = fmt(S.rp); $('s-fuel').textContent = fmt(S.fuel); $('s-fuelmax').textContent = fmt(fuelMax());
  $('s-rep').textContent = S.rep; $('s-day').textContent = S.day;
  document.querySelectorAll('[data-cost]').forEach(b => { b.disabled = S.money < +b.dataset.cost || b.dataset.off === '1'; });
  document.querySelectorAll('[data-rp]').forEach(b => { b.disabled = S.rp < +b.dataset.rp || b.dataset.off === '1'; });
}
function updateLive() {
  const l = document.getElementById('live-base');
  if (l) l.innerHTML = baseLive();
}
const barHtml = (v, m) => `<div class="bar"><i style="width:${Math.min(100, v / m * 100)}%"></i></div>`;
function baseLive() {
  return `<p>⛽ Bahan bakar: <b>${fmt(S.fuel)}/${fmt(fuelMax())}</b> (+${fuelRate().toFixed(2)}/dtk)</p>${barHtml(S.fuel, fuelMax())}
  <p>🔬 Riset: +${rpRate().toFixed(2)} RP/dtk · Hari berikutnya: ${Math.ceil(DAY_SEC - S.dayT)} dtk</p>${barHtml(S.dayT, DAY_SEC)}`;
}
function bestRocketFor(c) {
  let best = null;
  S.rockets.forEach(r => {
    if (rocketCap(r) < c.mass || (c.type === 'crew' && !r.capsule) || ENGINES[r.engine].tier > S.fac.pad) return;
    if (!best || reliability(r, c) > reliability(best, c)) best = r;
  });
  return best;
}
function recommended() {
  return S.contracts.map(c => {
    const r = bestRocketFor(c), gain = Math.round(c.reward * rewardMul());
    if (!r) return {c, r: null, gain, ev: -Infinity, min: minRocketCost(c.mass, c.type === 'crew'), ch: cheapestFor(c.mass, c.type === 'crew')};
    const p = reliability(r, c), cost = rocketCost(r.engine, r.tank, r.guide, r.capsule);
    return {c, r, p, gain, cost, ev: p * gain - cost - (1 - p) * 4000 * S.fac.pad};
  }).sort((a, b) => (b.ev - a.ev) || (b.gain - a.gain));
}
function warnings() {
  const w = [], sal = salary();
  if (S.money < 0) w.push(['bad', `Uang minus (${fmt(S.money)}). Reputasi turun tiap hari sampai saldo positif.`]);
  if (stuck()) w.push(['bad', 'Uang dan roket habis. Ajukan Hibah Darurat di tab Misi (tombol H).']);
  if (!S.rockets.length) w.push(['warn', 'Hanger kosong. Rakit roket agar bisa meluncur.']);
  const need = S.rockets.length ? Math.min(...S.rockets.map(fuelUse)) : TANKS.t1.cap;
  if (S.fuel < need) w.push(['warn', `Bahan bakar menipis (${fmt(S.fuel)}/${need} dibutuhkan). Upgrade pabrik bahan bakar atau tunggu.`]);
  if (sal > 0 && S.money >= 0 && S.money < sal * 3) w.push(['warn', `Uang mepet gaji: cukup untuk ${Math.floor(S.money / sal)} hari (gaji ${fmt(sal)}/hari).`]);
  if (staffCount() >= staffCap()) w.push(['info', 'Kapasitas staf penuh. Upgrade Control Center atau Lab untuk menambah.']);
  if (S.rockets.length >= S.fac.hangar) w.push(['info', 'Hanger penuh.']);
  if (!w.length) w.push(['ok', 'Semua sistem normal.']);
  return w;
}
function bestUpgrade() {
  const order = [];
  if (S.fuel < 40 || fuelRate() < 0.5) order.push('fuel');
  if (Object.values(ENGINES).some(e => unlocked(e) && e.tier > S.fac.pad)) order.push('pad');
  order.push('control', 'lab', 'fuel', 'pad');
  if (S.rockets.length >= S.fac.hangar) order.unshift('hangar');
  const k = order.find(x => S.fac[x] < FAC[x].max);
  return k ? {k, cost: facCost(k, S.fac[k] + 1)} : null;
}
function finChart() {
  const d = (S.fin || []).slice(-10);
  if (!d.length) return '<p class="mut">Belum ada data keuangan.</p>';
  const W = 440, H = 150, pad = 22, max = Math.max(1000, ...d.map(x => Math.max(x.inc, x.exp)));
  const bw = (W - pad) / d.length, bars = d.map((x, i) => {
    const hi = x.inc / max * (H - 30), he = x.exp / max * (H - 30), w = Math.min(bw / 2 - 5, 20), x0 = pad + i * bw + (bw - 2 * w - 2) / 2;
    return `<rect x="${x0}" y="${H - 18 - hi}" width="${w}" height="${hi}" fill="var(--ok)"><title>Hari ${x.day}: masuk ${fmt(x.inc)}</title></rect>
    <rect x="${x0 + w + 2}" y="${H - 18 - he}" width="${w}" height="${he}" fill="var(--bad)"><title>Hari ${x.day}: keluar ${fmt(x.exp)}</title></rect>
    <text x="${x0 + w}" y="${H - 4}" text-anchor="middle" font-size="10" fill="var(--mut)">${x.day}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:520px;height:auto" role="img" aria-label="Pemasukan dan pengeluaran per hari"><line x1="${pad}" x2="${W}" y1="${H - 18}" y2="${H - 18}" stroke="var(--line)"/><text x="0" y="12" font-size="10" fill="var(--mut)">${fmt(max)}</text>${bars}</svg>
  <p class="mut"><span class="ok">■</span> pemasukan &nbsp; <span class="bad">■</span> pengeluaran (per hari)</p>`;
}
function viewBase() {
  const sal = salary(), runway = sal ? Math.floor(Math.max(S.money, 0) / sal) + ' hari' : '∞';
  const fd = (S.fin || []).slice(-7), inc = fd.reduce((a, x) => a + x.inc, 0), exp = fd.reduce((a, x) => a + x.exp, 0);
  const st = S.stats, total = st.ok + st.fail, rate = total ? Math.round(st.ok / total * 100) : 0;
  const W = warnings().map(([l, t]) => `<div class="warn ${l}">${{bad: '⛔', warn: '⚠️', info: 'ℹ️', ok: '✅'}[l]} ${t}</div>`).join('');
  const rec = recommended().slice(0, 3).map(x => {
    const mt = MISSION_TYPES[x.c.type];
    return `<div class="rec"><b>${mt.i} ${mt.n}</b> <span class="pill">T${x.c.tier}</span> <span class="mut">${x.c.client} · massa ${x.c.mass} · ${x.c.left} hari</span><br>
      Hadiah <b class="ok">${fmt(x.gain)}</b> ·
      ${x.r ? `${x.r.name}: peluang <b>${Math.round(x.p * 100)}%</b> · laba bersih ${x.gain - x.cost >= 0 ? '+' : ''}${fmt(x.gain - x.cost)}<br><button class="btn" data-act="launch" data-k="${x.c.id}" data-rid="${x.r.id}">🚀 Luncurkan</button>`
        : (x.ch ? `belum punya roket yang cocok<br><button class="btn alt" data-act="qbuild" data-k="${x.c.id}" data-cost="${x.ch.cost}">🛠️ Rakit roket untuk misi ini · ${fmt(x.ch.cost)}</button>`
          : `<span class="bad">butuh komponen/pad yang belum terbuka</span> (roket ≥ ${fmt(x.min)})`)}</div>`;
  }).join('') || '<p class="mut">Tidak ada kontrak.</p>';
  const up = bestUpgrade();
  const facRows = Object.keys(FAC).map(k => `<div>${FAC[k].i} ${FAC[k].n} <b>Lv ${S.fac[k]}/${FAC[k].max}</b>${barHtml(S.fac[k], FAC[k].max)}</div>`).join('');
  const hist = (S.history || []).map(h => `<tr><td>Hari ${h.day}</td><td>${MISSION_TYPES[h.type].i} ${h.client}</td><td>${h.ok ? '<span class="ok">Sukses</span>' : '<span class="bad">Gagal</span>'}</td><td style="text-align:right" class="${h.net >= 0 ? 'ok' : 'bad'}">${h.net >= 0 ? '+' : ''}${fmt(h.net)}</td></tr>`).join('');
  return `<div class="grid wide">
  <div class="card span">${W}</div>
  <div class="card span2"><h3>💰 Keuangan</h3>
    <div class="tiles"><div class="tile"><span class="mut">Saldo</span><b class="${S.money < 0 ? 'bad' : ''}">${fmt(S.money)}</b></div>
      <div class="tile"><span class="mut">Masuk 7 hari</span><b class="ok">${fmt(inc)}</b></div>
      <div class="tile"><span class="mut">Keluar 7 hari</span><b class="bad">${fmt(exp)}</b></div>
      <div class="tile"><span class="mut">Gaji / hari</span><b>${fmt(sal)}</b></div>
      <div class="tile"><span class="mut">Cukup untuk</span><b>${runway}</b></div>
      <div class="tile"><span class="mut">Laba bersih misi</span><b class="${(st.net || 0) >= 0 ? 'ok' : 'bad'}">${fmt(st.net || 0)}</b></div></div>
    ${finChart()}</div>
  <div class="card span2"><h3>🎯 Misi Direkomendasikan</h3>${rec}</div>
  <div class="card"><h3>⚡ Aksi Cepat</h3>
    <button class="btn alt" data-act="qbuild" data-k="" data-cost="${CHEAPEST()}">🛠️ Rakit roket termurah</button><br>
    <button class="btn" data-act="test">🔥 Uji statis (+uang)</button><br>
    ${up ? `<button class="btn" data-act="fac" data-k="${up.k}" data-cost="${up.cost}">⬆️ ${FAC[up.k].n} Lv${S.fac[up.k] + 1} · ${fmt(up.cost)}</button>` : '<p class="ok">Semua fasilitas maksimum.</p>'}
    <p class="mut" style="margin-top:8px">Upgrade yang disarankan menyesuaikan kondisi (bahan bakar, pad, control center).</p>${engineAdvice()}</div>
  <div class="card"><h3>🏗️ Fasilitas & Staf</h3>${facRows}
    <p class="mut">Staf ${staffCount()}/${staffCap()} · 🛠️ ${S.staff.eng} · 🧪 ${S.staff.sci} · 🔧 ${S.staff.tech}<br>Roket di hanger ${S.rockets.length}/${S.fac.hangar}</p>
    <div id="live-base">${baseLive()}</div></div>
  <div class="card"><h3>📜 Peluncuran Terakhir</h3>${hist ? `<table class="hist">${hist}</table>` : '<p class="mut">Belum ada peluncuran.</p>'}</div>
  <div class="card"><h3>📊 Statistik & Rekor</h3>
    <p>Peluncuran: <b>${total}</b> (<span class="ok">${st.ok}</span> sukses / <span class="bad">${st.fail}</span> gagal)</p>
    <p>Tingkat keberhasilan: <b>${rate}%</b>${barHtml(rate, 100)}</p>
    <p>Beruntun sukses: <b>${st.streak || 0}</b> · rekor <b>${st.maxStreak || 0}</b></p>
    <p>Hadiah terbesar: <b>${fmt(st.bestGain || 0)}</b></p>
    <p>Laba bersih terbaik: <b>${st.bestNet == null || st.bestNet === -Infinity ? '-' : fmt(st.bestNet)}</b></p>
    <p>Total pendapatan: <b class="ok">${fmt(st.earned)}</b> · Hari ke-${S.day} · ⭐ ${S.rep}</p></div>
  </div>`;
}
function viewFac() {
  return `<h2>Fasilitas</h2><div class="grid">${Object.keys(FAC).map(k => {
    const f = FAC[k], lvl = S.fac[k], maxed = lvl >= f.max, c = facCost(k, lvl + 1);
    return `<div class="card"><h3>${f.i} ${f.n} <span class="pill">Lv ${lvl}/${f.max}</span></h3><p class="mut">${f.d}</p>
      ${maxed ? '<p class="ok">Level maksimum</p>' : `<button class="btn" data-act="fac" data-k="${k}" data-cost="${c}">Upgrade 💰 ${fmt(c)}</button>`}</div>`;
  }).join('')}</div>`;
}
function viewStaff() {
  return `<h2>Staf <span class="pill">${staffCount()}/${staffCap()}</span></h2>
  <p class="mut">Kapasitas staf naik dengan level Control Center dan Lab. Gaji dibayar tiap hari.</p>
  <div class="grid">${Object.keys(STAFF).map(k => {
    const s = STAFF[k], full = staffCount() >= staffCap();
    return `<div class="card"><h3>${s.i} ${s.n}: ${S.staff[k]}</h3><p class="mut">${s.d}</p><p>Gaji: ${fmt(s.sal)}/hari</p>
    <button class="btn" data-act="hire" data-k="${k}" data-cost="${s.hire}" ${full ? 'data-off="1" disabled' : ''}>Rekrut 💰 ${fmt(s.hire)}</button>
    <button class="btn danger" data-act="fire" data-k="${k}" ${S.staff[k] ? '' : 'disabled'}>Pecat</button></div>`;
  }).join('')}</div>`;
}
function viewTech() {
  return `<h2>Pohon Teknologi</h2><div class="grid">${Object.keys(TECH).map(id => {
    const t = TECH[id], done = S.tech[id], ready = t.r.every(x => S.tech[x]);
    return `<div class="card ${done ? 'done' : ready ? '' : 'locked'}"><h3>${t.n}</h3><p class="mut">${t.d}</p>
    ${t.r.length ? `<p class="mut">Syarat: ${t.r.map(x => TECH[x].n).join(', ')}</p>` : ''}
    ${done ? '<p class="ok">✔ Selesai</p>' : `<button class="btn alt" data-act="tech" data-k="${id}" data-rp="${t.c}" ${ready ? '' : 'data-off="1" disabled'}>Riset 🔬 ${t.c}</button>`}</div>`;
  }).join('')}</div>`;
}
function opts(obj, sel) {
  return Object.keys(obj).filter(k => unlocked(obj[k])).map(k => `<option value="${k}" ${k === sel ? 'selected' : ''}>${obj[k].n}${obj[k].tier > S.fac.pad ? ` (butuh Pad Lv${obj[k].tier})` : ''}</option>`).join('');
}
// Perbandingan mesin untuk satu kontrak: roket termurah per mesin, peluang, laba/misi.
function targetContract() {
  return S.contracts.slice().sort((a, b) => (b.tier - a.tier) || (b.reward - a.reward))[0] || null;
}
function enginePlans(c) {
  const crew = c.type === 'crew', gain = Math.round(c.reward * rewardMul()), repair = 4000 * S.fac.pad;
  return Object.entries(ENGINES).map(([e, E]) => {
    let best = null;
    for (const [t, T] of Object.entries(TANKS)) {
      if (Math.round(E.thrust * 0.6 + T.cap * 1.2) < c.mass) continue;
      const cost = rocketCost(e, t, 'g1', crew); if (!best || cost < best.cost) best = {t, cost};
    }
    const need = [];
    if (E.tech && !S.tech[E.tech]) need.push({type: 'tech', id: E.tech});
    if (E.tier > S.fac.pad) need.push({type: 'pad'});
    if (!best) return {e, E, ok: false, need};
    const T = TANKS[best.t];
    if (T.tech && !S.tech[T.tech]) need.push({type: 'tech', id: T.tech});
    const p = reliability({engine: e, tank: best.t, guide: 'g1', capsule: crew}, c), refund = Math.round(best.cost * E.rec);
    const fuel = Math.ceil(T.cap * E.fuel * (S.tech.fuel1 ? .75 : 1));
    const ev = p * (gain + refund) - best.cost - (1 - p) * repair, cycle = Math.max(20, fuel / fuelRate());
    return {e, E, ok: true, t: best.t, cost: best.cost, p, refund, fuel, gain, ev, cycle, score: ev / cycle * 60, need};
  });
}
const needBtns = need => need.map(n => n.type === 'tech'
  ? `<button class="btn alt" data-act="tech" data-k="${n.id}" data-rp="${TECH[n.id].c}" ${TECH[n.id].r.every(x => S.tech[x]) ? '' : 'data-off="1" disabled'}>Riset ${TECH[n.id].n} 🔬${TECH[n.id].c}</button>`
  : `<button class="btn" data-act="fac" data-k="pad" data-cost="${facCost('pad', S.fac.pad + 1)}" ${S.fac.pad >= FAC.pad.max ? 'disabled' : ''}>Upgrade Pad Lv${S.fac.pad + 1} 💰${fmt(facCost('pad', S.fac.pad + 1))}</button>`).join(' ');
function engineCard() {
  const c = targetContract();
  if (!c) return '';
  const plans = enginePlans(c), ready = plans.filter(p => p.ok && !p.need.length), cur = ready.sort((a, b) => b.score - a.score)[0];
  const mt = MISSION_TYPES[c.type];
  const rows = plans.map(p => {
    if (!p.ok) return `<tr class="dim"><td>${p.E.n}</td><td colspan="6" class="mut">Tidak cukup untuk muatan ${c.mass}</td></tr>`;
    const d = cur ? p.score - cur.score : null;
    return `<tr class="${p.need.length ? 'dim' : ''}"><td><b>${p.E.n}</b><br><span class="mut">${TANKS[p.t].n}</span></td><td>${fmt(p.cost)}</td><td>${Math.round(p.p * 100)}%</td><td>${p.fuel}<br><span class="mut">isi ${Math.round(p.cycle)} dtk</span></td><td>${p.E.rec ? Math.round(p.E.rec * 100) + '%' : '-'}</td>
      <td class="${p.score >= 0 ? 'ok' : 'bad'}"><b>${p.score >= 0 ? '+' : ''}${fmt(p.score)}/mnt</b><br><span class="mut">${fmt(p.ev)}/misi${cur && p !== cur ? ` · ${d >= 0 ? '+' : ''}${fmt(d)}/mnt vs ${cur.E.n}` : cur ? ' · terbaik saat ini' : ''}</span></td>
      <td>${p.need.length ? needBtns(p.need) : '<span class="ok">✅ Siap</span>'}</td></tr>`;
  }).join('');
  return `<div class="card span"><h3>🔧 Jalur Upgrade Mesin</h3>
    <p class="mut">Perbandingan untuk kontrak ${mt.i} ${mt.n} Tier ${c.tier} (${c.client}, massa ${c.mass}, hadiah ${fmt(c.reward * rewardMul())}). Laba dihitung rata-rata (peluang sukses, pemulihan booster, dan risiko gagal sudah masuk) dan dibagi waktu menunggu bahan bakar terisi, jadi mesin hemat BBM bisa meluncur jauh lebih sering. Mesin lebih baik = peluang lebih tinggi, BBM lebih hemat, sebagian roket dipulihkan, dan membuka muatan yang tak terjangkau Kestrel-1.</p>
    <div style="overflow-x:auto"><table class="hist eng"><tr><th>Mesin</th><th>Biaya roket</th><th>Peluang</th><th>BBM</th><th>Pulih</th><th>Laba (per menit)</th><th>Syarat</th></tr>${rows}</table></div></div>`;
}
function engineAdvice() {
  const c = targetContract(); if (!c) return '';
  const plans = enginePlans(c).filter(p => p.ok), ready = plans.filter(p => !p.need.length).sort((a, b) => b.score - a.score)[0];
  const best = plans.slice().sort((a, b) => b.score - a.score)[0];
  if (!best || (ready && best.e === ready.e)) return `<p class="ok">🔧 Mesin ${ready ? ready.E.n : ''} sudah paling menguntungkan untuk kontrak teratas.</p>`;
  const gainTxt = ready ? `laba ${fmt(best.score)}/mnt vs ${fmt(ready.score)}/mnt sekarang (+${fmt(best.score - ready.score)})` : `satu-satunya yang sanggup mengangkut muatan ${c.mass}`;
  return `<div class="advice"><b>🔧 Upgrade mesin disarankan: ${best.E.n}</b><br><span class="mut">Kontrak T${c.tier} ${c.client}: ${gainTxt}.</span><br>${needBtns(best.need)}</div>`;
}
function viewHangar() {
  const bs = window._bsel || {};
  const e = bs.e || 'e1', t = bs.t || 't1', g = bs.g || 'g1', cp = !!bs.cp;
  const cost = rocketCost(e, t, g, cp);
  const cap = Math.round(ENGINES[e].thrust * .6 + TANKS[t].cap * 1.2);
  return `<h2>Hanger <span class="pill">${S.rockets.length}/${S.fac.hangar}</span></h2><div class="grid wide">${engineCard()}
  <div class="card"><h3>Rakit Roket Baru</h3>
    <label>Mesin</label><select id="b-engine" data-act="bsel">${opts(ENGINES, e)}</select>
    <label>Tangki</label><select id="b-tank" data-act="bsel">${opts(TANKS, t)}</select>
    <label>Panduan</label><select id="b-guide" data-act="bsel">${opts(GUIDE, g)}</select>
    ${S.tech.life1 ? `<label class="chk"><input type="checkbox" id="b-cap" data-act="bsel" ${cp ? 'checked' : ''}> Kapsul awak (+${fmt(CAPSULE_COST)})</label>` : ''}
    <p class="mut">Daya angkut: <b>${cap}</b> · Keandalan dasar: <b>${Math.round(reliability({engine: e, tank: t, guide: g}) * 100)}%</b> · Mesin butuh Pad Lv${ENGINES[e].tier} · Bahan bakar ${Math.ceil(TANKS[t].cap * (S.tech.fuel1 ? .75 : 1))}</p>
    <button class="btn" data-act="build" data-cost="${cost}" ${S.rockets.length >= S.fac.hangar ? 'data-off="1" disabled' : ''}>Rakit 💰 ${fmt(cost)}</button></div>
  ${S.rockets.map(r => `<div class="card"><h3>🚀 ${r.name}</h3>
    <p>${ENGINES[r.engine].n} · ${TANKS[r.tank].n} · ${GUIDE[r.guide].n}${r.capsule ? ' · Kapsul' : ''}</p>
    <p class="mut">Angkut ${rocketCap(r)} · Keandalan ${Math.round(reliability(r) * 100)}% · BBM ${fuelUse(r)}</p>
    <button class="btn danger" data-act="scrap" data-k="${r.id}">Bongkar (+40% biaya)</button></div>`).join('')}</div>`;
}
function viewMis() {
  const list = S.contracts.map(c => {
    const mt = MISSION_TYPES[c.type];
    const ok = S.rockets.filter(r => rocketCap(r) >= c.mass && (c.type !== 'crew' || r.capsule) && ENGINES[r.engine].tier <= S.fac.pad);
    return `<div class="card"><h3>${mt.i} ${mt.n} <span class="pill">Tier ${c.tier}</span></h3>
    <p>${c.client}</p><p class="mut">Massa ${c.mass} · Sisa ${c.left} hari</p>
    <p>Hadiah: <b class="ok">💰 ${fmt(c.reward * rewardMul())}</b> · 🔬 ${c.rp}</p>
    <p class="mut">Roket termurah yang cukup: 💰 ${fmt(minRocketCost(c.mass, c.type === 'crew'))}</p>
    ${ok.length ? `<details class="mut"><summary>Rincian peluang (roket terpilih)</summary><div>${relText(ok[0], c)}</div></details><select id="sel-${c.id}" data-act="misel" data-k="${c.id}">${ok.map(r => `<option value="${r.id}">${r.name} (${Math.round(reliability(r, c) * 100)}%)</option>`).join('')}</select>
    <button class="btn" data-act="launch" data-k="${c.id}">🚀 Luncurkan</button>`
      : '<p class="bad">Tidak ada roket yang cocok (angkut/kapsul/pad).</p>'}</div>`;
  }).join('');
  const help = `<div class="card"><h3>💡 Cari Uang</h3>
    <p class="mut">Uji statis mesin: pekerjaan kecil yang selalu tersedia (jeda 15 dtk), tanpa roket.</p>
    <button class="btn alt" data-act="test">🔥 Uji Statis Mesin</button>
    ${stuck() ? `<p class="bad" style="margin-top:8px">Uang dan roket habis!</p><button class="btn" data-act="grant">🏛️ Ajukan Hibah Darurat</button>` : '<p class="mut" style="margin-top:8px">Hibah darurat muncul jika uang kurang dari harga roket termurah dan hanger kosong.</p>'}</div>`;
  return `<h2>Kontrak Misi</h2><p class="mut">Persentase = peluang sukses roket untuk misi tersebut.</p><div class="grid">${help}${list || '<p class="mut">Tidak ada kontrak.</p>'}</div>`;
}
function viewLog() { return `<h2>Log</h2><div class="card log">${S.log.map(l => `<div>${l}</div>`).join('') || '<p class="mut">Kosong.</p>'}</div>
  <button class="btn danger" data-act="reset" style="margin-top:14px">Reset game</button>`; }

function render() {
  const tabs = document.getElementById('tabs');
  tabs.innerHTML = TABS.map(([k, n], i) => { const sp = n.indexOf(' '); return `<button data-act="tab" data-k="${k}" data-key="${i + 1}" title="${n.slice(sp + 1)} (${i + 1})" class="${S.tab === k ? 'on' : ''}"><span class="ico">${n.slice(0, sp)}</span><span class="lbl">${n.slice(sp + 1)}</span><kbd>${i + 1}</kbd></button>`; }).join('')
    + `<button data-act="guide" id="guide-btn" title="Petunjuk bermain (N)"><span class="ico">📖</span><span class="lbl">Petunjuk</span><kbd>N</kbd></button>`;
  const v = {base: viewBase, fac: viewFac, staff: viewStaff, tech: viewTech, hangar: viewHangar, mis: viewMis, log: viewLog}[S.tab];
  // preserve rocket selection in missions across re-renders is unnecessary; day change resets it
  document.getElementById('view').innerHTML = v();
  assignKeys();
  updateTop();
}

// ---------- Events ----------
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.tagName === 'SELECT' || b.type === 'checkbox') return;
  const k = b.dataset.k, a = b.dataset.act;
  if (a === 'tab') { S.tab = k; render(); document.getElementById('content').scrollTop = 0; }
  else if (a === 'fac') buildFac(k);
  else if (a === 'hire') hire(k);
  else if (a === 'fire') fire(k);
  else if (a === 'tech') research(k);
  else if (a === 'build') buildRocket();
  else if (a === 'scrap') scrap(+k);
  else if (a === 'launch') launch(+k, b.dataset.rid ? +b.dataset.rid : undefined);
  else if (a === 'qbuild') quickBuild(k ? +k : null);
  else if (a === 'test') staticTest();
  else if (a === 'grant') emergencyGrant();
  else if (a === 'guide') openGuide(-1);
  else if (a === 'reset') { if (confirm('Hapus semua progres?')) { const off = S.guideOff; localStorage.removeItem(SAVE_KEY + (AUTH.user ? '_' + AUTH.user : '')); S = newState(); S.guideOff = off; refreshContracts(); render(); save(); if (!off) openGuide(-1); } }
});
document.addEventListener('change', e => {
  if (e.target.dataset.act === 'bsel') {
    window._bsel = {e: val('b-engine'), t: val('b-tank'), g: val('b-guide'), cp: !!(document.getElementById('b-cap') || {}).checked};
    render();
  }
});
document.getElementById('launch-close').onclick = () => {
  document.getElementById('launch-overlay').classList.add('hidden'); launching = false; render();
};

// ---------- Shortcut keyboard ----------
const FAC_KEYS = {pad: 'P', hangar: 'H', lab: 'L', fuel: 'B', control: 'C'};
const HIRE_KEYS = {eng: 'I', sci: 'U', tech: 'T'};
const TECH_KEYS = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'D'];
const LAUNCH_KEYS = ['L', 'K', 'J', 'G', 'F', 'D', 'B'];
function tag(btn, key) {
  if (!key || btn.querySelector('kbd')) return;
  btn.dataset.key = key.toLowerCase();
  const k = document.createElement('kbd'); k.textContent = key; btn.appendChild(k);
}
function assignKeys() {
  const view = document.getElementById('view');
  const techIds = Object.keys(TECH);
  let li = 0;
  view.querySelectorAll('button[data-act]').forEach(b => {
    const a = b.dataset.act, k = b.dataset.k;
    if (a === 'fac') { if (S.tab === 'fac' || S.tab === 'base') tag(b, FAC_KEYS[k]); }
    else if (a === 'hire') tag(b, HIRE_KEYS[k]);
    else if (a === 'tech') { if (S.tab === 'tech') tag(b, TECH_KEYS[techIds.indexOf(k)]); }
    else if (a === 'build') tag(b, 'R');
    else if (a === 'test') tag(b, 'T');
    else if (a === 'grant') tag(b, 'H');
    else if (a === 'qbuild' && !k) tag(b, 'R');
    else if (a === 'launch') tag(b, LAUNCH_KEYS[li++]);
  });
}
const visible = el => el && !el.classList.contains('hidden');
function helpHtml() {
  const rows = [['1-7', 'Pindah tab'], ['S', 'Simpan sekarang'], ['N / F1', 'Buka petunjuk bermain'], ['?', 'Buka/tutup bantuan ini'], ['Esc / Enter', 'Tutup dialog']];
  const ctx = {
    fac: [['P H L B C', 'Upgrade Pad, Hangar, Lab, Bahan bakar, Control']],
    staff: [['I U T', 'Rekrut Insinyur, Ilmuwan, Teknisi']],
    tech: [['Q W E R T Y U I O P A D', 'Riset sesuai urutan kartu (huruf tampil di tombol)']],
    hangar: [['R', 'Rakit roket']],
    mis: [['L K J G F D B', 'Luncurkan kontrak sesuai urutan kartu'], ['T', 'Uji statis mesin'], ['H', 'Hibah darurat']],
  }[S.tab] || [];
  return '<h3>⌨️ Shortcut keyboard</h3><table>' + rows.concat([['—', 'Tab ini:']], ctx).map(r => `<tr><td><kbd class="inl">${r[0]}</kbd></td><td>${r[1]}</td></tr>`).join('') + '</table><p class="mut">Shortcut tidak aktif saat mengetik di kolom isian.</p><button class="btn" id="help-close">Tutup</button>';
}
function toggleHelp(force) {
  let h = document.getElementById('help');
  if (!h) { h = document.createElement('div'); h.id = 'help'; h.className = 'hidden'; document.body.appendChild(h); h.addEventListener('click', e => { if (e.target === h || e.target.id === 'help-close') toggleHelp(false); }); }
  const show = force === undefined ? !visible(h) || h.classList.contains('hidden') : force;
  if (show) { h.innerHTML = '<div class="box">' + helpHtml() + '</div>'; h.classList.remove('hidden'); } else h.classList.add('hidden');
}
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  const t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const help = document.getElementById('help'), lo = document.getElementById('launch-overlay'), auth = document.getElementById('auth'), guide = document.getElementById('guide');
  if (key === 'Escape' || (key === 'Enter' && visible(lo) && visible(document.getElementById('launch-close')))) {
    if (visible(guide)) { closeGuide(); e.preventDefault(); return; }
    if (visible(help)) return toggleHelp(false);
    const lc = document.getElementById('launch-close');
    if (visible(lo) && visible(lc)) { lc.click(); e.preventDefault(); }
    return;
  }
  if (visible(guide)) { if (key === 'ArrowRight') { guideGo(1); e.preventDefault(); } else if (key === 'ArrowLeft') { guideGo(-1); e.preventDefault(); } return; }
  if (key === 'F1' && started && !visible(auth) && !visible(lo)) { e.preventDefault(); return openGuide(-1); }
  if (typing || visible(auth) || visible(lo)) return;
  if (key === 'n' && started && !visible(help)) { e.preventDefault(); return openGuide(-1); }
  if (key === '?' || key === '/') { e.preventDefault(); return toggleHelp(); }
  if (visible(help)) return;
  if (!started) return;
  if (key === 's') { save(); toast('Progres disimpan.'); return; }
  if (/^[1-7]$/.test(key)) { S.tab = TABS[+key - 1][0]; render(); document.getElementById('content').scrollTop = 0; return; }
  const scope = document.getElementById('view');
  const btn = [...scope.querySelectorAll('button[data-key]')].find(b => b.dataset.key === key && !b.disabled);
  if (btn) { e.preventDefault(); btn.click(); }
});
(function () {
  const u = document.querySelector('.user');
  const b = document.createElement('button'); b.id = 'help-btn'; b.title = 'Shortcut keyboard'; b.innerHTML = '?<kbd>?</kbd>'; b.onclick = () => toggleHelp();
  u.insertBefore(b, document.getElementById('u-btn'));
})();

// ---------- Petunjuk bermain ----------
const TUTOR_STEPS = [
  {t: '📊 Bilah ringkasan', tx: 'Uang 💰, poin riset 🔬, bahan bakar ⛽, reputasi ⭐, dan hari 📅. Satu hari = 20 detik; gaji staf dipotong tiap hari.', sel: ['#summary .stats'], tab: 'base', side: ['bottom']},
  {t: '🧭 Menu tab', tx: 'Pindah layar lewat menu ini atau tekan angka <kbd class="inl">1</kbd>–<kbd class="inl">7</kbd>.', sel: ['#tabs'], side: ['right']},
  {t: '💰 Cara kerja uang', tx: 'Uang keluar untuk roket, upgrade, dan gaji. Uang masuk dari hadiah kontrak. Untung = hadiah − biaya roket; kalau gagal, roket hilang.', sel: ['#summary .stats span'], tab: 'base', side: ['bottom']},
  {t: '🛠️ Rakit roket', tx: 'Pilih mesin, tangki, dan panduan, lalu Rakit. Daya angkut harus ≥ massa muatan. Cara cepat: <b>Rakit roket termurah</b> di Markas (<kbd class="inl">R</kbd>).', sel: ['#view [data-act=build]'], tab: 'hangar'},
  {t: '🎯 Pilih kontrak', tx: 'Angka % = peluang sukses. Mulai dari satelit kecil; sukses menaikkan ⭐ dan membuka kontrak lebih besar.', sel: ['#view .grid > .card:nth-child(2)', '#view .card'], tab: 'mis', side: ['bottom', 'right', 'top']},
  {t: '🚀 Luncurkan', tx: 'Pilih roket lalu tekan <b>Luncurkan</b>. Pastikan bahan bakar ⛽ cukup.', sel: ['#view [data-act=launch]', '#view .grid > .card:nth-child(2)'], tab: 'mis', side: ['bottom', 'right', 'top']},
  {t: '⬆️ Upgrade fasilitas', tx: 'Launch Pad menentukan mesin terkuat, Control Center menambah keandalan.', sel: ['#view [data-act=fac]'], tab: 'fac'},
  {t: '🔬 Riset', tx: 'Poin riset membuka mesin, tangki, dan navigasi yang lebih baik.', sel: ['#view [data-act=tech]'], tab: 'tech'},
  {t: '🛟 Agar tidak bangkrut', tx: 'Awasi peringatan di Markas dan sisakan uang untuk gaji. Uang dan roket habis? Di tab Misi pakai Uji Statis (<kbd class="inl">T</kbd>) atau Hibah Darurat (<kbd class="inl">H</kbd>).', sel: ['#view .card.span'], tab: 'base', side: ['bottom', 'top']},
  {t: '📖 Buka lagi kapan saja', tx: 'Tombol <b>Petunjuk</b> (atau <kbd class="inl">N</kbd> / <kbd class="inl">F1</kbd>) membuka tur ini lagi.', sel: ['#guide-btn'], side: ['right']},
];
let guideStep = -1, guideTab0 = null, guideTimer = null;
function renderGuide() {
  const g = document.getElementById('guide'), n = TUTOR_STEPS.length;
  const off = `<label class="chk g-off"><input type="checkbox" id="guide-off" ${S.guideOff ? 'checked' : ''}> Jangan tampilkan lagi saat game baru</label><div class="mut">Esc untuk menutup · ← → untuk berpindah</div>`;
  if (guideStep < 0) {
    g.classList.remove('tour');
    g.innerHTML = `<div class="box"><h3>🚀 Selamat datang di ROKET Tycoon</h3>
      <p>Kelola base peluncuran: rakit roket, ambil kontrak, dan jaga kas tetap sehat. Mau tur singkat yang menunjuk bagian-bagian layar?</p>
      <div class="g-row"><button class="btn" data-g="start">Ikuti panduan</button><button class="btn alt" data-g="skip">Lewati, langsung main</button></div>${off}</div>`;
    const f = g.querySelector('[data-g]'); if (f) f.focus();
    return;
  }
  const s = TUTOR_STEPS[guideStep], last = guideStep === n - 1;
  if (s.tab && S.tab !== s.tab) { S.tab = s.tab; render(); }
  g.classList.add('tour');
  g.innerHTML = `<div class="g-spot"></div><div class="box g-pop"><i class="g-arrow"></i>
    <div class="mut">Langkah ${guideStep + 1} dari ${n}</div><h3>${s.t}</h3><p>${s.tx}</p>
    <div class="g-row">${guideStep > 0 ? '<button class="btn alt" data-g="prev">Kembali</button>' : ''}<button class="btn" data-g="${last ? 'skip' : 'next'}">${last ? 'Selesai, main!' : 'Lanjut'}</button>${last ? '' : '<button class="btn danger" data-g="skip">Lewati</button>'}</div>${off}</div>`;
  const f = g.querySelector('[data-g=next],[data-g=skip]'); if (f) f.focus({preventScroll: true});
  const el = guideTarget(s); if (el) el.scrollIntoView({block: 'center', inline: 'nearest'});
  placeTour();
}
function guideTarget(s) {
  for (const q of s.sel) { const el = document.querySelector(q); if (el) { const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) return el; } }
  return null;
}
function placeTour() {
  const g = document.getElementById('guide');
  if (!g || g.classList.contains('hidden') || !g.classList.contains('tour') || guideStep < 0) return;
  const pop = g.querySelector('.g-pop'), spot = g.querySelector('.g-spot'), arrow = g.querySelector('.g-arrow');
  if (!pop) return;
  const s = TUTOR_STEPS[guideStep], el = guideTarget(s), vw = window.innerWidth, vh = window.innerHeight, m = 10, gap = 16;
  pop.style.maxWidth = Math.min(340, vw - 2 * m) + 'px';
  const pw = pop.offsetWidth, ph = pop.offsetHeight, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  if (!el) { spot.style.display = 'none'; arrow.style.display = 'none'; pop.style.left = (vw - pw) / 2 + 'px'; pop.style.top = Math.max(m, (vh - ph) / 2) + 'px'; return; }
  const r = el.getBoundingClientRect(), pad = 6;
  const sx = Math.max(0, r.left - pad), sy = Math.max(0, r.top - pad), sw = Math.min(vw, r.right + pad) - sx, sh = Math.min(vh, r.bottom + pad) - sy;
  spot.style.display = 'block'; spot.style.left = sx + 'px'; spot.style.top = sy + 'px'; spot.style.width = sw + 'px'; spot.style.height = sh + 'px';
  const cx = sx + sw / 2, cy = sy + sh / 2;
  const fits = {
    right: sx + sw + gap + pw <= vw - m, left: sx - gap - pw >= m,
    bottom: sy + sh + gap + ph <= vh - m, top: sy - gap - ph >= m,
  };
  const side = (s.side || ['bottom', 'right', 'top', 'left']).concat(['bottom', 'right', 'top', 'left']).find(k => fits[k]);
  let x, y;
  if (!side) { x = clamp(cx - pw / 2, m, vw - pw - m); y = clamp(sy + sh + gap, m, vh - ph - m); arrow.style.display = 'none'; }
  else {
    if (side === 'right' || side === 'left') { x = side === 'right' ? sx + sw + gap : sx - gap - pw; y = clamp(cy - ph / 2, m, vh - ph - m); }
    else { y = side === 'bottom' ? sy + sh + gap : sy - gap - ph; x = clamp(cx - pw / 2, m, vw - pw - m); }
    arrow.style.display = 'block'; arrow.className = 'g-arrow a-' + side;
    if (side === 'right' || side === 'left') arrow.style.cssText = `top:${clamp(cy - y, 16, ph - 16)}px`;
    else arrow.style.cssText = `left:${clamp(cx - x, 16, pw - 16)}px`;
  }
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
}
function guideGo(d) {
  if (guideStep < 0) return;
  const n = guideStep + d; if (n < 0) return;
  if (n >= TUTOR_STEPS.length) return closeGuide();
  guideStep = n; renderGuide();
}
function openGuide(step) {
  let g = document.getElementById('guide');
  if (!g) {
    g = document.createElement('div'); g.id = 'guide'; g.className = 'hidden'; document.body.appendChild(g);
    g.addEventListener('click', e => {
      const a = e.target.closest('[data-g]');
      if (!a) { if (e.target === g && !g.classList.contains('tour')) closeGuide(); return; }
      if (a.dataset.g === 'start') { guideTab0 = S.tab; guideStep = 0; renderGuide(); }
      else if (a.dataset.g === 'next') guideGo(1);
      else if (a.dataset.g === 'prev') guideGo(-1);
      else closeGuide();
    });
    g.addEventListener('change', e => { if (e.target.id === 'guide-off') { S.guideOff = e.target.checked; save(); } });
    window.addEventListener('resize', placeTour);
    window.addEventListener('scroll', placeTour, true);
  }
  const h = document.getElementById('help'); if (h) h.classList.add('hidden');
  guideStep = step; S.guideSeen = true; renderGuide(); g.classList.remove('hidden');
  clearInterval(guideTimer); guideTimer = setInterval(placeTour, 400);
}
function closeGuide() {
  const g = document.getElementById('guide'); if (g) g.classList.add('hidden');
  clearInterval(guideTimer);
  if (guideTab0 && S.tab !== guideTab0) { S.tab = guideTab0; render(); }
  guideTab0 = null; guideStep = -1;
  save();
}

// ---------- Init ----------
let started = false;
function startGame(fromServer) {
  let isNew = false;
  if (fromServer) { S = Object.assign(newState(), fromServer); }
  else if (!load()) { S = newState(); isNew = true; }
  else {
    const away = Math.min(600, (Date.now() - S.last) / 1000);
    if (away > 5) { S.fuel = Math.min(fuelMax(), S.fuel + fuelRate() * away); S.rp += rpRate() * away * .5; setTimeout(() => toast(`Selamat datang kembali! Produksi offline ${Math.round(away)} dtk.`), 300); }
  }
  refreshContracts(); render(); updateUser();
  if (isNew && !S.guideOff) setTimeout(() => openGuide(-1), 300);
  if (!started) { started = true; setInterval(tick, 1000); setInterval(save, 5000); window.addEventListener('beforeunload', save); }
}
function updateUser() {
  document.getElementById('u-name').textContent = AUTH.user ? '👤 ' + AUTH.user : 'Tamu (lokal)';
  document.getElementById('u-btn').textContent = AUTH.user ? 'Keluar' : 'Masuk';
}
async function enterAccount(r) {
  AUTH.token = r.token; AUTH.user = r.username;
  try { localStorage.setItem('roket_token', r.token); localStorage.setItem('roket_user', r.username); } catch (e) {}
  let remote = null;
  try { remote = (await api('GET', '/api/save')).save; } catch (e) {}
  document.getElementById('auth').classList.add('hidden');
  startGame(remote);
  if (!remote) save();
}
function logout() {
  if (AUTH.token) api('POST', '/api/logout').catch(() => {});
  try { localStorage.removeItem('roket_token'); localStorage.removeItem('roket_user'); } catch (e) {}
  location.reload();
}
async function doAuth(kind) {
  const err = document.getElementById('auth-err'); err.textContent = '';
  try { await enterAccount(await api('POST', '/api/' + kind, {username: document.getElementById('a-user').value, password: document.getElementById('a-pass').value})); }
  catch (e) { err.textContent = e.status ? e.message : 'Server tidak terjangkau. Jalankan server (lihat README), buka index.html langsung, atau main tanpa akun.'; }
}
document.getElementById('a-login').onclick = () => doAuth('login');
document.getElementById('a-reg').onclick = () => doAuth('register');
document.getElementById('a-guest').onclick = () => { document.getElementById('auth').classList.add('hidden'); startGame(); };
document.getElementById('u-btn').onclick = () => { if (AUTH.user) logout(); else document.getElementById('auth').classList.remove('hidden'); };
(async () => {
  if (AUTH.token) {
    try { await api('GET', '/api/me'); const remote = (await api('GET', '/api/save')).save; startGame(remote); return; }
    catch (e) { if (e.status === 401) { AUTH.token = AUTH.user = null; try { localStorage.removeItem('roket_token'); localStorage.removeItem('roket_user'); } catch (_) {} } else { startGame(); return; } }
  }
  document.getElementById('auth').classList.remove('hidden');
})();
