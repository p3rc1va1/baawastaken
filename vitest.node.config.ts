import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    name: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/worker/**'],
  },
});
