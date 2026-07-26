# 📺 tvcan — Modern VLC-Powered Live IPTV Desktop Player

> **tvcan** is a high-performance, zero-configuration desktop live TV application for Windows. Powered by an integrated **VLC Media Player Engine** and **HLS.js**, `tvcan` aggregates free public IPTV streams into a sleek, organized, and reliable viewing experience.

---

## ✨ Key Features

- 🟠 **VLC Media Player Engine**: Re-skinned with the classic VLC Media Player slate aesthetic, iconic traffic cone branding, and full transport controls (Play, Pause, Stop, Previous Channel, Next Channel, Volume %, and Fullscreen).
- 🧹 **Smart Category Normalization**: Automatically groups thousands of fragmented M3U sub-categories into clean parent groups:
  - 🧸 **Kids & Cartoons** (Disney, Nickelodeon, Cartoons, Anime)
  - 🍿 **Movies & Series** (Cinema, Film, Drama, Shows)
  - ⚽ **Sports** (Football, Racing, ESPN, Live Events)
  - 📰 **News & World** (CNN, BBC, Local & Global News)
  - 🎵 **Music** (MTV, Radio, Live Music Hits)
  - 🌍 **Documentary & Nature** (Discovery, History, Science)
  - 📺 **General & Regional TV**
- 🛡️ **Direct Stream Filtering**: Strips out non-playable redirects (YouTube/Twitch link traps) to ensure every listed channel streams directly inside the application.
- ⚡ **Zero-Configuration Startup**: No sign-in or account setup required. Loads live channels instantly on launch.
- 🔑 **VLC Header Spoofing**: Configured with native VLC LibVLC headers (`User-Agent: VLC/3.0.18 LibVLC/3.0.18`) for optimal stream server compatibility.

---

## 🛠️ Installation & Usage

### Option 1: Direct Download (Pre-built Executable)

1. Download **[tvcan-win-x64.zip](https://github.com/hvndal/TvCan/releases)**.
2. Extract the ZIP package anywhere on your computer.
3. Double-click `tvcan.exe` to start watching live TV immediately!

---

### Option 2: Build from Source

#### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- `npm`

#### Step-by-Step Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hvndal/TvCan.git
   cd TvCan
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run in development mode**:
   ```bash
   npm run dev
   npx electron .
   ```

4. **Build the Standalone Executable (.exe)**:
   ```bash
   npm run build
   npm run dist
   ```
   The compiled Windows executable will be generated in `dist-app/tvcan-win32-x64/tvcan.exe`.

---

## 💻 Technical Architecture

| Component | Technology |
| :--- | :--- |
| **Desktop Shell** | Electron 34 |
| **Bundler & HMR** | Vite 6 |
| **Stream Engine** | HLS.js (HTTP Live Streaming) |
| **Theme** | Custom VLC Media Player Dark Slate Palette |
| **Network Protocol** | VLC LibVLC Header Mimicking |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">Made with ❤️ by Herman • Powered by open-source IPTV</p>
