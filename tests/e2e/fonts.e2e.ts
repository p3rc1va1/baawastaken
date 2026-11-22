import { expect, test } from '@playwright/test';

test('fonts load from our own origin and nothing third-party is requested', async ({ page, baseURL }) => {
  const hosts = new Set<string>();
  page.on('request', (req) => hosts.add(new URL(req.url()).host));

  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  expect([...hosts]).toEqual([new URL(baseURL!).host]);

  const loaded = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family}:${f.weight}`),
  );
  // one typeface for the whole page, in a single weight
  expect([...new Set(loaded)]).toEqual(['Jersey 20:400']);
});
