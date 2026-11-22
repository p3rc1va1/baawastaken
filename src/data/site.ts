/** Site-wide strings. Defined here once; everything else imports them. */
export const site = {
  name: 'BaaWasTaken',
  brand: 'BaaWasTaken',
  title: 'BaaWasTaken | Cozy pixel art, tech and games',
  description:
    'Home of BaaWasTaken: cozy pixel art, tech and games. Find the newest video and every channel in one place.',
  tagline: "I'm into tech and I play games sometimes. Grab a drink and come hang out.",
  /** Where to write: a friendly address for fans, and one for business inquiries. */
  emails: {
    fans: 'hello@baawastaken.com',
    business: 'business@baawastaken.com',
  },
  canonicalUrl: 'https://baawastaken.com/',
  themeColor: '#323D39',
  youtubeChannelId: 'UC-MLQMe0PJR6v2d14VVb5fg',
  youtubeChannelUrl: 'https://www.youtube.com/@BaaWasTaken',
} as const;
