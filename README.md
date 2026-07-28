# 📺 tvcan — Modern VLC-Powered Live IPTV Desktop Player

[![Download tvcan for Windows](https://img.shields.io/badge/Download-tvcan--win--x64.zip-orange?style=for-the-badge&logo=windows)](https://github.com/hvndal/TvCan/releases/tag/v1.0.0)

> **tvcan** is a high-performance desktop live TV application for Windows. Powered by an integrated **VLC Media Player Engine** and **HLS.js**, `tvcan` aggregates free public IPTV streams into a clean, organized, and reliable viewing experience. No installation or setup required — download and play.

---

## 🚀 Quick Download & Run (No Setup Needed)

1. Go to https://drive.google.com/file/d/1apVS26ynVMA7x1kAkHoK0kgSu4lweGpb/view?usp=drive_link
2. Download **`tvcan-win-x64.zip`**.
3. Extract the ZIP file anywhere on your Windows PC.
4. Double-click **`tvcan.exe`** to start watching live TV!

---

## ✨ Features

- 🟠 **VLC Media Player Engine**: Iconic VLC Media Player slate design with full transport controls (Play, Pause, Stop, Previous Channel, Next Channel, Volume %, and Fullscreen).
- 🧹 **Smart Category Normalization**: Automatically groups thousands of fragmented M3U sub-categories into parent groups:
  - 🧸 **Kids & Cartoons** (Disney, Nickelodeon, Cartoons, Anime)
  - 🍿 **Movies & Series** (Cinema, Film, Drama, Shows)
  - ⚽ **Sports** (Football, Racing, ESPN, Live Events)
  - 📰 **News & World** (CNN, BBC, Local & Global News)
  - 🎵 **Music** (MTV, Radio, Live Music Hits)
  - 🌍 **Documentary & Nature** (Discovery, History, Science)
  - 📺 **General & Regional TV**
- 🛡️ **Direct Stream Filtering**: Strips out non-playable redirects (YouTube/Twitch link traps) so every listed channel plays directly in the app.
- ⚡ **Zero-Configuration**: No sign-in or account setup required.
- 🔑 **VLC Header Spoofing**: Configured with native VLC headers (`User-Agent: VLC/3.0.18 LibVLC/3.0.18`) for maximum stream compatibility.

---

## 🛠️ Building from Source (Developers Only)

```bash
git clone https://github.com/hvndal/TvCan.git
cd TvCan
npm install
npm run dev      # Run locally
npm run dist     # Package executable .exe
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

<p align="center">Made with ❤️ by Herman • Powered by open-source IPTV</p>
