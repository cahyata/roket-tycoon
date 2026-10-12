'use strict';
// Server ROKET Tycoon: file statis + API akun & simpan progres. Tanpa dependensi (Node 18+).
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = +process.env.PORT || 3000;
const ROOT = __dirname;

// ---- Database: SQLite (node:sqlite, Node 22.5+) dengan fallback file JSON ----
let db;
try {
  const { DatabaseSync } = require('node:sqlite');
  const s = new DatabaseSync(path.join(ROOT, 'roket.db'));
  s.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL, created INTEGER NOT NULL);
          CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created INTEGER NOT NULL);
          CREATE TABLE IF NOT EXISTS saves(user_id INTEGER PRIMARY KEY, data TEXT NOT NULL, updated INTEGER NOT NULL);`);
  db = {
    kind: 'SQLite',
    user: n => s.prepare('SELECT * FROM users WHERE username=?').get(n),
    addUser: (n, salt, hash) => Number(s.prepare('INSERT INTO users(username,salt,hash,created) VALUES(?,?,?,?)').run(n, salt, hash, Date.now()).lastInsertRowid),
    addSession: (t, u) => s.prepare('INSERT INTO sessions VALUES(?,?,?)').run(t, u, Date.now()),
    session: t => { const r = s.prepare('SELECT u.id,u.username FROM sessions x JOIN users u ON u.id=x.user_id WHERE x.token=?').get(t); return r; },
    delSession: t => s.prepare('DELETE FROM sessions WHERE token=?').run(t),
    getSave: u => (s.prepare('SELECT data FROM saves WHERE user_id=?').get(u) || {}).data || null,
    putSave: (u, d) => s.prepare('INSERT INTO saves VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, updated=excluded.updated').run(u, d, Date.now()),
  };
} catch (e) {
  const f = path.join(ROOT, 'roket-db.json');
  let d = {users: [], sessions: {}, saves: {}};
  try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (_) {}
  const flush = () => fs.writeFileSync(f, JSON.stringify(d));
  db = {
    kind: 'file JSON (Node < 22.5, tanpa SQLite)',
    user: n => d.users.find(u => u.username === n),
    addUser: (n, salt, hash) => { const id = d.users.length + 1; d.users.push({id, username: n, salt, hash}); flush(); return id; },
    addSession: (t, u) => { d.sessions[t] = u; flush(); },
    session: t => { const u = d.users.find(x => x.id === d.sessions[t]); return u && {id: u.id, username: u.username}; },
    delSession: t => { delete d.sessions[t]; flush(); },
    getSave: u => d.saves[u] || null,
    putSave: (u, data) => { d.saves[u] = data; flush(); },
  };
}

// ---- Util ----
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
const send = (res, code, obj) => { res.writeHead(code, {'Content-Type': 'application/json'}); res.end(JSON.stringify(obj)); };
const body = req => new Promise((ok, no) => { let b = ''; req.on('data', c => { b += c; if (b.length > 2e6) { req.destroy(); no(); } }); req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch (e) { ok({}); } }); });
const authUser = req => { const m = /^Bearer (.+)$/.exec(req.headers.authorization || ''); return m ? db.session(m[1]) : null; };
const MIME = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.ico': 'image/x-icon'};
const STATIC = new Set(['/index.html', '/style.css', '/game.js']);
const tries = {};
function throttled(ip) { const t = Date.now(); tries[ip] = (tries[ip] || []).filter(x => t - x < 60000); tries[ip].push(t); return tries[ip].length > 20; }

http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  try {
    if (url.startsWith('/api/')) {
      if (url === '/api/register' || url === '/api/login') {
        if (req.method !== 'POST') return send(res, 405, {error: 'Metode salah'});
        if (throttled(req.socket.remoteAddress)) return send(res, 429, {error: 'Terlalu banyak percobaan, tunggu sebentar.'});
        const {username, password} = await body(req);
        const n = String(username || '').trim().toLowerCase();
        if (url === '/api/register') {
          if (!/^[a-z0-9_]{3,20}$/.test(n)) return send(res, 400, {error: 'Username 3-20 karakter: huruf, angka, underscore.'});
          if (String(password || '').length < 6) return send(res, 400, {error: 'Password minimal 6 karakter.'});
          if (db.user(n)) return send(res, 409, {error: 'Username sudah dipakai.'});
          const salt = crypto.randomBytes(16).toString('hex');
          const id = db.addUser(n, salt, hashPw(password, salt));
          const token = crypto.randomBytes(32).toString('hex'); db.addSession(token, id);
          return send(res, 200, {token, username: n});
        }
        const u = db.user(n);
        if (!u || !crypto.timingSafeEqual(Buffer.from(hashPw(String(password || ''), u.salt), 'hex'), Buffer.from(u.hash, 'hex')))
          return send(res, 401, {error: 'Username atau password salah.'});
        const token = crypto.randomBytes(32).toString('hex'); db.addSession(token, u.id);
        return send(res, 200, {token, username: u.username});
      }
      const user = authUser(req);
      if (!user) return send(res, 401, {error: 'Belum login.'});
      if (url === '/api/me') return send(res, 200, {username: user.username});
      if (url === '/api/logout') { db.delSession(req.headers.authorization.slice(7)); return send(res, 200, {ok: true}); }
      if (url === '/api/save' && req.method === 'GET') { const d = db.getSave(user.id); return send(res, 200, {save: d ? JSON.parse(d) : null}); }
      if (url === '/api/save' && req.method === 'PUT') { const b = await body(req); if (!b.save) return send(res, 400, {error: 'Data kosong.'}); db.putSave(user.id, JSON.stringify(b.save)); return send(res, 200, {ok: true}); }
      return send(res, 404, {error: 'Tidak ditemukan'});
    }
    const p = url === '/' ? '/index.html' : url;
    if (!STATIC.has(p)) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, {'Content-Type': MIME[path.extname(p)] || 'application/octet-stream'});
    fs.createReadStream(path.join(ROOT, p)).pipe(res);
  } catch (e) { send(res, 500, {error: 'Kesalahan server.'}); }
}).listen(PORT, () => console.log(`ROKET Tycoon berjalan di http://localhost:${PORT}  (database: ${db.kind})`));
