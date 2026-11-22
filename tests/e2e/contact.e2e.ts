import { expect, test } from '@playwright/test';

const HELLO = 'hello@baawastaken.com';
const BUSINESS = 'business@baawastaken.com';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
});

test('"Say hi" has a friendly address for fans and one for business, each a mailto link', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 2, name: 'Say hi' })).toBeVisible();

  const fans = page.locator('[data-contact="fans"]');
  await expect(fans.getByRole('heading', { level: 3 })).toHaveText('Just saying hi?');
  await expect(fans.getByRole('link', { name: HELLO })).toHaveAttribute('href', `mailto:${HELLO}`);

  const business = page.locator('[data-contact="business"]');
  await expect(business.getByRole('heading', { level: 3 })).toHaveText('Business inquiries');
  await expect(business.getByRole('link', { name: BUSINESS })).toHaveAttribute('href', `mailto:${BUSINESS}`);
});

test('fans come first, then business', async ({ page }) => {
  await page.goto('/');
  const order = await page.locator('[data-contact]').evaluateAll((els) => els.map((e) => e.getAttribute('data-contact')));
  expect(order).toEqual(['fans', 'business']);
});

test('the old address is gone', async ({ page }) => {
  await page.goto('/');
  expect(await page.content()).not.toContain('pm.me');
});

test('the mail buttons meet the 44px touch target', async ({ page }) => {
  await page.goto('/');
  for (const link of [HELLO, BUSINESS]) expect((await page.getByRole('link', { name: link }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
});

test('each Copy button copies its own address, says so, then resets', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');

  for (const email of [HELLO, BUSINESS]) {
    const copy = page.getByRole('button', { name: `Copy email (${email})` });
    await expect(copy).toBeVisible();
    await copy.click();

    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(email);
    await expect(page.getByRole('button', { name: `Copied (${email})` })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText(`${email} copied to the clipboard`);
    await expect(page.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    await expect(page.getByRole('button', { name: `Copy email (${email})` })).toBeVisible({ timeout: 6000 });
  }
  await expect(page.getByRole('status')).toHaveText('');
});

test('the two Copy buttons have different accessible names', async ({ page }) => {
  await page.goto('/');
  const names = await page.locator('[data-copy]').evaluateAll((els) => els.map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim()));
  expect(names).toEqual([`Copy email (${HELLO})`, `Copy email (${BUSINESS})`]);
});

test('if the browser refuses to copy, the broken buttons go away but both addresses stay', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) },
    });
  });
  await page.goto('/');
  const copy = page.getByRole('button', { name: `Copy email (${HELLO})` });
  await copy.click();
  await expect(copy).toBeHidden();
  for (const [email] of [[HELLO], [BUSINESS]] as const) {
    await expect(page.getByRole('link', { name: email })).toHaveAttribute('href', `mailto:${email}`);
  }
});

test('no Clipboard API at all: no copy button is ever shown', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined });
  });
  await page.goto('/');
  await expect(page.getByRole('link', { name: HELLO })).toBeVisible();
  await expect(page.locator('[data-copy]').first()).toBeHidden();
  await expect(page.locator('[data-copy]').last()).toBeHidden();
});

test('JavaScript disabled: both addresses are visible text with working mailto links, and no copy buttons', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, ...(baseURL ? { baseURL } : {}) });
  const page = await context.newPage();
  await page.goto('/');
  for (const email of [HELLO, BUSINESS]) {
    await expect(page.getByRole('link', { name: email })).toBeVisible();
    await expect(page.getByRole('link', { name: email })).toHaveAttribute('href', `mailto:${email}`);
  }
  await expect(page.locator('[data-copy]').first()).toBeHidden();
  await context.close();
});

test('the pin, envelope and stamp are decoration', async ({ page }) => {
  await page.goto('/');
  for (const sel of ['.pin', '.envelope', '.stamp']) await expect(page.locator(sel)).toHaveAttribute('aria-hidden', 'true');
});
