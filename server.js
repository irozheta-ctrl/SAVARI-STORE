const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'ganti-admin-key-anda';

const db = new Database(path.join(__dirname, 'data', 'store.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT UNIQUE NOT NULL,
  game TEXT NOT NULL,
  user_id TEXT NOT NULL,
  server_id TEXT DEFAULT '',
  product TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'WAITING_PAYMENT',
  customer_name TEXT DEFAULT '',
  customer_contact TEXT DEFAULT '',
  payment_method TEXT DEFAULT 'MANUAL',
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`);

const catalog = {
  "Mobile Legends": [
    {name:"86 Diamonds", amount:15000},
    {name:"172 Diamonds", amount:29000},
    {name:"257 Diamonds", amount:43000},
    {name:"344 Diamonds", amount:57000}
  ],
  "Free Fire": [
    {name:"70 Diamonds", amount:12000},
    {name:"140 Diamonds", amount:23000},
    {name:"355 Diamonds", amount:55000},
    {name:"720 Diamonds", amount:105000}
  ],
  "HAGO": [
    {name:"20 Diamonds", amount:5000},
    {name:"50 Diamonds", amount:10000},
    {name:"100 Diamonds", amount:19000}
  ],
  "PUBG Mobile": [
    {name:"60 UC", amount:16000},
    {name:"325 UC", amount:78000},
    {name:"660 UC", amount:150000}
  ]
};

const statuses = [
  "WAITING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "CANCELLED"
];

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function now() {
  return new Date().toISOString();
}

function makeCode() {
  let code;
  do {
    code = "SVR-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  } while (db.prepare("SELECT 1 FROM orders WHERE order_code=?").get(code));
  return code;
}

function admin(req, res, next) {
  if (req.get("x-admin-key") !== ADMIN_KEY) {
    return res.status(401).json({error:"Admin key salah."});
  }
  next();
}

app.get("/api/catalog", (req,res) => {
  res.json(catalog);
});

app.post("/api/orders", (req,res) => {
  const {
    game, user_id, server_id = "",
    product, customer_name = "",
    customer_contact = "", payment_method = "MANUAL", note = ""
  } = req.body || {};

  if (!game || !user_id || !product) {
    return res.status(400).json({error:"Game, User ID, dan produk wajib diisi."});
  }

  const items = catalog[game];
  const selected = items?.find(x => x.name === product);
  if (!selected) return res.status(400).json({error:"Produk tidak tersedia."});

  const code = makeCode();
  const created = now();

  db.prepare(`
    INSERT INTO orders
    (order_code, game, user_id, server_id, product, amount, status,
     customer_name, customer_contact, payment_method, note, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'WAITING_PAYMENT', ?, ?, ?, ?, ?, ?)
  `).run(
    code, game, String(user_id).trim(), String(server_id).trim(),
    product, selected.amount, String(customer_name).trim(),
    String(customer_contact).trim(), payment_method, String(note).trim(),
    created, created
  );

  const order = db.prepare("SELECT * FROM orders WHERE order_code=?").get(code);
  res.status(201).json(order);
});

app.get("/api/orders/:code", (req,res) => {
  const order = db.prepare("SELECT * FROM orders WHERE order_code=?").get(req.params.code);
  if (!order) return res.status(404).json({error:"Pesanan tidak ditemukan."});
  res.json(order);
});

app.get("/api/admin/orders", admin, (req,res) => {
  const orders = db.prepare("SELECT * FROM orders ORDER BY id DESC").all();
  res.json(orders);
});

app.patch("/api/admin/orders/:id", admin, (req,res) => {
  const {status, note} = req.body || {};
  if (!statuses.includes(status)) {
    return res.status(400).json({error:"Status tidak valid."});
  }

  const result = db.prepare(`
    UPDATE orders
    SET status=?, note=COALESCE(?, note), updated_at=?
    WHERE id=?
  `).run(status, note ?? null, now(), req.params.id);

  if (!result.changes) return res.status(404).json({error:"Pesanan tidak ditemukan."});

  res.json(db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id));
});

app.listen(PORT, () => {
  console.log(`SAVARI STORE berjalan di http://localhost:${PORT}`);
});
