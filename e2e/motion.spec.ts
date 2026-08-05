import { expect, test } from "@playwright/test";

test("the cable responds to pointer movement", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("chromium"));
  await page.goto("/");
  const canvas = page.locator(".cable-backdrop canvas");
  await expect(canvas).toBeVisible();

  const before = await canvas.screenshot();
  await page.mouse.move(40, 120);
  await page.waitForTimeout(250);
  await page.mouse.move(1180, 700);
  await page.waitForTimeout(450);
  const after = await canvas.screenshot();

  expect(after.equals(before)).toBe(false);
});

test("reduced motion uses the static fallback", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".cable-backdrop__fallback").first()).toBeVisible();
  await expect(page.locator(".cable-backdrop canvas")).toHaveCount(0);
});

test("missing WebGL support uses the static fallback", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl" || type === "webgl2") return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/");
  await expect(page.locator(".cable-backdrop__fallback").first()).toBeVisible();
  await expect(page.locator(".cable-backdrop canvas")).toHaveCount(0);
});
