# tvcan

`tvcan` is a desktop live TV application for Windows built using Electron and HLS.js. It streams free public live TV channels directly from the [Free-TV IPTV M3U8 playlist](https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8).

No login or account creation is required. All direct live streams are loaded automatically upon launch.

---

## Features

- **No Sign-In**: Opens directly into the live channel list.
- **Direct Live HLS Streams**: Filters out non-playable links so every listed channel streams directly in the app.
- **Categories & Search**: Filter channels by country/group and search by name.
- **Favorites**: Bookmark channels for quick access.
- **Player Controls**: Volume slider, Picture-in-Picture, Fullscreen mode, and stream status indicator.
- **VLC Header Compatibility**: Configured with VLC LibVLC user-agent headers for maximum stream server compatibility.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm

---

## Installation & Running Locally

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

---

## Building the Standalone Windows Executable (.exe)

To compile the application into a Windows executable (`.exe`):

```bash
npm run build
npm run dist
```

The output executable will be created in `dist-app/tvcan-win32-x64/tvcan.exe`.

---

## License

MIT
