import { createHmac } from "node:crypto";
import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

function localDemoCookie() {
  const email = process.env.MOMENTUS_LOCAL_DEMO_EMAIL?.trim().toLowerCase();
  const secret = process.env.MOMENTUS_LOCAL_DEMO_SIGNING_SECRET;
  if (
    process.env.MOMENTUS_LOCAL_DEMO_ENABLED !== "true" ||
    !email ||
    !secret ||
    secret.length < 32
  ) {
    throw new Error(
      "Playwright requires the ignored .env local-demo session settings.",
    );
  }
  const expiry = Math.floor(Date.now() / 1000) + 60 * 60;
  const payload = `${email}|${expiry}`;
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

test.beforeEach(async ({ context, page }) => {
  mkdirSync("test-results", { recursive: true });
  await context.addCookies([
    {
      name: "momentus-local-demo",
      value: localDemoCookie(),
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
  await page.goto("/admin/designer/amara-luca");
  await expect(page.locator(".designer-shell")).toBeVisible();
  await expect(page.getByLabel("Active page")).toBeEnabled();
});

test("creates, switches, edits metadata, duplicates, deletes and restores pages", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Pages", exact: true }).click();
  await page.getByRole("button", { name: "+ Add page" }).click();
  await page.getByLabel("New page name").fill("Our Story");
  await page.getByRole("button", { name: "Create page" }).click();
  await expect(page.getByLabel("Active page")).toContainText("Our Story");
  const frame = page.frameLocator("iframe.gjs-frame");
  await expect(frame.locator("h1").first()).toContainText("Our Story");

  await page.getByLabel("Page name").fill("Our Story and Gallery");
  await page.getByLabel("Page name").press("Tab");
  await page.getByLabel("Page slug").fill("our-story-gallery");
  await page.getByLabel("Page slug").press("Tab");
  await page
    .locator(".designer-page-actions")
    .getByRole("button", { name: "Duplicate" })
    .click();
  await expect(page.getByLabel("Active page")).toContainText(
    "Our Story and Gallery copy",
  );
  await page.getByRole("button", { name: "Set as home" }).click();
  await expect(page.locator(".designer-home-badge")).toHaveCount(1);
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator(".designer-page-actions")
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByLabel("Active page")).not.toContainText("copy");

  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.locator(".designer-status")).toContainText(
    "Saved in this browser",
  );
  await page.screenshot({
    path: "test-results/designer-pages-desktop.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByLabel("Active page")).toContainText(
    "Our Story and Gallery",
  );
  await page
    .getByLabel("Active page")
    .selectOption({ label: "Our Story and Gallery" });
  await expect(
    page.frameLocator("iframe.gjs-frame").locator("h1").first(),
  ).toContainText("Our Story");
});

test("edits rich text, handles shortcuts and previews navigation between pages", async ({
  page,
}) => {
  const frame = page.frameLocator("iframe.gjs-frame");
  const heading = frame.locator("h1").first();
  await heading.dblclick();
  await expect(page.locator("[aria-label='H2']")).toBeVisible();
  await page.locator("[aria-label='H2']").click();
  await expect(frame.locator("h2").first()).toBeVisible();
  await page.getByRole("button", { name: "Pages", exact: true }).click();
  await page.getByRole("button", { name: "+ Add page" }).click();
  await page.getByLabel("New page name").fill("Gallery");
  await page.getByRole("button", { name: "Create page" }).click();
  await page.getByRole("button", { name: "Pages", exact: true }).click();
  await page.getByRole("button", { name: "Add page navigation" }).click();
  await expect(frame.locator("nav.momentus-navigation a")).toHaveCount(2);

  await page.getByRole("button", { name: "Preview design" }).click();
  await frame.getByRole("link", { name: "Gallery" }).click();
  await expect(page.getByLabel("Active page")).toHaveValue(/page-/);
  await expect(frame.locator("h1").first()).toContainText("Gallery");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Shortcuts" }).click();
  await expect(page.getByRole("dialog")).toContainText("Ctrl/Cmd + D");
  await page.getByRole("button", { name: "Got it" }).click();
  await page.screenshot({
    path: "test-results/designer-pages-mobile.png",
    fullPage: true,
  });
});

test("proposes, applies, saves and reverts deterministic AI design operations", async ({
  page,
}) => {
  await page.getByRole("button", { name: "AI assistant" }).click();
  await page
    .getByLabel("Design request")
    .fill("Add a photo gallery to this page");
  await page.getByRole("button", { name: "Generate proposal" }).click();
  await expect(
    page.getByText("Add an editable photo gallery to the current page.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("Local demo · sample proposals")).toBeVisible();
  await page.getByRole("button", { name: "Apply proposal" }).click();
  const frame = page.frameLocator("iframe.gjs-frame");
  await expect(frame.locator(".momentus-gallery")).toBeVisible();
  await page.screenshot({
    path: "test-results/designer-ai-gallery.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Undo last AI change" }).click();
  await expect(frame.locator(".momentus-gallery")).toHaveCount(0);

  await page
    .getByLabel("Design request")
    .fill("Apply an elegant wedding theme");
  await page.getByLabel("Assistant change scope").selectOption("theme");
  await page.getByRole("button", { name: "Generate proposal" }).click();
  await expect(
    page.getByText("Apply colors, typography, and spacing across pages"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Apply proposal" }).click();
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.locator(".designer-status")).toContainText(
    "Saved in this browser",
  );
  await page.reload();
  await expect(page.getByLabel("Active page")).toBeEnabled();
});

test("rejects malformed proposals and prevents unauthenticated assistant requests", async ({
  page,
  request,
}) => {
  await page.route("**/api/designer/assistant", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        provider: "demo",
        usage: null,
        proposal: {
          summary: "Invalid operation",
          operations: [{ action: "execute_javascript", code: "alert(1)" }],
        },
      }),
    }),
  );
  await page.getByRole("button", { name: "AI assistant" }).click();
  await page.getByLabel("Design request").fill("Make the page better");
  await page.getByRole("button", { name: "Generate proposal" }).click();
  await expect(page.locator(".designer-assistant-error")).toContainText(
    "Invalid",
  );
  await expect(
    page.getByRole("button", { name: "Apply proposal" }),
  ).toHaveCount(0);

  const response = await request.post("/api/designer/assistant", {
    data: {
      siteId: "amara-luca",
      mode: "page",
      prompt: "Add a gallery",
      context: {
        activePageId: "home",
        pages: [{ id: "home", name: "Home", slug: "home" }],
        selectedComponentId: "",
        tree: [],
      },
      history: [],
    },
  });
  expect(response.status()).toBe(403);
});

test("preserves canvas behavior at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Pages", exact: true }).click();
  await expect(page.getByRole("button", { name: "+ Add page" })).toBeVisible();
  await expect(
    page.frameLocator("iframe.gjs-frame").locator("body"),
  ).toBeVisible();
  mkdirSync("test-results", { recursive: true });
  await page.screenshot({
    path: "test-results/designer-mobile-viewport.png",
    fullPage: true,
  });
});
