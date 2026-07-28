import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const archiverLib = require('archiver');
const archiver = typeof archiverLib === 'function' ? archiverLib : archiverLib.default || archiverLib;

const outputZipPath = path.join(process.cwd(), 'tvcan-win-x64.zip');
const sourceFolder = path.join(process.cwd(), 'dist-app', 'tvcan-win32-x64');

console.log('Compressing tvcan-win32-x64 to tvcan-win-x64.zip with level 9 max compression...');

const output = fs.createWriteStream(outputZipPath);
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', () => {
  const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`tvcan-win-x64.zip created successfully! Final compressed size: ${sizeMB} MB`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.directory(sourceFolder, false);
archive.finalize();
