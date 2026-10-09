@echo off
title Mana Calendar 2027 -- Live Cloudflare Tunnel
echo ========================================================
echo   Starting Worldwide HTTPS Public Tunnel (Port 3000)
echo ========================================================
echo.
echo Make sure the local dev server is running (npm run dev)
echo Copy the https://xxxx.trycloudflare.com URL below to open on any mobile phone!
echo.
"E:\rakesh\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
pause
