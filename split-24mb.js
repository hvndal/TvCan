const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, 'tvcan-win-x64.zip');
const outputDir = path.join('C:', 'Users', 'herma', 'Downloads', 'TVCAN_RELEASE_FILES');
const chunkSize = 23.5 * 1024 * 1024; // 23.5 MB (strictly under GitHub's 25 MB limit)

if (fs.existsSync(sourceFile)) {
  const buffer = fs.readFileSync(sourceFile);
  const totalChunks = Math.ceil(buffer.length / chunkSize);
  console.log(`Splitting ${sourceFile} (${(buffer.length / 1024 / 1024).toFixed(2)} MB) into ${totalChunks} chunks of max 23.5 MB each...`);

  // Clean output directory first
  if (fs.existsSync(outputDir)) {
    fs.readdirSync(outputDir).forEach(file => {
      fs.unlinkSync(path.join(outputDir, file));
    });
  } else {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, buffer.length);
    const chunkBuffer = buffer.slice(start, end);
    const chunkFileName = path.join(outputDir, `tvcan-win-x64.part${i + 1}.zip`);

    fs.writeFileSync(chunkFileName, chunkBuffer);
    console.log(`Created ${chunkFileName} (${(chunkBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
  }

  // Also create a 1-click unpack batch script in the same folder
  const batchScript = `@echo off
echo Merging tvcan-win-x64.part* files...
copy /b tvcan-win-x64.part*.zip tvcan-win-x64.zip
echo Done! tvcan-win-x64.zip has been reassembled.
pause
`;
  fs.writeFileSync(path.join(outputDir, 'Double-Click-To-Assemble.bat'), batchScript);

  console.log('Split complete! All files are under 24 MB.');
} else {
  console.error('Source zip not found!');
}
