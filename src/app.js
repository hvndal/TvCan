import Hls from 'hls.js';
import { parseM3U, extractCategories } from './m3uParser.js';

const PRIMARY_PLAYLIST_URL = 'https://iptv-org.github.io/iptv/index.m3u';
const SECONDARY_PLAYLIST_URL = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';
const STORAGE_KEY_PLAYLIST_URL = 'tvcan_playlist_url';
const STORAGE_KEY_FAVORITES = 'tvcan_favorites';
const STORAGE_KEY_CACHE = 'tvcan_cached_m3u';

class TvCanApp {
  constructor() {
    this.playlistUrl = localStorage.getItem(STORAGE_KEY_PLAYLIST_URL) || PRIMARY_PLAYLIST_URL;
    this.favorites = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_FAVORITES) || '[]'));
    this.channels = [];
    this.filteredChannels = [];
    this.categories = [];
    this.activeCategory = 'ALL';
    this.searchQuery = '';
    this.activeChannel = null;
    this.hlsEngine = null;

    this.initDOM();
    this.initEvents();
    this.initPlayer();
    this.loadPlaylist();
  }

  initDOM() {
    this.dom = {
      searchInput: document.getElementById('searchInput'),
      btnRefresh: document.getElementById('btnRefresh'),
      btnSettings: document.getElementById('btnSettings'),
      categoryMenu: document.getElementById('categoryMenu'),
      categoryList: document.getElementById('categoryList'),
      badgeAllCount: document.getElementById('badgeAllCount'),
      badgeFavCount: document.getElementById('badgeFavCount'),
      videoPlayer: document.getElementById('videoPlayer'),
      iframePlayer: document.getElementById('iframePlayer'),
      playerOverlay: document.getElementById('playerOverlay'),
      playerSpinner: document.getElementById('playerSpinner'),
      overlayTitle: document.getElementById('overlayTitle'),
      overlaySub: document.getElementById('overlaySub'),
      playingLogo: document.getElementById('playingLogo'),
      playingTitle: document.getElementById('playingTitle'),
      playingMeta: document.getElementById('playingMeta'),
      playingStatus: document.getElementById('playingStatus'),
      btnMute: document.getElementById('btnMute'),
      volumeSlider: document.getElementById('volumeSlider'),
      btnPip: document.getElementById('btnPip'),
      btnFullscreen: document.getElementById('btnFullscreen'),
      currentCategoryTitle: document.getElementById('currentCategoryTitle'),
      currentCategoryCount: document.getElementById('currentCategoryCount'),
      channelsGrid: document.getElementById('channelsGrid'),
      settingsModal: document.getElementById('settingsModal'),
      btnCloseModal: document.getElementById('btnCloseModal'),
      playlistUrlInput: document.getElementById('playlistUrlInput'),
      btnResetUrl: document.getElementById('btnResetUrl'),
      btnSaveUrl: document.getElementById('btnSaveUrl')
    };
  }

  initEvents() {
    // Search
    this.dom.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderChannels();
    });

    // Refresh & Settings
    this.dom.btnRefresh.addEventListener('click', () => this.loadPlaylist(true));
    this.dom.btnSettings.addEventListener('click', () => {
      this.dom.playlistUrlInput.value = this.playlistUrl;
      this.dom.settingsModal.classList.add('show');
    });
    this.dom.btnCloseModal.addEventListener('click', () => {
      this.dom.settingsModal.classList.remove('show');
    });
    this.dom.btnResetUrl.addEventListener('click', () => {
      this.dom.playlistUrlInput.value = PRIMARY_PLAYLIST_URL;
    });
    this.dom.btnSaveUrl.addEventListener('click', () => {
      const newUrl = this.dom.playlistUrlInput.value.trim();
      if (newUrl) {
        this.playlistUrl = newUrl;
        localStorage.setItem(STORAGE_KEY_PLAYLIST_URL, newUrl);
        this.dom.settingsModal.classList.remove('show');
        this.loadPlaylist(true);
      }
    });

    // Category click delegation
    this.dom.categoryMenu.addEventListener('click', (e) => {
      const item = e.target.closest('.menu-item');
      if (!item) return;

      const cat = item.dataset.category;
      if (cat) {
        this.setActiveCategory(cat);
      }
    });

    // Video Player Controls
    this.dom.btnMute.addEventListener('click', () => {
      this.dom.videoPlayer.muted = !this.dom.videoPlayer.muted;
      this.dom.volumeSlider.value = this.dom.videoPlayer.muted ? 0 : this.dom.videoPlayer.volume;
    });

    this.dom.volumeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.dom.videoPlayer.volume = val;
      this.dom.videoPlayer.muted = val === 0;
    });

    this.dom.btnPip.addEventListener('click', async () => {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && !this.dom.videoPlayer.paused) {
        await this.dom.videoPlayer.requestPictureInPicture();
      }
    });

    this.dom.btnFullscreen.addEventListener('click', () => {
      const playerArea = document.querySelector('.video-wrapper');
      if (!document.fullscreenElement) {
        playerArea.requestFullscreen?.() || this.dom.videoPlayer.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    });
  }

  initPlayer() {
    const video = this.dom.videoPlayer;

    video.addEventListener('loadstart', () => this.showOverlay(true, 'Connecting to stream...', 'Buffering live feed...'));
    video.addEventListener('playing', () => {
      this.hideOverlay();
      this.dom.playingStatus.textContent = 'LIVE';
    });
    video.addEventListener('waiting', () => this.showOverlay(true, 'Buffering stream...', 'Please wait'));
    video.addEventListener('error', () => {
      this.showOverlay(false, 'Stream Unavailable', 'This live stream is currently offline');
      this.dom.playingStatus.textContent = 'Offline';
    });
  }

  showOverlay(showSpinner, title, sub) {
    this.dom.playerOverlay.classList.remove('hidden');
    this.dom.playerSpinner.style.display = showSpinner ? 'block' : 'none';
    this.dom.overlayTitle.textContent = title;
    this.dom.overlaySub.textContent = sub || 'tvcan made by herman';
  }

  hideOverlay() {
    this.dom.playerOverlay.classList.add('hidden');
  }

  async fetchPlaylistText(url) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.text();
    } catch (e) {
      console.warn('Failed to fetch:', url, e);
    }
    return '';
  }

  async loadPlaylist(forceFetch = false) {
    this.showOverlay(true, 'Loading Channels...', 'tvcan made by herman');

    let combinedChannels = [];

    let cached = null;
    if (!forceFetch) {
      cached = localStorage.getItem(STORAGE_KEY_CACHE);
    }

    if (cached) {
      combinedChannels = JSON.parse(cached);
    } else {
      // Fetch both iptv-org and Free-TV playlists in parallel
      const [primaryRaw, secondaryRaw] = await Promise.all([
        this.fetchPlaylistText(this.playlistUrl),
        this.fetchPlaylistText(SECONDARY_PLAYLIST_URL)
      ]);

      const channels1 = parseM3U(primaryRaw);
      const channels2 = parseM3U(secondaryRaw);

      // Combine and remove duplicates by stream URL
      const urlMap = new Map();
      [...channels1, ...channels2].forEach(ch => {
        if (ch.url && !urlMap.has(ch.url)) {
          urlMap.set(ch.url, ch);
        }
      });

      combinedChannels = Array.from(urlMap.values());
      try {
        localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(combinedChannels.slice(0, 5000)));
      } catch (e) {}
    }

    this.channels = combinedChannels;
    this.categories = extractCategories(this.channels);

    this.updateCategoryUI();
    this.renderChannels();
    this.showOverlay(false, 'Select a Channel to Play', 'tvcan made by herman');
  }

  updateCategoryUI() {
    this.dom.badgeAllCount.textContent = this.channels.length;
    this.dom.badgeFavCount.textContent = this.favorites.size;

    this.dom.categoryList.innerHTML = this.categories.map(cat => `
      <div class="menu-item ${this.activeCategory === cat.name ? 'active' : ''}" data-category="${this.escapeHtml(cat.name)}">
        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px;">${this.escapeHtml(cat.name)}</span>
        <span class="menu-badge">${cat.count}</span>
      </div>
    `).join('');
  }

  setActiveCategory(category) {
    this.activeCategory = category;
    document.querySelectorAll('.menu-item').forEach(el => {
      el.classList.toggle('active', el.dataset.category === category);
    });

    this.dom.currentCategoryTitle.textContent = category === 'ALL' ? 'All Channels' : (category === 'FAVORITES' ? 'Favorites' : category);
    this.renderChannels();
  }

  renderChannels() {
    let list = this.channels;

    if (this.activeCategory === 'FAVORITES') {
      list = list.filter(ch => this.favorites.has(ch.id));
    } else if (this.activeCategory !== 'ALL') {
      list = list.filter(ch => ch.group === this.activeCategory);
    }

    if (this.searchQuery) {
      list = list.filter(ch => 
        ch.title.toLowerCase().includes(this.searchQuery) ||
        ch.group.toLowerCase().includes(this.searchQuery) ||
        ch.country.toLowerCase().includes(this.searchQuery)
      );
    }

    this.filteredChannels = list;
    this.dom.currentCategoryCount.textContent = list.length;

    if (list.length === 0) {
      this.dom.channelsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
          <div>No channels match your criteria</div>
        </div>
      `;
      return;
    }

    // Render up to 500 channels at a time for high performance rendering
    const renderList = list.slice(0, 500);

    this.dom.channelsGrid.innerHTML = renderList.map(ch => {
      const isFav = this.favorites.has(ch.id);
      const isActive = this.activeChannel?.id === ch.id;
      const initial = ch.title.charAt(0).toUpperCase();

      return `
        <div class="channel-card ${isActive ? 'active' : ''}" data-id="${ch.id}">
          <div class="channel-logo-wrapper">
            ${ch.logo ? `<img class="channel-logo" src="${this.escapeHtml(ch.logo)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" alt="">` : ''}
            <span class="channel-logo-placeholder" style="${ch.logo ? 'display:none;' : ''}">${initial}</span>
          </div>
          <div class="channel-info">
            <div class="channel-name" title="${this.escapeHtml(ch.title)}">${this.escapeHtml(ch.title)}</div>
            <div class="channel-group">${this.escapeHtml(ch.group)}</div>
          </div>
          <button class="fav-btn ${isFav ? 'active' : ''}" data-fav-id="${ch.id}" title="Favorite">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </button>
        </div>
      `;
    }).join('');

    this.dom.channelsGrid.querySelectorAll('.channel-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const favBtn = e.target.closest('.fav-btn');
        const chId = card.dataset.id;
        const channel = this.channels.find(c => c.id === chId);

        if (favBtn) {
          e.stopPropagation();
          this.toggleFavorite(chId);
          return;
        }

        if (channel) {
          this.playChannel(channel);
        }
      });
    });
  }

  toggleFavorite(chId) {
    if (this.favorites.has(chId)) {
      this.favorites.delete(chId);
    } else {
      this.favorites.add(chId);
    }

    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(Array.from(this.favorites)));
    this.updateCategoryUI();
    this.renderChannels();
  }

  playChannel(channel) {
    this.activeChannel = channel;
    
    document.querySelectorAll('.channel-card').forEach(card => {
      card.classList.toggle('active', card.dataset.id === channel.id);
    });

    this.dom.playingTitle.textContent = channel.title;
    if (channel.logo) {
      this.dom.playingLogo.src = channel.logo;
      this.dom.playingLogo.style.display = 'block';
    } else {
      this.dom.playingLogo.style.display = 'none';
    }
    this.dom.playingStatus.textContent = 'Connecting...';

    const url = channel.url;

    this.dom.iframePlayer.classList.add('hidden');
    this.dom.iframePlayer.src = '';
    this.dom.videoPlayer.style.display = 'block';

    if (this.hlsEngine) {
      this.hlsEngine.destroy();
      this.hlsEngine = null;
    }

    if (Hls.isSupported()) {
      this.hlsEngine = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      this.hlsEngine.loadSource(url);
      this.hlsEngine.attachMedia(this.dom.videoPlayer);
      this.hlsEngine.on(Hls.Events.MANIFEST_PARSED, () => {
        this.dom.videoPlayer.play().catch(e => console.warn('Autoplay blocked:', e));
      });

      this.hlsEngine.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              this.hlsEngine.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              this.hlsEngine.recoverMediaError();
              break;
            default:
              this.showOverlay(false, 'Stream Offline', 'tvcan made by herman');
              break;
          }
        }
      });
    } else {
      this.dom.videoPlayer.src = url;
      this.dom.videoPlayer.play();
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m]));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new TvCanApp();
});
