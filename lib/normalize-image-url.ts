export const IMAGE_PLACEHOLDER = '/placeholder.svg';

function extractDriveFileId(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([^/]+)/,
    /drive\.google\.com\/open\?id=([^&]+)/,
    /[?&]id=([^&]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function extractLh3FileId(url: string): string | null {
  const match = url.match(/lh3\.googleusercontent\.com\/d\/([^/=?\s]+)/);
  return match?.[1] ?? null;
}

/**
 * Normalizes image URLs for display in <img>.
 * Supports Google Drive and lh3.googleusercontent.com direct links.
 */
export function normalizeImageUrl(url: string | undefined | null): string {
  if (!url?.trim()) return IMAGE_PLACEHOLDER;

  const trimmed = url.trim();

  const lh3FileId = extractLh3FileId(trimmed);
  if (lh3FileId) {
    return `https://lh3.googleusercontent.com/d/${lh3FileId}`;
  }

  if (trimmed.includes('drive.google.com')) {
    const fileId = extractDriveFileId(trimmed);
    if (fileId) {
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return IMAGE_PLACEHOLDER;
}

export function buildCacheBustedImageUrl(
  normalizedUrl: string,
  cacheKey: string
): string {
  if (normalizedUrl === IMAGE_PLACEHOLDER || !normalizedUrl) {
    return IMAGE_PLACEHOLDER;
  }

  const separator = normalizedUrl.includes('?') ? '&' : '?';
  return `${normalizedUrl}${separator}v=${encodeURIComponent(cacheKey)}`;
}
