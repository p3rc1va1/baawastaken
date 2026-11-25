import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
  feedUrl,
  formatPublished,
  isVideoId,
  parseLatestVideo,
  parseVideos,
  thumbPath,
  thumbSource,
  unescapeXml,
  watchUrl,
} from '../src/lib/youtube/feed.ts';
import { root } from './helpers';

const fixture = readFileSync(`${root}tests/fixtures/feed.xml`, 'utf8');

const entry = (id: string, title: string, published: string) =>
  `<entry><yt:videoId>${id}</yt:videoId><title>${title}</title><published>${published}</published></entry>`;
const short = (id: string, title: string, published: string) =>
  `<entry><yt:videoId>${id}</yt:videoId><title>${title}</title><link rel="alternate" href="https://www.youtube.com/shorts/${id}"/><published>${published}</published></entry>`;
const feed = (...entries: string[]) => `<feed><title>Channel</title>${entries.join('')}</feed>`;

describe('parseLatestVideo', () => {
  test('picks the newest long-form entry, ignoring feed-level fields, media:title decoys and Shorts', () => {
    expect(parseLatestVideo(fixture)).toEqual({
      id: 'ccccccccccc',
      title: 'Middle video',
      published: '2026-11-15T12:00:00.000Z',
    });
  });

  test('parseVideos decodes every entry and flags Shorts by their /shorts/ link', () => {
    const all = parseVideos(fixture);
    expect(all.map((v) => [v.id, v.isShort])).toEqual([
      ['aaaaaaaaaaa', false],
      ['bbbbbbbbbbb', true],
      ['ccccccccccc', false],
    ]);
    expect(all[1]!.title).toBe('Tom & Jerry\'s "big" day \u{1F9F9} <3');
  });

  test('newest entry is a Short: the newest long-form video is used', () => {
    const xml = feed(
      entry('aaaaaaaaaaa', 'Long old', '2026-01-01T00:00:00Z'),
      short('bbbbbbbbbbb', 'Short new', '2026-03-01T00:00:00Z'),
    );
    expect(parseLatestVideo(xml)?.id).toBe('aaaaaaaaaaa');
  });

  test('all entries are Shorts: no latest video', () => {
    expect(parseLatestVideo(feed(short('aaaaaaaaaaa', 'S1', '2026-01-01T00:00:00Z')))).toBeNull();
  });

  test('no Shorts: behaves as before', () => {
    const xml = feed(entry('aaaaaaaaaaa', 'A', '2026-01-01T00:00:00Z'), entry('bbbbbbbbbbb', 'B', '2026-02-01T00:00:00Z'));
    expect(parseLatestVideo(xml)?.id).toBe('bbbbbbbbbbb');
    expect(parseVideos(xml).every((v) => !v.isShort)).toBe(true);
  });

  test('chooses by publish date, not by position in the feed', () => {
    const xml = feed(
      entry('aaaaaaaaaaa', 'Oldest', '2026-01-01T00:00:00+00:00'),
      entry('bbbbbbbbbbb', 'Newest', '2026-03-01T00:00:00+00:00'),
      entry('ccccccccccc', 'Middle', '2026-02-01T00:00:00+00:00'),
    );
    expect(parseLatestVideo(xml)?.id).toBe('bbbbbbbbbbb');
  });

  test('compares dates across time zone offsets', () => {
    const xml = feed(
      entry('aaaaaaaaaaa', 'Earlier in UTC', '2026-11-21T23:30:00-05:00'), // 04:30 UTC on the 22nd
      entry('bbbbbbbbbbb', 'Later in UTC', '2026-11-22T10:00:00+00:00'),
    );
    expect(parseLatestVideo(xml)?.id).toBe('bbbbbbbbbbb');
  });

  test('on a tie the first entry in the feed wins', () => {
    const xml = feed(
      entry('aaaaaaaaaaa', 'First', '2026-01-01T00:00:00+00:00'),
      entry('bbbbbbbbbbb', 'Second', '2026-01-01T00:00:00+00:00'),
    );
    expect(parseLatestVideo(xml)?.id).toBe('aaaaaaaaaaa');
  });

  test('decodes entities: named, decimal, hex, and double-escaped text only once', () => {
    const xml = feed(entry('aaaaaaaaaaa', 'A &amp;lt; B &#65;&#x42; &apos;q&apos;', '2026-01-01T00:00:00Z'));
    expect(parseLatestVideo(xml)?.title).toBe("A &lt; B AB 'q'");
  });

  test('keeps raw emoji and non-Latin text, and reads CDATA titles literally', () => {
    expect(parseLatestVideo(feed(entry('aaaaaaaaaaa', 'Dynamo \u{1F9F9} ゲーム', '2026-01-01T00:00:00Z')))?.title).toBe(
      'Dynamo \u{1F9F9} ゲーム',
    );
    const cdata = feed(entry('aaaaaaaaaaa', '<![CDATA[Fish &amp; <chips>]]>', '2026-01-01T00:00:00Z'));
    expect(parseLatestVideo(cdata)?.title).toBe('Fish &amp; <chips>');
  });

  test('collapses whitespace, strips control characters and caps the length', () => {
    const xml = feed(entry('aaaaaaaaaaa', `  Hello\n\t  world\u0007${'x'.repeat(400)}`, '2026-01-01T00:00:00Z'));
    const title = parseLatestVideo(xml)!.title;
    expect(title.startsWith('Hello world')).toBe(true);
    expect(title).not.toMatch(/[\u0000-\u001f]/);
    expect(title.length).toBe(200);
  });

  test('skips entries with an invalid ID, date or title, and uses the next valid one', () => {
    const xml = feed(
      entry('short', 'Bad id (too short)', '2026-05-01T00:00:00Z'),
      entry('"><script>x', 'Bad id (markup)', '2026-05-02T00:00:00Z'),
      entry('bbbbbbbbbbb', 'Bad date', 'not-a-date'),
      entry('ccccccccccc', '   ', '2026-05-04T00:00:00Z'),
      entry('ddddddddddd', 'Valid', '2026-01-01T00:00:00Z'),
    );
    expect(parseLatestVideo(xml)).toEqual({
      id: 'ddddddddddd',
      title: 'Valid',
      published: '2026-01-01T00:00:00.000Z',
    });
  });

  test('empty, malformed and truncated feeds produce null, never an exception', () => {
    expect(parseLatestVideo('')).toBeNull();
    expect(parseLatestVideo('<feed></feed>')).toBeNull();
    expect(parseLatestVideo('<html><body>503 Service Unavailable</body></html>')).toBeNull();
    expect(parseLatestVideo('not xml at all \u0000 <<<>>>')).toBeNull();
    expect(parseLatestVideo('<feed><entry><yt:videoId>aaaaaaaaaaa</yt:videoId><title>Cut off')).toBeNull();
    expect(parseLatestVideo('<entry><yt:videoId>aaaaaaaaaaa</yt:videoId></entry>')).toBeNull();
  });

  test('a large feed is parsed quickly', () => {
    const entries = Array.from({ length: 2000 }, (_, i) =>
      entry(`v${String(i).padStart(10, '0')}`, `Video ${i}`, new Date(1.7e12 + i * 1000).toISOString()),
    );
    const start = performance.now();
    expect(parseLatestVideo(feed(...entries))?.title).toBe('Video 1999');
    expect(performance.now() - start).toBeLessThan(100);
  });
});

