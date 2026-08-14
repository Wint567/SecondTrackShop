import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const hasPublicStoreConfiguration = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

test("home and catalog include their initial server state", async ({ request }) => {
  for (const pathname of ["/", "/catalog"]) {
    const response = await request.get(pathname);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain("SECONDTRACK");
    if (hasPublicStoreConfiguration) {
      expect(html).toContain('class="product-card"');
      expect(html).toContain("/storage/v1/object/public/item-photos/");
    } else {
      expect(html).toContain('role="alert"');
      expect(html).not.toContain("demo-fieldworks-jacket");
    }
  }
});

test("catalog state remains shareable in the URL", async ({ page }) => {
  await page.goto("/catalog");
  const search = page.getByRole("search").getByRole("searchbox");
  await search.fill("jacket");
  await search.press("Enter");
  await expect(page).toHaveURL(/q=jacket/);

  await page.getByLabel("Sort by").selectOption("name-asc");
  await expect(page).toHaveURL(/sort=name-asc/);

  await page.reload();
  await expect(page).toHaveURL(/q=jacket/);
  await expect(page).toHaveURL(/sort=name-asc/);
  await expect(page.getByLabel("Sort by")).toHaveValue("name-asc");
});

test("archive search reuses catalog data without abort errors", async ({ page }, testInfo) => {
  test.skip(!hasPublicStoreConfiguration, "Public catalog configuration is required.");
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/catalog");
  const firstBrand = (await page.locator(".product-card h3 span").first().innerText()).trim();
  await page.getByRole("button", { exact: true, name: "Search" }).click();
  const search = page.getByRole("dialog", { name: "Search the archive" }).getByRole("searchbox");
  await search.fill(firstBrand);
  await expect(page.locator(".search-panel__results a").first()).toContainText(firstBrand);

  const searchTextColor = await search.evaluate((element) => getComputedStyle(element).color);
  expect(searchTextColor).toBe("rgb(12, 11, 9)");

  if (!testInfo.project.name.startsWith("webkit")) {
    const scrollbarColor = await page
      .locator(".search-panel")
      .evaluate((element) => getComputedStyle(element).scrollbarColor);
    expect(scrollbarColor).toContain("rgb(192, 0, 104)");
  }
  expect(
    consoleErrors.filter((message) => /AbortError|SupabaseRequestError/.test(message)),
  ).toEqual([]);
});

test("catalog sort control keeps readable text", async ({ page }) => {
  await page.goto("/catalog");
  const color = await page
    .getByLabel("Sort by")
    .evaluate((element) => getComputedStyle(element).color);
  expect(color).not.toBe("rgb(255, 255, 255)");
});

test("mobile menu remains contained and scrollable on short screens", async ({ page }) => {
  await page.setViewportSize({ height: 360, width: 320 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();

  const dialog = page.getByRole("dialog", { name: "Mobile menu" });
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds?.y).toBeGreaterThanOrEqual(0);
  expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(360);

  const navigation = dialog.getByRole("navigation", { name: "Mobile navigation" });
  expect(await navigation.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
    true,
  );
  await navigation.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
  await expect(navigation.getByRole("link", { name: /Favorites/ })).toBeVisible();
});

test("primary layouts do not overflow from 320 to 1600 pixels", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");

  for (const width of [320, 375, 768, 1024, 1600]) {
    await page.setViewportSize({ height: 900, width });
    for (const pathname of ["/", "/catalog", "/about", "/saved"]) {
      await page.goto(pathname);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${pathname} overflows at ${width}px`).toBeLessThanOrEqual(1);
    }
  }
});

test("favorites persist locally and clear can be undone", async ({ page }) => {
  test.skip(!hasPublicStoreConfiguration, "Public catalog configuration is required.");
  await page.goto("/catalog");
  const firstCard = page.locator(".product-card").first();
  await firstCard.getByRole("button", { name: /^Save / }).click();
  await page.goto("/saved");
  await expect(page.locator(".saved-object")).toHaveCount(1);
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page.getByText("Saved objects cleared.")).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator(".saved-object")).toHaveCount(1);
});

test("product route exposes gallery, metadata and safe purchase handoff", async ({ page }) => {
  test.skip(!hasPublicStoreConfiguration, "Public catalog configuration is required.");
  await page.goto("/catalog");
  await page.locator(".product-card__link").first().click();
  await expect(page.locator("h1#product-title")).toBeVisible();
  await expect(page.locator(".product-gallery")).toBeVisible();
  const structuredData = await page.locator('script[type="application/ld+json"]').textContent();
  expect(structuredData).toContain("BreadcrumbList");

  const vintedLink = page.getByRole("link", { name: /View on Vinted/i });
  if (await vintedLink.count()) {
    await expect(vintedLink).toHaveAttribute("href", /^https:\/\/(?:www\.)?vinted\.pl\//);
    await expect(vintedLink).toHaveAttribute("rel", /noopener/);
  }
});

test("primary routes have no critical or serious accessibility violations", async ({ page }) => {
  test.setTimeout(60_000);
  for (const pathname of ["/", "/catalog", "/about", "/saved"]) {
    await page.goto(pathname);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );
    expect(blocking, `${pathname}: ${JSON.stringify(blocking, null, 2)}`).toEqual([]);
  }
});

test("all local document resources resolve", async ({ page, request }) => {
  await page.goto("/");
  const localResources = await page.locator("[src], link[href]").evaluateAll((nodes) => [
    ...new Set(
      nodes.flatMap((node) => {
        const value = node.getAttribute("src") ?? node.getAttribute("href");
        if (!value) return [];
        const url = new URL(value, window.location.href);
        return url.origin === window.location.origin ? [url.pathname + url.search] : [];
      }),
    ),
  ]);

  for (const resource of localResources) {
    const response = await request.get(resource);
    expect(response.status(), resource).toBeLessThan(400);
  }
});

test("missing routes return a branded 404", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("LOST IN THE RACK");
});
