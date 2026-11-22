import type { SpriteDef } from './types';

// Room decoration. All sprites share the page's pixel grid (1 art pixel = 4 CSS px).

/** Wall clock (the pendulum is a separate two-frame sprite). */
export const clock: SpriteDef = {
  w: 12,
  h: 12,
  palette: {
    a: '#000000',
    b: '#A8714C',
    c: '#F9EEBF',
    d: '#8B5A3C',
    e: '#1E1A17',
    f: '#E0464F',
    g: '#E6D39B',
    h: '#6B3A2E',
  },
  frames: [
    [
      '....aaaa....',
      '..aabbbbaa..',
      '.abbccccbba.',
      'addccceccdda',
      'adccccecccda',
      'adccccfeecda',
      'adccccccccda',
      'adccccccccda',
      'addggggggdda',
      '.ahhgggghha.',
      '..aahhhhaa..',
      '....aaaa....',
    ],
  ],
};

/** Clock pendulum swinging between two frames. */
export const pendulum: SpriteDef = {
  w: 12,
  h: 10,
  palette: {
    a: '#6B3A2E',
    b: '#FFF0B8',
    c: '#F9D77E',
    d: '#C9A24A',
  },
  frames: [
    [
      '......a.....',
      '......a.....',
      '......a.....',
      '.....a......',
      '.....a......',
      '.....a......',
      '....bcc.....',
      '....ccc.....',
      '....ccd.....',
      '............',
    ],
    [
      '.....a......',
      '.....a......',
      '.....a......',
      '......a.....',
      '......a.....',
      '......a.....',
      '.....bcc....',
      '.....ccc....',
      '.....ccd....',
      '............',
    ],
  ],
};

/** Potted plant; the top leaf sways between two frames. */
export const plant: SpriteDef = {
  w: 12,
  h: 20,
  palette: {
    a: '#5DB88E',
    b: '#3A9470',
    c: '#2E7E5E',
    d: '#2B6E53',
    e: '#A8714C',
    f: '#8B5A3C',
    g: '#6B3A2E',
  },
  frames: [
    [
      '.....aa.....',
      '.....aa.....',
      '.....aa.....',
      '....aaab....',
      '....bbbb....',
      '....cccc....',
      '.aabcccc....',
      '.bbbb..aabb.',
      '.bbbb..bbbb.',
      '...aabbbbbd.',
      '...bbbddd...',
      '...bbbddd...',
      '...bbbddd...',
      '.eeeeeeeeee.',
      '.ffffffffff.',
      '..effffggg..',
      '..effffggg..',
      '..effffggg..',
      '..effffggg..',
      '..effffggg..',
    ],
    [
      '......aa....',
      '......aa....',
      '......aa....',
      '....aaaa....',
      '....bbbb....',
      '....cccc....',
      '.aabcccc....',
      '.bbbb..aabb.',
      '.bbbb..bbbb.',
      '...aabbbbbd.',
      '...bbbddd...',
      '...bbbddd...',
      '...bbbddd...',
      '.eeeeeeeeee.',
      '.ffffffffff.',
      '..effffggg..',
      '..effffggg..',
      '..effffggg..',
      '..effffggg..',
      '..effffggg..',
    ],
  ],
};

/** A wisp of steam (animated with CSS). */
export const steam: SpriteDef = {
  w: 4,
  h: 5,
  palette: {
    a: '#CFD8D2',
  },
  frames: [
    [
      'a...',
      'a..a',
      '.a.a',
      '.a..',
      '....',
    ],
  ],
};

/** Coffee mug. */
export const mug: SpriteDef = {
  w: 11,
  h: 10,
  palette: {
    a: '#F9EEBF',
    b: '#6B3A2E',
    c: '#E6D39B',
    d: '#3A9470',
    e: '#2B6E53',
  },
  frames: [
    [
      '...........',
      'abbbbbba...',
      'aaaaaacc...',
      'aaaaaacccc.',
      'aaaaaacc.c.',
      'ddddddee.c.',
      'ddddddee.c.',
      'aaaaaacccc.',
      'aaaaaacc...',
      'aaaaaacc...',
    ],
  ],
};

/** A stack of books. */
export const books: SpriteDef = {
  w: 14,
  h: 9,
  palette: {
    a: '#A8714C',
    b: '#F9EEBF',
    c: '#8B5A3C',
    d: '#F9DDBA',
    e: '#6B3A2E',
    f: '#EEC399',
    g: '#5DB88E',
    h: '#3A9470',
  },
  frames: [
    [
      '..aaaaaaabaa..',
      '..cccccccbcc..',
      '..cccccccbcc..',
      '.ddeddddddddd.',
      '.ffefffffffff.',
      '.ffefffffffff.',
      'gggggggggggbgg',
      'hhhhhhhhhhhbhh',
      'hhhhhhhhhhhbhh',
    ],
  ],
};

/** Small succulent in a pot. */
export const succulent: SpriteDef = {
  w: 8,
  h: 8,
  palette: {
    a: '#5DB88E',
    b: '#3A9470',
    c: '#A8714C',
    d: '#8B5A3C',
    e: '#6B3A2E',
  },
  frames: [
    [
      '...aa...',
      '...aabb.',
      '.bbaabb.',
      '.bbaabb.',
      'cccccccc',
      '.ddddee.',
      '.ddddee.',
      '.ddddee.',
    ],
  ],
};