describe('helpers', () => {
  test('unescapeXml leaves unknown or invalid references alone', () => {
    expect(unescapeXml('&nope; &#0; &#xD800; &#1114112; &amp;')).toBe('&nope; &#0; &#xD800; &#1114112; &');
  });

  test('video ID validation is strict', () => {
    expect(isVideoId('sXAz0SK9lZg')).toBe(true);
    expect(isVideoId('-_aZ09-_aZ0')).toBe(true);
    for (const bad of ['', 'short', 'toolongtoolong', '../etc/passw', 'abc def ghij', 'https://x.y/z', 'aaaaaaaaaa\n', 12345678901, null]) {
      expect(isVideoId(bad), String(bad)).toBe(false);
    }
  });

  test('URLs', () => {
    expect(feedUrl('UC-abc')).toBe('https://www.youtube.com/feeds/videos.xml?channel_id=UC-abc');
    expect(watchUrl('aaaaaaaaaaa')).toBe('https://www.youtube.com/watch?v=aaaaaaaaaaa');
    expect(thumbPath('aaaaaaaaaaa')).toBe('/yt/aaaaaaaaaaa.jpg');
    expect(thumbSource('aaaaaaaaaaa')).toBe('https://i.ytimg.com/vi/aaaaaaaaaaa/mqdefault.jpg');
  });

  test('dates are formatted in UTC, the same on every machine', () => {
    expect(formatPublished('2026-11-21T18:18:14.000Z')).toBe('Nov 21, 2026');
    expect(formatPublished('2026-11-21T23:59:59.000Z')).toBe('Nov 21, 2026');
    expect(formatPublished('2026-11-22T00:00:00.000Z')).toBe('Nov 22, 2026');
  });
});
