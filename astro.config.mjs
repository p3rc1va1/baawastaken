// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://baawastaken.com',
  output: 'static',
  trailingSlash: 'never',
  build: {
    inlineStylesheets: 'auto',
  },
});
