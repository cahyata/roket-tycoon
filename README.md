# ROKET Tycoon

Game tycoon base peluncuran roket, dimainkan di browser. Menu di sidebar kiri, ringkasan (uang, riset, BBM, reputasi, hari) selalu tampil di atas konten. Punya akun pengguna dan database; progres tersimpan per akun.

## Cara menjalankan
Mode server butuh [Node.js](https://nodejs.org) 18 atau lebih baru (disarankan 22.5+ agar memakai SQLite).

1. Buka terminal di folder ini, lalu jalankan `node server.js` (di Windows cukup dobel klik `jalankan.bat`).
2. Buka http://localhost:3000 di browser.
3. Daftar akun baru atau masuk. Progres tersimpan otomatis ke database (`roket.db`).

Tanpa dependensi dan tanpa `npm install`. Ganti port dengan variabel `PORT`, misalnya `PORT=8080 node server.js`.

### Tanpa Node (disarankan jika Node belum terpasang)
Dobel klik `index.html`. Daftar dan login tetap tersedia: akun (password di-hash PBKDF2) dan progres disimpan di database browser (IndexedDB). Data hanya ada di browser dan komputer itu, dan tidak terbawa ke browser lain. Tombol "Main tanpa akun" juga tersedia.

### Database
- Node 22.5+: SQLite lewat modul bawaan `node:sqlite` (file `roket.db`).
- Node lebih lama: otomatis memakai file JSON `roket-db.json`.
- Password disimpan sebagai hash scrypt dengan salt. Sesi memakai token acak.
- Server ini untuk penggunaan lokal; untuk dipublikasikan, pasang di belakang HTTPS.

## Shortcut keyboard
Tekan `?` di game untuk daftar lengkap; huruf shortcut juga tampil kecil di setiap tombol.
- `1`-`7` pindah tab, `S` simpan, `Esc`/`Enter` tutup dialog.
- Fasilitas: `P` `H` `L` `B` `C` (Pad, Hangar, Lab, Bahan bakar, Control).
- Staf: `I` insinyur, `U` ilmuwan, `T` teknisi. Hanger: `R` rakit.
- Misi: `L` `K` `J` `G` `F` `D` `B` meluncurkan kontrak sesuai urutan kartu, `T` uji statis, `H` hibah darurat.
- Riset: huruf yang tertera di tiap kartu.

## Markas
Tab Markas adalah pusat kendali: peringatan (hanger kosong, bahan bakar menipis, uang mepet gaji), keuangan dengan grafik pemasukan/pengeluaran per hari, 3 misi yang direkomendasikan (urut perkiraan laba) dengan tombol luncur langsung, aksi cepat (rakit roket termurah, uji statis, upgrade yang disarankan), status fasilitas dan staf, riwayat peluncuran, serta statistik dan rekor.

## Mesin
Tiap mesin lebih baik dalam 4 hal: peluang sukses, hemat bahan bakar (Merlin-X 85%, Raptor-S 70%, Ion-Nova 55% dari pemakaian dasar), pemulihan booster saat sukses (15%/40%/60% biaya roket dikembalikan), dan muatan yang bisa diangkut. Kontrak tier 2/3/4 terbuka di reputasi 6/16/30 dan membayar premi 10%/20%/35%. Tab Hanger punya tabel "Jalur Upgrade Mesin" (biaya, peluang, BBM, laba per misi, syarat riset/pad) dengan tombol riset/upgrade langsung; rekomendasinya juga ada di Markas. Mesin butuh Launch Pad dengan level yang sama dengan tier mesinnya.

## Cara bermain
1. **Fasilitas**: upgrade Launch Pad, Hangar, Lab Riset, Pabrik Bahan Bakar, Control Center.
2. **Staf**: insinyur (keandalan), ilmuwan (riset), teknisi (pendapatan). Gaji dibayar tiap hari.
3. **Riset**: habiskan Poin Riset untuk membuka mesin, tangki, panduan, kapsul awak, dan bonus.
4. **Hanger**: rakit roket dari mesin + tangki + panduan (+ kapsul awak).
5. **Cari uang**: selain kontrak, tab Misi punya *Uji Statis Mesin* (pendapatan kecil tanpa roket, jeda 15 detik). Jika uang kurang dari roket termurah dan hanger kosong, ajukan *Hibah Darurat* (tiap 3 hari) agar tidak pernah buntu. Selalu ada kontrak satelit kecil untuk roket termurah.
6. **Peluang sukses**: mesin + panduan + Control Center + Launch Pad + insinyur, dikurangi beban muatan dan tingkat misi. Rinciannya tampil di kartu misi dan layar peluncuran. Setelah gagal, tim "belajar dari kegagalan" (+5% per kegagalan beruntun, maks +10%) sampai peluncuran berikutnya sukses.
7. **Ekonomi**: roket habis dipakai tiap peluncuran. Hadiah kontrak = biaya roket termurah yang cukup untuk muatan itu + margin 40-60% (bonus riset dan teknisi menambah). Pakai roket yang pas, jangan berlebihan. Ringkasan laba bersih tampil setelah tiap peluncuran.
8. **Misi**: pilih kontrak (satelit, kargo, awak), pilih roket, luncurkan. Gagal berarti roket hilang dan pad rusak.

File: `index.html`, `style.css`, `game.js`, `server.js`, `jalankan.bat`, `package.json`.
