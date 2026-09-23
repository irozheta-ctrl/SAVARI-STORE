# SAVARI STORE FULL

Versi ini sudah lebih lengkap dari starter:
- katalog game
- checkout
- User ID / Server ID
- data pembeli
- nomor WhatsApp
- order code `SVR-XXXXXXX`
- database SQLite
- halaman cek status pesanan
- halaman admin `/admin.html`
- perubahan status: WAITING_PAYMENT, PAID, PROCESSING, SUCCESS, FAILED, CANCELLED
- API katalog, order, cek status, dan admin

## Jalankan
1. Install Node.js 18+
2. `npm install`
3. Set `ADMIN_KEY` ke nilai rahasia sendiri.
4. `npm start`
5. Buka `http://localhost:3000`
6. Admin: `http://localhost:3000/admin.html`

Contoh Linux/macOS:
`ADMIN_KEY="rahasia-sendiri" npm start`

Windows PowerShell:
`$env:ADMIN_KEY="rahasia-sendiri"; npm start`

## Catatan penting
Ini belum menghubungkan payment gateway sungguhan dan belum mengirim top-up otomatis.
Untuk produksi, gunakan payment gateway resmi dan provider top-up resmi/API yang sah.
Jangan menaruh API key/payment secret di frontend.
