import { cat } from './scene';
import type { SpriteDef } from './types';

/** Play button drawn over the TV's thumbnail: a cream key with a jade triangle. */
export const play: SpriteDef = {
  w: 12,
  h: 12,
  palette: {
    a: '#000000',
    b: '#F9EEBF',
    c: '#3A9470',
    d: '#E6D39B',
  },
  frames: [
    [
      '.aaaaaaaaaa.',
      'abbbbbbbbbba',
      'abbbbbbbbbba',
      'abbbbcbbbbba',
      'abbbbccbbbba',
      'abbbbcccbbba',
      'abbbbcccbbba',
      'abbbbccbbbba',
      'abbbbcbbbbba',
      'abbbbbbbbbba',
      'adddddddddda',
      '.aaaaaaaaaa.',
    ],
  ],
};

/** The Bengal cat from the TV, awake: same pixels, with its closed-eye lines turned into open green eyes. */
export const catAwake: SpriteDef = { ...cat, palette: { ...cat.palette, f: '#7FD3A8' } };
