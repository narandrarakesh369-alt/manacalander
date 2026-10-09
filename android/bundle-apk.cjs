/**
 * MANA CALENDAR 2027 — ANDROID PRODUCTION APK BUILD ENGINE
 * Compiles and packages web assets and native Android container into a verified, signed APK.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ANDROID_DIR = path.resolve(ROOT, 'android');
const APP_DIR = path.resolve(ANDROID_DIR, 'app');
const BUILD_DIR = path.resolve(APP_DIR, 'build');
const OUTPUTS_DIR = path.resolve(BUILD_DIR, 'outputs', 'apk');

const JAVA_HOME = 'C:\\Users\\user\\AppData\\Local\\jdk-17\\jdk-17.0.20.1+1';
const ANDROID_SDK = 'C:\\Users\\user\\AppData\\Local\\Android\\Sdk';
const BUILD_TOOLS = path.join(ANDROID_SDK, 'build-tools', '34.0.0');
const PLATFORM_JAR = path.join(ANDROID_SDK, 'platforms', 'android-34', 'android.jar');
const KEYSTORE = 'C:\\Users\\user\\.android\\debug.keystore';

const AAPT2 = path.join(BUILD_TOOLS, 'aapt2.exe');
const D8 = path.join(BUILD_TOOLS, 'd8.bat');
const ZIPALIGN = path.join(BUILD_TOOLS, 'zipalign.exe');
const APKSIGNER = path.join(BUILD_TOOLS, 'apksigner.bat');
const JAVAC = path.join(JAVA_HOME, 'bin', 'javac.exe');
const JAR = path.join(JAVA_HOME, 'bin', 'jar.exe');

process.env.JAVA_HOME = JAVA_HOME;
process.env.ANDROID_HOME = ANDROID_SDK;
process.env.PATH = `${path.join(JAVA_HOME, 'bin')};${BUILD_TOOLS};${process.env.PATH}`;

console.log('==========================================================');
console.log('  MANA CALENDAR 2027 — ANDROID PRODUCTION APK BUILDER     ');
console.log('==========================================================');

// 1. Prepare build directories
console.log('[1/7] Initializing clean build directories...');
if (fs.existsSync(BUILD_DIR)) {
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}
fs.mkdirSync(path.join(BUILD_DIR, 'res_compiled'), { recursive: true });
fs.mkdirSync(path.join(BUILD_DIR, 'gen'), { recursive: true });
fs.mkdirSync(path.join(BUILD_DIR, 'classes'), { recursive: true });
fs.mkdirSync(path.join(BUILD_DIR, 'assets', 'dist'), { recursive: true });
fs.mkdirSync(OUTPUTS_DIR, { recursive: true });

// 2. Ensure dist/ exists and copy to assets/dist
console.log('[2/7] Staging web assets from dist/ into Android assets...');
const distDir = path.resolve(ROOT, 'dist');
if (!fs.existsSync(distDir)) {
  console.log('Building web bundle with npm run build...');
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
}

function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
copyRecursive(distDir, path.join(BUILD_DIR, 'assets', 'dist'));

// 3. Compile Android resources with aapt2
console.log('[3/7] Compiling Android resources (aapt2)...');
const resDir = path.join(APP_DIR, 'src', 'main', 'res');
const resZip = path.join(BUILD_DIR, 'res_compiled.zip');
execSync(`"${AAPT2}" compile --dir "${resDir}" -o "${resZip}"`, { stdio: 'inherit' });

// 4. Link resources and generate base APK
console.log('[4/7] Linking manifest & resources to create base.apk...');
const manifest = path.join(APP_DIR, 'src', 'main', 'AndroidManifest.xml');
const baseApk = path.join(BUILD_DIR, 'base.apk');
const genDir = path.join(BUILD_DIR, 'gen');
execSync(`"${AAPT2}" link -o "${baseApk}" -I "${PLATFORM_JAR}" --manifest "${manifest}" --java "${genDir}" "${resZip}"`, { stdio: 'inherit' });

// 5. Compile Java sources
console.log('[5/7] Compiling Java container classes (javac)...');
function findJavaFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findJavaFiles(full, files);
    else if (entry.name.endsWith('.java')) files.push(full);
  }
  return files;
}

const javaFiles = [
  ...findJavaFiles(path.join(APP_DIR, 'src', 'main', 'java')),
  ...findJavaFiles(genDir),
];

const classesDir = path.join(BUILD_DIR, 'classes');
execSync(`"${JAVAC}" -cp "${PLATFORM_JAR}" -d "${classesDir}" ${javaFiles.map(f => `"${f}"`).join(' ')}`, { stdio: 'inherit' });

// 6. Convert to Dalvik Executable (classes.dex via d8)
console.log('[6/7] Converting bytecode to Dalvik Executable (d8)...');
function findClassFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findClassFiles(full, files);
    else if (entry.name.endsWith('.class')) files.push(full);
  }
  return files;
}
const classFiles = findClassFiles(classesDir);
execSync(`"${D8}" --lib "${PLATFORM_JAR}" --output "${BUILD_DIR}" ${classFiles.map(f => `"${f}"`).join(' ')}`, { stdio: 'inherit' });

// Add classes.dex into base.apk
execSync(`"${JAR}" -uf "${baseApk}" -C "${BUILD_DIR}" classes.dex`, { stdio: 'inherit' });

// Add assets into base.apk using jar with forward slashes
console.log('Packaging assets/dist into base.apk...');
execSync(`"${JAR}" -uf "${baseApk}" -C "${BUILD_DIR}" assets`, { stdio: 'inherit' });

// 7. ZipAlign and Sign APK
console.log('[7/7] Aligning and signing APK (zipalign & apksigner)...');
const finalApk = path.join(OUTPUTS_DIR, 'ManaCalendar2027.apk');
const rootApk = path.join(ROOT, 'ManaCalendar2027.apk');

execSync(`"${ZIPALIGN}" -f -p 4 "${baseApk}" "${finalApk}"`, { stdio: 'inherit' });
execSync(`"${APKSIGNER}" sign --ks "${KEYSTORE}" --ks-pass "pass:android" --key-pass "pass:android" "${finalApk}"`, { stdio: 'inherit' });

fs.copyFileSync(finalApk, rootApk);

// Verify signature
console.log('Verifying APK signature:');
execSync(`"${APKSIGNER}" verify -v "${finalApk}"`, { stdio: 'inherit' });

const stats = fs.statSync(finalApk);
console.log('==========================================================');
console.log('SUCCESS! Android APK built, packaged and signed!');
console.log(`Path: ${rootApk}`);
console.log(`Size: ${(stats.size / 1024).toFixed(1)} KB`);
console.log('==========================================================');
