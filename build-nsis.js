/**
 * build-nsis.js
 * Builds the tvcan Windows NSIS Installer Wizard using electron-builder.
 * Output: C:\Users\herma\Desktop\tvcan-Setup-1.0.0.exe
 *
 * Features:
 *   - LZMA maximum compression (smallest possible .exe)
 *   - Welcome screen → choose install dir → progress → finish
 *   - Desktop + Start Menu shortcuts with orange tvcan icon
 *   - "Launch tvcan" checkbox on Finish
 *   - Full uninstaller in Add/Remove Programs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RELEASE_FOLDER = path.join('C:', 'Users', 'herma', 'Desktop');
const INSTALLER_NAME = 'tvcan-Setup-1.0.0.exe';

console.log('\n🏗️  Step 1: Building Vite web assets...');
execSync('npx vite build', { stdio: 'inherit', cwd: __dirname });

console.log('\n📦 Step 2: Building compressed NSIS Installer Wizard (electron-builder)...');
console.log('   Using LZMA maximum compression — this may take a few minutes...\n');

// Clean old dist-installer to avoid stale files
const distDir = path.join(__dirname, 'dist-installer');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}

try {
  execSync('npx electron-builder --win --x64', {
    stdio: 'inherit',
    cwd: __dirname,
    env: {
      ...process.env,
      CSC_LINK: '',
      CSC_KEY_PASSWORD: '',
      WIN_CSC_LINK: '',
      WIN_CSC_KEY_PASSWORD: ''
    }
  });
} catch (e) {
  console.error('\n❌ electron-builder failed:', e.message);
  process.exit(1);
}

// Move just the .exe to the release folder
const srcExe = path.join(distDir, INSTALLER_NAME);
if (!fs.existsSync(srcExe)) {
  console.error(`\n❌ Could not find ${INSTALLER_NAME} in dist-installer/.`);
  process.exit(1);
}

if (!fs.existsSync(RELEASE_FOLDER)) {
  fs.mkdirSync(RELEASE_FOLDER, { recursive: true });
}

const destExe = path.join(RELEASE_FOLDER, INSTALLER_NAME);
fs.copyFileSync(srcExe, destExe);

const sizeMB = (fs.statSync(destExe).size / 1024 / 1024).toFixed(1);
console.log(`\n✅ Installer ready!`);
console.log(`📁 Location : ${destExe}`);
console.log(`📏 Size     : ${sizeMB} MB`);
console.log(`\n👆 Double-click the .exe to run the Setup Wizard!`);
