import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import TV from '../src/components/LatestVideoTV.astro';
import type { Video } from '../src/lib/youtube/feed.ts';

const video: Video = { id: 'sXAz0SK9lZg', title: 'Tom & "Jerry" <3', published: '2026-11-21T18:18:14.000Z' };

async function render(v: Video | null): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(TV, { props: { video: v } });
}

/** All elements whose opening tag contains `needle`, as the opening tag text. */
const TAG = /<[a-z][a-z0-9-]*(?:[^>"']|"[^"]*"|'[^']*')*>/g; // quote-aware: ">" may appear inside an attribute value
const tags = (html: string, needle: string) => [...html.matchAll(TAG)].map((m) => m[0]).filter((t) => t.includes(needle));

const hasClass = (html: string, cls: string) => tags(html, `class="${cls}`).length > 0 || tags(html, ` ${cls} `).length > 0;

describe('<LatestVideoTV> with a video', () => {
  test('shows the video and no fallback', async () => {
    const html = await render(video);
    expect(tags(html, 'class="video-link').length).toBe(1);
    expect(hasClass(html, 'fallback')).toBe(false);
    expect(html).not.toContain('See what');
    expect(html).not.toContain('data-lv');
  });

  test('link opens the video on YouTube and is named after it', async () => {
    const [link] = tags(await render(video), 'class="video-link');
    expect(link).toContain('href="https://www.youtube.com/watch?v=sXAz0SK9lZg"');
    // Quotes and ampersands are escaped inside the attribute, so a hostile title cannot break out of it.
    expect(link).toContain('aria-label="Play video: Tom &amp; &quot;Jerry&quot; <3"');
  });

  test('thumbnail is a static file on our own origin and is decorative (the link carries the name)', async () => {
    const [img] = tags(await render(video), 'class="thumb');
    expect(img).toContain('src="/yt/sXAz0SK9lZg.jpg"');
    expect(img).toContain('alt=""');
    expect(img).toMatch(/width="320"/);
    expect(img).toMatch(/height="180"/);
  });

  test('title and date are printed under the TV, escaped, with a machine-readable date', async () => {
    const html = await render(video);
    expect(html).toContain('Tom &amp; &quot;Jerry&quot; &lt;3</p>');
    expect(html).toContain('datetime="2026-11-21T18:18:14.000Z"');
    expect(html).toContain('>Nov 21, 2026</time>');
    expect(html).not.toContain('<script>alert');
  });

  test('the screen carries the video ID for the click handler', async () => {
    const [screen] = tags(await render(video), 'class="screen');
    expect(screen).toContain('data-video-id="sXAz0SK9lZg"');
  });
});

describe('<LatestVideoTV> without a video (nothing captured yet)', () => {
  test('shows the Watch on YouTube fallback and no video', async () => {
    const html = await render(null);
    expect(tags(html, 'class="video-link').length).toBe(0);
    expect(tags(html, 'class="thumb').length).toBe(0);
    expect(html).toContain('href="https://www.youtube.com/@BaaWasTaken"');
    expect(html).toContain('Watch on YouTube');
    expect(html).toContain('See what');
  });

  test('has no stale video ID and requests no thumbnail', async () => {
    const html = await render(null);
    expect(tags(html, 'class="screen')[0]).not.toMatch(/data-video-id="[^"]/);
    expect(html).not.toContain('/yt/');
  });
});

describe('play-on-click script', () => {
  test('is small, inline, and validates the ID before embedding', async () => {
    const html = await render(video);
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';
    expect(script.length).toBeLessThan(1500);
    expect(script).toContain('youtube-nocookie.com/embed/');
    expect(script).toContain('[A-Za-z0-9_-]{11}');
  });
});

describe('hostile titles', () => {
  const evil: Video = { id: 'aaaaaaaaaaa', title: '"><script>alert(1)</script> & Tom', published: '2026-01-01T00:00:00.000Z' };

  test('cannot break out of the aria-label attribute', async () => {
    const [link] = tags(await render(evil), 'class="video-link');
    // The whole payload lives inside ONE quoted attribute value: its quote is escaped, so it never closes early.
    const value = /aria-label="([^"]*)"/.exec(link!)?.[1];
    expect(value).toBe('Play video: &quot;><script>alert(1)</script> &amp; Tom');
  });

  test('is fully escaped when printed as text', async () => {
    const html = await render(evil);
    expect(html).toContain('class="tv-title" data-astro-cid-');
    expect(html).toContain('&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt; &amp; Tom</p>');
    // Blank out attribute values (where "<script>" is inert text), then count real <script> elements.
    const structural = html.replace(TAG, (t) => t.replace(/"[^"]*"|'[^']*'/g, '""'));
    const scripts = [...structural.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
    expect(scripts).toHaveLength(1); // only our own click handler
    expect(scripts[0]![1]).not.toContain('alert(1)');
  });
});
