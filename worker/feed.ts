/**
 * YouTube channel feed handling. Dependency-free and linear on purpose: it runs at the edge under a
 * tight CPU budget, and it is also used by the site build, so both always agree on what "latest" means.
 */

export interface Video {
  /** The 11-character YouTube video ID. */
  id: string;
  title: string;
  /** Publish time as an ISO 8601 UTC string. */
  published: string;
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function isVideoId(value: unknown): value is string {
  return typeof value === 'string' && VIDEO_ID.test(value);
}

export const feedUrl = (channelId: string) =>
  `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/** Where the Worker serves a video's thumbnail from (our own origin). */
export const thumbPath = (id: string) => `/yt-thumb/${id}`;

/** The one place thumbnails are fetched from. mqdefault is true 16:9; hqdefault has black bars baked in. */
export const thumbSource = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

/** Decodes XML entities in a single pass, so "&amp;lt;" becomes "&lt;" and not "<". */
export function unescapeXml(text: string): string {
  return text.replace(/&(#[xX][0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (whole, ref: string) => {
    if (ref[0] === '#') {
      const cp = ref[1] === 'x' || ref[1] === 'X' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      const valid = cp > 0 && cp <= 0x10ffff && !(cp >= 0xd800 && cp <= 0xdfff);
      return valid ? String.fromCodePoint(cp) : whole;
    }
    return NAMED[ref] ?? whole;
  });
}

/** Contents of the first <name>…</name> in `xml`. Prefixed look-alikes such as <media:title> never match. */
function tag(xml: string, name: string): string | null {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(xml);
  return m ? m[1]! : null;
}

function text(raw: string): string {
  const cdata = /^\s*<!\[CDATA\[([\s\S]*)\]\]>\s*$/.exec(raw);
  const value = cdata ? cdata[1]! : unescapeXml(raw);
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
}

/**
 * Returns the most recently published video in a YouTube channel feed, or null if the feed has no
 * usable entries. Entries with a bad ID, date or title are skipped rather than trusted.
 */
export function parseLatestVideo(xml: string): Video | null {
  let best: { video: Video; time: number } | null = null;

  for (const entry of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const body = entry[1]!;
    const id = (tag(body, 'yt:videoId') ?? '').trim();
    const titleRaw = tag(body, 'title');
    const publishedRaw = (tag(body, 'published') ?? '').trim();
    if (!isVideoId(id) || titleRaw === null) continue;

    const title = text(titleRaw);
    const time = Date.parse(publishedRaw);
    if (!title || Number.isNaN(time)) continue;

    if (!best || time > best.time) {
      best = { video: { id, title, published: new Date(time).toISOString() }, time };
    }
  }
  return best ? best.video : null;
}

/** "Nov 21, 2026". Always UTC, so the build and the edge produce the same text. */
export function formatPublished(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(iso));
}
