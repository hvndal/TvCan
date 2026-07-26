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

  const category = normalizeCategory(groupTitle, title);

  return {
    id: `channel-${idIndex}-${Math.random().toString(36).substr(2, 6)}`,
    title: title || 'Live Channel',
    tvgName: tvgName || title,
    logo: tvgLogo || '',
    tvgId: tvgId || '',
    country: tvgCountry || '',
    group: category,
    rawGroup: groupTitle || 'General',
    url: '',
    isWorking: true
  };
}

/**
 * Consolidates all fragmented raw categories into 7 unified primary groups
 */
function normalizeCategory(rawGroup = '', channelTitle = '') {
  const text = `${rawGroup} ${channelTitle}`.toLowerCase();

  // 1. Kids & Cartoons
  if (
    text.includes('kid') || text.includes('child') || text.includes('cartoon') ||
    text.includes('disney') || text.includes('nick') || text.includes('anime') ||
    text.includes('junior') || text.includes('toon') || text.includes('baby') ||
    text.includes('cbbc') || text.includes('cbeebies') || text.includes('kika') ||
    text.includes('gulli') || text.includes('youth') || text.includes('pixar') ||
    text.includes('animation') || text.includes('boing') || text.includes('boomerang')
  ) {
    return '🧸 Kids & Cartoons';
  }

  // 2. Movies & Entertainment
  if (
    text.includes('movie') || text.includes('cinema') || text.includes('film') ||
    text.includes('series') || text.includes('drama') || text.includes('hbo') ||
    text.includes('show') || text.includes('comedy') || text.includes('action') ||
    text.includes('enter') || text.includes('variet') || text.includes('life') ||
    text.includes('style') || text.includes('fashion') || text.includes('reality') ||
    text.includes('fox') || text.includes('paramount') || text.includes('amc') ||
    text.includes('tnt') || text.includes('wb') || text.includes('universal') ||
    text.includes('star') || text.includes('axn') || text.includes('fx') ||
    text.includes('thriller') || text.includes('romance') || text.includes('horror')
  ) {
    return '🍿 Movies & Entertainment';
  }

  // 3. Sports
  if (
    text.includes('sport') || text.includes('soccer') || text.includes('foot') ||
    text.includes('espn') || text.includes('racing') || text.includes('nba') ||
    text.includes('nfl') || text.includes('f1') || text.includes('golf') ||
    text.includes('fight') || text.includes('arena') || text.includes('wwe') ||
    text.includes('tennis') || text.includes('cricket') || text.includes('bein') ||
    text.includes('sky sport') || text.includes('eurosport') || text.includes('super sport') ||
    text.includes('dazn') || text.includes('motogp') || text.includes('ufc')
  ) {
    return '⚽ Sports';
  }

  // 4. News & World
  if (
    text.includes('news') || text.includes('weather') || text.includes('info') ||
    text.includes('politic') || text.includes('cnn') || text.includes('bbc') ||
    text.includes('press') || text.includes('actuality') || text.includes('al jazeera') ||
    text.includes('euronews') || text.includes('bloomberg') || text.includes('fox news') ||
    text.includes('msnbc') || text.includes('sky news') || text.includes('reuters')
  ) {
    return '📰 News & World';
  }

  // 5. Music
  if (
    text.includes('music') || text.includes('radio') || text.includes('mtv') ||
    text.includes('hit') || text.includes('sound') || text.includes('song') ||
    text.includes('audio') || text.includes('dance') || text.includes('vh1') ||
    text.includes('trace') || text.includes('clubbing') || text.includes('dj')
  ) {
    return '🎵 Music';
  }

  // 6. Documentary & Nature
  if (
    text.includes('docu') || text.includes('history') || text.includes('science') ||
    text.includes('nature') || text.includes('discovery') || text.includes('geo') ||
    text.includes('wild') || text.includes('planet') || text.includes('animal') ||
    text.includes('nat geo') || text.includes('explore') || text.includes('archaeo')
  ) {
    return '🌍 Documentary & Nature';
  }

  // 7. General & Regional TV
  return '📺 General & Regional TV';
}

const CATEGORY_ORDER = [
  '🧸 Kids & Cartoons',
  '🍿 Movies & Entertainment',
  '⚽ Sports',
  '📰 News & World',
  '🎵 Music',
  '🌍 Documentary & Nature',
  '📺 General & Regional TV'
];

export function extractCategories(channels) {
  const categoryMap = new Map();

  channels.forEach(ch => {
    const groupName = ch.group || '📺 General & Regional TV';
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
