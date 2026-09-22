const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join('C:', 'Users', 'herma', 'Desktop', 'MANDER_TECH_VIDEOS');
const SLIDES_DIR = path.join(OUTPUT_DIR, 'carousel_slides');
const VIDEO_FILE = path.join(OUTPUT_DIR, 'tvcan_mander_tech_instagram_reel.webm');

if (!fs.existsSync(SLIDES_DIR)) {
  fs.mkdirSync(SLIDES_DIR, { recursive: true });
}

let win;

app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

app.whenReady().then(() => {
  console.log('🎬 Starting high-speed render of @mander.tech Instagram Reel & Carousel (1080x1920 60FPS)...');

  win = new BrowserWindow({
    width: 420,
    height: 740,
    show: true,
    title: 'mander.tech Instagram Reel & Carousel Studio',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile(path.join(__dirname, 'export-worker.html'));

  ipcMain.on('recording-progress', (event, percent) => {
    process.stdout.write(`\r⏳ Rendering frames: ${percent}%`);
  });

  ipcMain.on('save-slide', (event, { name, base64Data }) => {
    const filePath = path.join(SLIDES_DIR, name);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    console.log(`\n📸 Carousel Slide Saved: ${name}`);
  });

  ipcMain.on('recording-complete', (event, buffer) => {
    console.log('\n💾 Writing full video to Desktop...');
    fs.writeFileSync(VIDEO_FILE, Buffer.from(buffer));
    const stats = fs.statSync(VIDEO_FILE);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`\n🎉 INSTAGRAM REEL & CAROUSEL EXPORT COMPLETE!`);
    console.log(`📁 Video: ${VIDEO_FILE} (${sizeMB} MB)`);
    console.log(`🖼️ Slides: ${SLIDES_DIR}`);
    console.log(`🎥 Format: 1080x1920 (9:16 Vertical • 60 FPS • Multi-Chapter)`);
    app.quit();
  });

  ipcMain.on('recording-error', (event, err) => {
    console.error('\n❌ Render error:', err);
    app.quit();
  });
});
