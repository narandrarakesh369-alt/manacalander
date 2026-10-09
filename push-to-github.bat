@echo off
setlocal
set PATH=E:\rakesh\git\cmd;%PATH%

echo ========================================================
echo   Push Mana Calendar 2027 to GitHub
echo ========================================================
echo.

cd /d "%~dp0"

echo Staging changes...
git add .

set /p MSG="Commit message (press Enter for default): "
if "%MSG%"=="" set MSG=chore: update Mana Calendar 2027

git commit -m "%MSG%"

echo.
echo Pushing to GitHub (origin main)...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo   Successfully pushed to GitHub!
    echo   Repo: https://github.com/narandrarakesh369-alt/manacalander
    echo ========================================================
) else (
    echo.
    echo [!] Push failed. Check your network or GitHub permissions.
)

pause
