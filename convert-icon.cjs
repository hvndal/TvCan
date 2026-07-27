const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const pngToIco = require('png-to-ico');

const sourceJpg = 'C:\\Users\\herma\\.gemini\\antigravity\\brain\\8659f0e9-fa1b-4b23-9024-e26daca4beaf\\orange_tv_icon_1785148147438.jpg';
const destPng = path.join(__dirname, 'public', 'tvcan-logo.png');
const destIco = path.join(__dirname, 'icon.ico');

async function run() {
  try {
    // Ensure public directory exists
    if (!fs.existsSync(path.join(__dirname, 'public'))) {
      fs.mkdirSync(path.join(__dirname, 'public'));
    }

    console.log('Reading JPG...');
    const image = await Jimp.read(sourceJpg);
    
    // Resize for standard icon and write PNG
    console.log('Writing PNG...');
    await image.resize(256, 256).writeAsync(destPng);
    
    // Convert PNG to ICO
    console.log('Converting to ICO...');
    const buf = await pngToIco.default(destPng);
    fs.writeFileSync(destIco, buf);
    
    console.log('Done! Created tvcan-logo.png and icon.ico');
  } catch (err) {
    console.error('Error during conversion:', err);
  }
}

run();
