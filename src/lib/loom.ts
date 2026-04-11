/**
 * Loom URL parsing utility.
 * Extracts video ID from various Loom URL formats and generates embed URLs.
 */

const LOOM_REGEX = /loom\.com\/(?:share|embed)\/([a-f0-9]+)/i;

export function parseLoomUrl(url: string): {
  videoId: string;
  embedUrl: string;
  shareUrl: string;
} | null {
  const match = url.match(LOOM_REGEX);
  if (!match) return null;

  const videoId = match[1];
  return {
    videoId,
    embedUrl: `https://www.loom.com/embed/${videoId}`,
    shareUrl: `https://www.loom.com/share/${videoId}`,
  };
}

export function getLoomThumbnail(videoId: string): string {
  return `https://cdn.loom.com/sessions/thumbnails/${videoId}-with-play.gif`;
}
