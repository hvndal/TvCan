/**
 * M3U / M3U8 IPTV Playlist Parser for tvcan
 * Includes Unified Category Normalization & Link Sanitization
 */

export function parseM3U(m3uRawContent) {
  if (!m3uRawContent) return [];

  const lines = m3uRawContent.split(/\r?\n/);
  const channels = [];
  let currentChannel = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      currentChannel = parseExtInfLine(line, i);
    } else if (line.startsWith('#')) {
      if (line.startsWith('#EXTGRP:') && currentChannel) {
        const grp = line.replace('#EXTGRP:', '').trim();
        if (grp) currentChannel.group = normalizeCategory(grp, currentChannel.title);
      }
    } else if (currentChannel && (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://') || line.startsWith('rtsp://'))) {
      currentChannel.url = line;
      
      const isYoutube = line.includes('youtube.com') || line.includes('youtu.be');
      const isTwitch = line.includes('twitch.tv');

      // Only include direct live IPTV streams (no YouTube link redirects)
      if (!isYoutube && !isTwitch) {
        currentChannel.isHls = true;
        channels.push(currentChannel);
      }
      
      currentChannel = null;
    }
  }

  return channels;
}

function parseExtInfLine(line, idIndex) {
  const getAttr = (attr) => {
    const match = line.match(new RegExp(`${attr}="([^"]*)"`, 'i'));
    return match ? match[1].trim() : '';
  };

  const tvgName = getAttr('tvg-name');
  const tvgLogo = getAttr('tvg-logo');
  const tvgId = getAttr('tvg-id');
  const tvgCountry = getAttr('tvg-country');
  const groupTitle = getAttr('group-title');

  const commaIndex = line.lastIndexOf(',');
  let title = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Unknown Channel';

  if (!title && tvgName) title = tvgName;

  const category = normalizeCategory(groupTitle, title, tvgCountry);

  return {
    id: `channel-${idIndex}-${Math.random().toString(36).substr(2, 6)}`,
    title: title || 'Live Channel',
    tvgName: tvgName || title,
    logo: tvgLogo || '',
    tvgId: tvgId || '',
    country: tvgCountry || '',
    group: category,
    rawGroup: groupTitle || 'Misc',
    url: '',
    isWorking: true
  };
}

/**
 * Consolidates all fragmented raw categories into unified primary groups
 */
function normalizeCategory(rawGroup = '', channelTitle = '', tvgCountry = '') {
  const text = `${rawGroup} ${channelTitle}`.toLowerCase();
  const rawGroupLower = rawGroup.toLowerCase();

  // 1. Kids — checked first so 'kids entertainment' doesn't fall into Entertainment
  if (
    text.includes('kid') || text.includes('child') || text.includes('cartoon') ||
    text.includes('disney') || text.includes('nick') || text.includes('anime') ||
    text.includes('junior') || text.includes('toon') || text.includes('baby') ||
    text.includes('animation') || text.includes('cbeebies') || text.includes('cbbc') ||
    text.includes('boomerang') || text.includes('boing') || text.includes('gulli')
  ) {
    return '🧸 Kids';
  }

  // 2. Sports — before Entertainment to prevent 'sport show' going to Entertainment
  if (
    text.includes('sport') || text.includes('soccer') || text.includes('football') ||
    text.includes(' nba') || text.includes(' nfl') || text.includes('espn') ||
    text.includes('wwe') || text.includes(' ufc') || text.includes('fight') ||
    text.includes('racing') || text.includes('f1 ') || text.includes('golf') ||
    text.includes('tennis') || text.includes('cricket') || text.includes('bein') ||
    text.includes('eurosport') || text.includes('dazn') || text.includes('motogp')
  ) {
    return '⚽ Sports';
  }

  // 3. News
  if (
    text.includes('news') || text.includes('weather') || text.includes('al jazeera') ||
    text.includes('euronews') || text.includes('bloomberg') || text.includes('reuters') ||
    text.includes('msnbc') || text.includes('sky news') || text.includes('cnn') ||
    text.includes('politic') || text.includes('bbc news')
  ) {
    return '📰 News';
  }

  // 4. Music
  if (
    text.includes('music') || text.includes(' radio') || text.includes('mtv') ||
    text.includes(' vh1') || text.includes('trace ') || text.includes('clubbing') ||
    text.includes(' dj ') || text.includes('sound') || text.includes('song')
  ) {
    return '🎵 Music';
  }

  // 5. Documentary
  if (
    text.includes('docu') || text.includes('discovery') || text.includes('history') ||
    text.includes('nature') || text.includes('science') || text.includes('nat geo') ||
    text.includes('planet') || text.includes('animal') || text.includes('wildlife')
  ) {
    return '🌍 Documentary';
  }

  // 6. Entertainment (movies, series, drama etc) — 'tv' keyword removed as it is too broad
  if (
    text.includes('movie') || text.includes('cinema') || text.includes('film') ||
    text.includes('series') || text.includes('drama') || text.includes('show') ||
    text.includes('comedy') || text.includes('action') || text.includes('entertain') ||
    text.includes('thriller') || text.includes('romance') || text.includes('horror') ||
    text.includes('sitcom') || text.includes('reality') || text.includes('variety')
  ) {
    return '🍿 Entertainment';
  }

  // 7. Countries — use tvg-country attribute first
  if (tvgCountry && tvgCountry.trim() !== '') {
    return `🗺️ ${tvgCountry.trim().toUpperCase()}`;
  }

  // Fallback: extract leading country code/name from group title e.g. "UK - General"
  const countryMatch = rawGroup.match(/^([A-Z]{2,4}|[A-Z][a-z]+(?: [A-Z][a-z]+)*)(?:\s*[-|:]|\s+)/);
  if (countryMatch && countryMatch[1]) {
    const possibleCountry = countryMatch[1].trim();
    const upper = possibleCountry.toUpperCase();
    const blocklist = new Set(['THE','ALL','LIVE','TOP','NEW','FREE','HOT','WEB','NET','BOX']);
    if (possibleCountry.length <= 20 && !blocklist.has(upper)) {
      return `🗺️ ${upper}`;
    }
  }

  // If group title is a non-generic name treat it as a country/region
  if (rawGroup && rawGroup.trim() !== '') {
    const blocklist = ['undefined','general','misc','other','unknown','all','free','live'];
    if (!blocklist.includes(rawGroupLower)) {
      return `🗺️ ${rawGroup.trim()}`;
    }
  }

  // 8. Misc — true fallback
  return '📺 Misc';
}

const CATEGORY_ORDER = [
  '🧸 Kids',
  '⚽ Sports',
  '📰 News',
  '🎵 Music',
  '🌍 Documentary',
  '🍿 Entertainment'
];

export function extractCategories(channels) {
  const categoryMap = new Map();

  channels.forEach(ch => {
    const groupName = ch.group || '📺 Misc';
    categoryMap.set(groupName, (categoryMap.get(groupName) || 0) + 1);
  });

  const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
    name,
    count
  }));

  categories.sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a.name);
    const indexB = CATEGORY_ORDER.indexOf(b.name);
    const orderA = indexA !== -1 ? indexA : 99;
    const orderB = indexB !== -1 ? indexB : 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  return categories;
}

export function sortChannelsByCategory(channels) {
  return [...channels].sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a.group);
    const indexB = CATEGORY_ORDER.indexOf(b.group);
    const orderA = indexA !== -1 ? indexA : 99;
    const orderB = indexB !== -1 ? indexB : 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.title.localeCompare(b.title);
  });
}
