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

  // 1. Kids
  if (
    text.includes('kid') || text.includes('child') || text.includes('cartoon') ||
    text.includes('disney') || text.includes('nick') || text.includes('anime') ||
    text.includes('junior') || text.includes('toon') || text.includes('baby') ||
    text.includes('animation')
  ) {
    return '🧸 Kids';
  }

  // 2. Entertainment
  if (
    text.includes('movie') || text.includes('cinema') || text.includes('film') ||
    text.includes('series') || text.includes('drama') || text.includes('show') ||
    text.includes('comedy') || text.includes('action') || text.includes('enter') ||
    text.includes('thriller') || text.includes('romance') || text.includes('horror') ||
    text.includes('tv')
  ) {
    return '🍿 Entertainment';
  }
  
  // 3. Sports
  if (
    text.includes('sport') || text.includes('soccer') || text.includes('foot') ||
    text.includes('nba') || text.includes('nfl') || text.includes('espn') || 
    text.includes('wwe') || text.includes('fight') || text.includes('racing')
  ) {
    return '⚽ Sports';
  }
  
  // 4. News
  if (
    text.includes('news') || text.includes('weather') || text.includes('cnn') ||
    text.includes('bbc')
  ) {
    return '📰 News';
  }

  // 5. Countries
  if (tvgCountry && tvgCountry.trim() !== '') {
    return `🗺️ ${tvgCountry.trim().toUpperCase()}`;
  }

  // Fallback to extract country from raw group (e.g. "UK - Entertainment" -> "UK")
  const countryMatch = rawGroup.match(/^([A-Z]{2,3}|[A-Z][a-z]+(?: [A-Z][a-z]+)*)(?:\s*[-|:]|\s+)/);
  if (countryMatch && countryMatch[1]) {
    const possibleCountry = countryMatch[1].trim().toUpperCase();
    if (possibleCountry.length <= 15 && possibleCountry !== 'THE' && possibleCountry !== 'ALL' && possibleCountry !== 'LIVE') {
      return `🗺️ ${possibleCountry}`;
    }
  }

  if (rawGroup && rawGroup.trim() !== '' && rawGroupLower !== 'undefined' && rawGroupLower !== 'general' && rawGroupLower !== 'misc') {
    return `🗺️ ${rawGroup.trim()}`;
  }

  // 6. Misc
  return '📺 Misc';
}

const CATEGORY_ORDER = [
  '🧸 Kids',
  '🍿 Entertainment',
  '⚽ Sports',
  '📰 News'
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
