import { createWindowsInstaller } from 'electron-winstaller';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildInstaller() {
  console.log('Building tvcan Windows Setup Installer Wizard...');
  
  try {
    await createWindowsInstaller({
      appDirectory: path.join(__dirname, 'dist-app', 'tvcan-win32-x64'),
      outputDirectory: path.join(__dirname, 'dist-installer'),
      authors: 'herman',
      exe: 'tvcan.exe',
      setupExe: 'tvcan-Setup-1.0.0.exe',
      noMsi: true,
      description: 'tvcan - Live IPTV Desktop Player'
    });
    console.log('tvcan Windows Setup Installer (.exe) successfully created in dist-installer/tvcan-Setup-1.0.0.exe!');
  } catch (e) {
    console.error('Installer build error:', e);
  }
}

buildInstaller();
