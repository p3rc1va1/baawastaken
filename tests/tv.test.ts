import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import TV from '../src/components/LatestVideoTV.astro';
import type { Video } from '../worker/feed';

const video: Video = { id: 'sXAz0SK9lZg', title: 'Tom & "Jerry" <3', published: '2026-11-21T18:18:14.000Z' };

async function render(v: Video | null): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(TV, { props: { video: v } });
}

/** All elements whose opening tag contains `needle`, as the opening tag text. */
const TAG = /<[a-z][a-z0-9-]*(?:[^>"']|"[^"]*"|'[^']*')*>/g; // quote-aware: ">" may appear inside an attribute value
const tags = (html: string, needle: string) => [...html.matchAll(TAG)].map((m) => m[0]).filter((t) => t.includes(needle));

describe('<LatestVideoTV> with a video', () => {
  test('shows the video blocks, hides the fallback blocks', async () => {
    const html = await render(video);
    for (const t of tags(html, 'data-lv="video"')) expect(t).not.toMatch(/\shidden\b/);
    for (const t of tags(html, 'data-lv="fallback"')) expect(t).toMatch(/\shidden\b/);
  });

  test('link opens the video on YouTube and is named after it', async () => {
    const [link] = tags(await render(video), 'data-lv="link"');
    expect(link).toContain('href="https://www.youtube.com/watch?v=sXAz0SK9lZg"');
    // Quotes and ampersands are escaped inside the attribute, so a hostile title cannot break out of it.
    expect(link).toContain('aria-label="Play video: Tom &amp; &quot;Jerry&quot; <3"');
  });

  test('thumbnail comes from our own origin and is decorative (the link carries the name)', async () => {
    const [img] = tags(await render(video), 'data-lv="thumb"');
    expect(img).toContain('src="/yt-thumb/sXAz0SK9lZg"');
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

  test('the player root carries the video ID for the click handler', async () => {
    const [player] = tags(await render(video), 'data-lv="player"');
    expect(player).toContain('data-video-id="sXAz0SK9lZg"');
  });
});

describe('<LatestVideoTV> without a video (feed was unavailable)', () => {
  test('hides the video blocks and shows the Watch on YouTube fallback', async () => {
    const html = await render(null);
    for (const t of tags(html, 'data-lv="video"')) expect(t).toMatch(/\shidden\b/);
    for (const t of tags(html, 'data-lv="fallback"')) expect(t).not.toMatch(/\shidden\b/);
    expect(html).toContain('href="https://www.youtube.com/@BaaWasTaken"');
    expect(html).toContain('Watch on YouTube');
  });

  test('requests no thumbnail and has no stale video ID', async () => {
    const html = await render(null);
    const [img] = tags(html, 'data-lv="thumb"');
    expect(img).not.toContain('src=');
    expect(tags(html, 'data-lv="player"')[0]).toMatch(/data-video-id(="")?[\s>]/);
    expect(tags(html, 'data-lv="player"')[0]).not.toMatch(/data-video-id="[^"]/);
    const [link] = tags(html, 'data-lv="link"');
    expect(link).not.toContain('href=');
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
    const [link] = tags(await render(evil), 'data-lv="link"');
    // The whole payload lives inside ONE quoted attribute value: its quote is escaped, so it never closes early.
    const value = /aria-label="([^"]*)"/.exec(link!)?.[1];
    expect(value).toBe('Play video: &quot;><script>alert(1)</script> &amp; Tom');
  });

  test('is fully escaped when printed as text', async () => {
    const html = await render(evil);
    expect(html).toContain('data-lv="title" data-astro-cid-');
    expect(html).toContain('&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt; &amp; Tom</p>');
    // Blank out attribute values (where "<script>" is inert text), then count real <script> elements.
    const structural = html.replace(TAG, (t) => t.replace(/"[^"]*"|'[^']*'/g, '""'));
    const scripts = [...structural.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
    expect(scripts).toHaveLength(1); // only our own click handler
    expect(scripts[0]![1]).not.toContain('alert(1)');
  });
});

describe('contract with the edge Worker', () => {
  test('every data-lv marker the Worker fills in exists in the page, in both states, and nothing else is marked', async () => {
    const { MARKERS } = await import('../worker/config');
    for (const state of [video, null]) {
      const html = await render(state);
      const present = new Set([...html.matchAll(/data-lv="([a-z-]+)"/g)].map((m) => m[1]));
      expect([...present].sort(), state ? 'with video' : 'without video').toEqual([...MARKERS].sort());
    }
  });
});
