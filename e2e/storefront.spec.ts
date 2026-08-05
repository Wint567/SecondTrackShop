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

  await page.goBack();
  await expect(page).not.toHaveURL(/sort=name-asc/);
  await page.goForward();
  await expect(page).toHaveURL(/sort=name-asc/);
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
  await expect(page.locator('script[type="application/ld+json"]')).toContainText("BreadcrumbList");

  const vintedLink = page.getByRole("link", { name: /View on Vinted/i });
  if (await vintedLink.count()) {
    await expect(vintedLink).toHaveAttribute("href", /^https:\/\/(?:www\.)?vinted\.pl\//);
    await expect(vintedLink).toHaveAttribute("rel", /noopener/);
  }
});

test("primary routes have no critical or serious accessibility violations", async ({ page }) => {
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
