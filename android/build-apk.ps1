# ==============================================================================
# MANA CALENDAR 2027 — ANDROID APK BUILD SCRIPT
# Uses native Android SDK Build Tools (aapt2, d8, zipalign, apksigner) & JDK 17
# ==============================================================================

$ErrorActionPreference = "Stop"

$Root = (Resolve-Path "$PSScriptRoot\..").Path
$AndroidDir = "$Root\android"
$AppDir = "$AndroidDir\app"
$BuildDir = "$AppDir\build"
$OutputsDir = "$BuildDir\outputs\apk"

$JavaHome = "C:\Users\user\AppData\Local\jdk-17\jdk-17.0.20.1+1"
$AndroidSdk = "C:\Users\user\AppData\Local\Android\Sdk"
$BuildTools = "$AndroidSdk\build-tools\34.0.0"
$PlatformJar = "$AndroidSdk\platforms\android-34\android.jar"
$Keystore = "C:\Users\user\.android\debug.keystore"

$env:JAVA_HOME = $JavaHome
$env:ANDROID_HOME = $AndroidSdk
$env:PATH = "$JavaHome\bin;$BuildTools;$env:PATH"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  MANA CALENDAR 2027 -- ANDROID PRODUCTION APK BUILDER    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Clean and prepare build directories
if (Test-Path $BuildDir) { Remove-Item -Recurse -Force $BuildDir }
New-Item -ItemType Directory -Force -Path "$BuildDir\res_compiled" | Out-Null
New-Item -ItemType Directory -Force -Path "$BuildDir\gen" | Out-Null
New-Item -ItemType Directory -Force -Path "$BuildDir\classes" | Out-Null
New-Item -ItemType Directory -Force -Path "$BuildDir\assets\dist" | Out-Null
New-Item -ItemType Directory -Force -Path $OutputsDir | Out-Null

# 2. Copy Web App Assets (dist)
Write-Host "[1/6] Copying web application bundle from dist/..." -ForegroundColor Yellow
$DistDir = "$Root\dist"
if (-not (Test-Path $DistDir)) {
    throw "dist directory does not exist! Please run 'npm run build' first."
}
Copy-Item -Recurse -Force "$DistDir\*" "$BuildDir\assets\dist"

# 3. Compile Android Resources with aapt2
Write-Host "[2/6] Compiling Android XML resources (aapt2)..." -ForegroundColor Yellow
& "$BuildTools\aapt2.exe" compile --dir "$AppDir\src\main\res" -o "$BuildDir\res_compiled.zip"

# 4. Link Resources and Generate R.java
Write-Host "[3/6] Linking resources and generating base APK..." -ForegroundColor Yellow
& "$BuildTools\aapt2.exe" link -o "$BuildDir\base.apk" `
    -I $PlatformJar `
    --manifest "$AppDir\src\main\AndroidManifest.xml" `
    --java "$BuildDir\gen" `
    -A "$BuildDir\assets" `
    "$BuildDir\res_compiled.zip"

# 5. Compile Java Source Code
Write-Host "[4/6] Compiling Java source code (javac)..." -ForegroundColor Yellow
$JavaSources = Get-ChildItem -Recurse "$AppDir\src\main\java", "$BuildDir\gen" -Filter "*.java" | ForEach-Object { $_.FullName }
& "$JavaHome\bin\javac.exe" -cp $PlatformJar -d "$BuildDir\classes" $JavaSources

# 6. Convert Bytecode to Dalvik Executable (classes.dex via d8)
Write-Host "[5/6] Generating Dalvik Executable (classes.dex via d8)..." -ForegroundColor Yellow
$ClassFiles = Get-ChildItem -Recurse "$BuildDir\classes" -Filter "*.class" | ForEach-Object { $_.FullName }
& "$BuildTools\d8.bat" --lib $PlatformJar --output "$BuildDir" $ClassFiles

# Add classes.dex into base.apk using jar.exe
Push-Location $BuildDir
& "$JavaHome\bin\jar.exe" -uf "base.apk" "classes.dex"
Pop-Location

# 7. ZipAlign and Sign APK
Write-Host "[6/6] Aligning and signing APK (zipalign and apksigner)..." -ForegroundColor Yellow
$UnalignedApk = "$BuildDir\base.apk"
$FinalApk = "$OutputsDir\ManaCalendar2027.apk"
$DistApk = "$Root\ManaCalendar2027.apk"

& "$BuildTools\zipalign.exe" -f -p 4 $UnalignedApk $FinalApk

# Sign using debug keystore
& "$BuildTools\apksigner.bat" sign --ks $Keystore --ks-pass "pass:android" --key-pass "pass:android" $FinalApk

# Also copy to root for instant access
Copy-Item -Force $FinalApk $DistApk

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "SUCCESS! Android APK built and signed successfully:" -ForegroundColor Green
Write-Host "  -> $FinalApk" -ForegroundColor White
Write-Host "  -> $DistApk" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
