/**
 * M3U / M3U8 IPTV Playlist Parser for tvcan
 * Includes Smart Category Normalization & Link Sanitization
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
        if (grp) currentChannel.group = normalizeCategory(grp, currentChannel.country);
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

  const category = normalizeCategory(groupTitle || title, tvgCountry);

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
 * Normalizes hundreds of fragmented sub-groups into clean parent categories
 */

function normalizeCategory(rawGroup = '', country = '') {
  const g = rawGroup.toLowerCase();

  // Kids & Animation
  if (g.includes('kid') || g.includes('child') || g.includes('cartoon') || g.includes('disney') || g.includes('nick') || g.includes('anime') || g.includes('junior') || g.includes('toon') || g.includes('baby')) {
    return '🧸 Kids & Cartoons';
  }

  // Movies & Series
  if (g.includes('movie') || g.includes('cinema') || g.includes('film') || g.includes('series') || g.includes('drama') || g.includes('hbo') || g.includes('show') || g.includes('comedy') || g.includes('action')) {
    return '🍿 Movies & Series';
  }

  // Sports
  if (g.includes('sport') || g.includes('soccer') || g.includes('foot') || g.includes('espn') || g.includes('racing') || g.includes('nba') || g.includes('nfl') || g.includes('f1') || g.includes('golf') || g.includes('fight') || g.includes('arena')) {
    return '⚽ Sports';
  }

  // News
  if (g.includes('news') || g.includes('weather') || g.includes('info') || g.includes('politic') || g.includes('cnn') || g.includes('bbc') || g.includes('press') || g.includes('actuality')) {
    return '📰 News & World';
  }

  // Music
  if (g.includes('music') || g.includes('radio') || g.includes('mtv') || g.includes('hit') || g.includes('sound') || g.includes('song') || g.includes('audio') || g.includes('dance')) {
    return '🎵 Music';
  }

  // Documentary & Science
  if (g.includes('docu') || g.includes('history') || g.includes('science') || g.includes('nature') || g.includes('discovery') || g.includes('geo') || g.includes('wild') || g.includes('planet') || g.includes('animal')) {
    return '🌍 Documentary & Nature';
  }

  // Entertainment
  if (g.includes('enter') || g.includes('variet') || g.includes('life') || g.includes('style') || g.includes('fashion') || g.includes('reality')) {
    return '📺 Entertainment';
  }

  // Fallback by country or General
  if (country) {
    return `🌐 ${country.toUpperCase()} Channels`;
  }

  return '📺 General TV';
}

export function extractCategories(channels) {
  const categoryMap = new Map();

  channels.forEach(ch => {
    const groupName = ch.group || '📺 General TV';
    categoryMap.set(groupName, (categoryMap.get(groupName) || 0) + 1);
  });

  const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
    name,
    count
  }));

  categories.sort((a, b) => a.name.localeCompare(b.name));
  return categories;
}
