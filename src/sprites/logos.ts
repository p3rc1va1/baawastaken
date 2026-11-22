import type { SpriteDef } from './types';

// Platform logos: every one on the same 12x12 art-pixel grid (48x48 CSS px), light from the top-left.

/** YouTube play button. */
export const youtube: SpriteDef = {
  w: 12,
  h: 12,
  palette: {
    a: '#FF0033',
    b: '#FF6680',
    c: '#FFFFFF',
    d: '#C8002A',
  },
  frames: [
    [
      '............',
      '............',
      '.aaaaaaaaaa.',
      'abbaaaaaaaaa',
      'aaaaacaaaaaa',
      'aaaaaccaaaaa',
      'aaaaaccaaaaa',
      'aaaaacaaaaaa',
      'dddddddddddd',
      '.dddddddddd.',
      '............',
      '............',
    ],
  ],
};

/** Twitch glitch speech bubble. */
export const twitch: SpriteDef = {
  w: 12,
  h: 12,
  palette: {
    a: '#9146FF',
    b: '#B184FF',
    c: '#FFFFFF',
    d: '#772CE8',
    e: '#5C1FC2',
  },
  frames: [
    [
      '.aaaaaaaaaaa',
      'abbaaaaaaaaa',
      'aaaaaaaaaaaa',
      'aaaacaacaaaa',
      'aaaacaacaaaa',
      'aaaacaacaaaa',
      'aaaaaaaaaaaa',
      'aaaaaaaaaaaa',
      'ddddddddddd.',
      'dddddddddd..',
      '..eee.......',
      '..e.........',
    ],
  ],
};

/** Kick "K" block. */
export const kick: SpriteDef = {
  w: 12,
  h: 12,
  palette: {
    a: '#A6FF85',
    b: '#53FC18',
    c: '#3CC70E',
    d: '#000000',
  },
  frames: [
    [
      'aaabbbbbbbbc',
      'bbbbbbbbbbbc',
      'bbbddbbbbdbc',
      'bbbddbbddbbc',
      'bbbddbbddbbc',
      'bbbddddbbbbc',
      'bbbddddbbbbc',
      'bbbddbbddbbc',
      'bbbddbbddbbc',
      'bbbddbbbbdbc',
      'bbbbbbbbbbbc',
      'cccccccccccc',
    ],
  ],
};

/** Discord controller face. */
export const discord: SpriteDef = {
  w: 12,
  h: 12,
  palette: {
    a: '#5865F2',
    b: '#8A93F7',
    c: '#FFFFFF',
    d: '#4752C4',
  },
  frames: [
    [
      '............',
      '............',
      '..aa....aa..',
      '.bbaaaaaaaa.',
      'aaaaaaaaaaaa',
      'aaaccaaccaaa',
      'aaaccaaccaaa',
      'aaaaaaaaaaaa',
      'dddddddddddd',
      '.ddd....ddd.',
      '..d......d..',
      '............',
    ],
  ],
};

/** Instagram camera with its gradient. */
export const instagram: SpriteDef = {
  w: 12,
  h: 12,
  palette: {
    a: '#F58529',
    b: '#FFFFFF',
    c: '#D62976',
    d: '#962FBF',
  },
  frames: [
    [
      '..aaaaaaaa..',
      '.aaaaaaaaaa.',
      'aaabbbbbbaaa',
      'aabaaaaabbaa',
      'ccbccbbccbcc',
      'ccbcbccbcbcc',
      'ccbcbccbcbcc',
      'ccbccbbccbcc',
      'ddbddddddbdd',
      'dddbbbbbbddd',
      '.dddddddddd.',
      '..dddddddd..',
    ],
  ],
};

/** TikTok note with its cyan and pink offset layers. */
export const tiktok: SpriteDef = {
  w: 12,
  h: 12,
  palette: {
    a: '#25F4EE',
    b: '#000000',
    c: '#FE2C55',
  },
  frames: [
    [
      '.....aa.....',
      '.....abba...',
      '.....abbbb..',
      '.....abbcbb.',
      '.....abbc.cc',
      '.....abbc...',
      '..aaaabbc...',
      '.aabbbbbc...',
      '.abbbbbbc...',
      '..bbbbbbc...',
      '...bbbccc...',
      '....ccc.....',
    ],
  ],
};

/** Ko-fi coffee cup. */
export const kofi: SpriteDef = {
  w: 12,
  h: 12,
  palette: {
    a: '#F9EEBF',
    b: '#29ABE0',
    c: '#FFFFFF',
    d: '#DCE3E0',
    e: '#FF5E5B',
  },
  frames: [
    [
      '...a........',
      '.....a......',
      'bbbbbbbbb...',
      'cccccccddcc.',
      'ceeceecdd.c.',
      'ceeeeecdd.c.',
      'cceeeccdddd.',
      'cccecccdd...',
      '.ddddddd....',
      '..ddddd.....',
      '............',
      '............',
    ],
  ],
};
