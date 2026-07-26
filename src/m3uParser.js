/**
 * M3U / M3U8 IPTV Playlist Parser for tvcan
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
        if (grp) currentChannel.group = grp;
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

  const category = groupTitle || (tvgCountry ? `Country: ${tvgCountry}` : 'General');

  return {
    id: `channel-${idIndex}-${Math.random().toString(36).substr(2, 6)}`,
    title: title || 'Live Channel',
    tvgName: tvgName || title,
    logo: tvgLogo || '',
    tvgId: tvgId || '',
    country: tvgCountry || '',
    group: category,
    url: ''
  };
}

export function extractCategories(channels) {
  const categoryMap = new Map();

  channels.forEach(ch => {
    const groupName = ch.group || 'General';
    categoryMap.set(groupName, (categoryMap.get(groupName) || 0) + 1);
  });

  const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
    name,
    count
  }));

  categories.sort((a, b) => a.name.localeCompare(b.name));
  return categories;
}
