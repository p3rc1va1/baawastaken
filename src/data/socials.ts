import type { SpriteName } from '../sprites';

export interface Social {
  id: 'youtube' | 'twitch' | 'kick' | 'discord' | 'instagram' | 'tiktok' | 'kofi';
  name: string;
  /** Short line shown under the name. */
  description: string;
  url: string;
  /** Which wooden shelf the tile sits on (1 = upper, 2 = lower). */
  shelf: 1 | 2;
  sprite: SpriteName;
  /** The support option gets its own colour. */
  support?: true;
}

/**
 * Every place to find BaaWasTaken, in shelf order (left to right, top to bottom).
 * Upper shelf: watch, follow and support. Lower shelf: live streams and community.
 */
export const socials: readonly Social[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Videos',
    url: 'https://www.youtube.com/@BaaWasTaken',
    shelf: 1,
    sprite: 'youtube',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: '@baawastakenyt',
    url: 'https://www.instagram.com/baawastakenyt',
    shelf: 1,
    sprite: 'instagram',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Short clips',
    url: 'https://www.tiktok.com/@baawastaken',
    shelf: 1,
    sprite: 'tiktok',
  },
  {
    id: 'kofi',
    name: 'Ko-fi',
    description: 'Buy me a coffee',
    url: 'https://ko-fi.com/baawastaken',
    shelf: 1,
    sprite: 'kofi',
    support: true,
  },
  {
    id: 'twitch',
    name: 'Twitch',
    description: 'Live streams',
    url: 'https://www.twitch.tv/baawastaken',
    shelf: 2,
    sprite: 'twitch',
  },
  {
    id: 'kick',
    name: 'Kick',
    description: 'Live streams too',
    url: 'https://kick.com/baawastaken',
    shelf: 2,
    sprite: 'kick',
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Join the server',
    url: 'https://discord.gg/rm4HDpmN9g',
    shelf: 2,
    sprite: 'discord',
  },
];

export const shelfOne = socials.filter((s) => s.shelf === 1);
export const shelfTwo = socials.filter((s) => s.shelf === 2);
