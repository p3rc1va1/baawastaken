import { describe, expect, test } from 'vitest';
import { site } from '../src/data/site';
import { shelfOne, shelfTwo, socials } from '../src/data/socials';
import { sprites } from '../src/sprites';
import { read, rel, root, walk } from './helpers';

describe('socials', () => {
  test('the seven destinations are exactly the agreed URLs', () => {
    expect(Object.fromEntries(socials.map((s) => [s.id, s.url]))).toEqual({
      youtube: 'https://www.youtube.com/@BaaWasTaken',
      twitch: 'https://www.twitch.tv/baawastaken',
      kick: 'https://kick.com/baawastaken',
      discord: 'https://discord.gg/rm4HDpmN9g',
      instagram: 'https://www.instagram.com/baawastakenyt',
      tiktok: 'https://www.tiktok.com/@baawastaken',
      kofi: 'https://ko-fi.com/baawastaken',
    });
  });

  test('shelf order: YouTube, Instagram, TikTok, Ko-fi above Twitch, Kick, Discord', () => {
    expect(shelfOne.map((s) => s.id)).toEqual(['youtube', 'instagram', 'tiktok', 'kofi']);
    expect(shelfTwo.map((s) => s.id)).toEqual(['twitch', 'kick', 'discord']);
  });

  test('Ko-fi is the only support option', () => {
    expect(socials.filter((s) => s.support).map((s) => s.id)).toEqual(['kofi']);
  });

  test('every link is https, unique, with a name, description and an existing logo', () => {
    expect(new Set(socials.map((s) => s.url)).size).toBe(socials.length);
    for (const s of socials) {
      expect(s.url, s.id).toMatch(/^https:\/\//);
      expect(s.name, s.id).not.toBe('');
      expect(s.description, s.id).not.toBe('');
      expect(sprites[s.sprite], s.id).toBeDefined();
    }
  });
});

describe('site data', () => {
  test('contact details and canonical URL', () => {
    expect(site.emails).toEqual({ fans: 'hello@baawastaken.com', business: 'business@baawastaken.com' });
    expect(site.canonicalUrl).toBe('https://baawastaken.com/');
    expect(site.themeColor).toBe('#323D39');
    expect(site.youtubeChannelId).toMatch(/^UC[\w-]{22}$/);
  });

  test('these strings are defined only in src/data, never copied elsewhere', () => {
    const strings = [
      ...Object.values(site.emails),
      site.tagline,
      site.canonicalUrl,
      site.themeColor,
      site.youtubeChannelId,
      ...socials.map((s) => s.url),
    ];
    const files = [
      ...walk(`${root}src`, ['.astro', '.ts', '.css']).filter((f) => !f.includes('/src/data/')),
      ...walk(`${root}worker`, ['.ts']),
    ];
    const offenders: string[] = [];
    for (const file of files) {
      const text = read(file);
      for (const str of strings) if (text.includes(str)) offenders.push(`${rel(file)} repeats ${str}`);
    }
    expect(offenders).toEqual([]);
  });
});
