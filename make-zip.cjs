const fs = require('fs');
const path = require('path');
const { ZipArchive } = require('archiver');

const outputZipPath = path.join(__dirname, 'tvcan-win-x64.zip');
const sourceFolder = path.join(__dirname, 'dist-app', 'tvcan-win32-x64');

console.log('Compressing tvcan-win32-x64 to tvcan-win-x64.zip...');

const output = fs.createWriteStream(outputZipPath);
const archive = new ZipArchive({
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
