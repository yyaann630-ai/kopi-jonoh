process.env.TZ = process.env.TZ || 'Asia/Makassar';
const os = require('os'), http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const QRCode = require('./lib/qr'), QL = require('./lib/qr/QRErrorCorrectLevel');
const PORT = process.env.PORT || 3000;
const PASS = process.env.ADMIN_PASSWORD;
if (!PASS) throw new Error('ADMIN_PASSWORD belum diatur!');
const db = new DatabaseSync(path.join(__dirname, 'cafe.db'));
db.exec(`
CREATE TABLE IF NOT EXISTS tables(id INTEGER PRIMARY KEY AUTOINCREMENT, number INTEGER UNIQUE);
CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);
CREATE TABLE IF NOT EXISTS menu(id INTEGER PRIMARY KEY AUTOINCREMENT, category_id INTEGER, name TEXT, price INTEGER, emoji TEXT DEFAULT '🍽️', available INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT, table_number INTEGER, items TEXT, total INTEGER, note TEXT, status TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS transactions(id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, amount INTEGER, note TEXT, created_at INTEGER, order_id INTEGER);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);`);
try { db.exec('ALTER TABLE orders ADD COLUMN method TEXT'); } catch {}
const all = (s, ...a) => db.prepare(s).all(...a), get = (s, ...a) => db.prepare(s).get(...a), run = (s, ...a) => db.prepare(s).run(...a);
if (!get('SELECT id FROM categories')) {
  for (const [c, items] of [['Kopi', [['Kopi Susu', 18000, '☕'], ['Americano', 15000, '☕']]], ['Non-Kopi', [['Matcha Latte', 22000, '🍵'], ['Es Teh', 8000, '🧋']]], ['Makanan', [['Nasi Goreng', 25000, '🍛'], ['Roti Bakar', 15000, '🍞']]]]) {
    const id = run('INSERT INTO categories(name) VALUES(?)', c).lastInsertRowid;
    for (const [n, p, e] of items) run('INSERT INTO menu(category_id,name,price,emoji) VALUES(?,?,?,?)', id, n, p, e);
  }
  for (let i = 1; i <= 5; i++) run('INSERT INTO tables(number) VALUES(?)', i);
}
// Hapus data > 5 hari (hari ini + 4 hari sebelumnya)
function cleanup() { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 4); const t = d.getTime();
  run('DELETE FROM transactions WHERE created_at<?', t); run('DELETE FROM orders WHERE created_at<?', t); }