/** Sleeping Bengal cat on the TV: golden coat, dark rosettes, ringed tail that flicks between two frames. */
export const cat: SpriteDef = {
  w: 18,
  h: 10,
  palette: {
    a: '#000000',
    b: '#F2A7A7',
    c: '#EBC27F',
    d: '#4A2E1C',
    e: '#D9A05B',
    f: '#2A2F2D',
    g: '#F2DDB0',
    h: '#A8642E',
    i: '#B07A3E',
  },
  frames: [
    [
      '.a..a.............',
      'abaaba............',
      'acdeda............',
      'aeeeeaaaaaaaaaa...',
      'afefeeccccddeeea..',
      'agbeeeeddehdedea..',
      'aaaaaeedheeeddea..',
      '.....eeeeddeeeeaaa',
      '.....aiiiiiiiiiaea',
      '.....aaaaaaaaaaaaa',
    ],
    [
      '.a..a.............',
      'abaaba............',
      'acdeda............',
      'aeeeeaaaaaaaaaa.aa',
      'afefeeccccddeeeaea',
      'agbeeeeddehdedeada',
      'aaaaaeedheeeddeaea',
      '.....eeeeddeeeeaaa',
      '.....aiiiiiiiiia..',
      '.....aaaaaaaaaaa..',
    ],
  ],
};

/** Red pushpin. */
export const pushpin: SpriteDef = {
  w: 5,
  h: 6,
  palette: {
    a: '#F7A3A3',
    b: '#E0464F',
    c: '#A82E36',
    d: '#6E7774',
  },
  frames: [
    [
      '.abb.',
      '.bbb.',
      '.bbb.',
      'ccccc',
      '..d..',
      '..d..',
    ],
  ],
};

/** Envelope with a red wax seal. */
export const envelope: SpriteDef = {
  w: 16,
  h: 12,
  palette: {
    a: '#6B3A2E',
    b: '#EEC399',
    c: '#E0464F',
    d: '#D9A877',
  },
  frames: [
    [
      'aaaaaaaaaaaaaaaa',
      'aaabbbbbbbbbbaaa',
      'abbaabbbbbbaabba',
      'abbbbaabbaabbbba',
      'abbbbbbaabbbbbba',
      'abbbbbbccbbbbbba',
      'abbbbbbccbbbbbba',
      'abbbbbbbbbbbbbba',
      'abbbbbbbbbbbbbba',
      'adddddddddddddda',
      'adddddddddddddda',
      'aaaaaaaaaaaaaaaa',
    ],
  ],
};

/** Heart stamp on the postcard. */
export const stampHeart: SpriteDef = {
  w: 7,
  h: 6,
  palette: {
    a: '#3A9470',
  },
  frames: [
    [
      '.aa.aa.',
      'aaaaaaa',
      'aaaaaaa',
      '.aaaaa.',
      '..aaa..',
      '...a...',
    ],
  ],
};

/** Night sky behind the window: moon, still stars and rooftops. (Three more stars twinkle as separate elements.) */
export const windowSky: SpriteDef = {
  w: 56,
  h: 42,
  palette: {
    a: '#1C2730',
    b: '#F9EEBF',
    c: '#FFFFFF',
    d: '#E6D9A4',
    e: '#CFD8D2',
    f: '#18232A',
    g: '#F9D77E',
    h: '#141D23',
  },
  frames: [
    [
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbbaaaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbbbbaaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabccbbbbbaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbbbbbbaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbbbddbaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbbbbbbaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaeaaaaaaaaaaaaaaaaddddddaaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaddddaaaaaaaaaaaaaaaa',
      '........................................................',
      '........................................................',
      '........................................................',
      '........................................................',
      '........................................................',
      '........................................................',
      '........................................................',
      '...........e............................................',
      '........................................................',
      '........................................................',
      '........................................................',
      '........................................................',
      '........................................................',
      '.......f................................................',
      '.......f................................................',
      '.......ffffff...........................................',
      '.......ffffff...........................................',
      '.......ffffff.......................fffffff.............',
      'fffffffffgfff.......................fffffff.............',
      'fffffffffffff.......................fffffff.............',
      'ffffffffffffffffffffff..............ffgffff.............',
      'ffffffffffffffffffffff..............ffffffffffffffffffff',
      'ffffffffffffffffgfffff..............ffffffffffffffffffff',
      'ffffffffffffffffffffffhhhhhhhhhhhhhhffffffffffffffffffff',
      'ffffffffffffffffffffffhhhhhhhhhhhhhhffffffffffffffffffff',
      'ffffffffffffffffffffffhhhhhhhhhhhhhhffffffffffffffffffff',
      'ffffffffffffffffffffffhhhhhhhhhhhhhhffffffffffffffffffff',
      'ffffffffffffffffffffffhhhhhhhhhhhhhhffffffffffffffffffff',
    ],
  ],
};

/** Cloud drifting past the window. */
export const cloud: SpriteDef = {
  w: 10,
  h: 4,
  palette: {
    a: '#3A4A55',
    b: '#33424C',
  },
  frames: [
    [
      '..aaaa....',
      '.aaaaaaa..',
      'bbbbbbbbbb',
      'bbbbbbbbbb',
    ],
  ],
};

/** Shooting star. */
export const shootingStar: SpriteDef = {
  w: 4,
  h: 3,
  palette: {
    a: '#FFFFFF',
    b: '#CFD8D2',
    c: '#8FA3AE',
  },
  frames: [
    [
      '...a',
      '.bb.',
      'c...',
    ],
  ],
};

/** Game controller on the rug. */
export const controller: SpriteDef = {
  w: 14,
  h: 8,
  palette: {
    a: '#000000',
    b: '#DCD7F0',
    c: '#C9C3E6',
    d: '#3B3552',
    e: '#E0464F',
    f: '#3A9470',
    g: '#A69FD1',
  },
  frames: [
    [
      '..aaaaaaaaaa..',
      'aabbbbbbbbbbaa',
      'accdccccccecca',
      'acdddccccccfca',
      'accdccccccccca',
      'aagggaaaagggaa',
      '.agga....agga.',
      '..aa......aa..',
    ],
  ],
};
