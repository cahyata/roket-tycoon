@echo off
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js belum terpasang.
  echo.
  echo Pilihan 1: tidak perlu instal apa pun. Dobel klik index.html untuk main
  echo            dengan akun yang disimpan di browser.
  echo Pilihan 2: instal Node.js LTS dari https://nodejs.org lalu jalankan file ini lagi.
  echo.
  start https://nodejs.org
  pause
  exit /b 1
)
echo Menjalankan server di http://localhost:3000
start http://localhost:3000
node server.js
pause
