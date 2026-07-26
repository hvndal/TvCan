/**
 * Live Stream Validator for tvcan
 * Rapidly tests stream URLs to hide dead/offline links
 */

export async function checkStreamHealth(url, timeoutMs = 3500) {
  if (!url) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Range': 'bytes=0-1024',
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok || response.status === 206 || response.status === 200;
  } catch (err) {
    clearTimeout(timeoutId);
    return false;
  }
}

/**
 * Filter list to return only verified working channels
 */
export function filterWorkingChannels(channels) {
  return channels.filter(ch => ch.isWorking !== false);
}
