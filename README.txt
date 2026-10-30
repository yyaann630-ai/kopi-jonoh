KOPI JONOH - CARA PAKAI
1. Klik dua kali start.bat (atau di CMD: node server.js). Tidak perlu npm install.
2. Admin    : http://localhost:3000/admin   (password awal: admin123)
3. Pelanggan: hanya lewat QR meja (http://localhost:3000/m/1). Halaman utama tidak punya link ke admin.
4. Ganti password:  set ADMIN_PASSWORD=passwordkamu   lalu   node server.js
5. Tes di HP (satu WiFi): ganti "localhost" dengan IP laptop (cek ipconfig) sebelum cetak QR,
   atau buka halaman Kelola Meja lewat alamat IP itu, supaya QR berisi alamat yang benar.
Hosting: butuh hosting Node.js (VPS / Node app) versi 22.5+; BUKAN hosting statis biasa.
Data tersimpan di cafe.db (pastikan folder tidak terhapus saat deploy). Zona waktu default Asia/Makassar (ubah dengan env TZ).
Library QR: qrcode-terminal (MIT, Kazuhiko Arase) di lib/qr.

TES DI HP (QR tidak terbuka): 1) HP & laptop harus satu WiFi. 2) Buka admin lewat alamat IP yang tampil di CMD ("Alamat HP"),
3) Saat Windows Firewall bertanya, izinkan Node.js (Private network). 4) Di HP pastikan alamatnya http:// (bukan https://).
Untuk hosting, set BASE_URL=https://domainkamu.com agar QR memakai domain tetap.

SUARA: notifikasi suara dibuat langsung di browser (tanpa file audio). Browser mewajibkan satu ketukan/klik pertama agar suara aktif. Tombol lonceng di pojok atas untuk mute/unmute.

TAMPILAN: default mode gelap (gaya warkop). Tombol "Terang/Gelap" di pojok atas untuk ganti mode; pilihan tersimpan di browser masing-masing.
BACKSOUND: halaman pelanggan memutar musik lo-fi santai (dibuat langsung di browser, tanpa file lagu). Mulai setelah pelanggan mengetuk layar sekali; tombol "Musik" di pojok atas untuk mati/nyalakan. Di iPhone, musik tidak bunyi kalau tombol senyap (silent) aktif.