cleanup(); setInterval(cleanup, 3600e3);
const dayKey = ts => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const qrSvg = text => { const q = new QRCode(-1, QL.M); q.addData(text); q.make(); const n = q.getModuleCount(); let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + 2},${r + 2}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}"/></svg>`; };
const lanIP = () => { for (const l of Object.values(os.networkInterfaces())) for (const i of l || []) if (i.family === 'IPv4' && !i.internal && !i.address.startsWith('169.254')) return i.address; };
const err = (status, error, extra) => Object.assign(new Error(error), { status, extra });
const sessions = new Set(), routes = [];
const R = (m, p, fn, admin) => routes.push({ m, admin, fn, re: new RegExp('^' + p.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$') });
const parseItems = o => ({ ...o, items: JSON.parse(o.items) });
function checkStock(items) { return items.map(i => get('SELECT id,name,available FROM menu WHERE id=?', i.id)).filter(m => !m || !m.available).map(m => m ? m.name : 'Menu dihapus'); }

// ---------- PUBLIK (pelanggan) ----------
R('GET', '/api/menu', () => ({ categories: all('SELECT * FROM categories ORDER BY id'), items: all('SELECT * FROM menu ORDER BY id'), qris: !!get("SELECT 1 x FROM settings WHERE key='qris'") }));
R('GET', '/api/qris', () => ({ image: get("SELECT value FROM settings WHERE key='qris'")?.value || null }));
R('GET', '/api/table/:n', c => { if (!get('SELECT id FROM tables WHERE number=?', +c.p.n)) throw err(404, 'Meja tidak ditemukan'); return { ok: true }; });
R('GET', '/api/qr/:n', c => { const n = parseInt(c.p.n); const proto = c.req.headers['x-forwarded-proto'] || 'http';
  let host = c.req.headers.host || ''; if (/^(localhost|127\.0\.0\.1)/.test(host)) host = (lanIP() || 'localhost') + ':' + PORT;
  const base = (process.env.BASE_URL || `${proto}://${host}`).replace(/\/$/, '');
  return { raw: qrSvg(`${base}/m/${n}`), type: 'image/svg+xml' }; });
R('POST', '/api/order', c => {
  const tn = +c.body.table; if (!get('SELECT id FROM tables WHERE number=?', tn)) throw err(404, 'Meja tidak valid');
  const list = (c.body.items || []).filter(i => i.qty > 0).slice(0, 60); if (!list.length) throw err(400, 'Keranjang kosong');
  const out = checkStock(list); if (out.length) throw err(409, 'Stok habis: ' + out.join(', '), { soldOut: out });
  const items = list.map(i => { const m = get('SELECT * FROM menu WHERE id=?', i.id); return { id: m.id, name: m.name, price: m.price, qty: Math.min(99, Math.floor(i.qty)) }; });
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const id = run('INSERT INTO orders(table_number,items,total,note,status,created_at) VALUES(?,?,?,?,?,?)', tn, JSON.stringify(items), total, String(c.body.note || '').slice(0, 200), 'unpaid', Date.now()).lastInsertRowid;
  return parseItems(get('SELECT * FROM orders WHERE id=?', id)); });
R('GET', '/api/order/:id', c => { const o = get('SELECT * FROM orders WHERE id=?', +c.p.id); if (!o) throw err(404, 'Order tidak ada'); return parseItems(o); });
R('POST', '/api/order/:id/pay', c => {
  const o = get('SELECT * FROM orders WHERE id=?', +c.p.id); if (!o) throw err(404, 'Order tidak ada');
  if (o.status !== 'unpaid') return parseItems(o);
  const out = checkStock(JSON.parse(o.items));
  if (out.length) { run("UPDATE orders SET status='cancelled' WHERE id=?", o.id); throw err(409, 'Maaf, stok habis: ' + out.join(', ') + '. Pesanan dibatalkan, belum ada pembayaran yang diproses.', { soldOut: out }); }
  run("UPDATE orders SET status='waiting',method=? WHERE id=?", c.body.method === 'cash' ? 'cash' : 'qris', o.id); return parseItems(get('SELECT * FROM orders WHERE id=?', o.id)); });

// ---------- ADMIN ----------
R('POST', '/api/login', c => { if (c.body.password !== PASS) throw err(401, 'Password salah'); const t = crypto.randomBytes(24).toString('hex'); sessions.add(t); c.setCookie = t; return { ok: true }; });
R('POST', '/api/logout', c => { sessions.delete(c.sid); c.setCookie = ''; return { ok: true }; });
R('GET', '/api/admin/me', () => ({ ok: true }), 1);
R('GET', '/api/admin/tables', () => all('SELECT * FROM tables ORDER BY number'), 1);
R('POST', '/api/admin/tables', c => { const n = +c.body.number || (get('SELECT MAX(number) m FROM tables').m || 0) + 1;
  if (get('SELECT id FROM tables WHERE number=?', n)) throw err(409, `Meja ${n} sudah ada`); run('INSERT INTO tables(number) VALUES(?)', n); return { ok: true }; }, 1);
R('DELETE', '/api/admin/tables/:id', c => { run('DELETE FROM tables WHERE id=?', +c.p.id); return { ok: true }; }, 1);
R('GET', '/api/admin/orders', () => all("SELECT * FROM orders WHERE status!='unpaid' ORDER BY id DESC LIMIT 100").map(o => { o = parseItems(o); o.soldOut = checkStock(o.items); return o; }), 1);
R('POST', '/api/admin/orders/:id/:action', c => {
  const o = get('SELECT * FROM orders WHERE id=?', +c.p.id); if (!o) throw err(404, 'Order tidak ada');
  if (c.p.action === 'confirm' && o.status === 'waiting') { run("UPDATE orders SET status='paid' WHERE id=?", o.id);
    run("INSERT INTO transactions(type,amount,note,created_at,order_id) VALUES('in',?,?,?,?)", o.total, `Order #${o.id} - Meja ${o.table_number} (${o.method === 'cash' ? 'Cash' : 'QRIS'})`, Date.now(), o.id); }
  else if (c.p.action === 'done' && o.status === 'paid') run("UPDATE orders SET status='done' WHERE id=?", o.id);
  else if (c.p.action === 'cancel') { run("UPDATE orders SET status='cancelled' WHERE id=?", o.id); run('DELETE FROM transactions WHERE order_id=?', o.id); }
  return { ok: true }; }, 1);
R('GET', '/api/admin/categories', () => ({ categories: all('SELECT * FROM categories ORDER BY id'), items: all('SELECT * FROM menu ORDER BY id') }), 1);
R('POST', '/api/admin/categories', c => { if (!String(c.body.name || '').trim()) throw err(400, 'Nama kosong'); run('INSERT INTO categories(name) VALUES(?)', c.body.name.trim()); return { ok: true }; }, 1);
R('DELETE', '/api/admin/categories/:id', c => { run('DELETE FROM menu WHERE category_id=?', +c.p.id); run('DELETE FROM categories WHERE id=?', +c.p.id); return { ok: true }; }, 1);
R('POST', '/api/admin/menu', c => { const b = c.body; if (!b.name?.trim() || !(+b.price >= 0) || !b.category_id) throw err(400, 'Data menu belum lengkap');
  run('INSERT INTO menu(category_id,name,price,emoji) VALUES(?,?,?,?)', +b.category_id, b.name.trim(), Math.round(+b.price), b.emoji || '🍽️'); return { ok: true }; }, 1);
R('PUT', '/api/admin/menu/:id', c => { const b = c.body, m = get('SELECT * FROM menu WHERE id=?', +c.p.id); if (!m) throw err(404, 'Menu tidak ada');
  run('UPDATE menu SET name=?,price=?,emoji=?,category_id=? WHERE id=?', b.name?.trim() || m.name, b.price >= 0 ? Math.round(+b.price) : m.price, b.emoji || m.emoji, +b.category_id || m.category_id, m.id); return { ok: true }; }, 1);
R('POST', '/api/admin/menu/:id/toggle', c => { run('UPDATE menu SET available=1-available WHERE id=?', +c.p.id); return { ok: true }; }, 1);
R('DELETE', '/api/admin/menu/:id', c => { run('DELETE FROM menu WHERE id=?', +c.p.id); return { ok: true }; }, 1);
R('PUT', '/api/admin/qris', c => { if (!/^data:image\/(png|jpe?g|webp);base64,/.test(c.body.image || '')) throw err(400, 'File harus gambar');
  run("INSERT INTO settings(key,value) VALUES('qris',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", c.body.image); return { ok: true }; }, 1);
R('DELETE', '/api/admin/qris', () => { run("DELETE FROM settings WHERE key='qris'"); return { ok: true }; }, 1);
R('GET', '/api/admin/finance', () => { cleanup(); const days = {};
  for (let i = 0; i < 5; i++) { const d = new Date(); d.setDate(d.getDate() - i); days[dayKey(d)] = { date: dayKey(d), income: 0, expense: 0, tx: [] }; }
  for (const t of all('SELECT * FROM transactions ORDER BY id DESC')) { const x = days[dayKey(t.created_at)]; if (!x) continue; x[t.type === 'in' ? 'income' : 'expense'] += t.amount; x.tx.push(t); }
  return Object.values(days); }, 1);
R('POST', '/api/admin/expense', c => { if (!(+c.body.amount > 0)) throw err(400, 'Jumlah tidak valid');
  run("INSERT INTO transactions(type,amount,note,created_at) VALUES('out',?,?,?)", Math.round(+c.body.amount), String(c.body.note || 'Pengeluaran').slice(0, 100), Date.now()); return { ok: true }; }, 1);
R('DELETE', '/api/admin/tx/:id', c => { run("DELETE FROM transactions WHERE id=? AND type='out'", +c.p.id); return { ok: true }; }, 1);

// ---------- SERVER ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png' };
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x'), p = url.pathname;
    const sid = (req.headers.cookie || '').match(/sid=([a-f0-9]+)/)?.[1];
    const send = (code, body, type = 'text/html; charset=utf-8', h = {}) => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', ...h }); res.end(body); };
    if (!p.startsWith('/api/')) {
      const pages = { '/admin': 'admin.html', '/': 'home.html' }, f = pages[p] || (/^\/m\/\d+$/.test(p) ? 'customer.html' : /^\/[\w-]+\.(css|js|png|svg)$/.test(p) ? p.slice(1) : null);
      const fp = f && path.join(__dirname, 'public', f); if (!fp || !fs.existsSync(fp)) return send(404, 'Halaman tidak ditemukan');
      return send(200, fs.readFileSync(fp), MIME[path.extname(fp)] || 'application/octet-stream');
    }
    let body = {}; if (req.method !== 'GET' && req.method !== 'DELETE') { let s = '', n = 0; for await (const ch of req) { n += ch.length; if (n > 8e6) throw err(413, 'File terlalu besar'); s += ch; } try { body = JSON.parse(s || '{}'); } catch { throw err(400, 'JSON tidak valid'); } }
    for (const r of routes) { if (r.m !== req.method) continue; const m = p.match(r.re); if (!m) continue;
      if (r.admin && !sessions.has(sid)) throw err(401, 'Belum login');
      const c = { req, body, p: m.groups || {}, sid }, out = r.fn(c), h = {};
      if (c.setCookie !== undefined) h['Set-Cookie'] = `sid=${c.setCookie}; Path=/; HttpOnly; SameSite=Lax${c.setCookie ? '' : '; Max-Age=0'}`;
      return out?.raw ? send(200, out.raw, out.type, h) : send(200, JSON.stringify(out), 'application/json', h); }
    throw err(404, 'API tidak ada');
  } catch (e) { res.writeHead(e.status || 500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.status ? e.message : 'Server error', ...e.extra })); if (!e.status) console.error(e); }
}).listen(PORT, () => console.log(`\n☕ Cafe berjalan\n   Admin    : http://localhost:${PORT}/admin  (password: ${PASS})\n   Pelanggan: http://localhost:${PORT}/m/1  (via QR meja)\n   Alamat HP (satu WiFi): http://${lanIP() || 'IP-laptop'}:${PORT}/m/1\n`));
