import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
});

test('every decorative container is hidden from assistive technology', async ({ page }) => {
  for (const sel of ['.lights-wrap', '.clock', '.window', '.motes', '.decor', '.pets', '.pin', '.envelope', '.stamp']) {
    await expect(page.locator(sel).first(), sel).toHaveAttribute('aria-hidden', 'true');
  }
});

test('no SVG is exposed to assistive technology: each is inside an aria-hidden ancestor', async ({ page }) => {
  const exposed = await page.evaluate(() =>
    [...document.querySelectorAll('svg')]
      .filter((svg) => !svg.closest('[aria-hidden="true"]'))
      .map((svg) => svg.outerHTML.slice(0, 100)),
  );
  expect(exposed).toEqual([]);
});

test('the screen reader outline is only the real content', async ({ page }) => {
  const outline = await page.evaluate(() => {
    const out: string[] = [];
    const walk = (el: Element) => {
      if (el.closest('[aria-hidden="true"], [hidden]')) return;
      if (['H1', 'H2', 'A', 'BUTTON'].includes(el.tagName)) out.push(`${el.tagName.toLowerCase()}:${(el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)}`);
      for (const c of el.children) walk(c);
    };
    walk(document.body);
    return out;
  });
  expect(outline.filter((o) => /^h[12]:/.test(o))).toEqual(['h1:BaaWasTaken', 'h2:Newest on the channel', 'h2:Say hi']);
  // 7 platforms, the video, and the two email addresses
  expect(outline.filter((o) => o.startsWith('a:'))).toHaveLength(10);
  expect(outline.filter((o) => o.startsWith('button:'))).toHaveLength(2); // a Copy button per address
});

test('axe finds no accessibility violations at desktop width', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
});

test('the twinkling stars are separate elements that actually blink', async ({ page }) => {
  const names = await page.locator('.window .star').evaluateAll((els) => els.map((e) => getComputedStyle(e).animationName));
  expect(names).toEqual(['blink', 'blink', 'blink']);
  const delays = await page.locator('.window .star').evaluateAll((els) => els.map((e) => getComputedStyle(e).animationDelay));
  expect(new Set(delays).size).toBe(3);
});
