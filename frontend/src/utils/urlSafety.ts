import type { SyntheticEvent } from 'react';

/**
 * URL safety helpers.
 *
 * Strings that reach this module come from listeners or from the database
 * (`song_requests.youtube_url`, `songs.artwork_url`, `stations.cover_image`,
 * `provider_video_id`). React escapes attributes, so plain text is safe — but
 * an attribute that accepts a *scheme* (an `href`, an image `src`) must be
 * validated before it is rendered, otherwise a row written by any path other
 * than the validating RPC (direct table write, restore, future tooling) turns
 * into a `javascript:`/`data:` link inside the admin portal.
 *
 * Every helper returns `null` for anything it cannot vouch for, so callers can
 * simply omit the element.
 */

/** Allow http(s) URLs only. Anything else (javascript:, data:, vbscript:) is rejected. */
export function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

const YOUTUBE_HOST = /^(?:[a-z0-9-]+\.)*(?:youtube\.com|youtu\.be)$/i;

/** http(s) and a YouTube host only — for outbound "open video" links. */
export function safeYouTubeUrl(value: unknown): string | null {
  const url = safeExternalUrl(value);
  if (!url) return null;
  try {
    return YOUTUBE_HOST.test(new URL(url).hostname) ? url : null;
  } catch {
    return null;
  }
}

/**
 * Same-origin paths and http(s) URLs only. Rejects `javascript:` and `data:`
 * so an attacker-supplied `artwork_url`/`cover_image` can never inject an SVG
 * document into every thumbnail on the site.
 */
export function safeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Same-origin relative path (but never protocol-relative `//evil.com`).
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  return safeExternalUrl(trimmed);
}

/** The id charset YouTube actually uses; anything else would only 404. */
const VIDEO_ID = /^[A-Za-z0-9_-]{6,20}$/;

/**
 * True when an id is plausibly a real YouTube video id. An empty/invalid id
 * handed to the player raises YouTube error 2 immediately, which the auto-skip
 * handler turns into a loop that churns through the whole playlist.
 */
export function isPlayableVideoId(value: unknown): boolean {
  return typeof value === 'string' && VIDEO_ID.test(value);
}

/** Thumbnail URL for a provider video id, or null when the id is implausible. */
export function youtubeThumb(
  videoId: unknown,
  quality: 'default' | 'hqdefault' | 'maxresdefault' = 'hqdefault'
): string | null {
  if (typeof videoId !== 'string' || !VIDEO_ID.test(videoId)) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Resolve the image to show for a song/station: the stored artwork if it is
 * safe, else a YouTube thumbnail for the id, else null (render nothing rather
 * than a `javascript:`/`data:` src).
 */
export function songArtwork(song: {
  artwork_url?: string | null;
  provider_video_id?: string | null;
}): string | null {
  return safeImageUrl(song.artwork_url) ?? youtubeThumb(song.provider_video_id);
}

/**
 * `onError` for decorative/catalog images: hide the broken element so the
 * container's background shows instead of a broken-image glyph. Every artwork
 * slot in the app already sits on a dark placeholder background.
 */
export function hideBrokenImage(e: SyntheticEvent<HTMLImageElement>): void {
  e.currentTarget.style.visibility = 'hidden';
}
