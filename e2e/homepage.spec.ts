import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

async function revealAllSections(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const els = document.querySelectorAll("[data-reveal]");
    for (const el of els) {
      el.classList.add("is-revealed");
    }
  });
  await page.waitForTimeout(200);
}

test.describe("MOMENTUS Homepage Redesign E2E & Visual Verification", () => {
  test.beforeEach(async () => {
    mkdirSync("test-results", { recursive: true });
  });

  test("1. Homepage loads without severe console errors and displays editorial branding", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await expect(page.locator(".site-header-redesign")).toBeVisible();
    await expect(page.locator(".site-header-redesign .wordmark")).toContainText("MOMENTUS");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Every Event.",
    );
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Every Experience.",
    );
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Every Memory.",
    );

    // Ensure no severe JavaScript runtime errors
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("favicon") &&
        !err.includes("hydrat") &&
        !err.includes("GrapesJS"),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("2. Navigation items exist and point to valid homepage anchors", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const nav = page.locator(".desktop-nav");
    await expect(nav.getByRole("link", { name: "Events" })).toHaveAttribute(
      "href",
      "#events",
    );
    await expect(
      nav.getByRole("link", { name: "The Experience" }),
    ).toHaveAttribute("href", "#experience");
    await expect(
      nav.getByRole("link", { name: "Organizer Value" }),
    ).toHaveAttribute("href", "#value");
    await expect(
      nav.getByRole("link", { name: "Designer Studio" }),
    ).toHaveAttribute("href", "#designer");
    await expect(nav.getByRole("link", { name: "Memories" })).toHaveAttribute(
      "href",
      "#memories",
    );

    // Verify all target sections exist
    await expect(page.locator("#events")).toBeAttached();
    await expect(page.locator("#experience")).toBeAttached();
    await expect(page.locator("#value")).toBeAttached();
    await expect(page.locator("#designer")).toBeAttached();
    await expect(page.locator("#memories")).toBeAttached();
  });

  test("3. Hero CTAs point to valid destinations and spotlight interaction functions", async ({
    page,
  }) => {
    await page.goto("/");

    // Primary CTA
    const primaryCta = page.locator(".hero-primary-cta");
    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveAttribute("href", "/sign-up");

    // Secondary CTA
    const secondaryCta = page.locator(".hero-secondary-cta");
    await expect(secondaryCta).toBeVisible();
    await expect(secondaryCta).toHaveAttribute("href", "#events");

    // Hero interactive spotlight pills
    const concertPill = page.getByRole("tab", { name: "Music Festival" });
    await expect(concertPill).toBeVisible();
    await concertPill.click();
    await expect(concertPill).toHaveClass(/is-active/);
    await expect(page.locator(".frame-title")).toContainText(
      "Amphitheater Live Acoustic Tour",
    );

    const marathonPill = page.getByRole("tab", { name: "Endurance & Fun Run" });
    await marathonPill.click();
    await expect(marathonPill).toHaveClass(/is-active/);
    await expect(page.locator(".frame-title")).toContainText(
      "Half-Marathon & Community Run",
    );
  });

  test("4. Renders all 6 previous client showcase cards with titles, live microsite links, and loaded artwork", async ({
    page,
  }) => {
    await page.goto("/");

    const categoriesSection = page.locator(".events-showcase-section");
    await expect(categoriesSection).toBeVisible();

    const expectedClients = [
      "Amara Santos & Luca Reyes",
      "Mikaela Cruz — XVIII The Grand Debut",
      "Solstice Sunset Music Festival",
      "Metro Coastal 21K Half-Marathon",
      "Apex Global Technology Summit",
      "The Obsidian Room · Private Society",
    ];

    for (const client of expectedClients) {
      await expect(
        categoriesSection.getByRole("heading", { name: client }),
      ).toBeVisible();
    }

    // Verify Event Categories
    await expect(categoriesSection.getByText("Weddings & Celebrations")).toBeVisible();
    await expect(categoriesSection.getByText("Birthdays & Milestones")).toBeVisible();
    await expect(categoriesSection.getByText("Concerts & Festivals")).toBeVisible();
    await expect(categoriesSection.getByText("Fun Runs & Sporting Events")).toBeVisible();
    await expect(categoriesSection.getByText("Corporate Events & Conferences")).toBeVisible();
    await expect(categoriesSection.getByText("Exclusive Parties & VIP Experiences")).toBeVisible();

    // Verify live microsite links
    const amaraLink = categoriesSection.getByRole("link", { name: /View Client Microsite for Amara/i });
    await expect(amaraLink).toHaveAttribute("href", "/demo/microsites/amara-luca");

    const mikaelaLink = categoriesSection.getByRole("link", { name: /View Client Microsite for Mikaela/i });
    await expect(mikaelaLink).toHaveAttribute("href", "/demo/microsites/mikaela-debut");

    // Verify category card artwork images have loaded successfully
    const images = categoriesSection.locator(".card-category-image");
    const count = await images.count();
    expect(count).toBe(6);

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const isLoaded = await img.evaluate(
        (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
      );
      expect(isLoaded).toBeTruthy();
    }
  });

  test("5. The three-stage journey communicates Before, During, and After with technical truth", async ({
    page,
  }) => {
    await page.goto("/");

    const journey = page.locator(".journey-experience-section");
    await expect(journey).toBeVisible();
    await expect(journey.getByText("Plan & Invite")).toBeVisible();
    await expect(journey.getByText("Welcome & Experience")).toBeVisible();
    await expect(journey.getByText("Remember & Relive")).toBeVisible();

    // Verify the technical architecture truths
    await expect(journey.getByText("PHYSICAL NFC CARDS")).toBeVisible();
    await expect(journey.getByText("ATOMIC INTEGRITY")).toBeVisible();
    await expect(journey.getByText("PRIVACY ARCHITECTURE")).toBeVisible();
  });

  test("6. Event management value and GrapesJS designer studio preview render cleanly", async ({
    page,
  }) => {
    await page.goto("/");

    // Value Section
    const valueSection = page.locator(".value-management-section");
    await expect(valueSection).toBeVisible();
    await expect(
      valueSection.getByRole("heading", {
        name: "Beautiful experiences. Thoughtfully organized.",
      }),
    ).toBeVisible();
    await expect(
      valueSection.getByText("Manage Multiple Clients"),
    ).toBeVisible();
    await expect(valueSection.getByText("Organize Multiple Events")).toBeVisible();

    // Designer Studio Showcase
    const designerSection = page.locator(".designer-studio-showcase-section");
    await expect(designerSection).toBeVisible();
    await expect(
      designerSection.getByRole("heading", { name: "Your event, your vision." }),
    ).toBeVisible();

    // Interactive Viewport Simulator Buttons
    const tabletBtn = designerSection.getByRole("button", { name: "Tablet" });
    await expect(tabletBtn).toBeVisible();
    await tabletBtn.click();
    await expect(designerSection.locator(".canvas-viewport-frame")).toHaveClass(
      /viewport-tablet/,
    );

    const mobileBtn = designerSection.getByRole("button", { name: "Mobile" });
    await mobileBtn.click();
    await expect(designerSection.locator(".canvas-viewport-frame")).toHaveClass(
      /viewport-mobile/,
    );

    // Valid Designer Studio demo entry point
    const studioLink = designerSection.locator(".mockup-open-btn");
    await expect(studioLink).toHaveAttribute(
      "href",
      "/admin/designer/amara-luca",
    );
  });

  test("7. Post-event memory showcase and CTA banner render properly", async ({
    page,
  }) => {
    await page.goto("/");

    const memoriesSection = page.locator(".memories-showcase-section");
    await expect(memoriesSection).toBeVisible();
    await expect(
      memoriesSection.getByRole("heading", {
        name: "The event ends. The memories stay.",
      }),
    ).toBeVisible();
    await expect(
      memoriesSection.getByText("The NFC Card Keepsake"),
    ).toBeVisible();

    const ctaBanner = page.locator(".cta-banner-section");
    await expect(ctaBanner).toBeVisible();
    await expect(
      ctaBanner.getByRole("heading", {
        name: "Ready to create an extraordinary event experience?",
      }),
    ).toBeVisible();
    await expect(
      ctaBanner.getByRole("link", { name: "Create Your Event" }),
    ).toHaveAttribute("href", "/sign-up");
  });

  test("8. Desktop 1440px layout: no horizontal overflow and captures screenshot", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify no unintended horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBeFalsy();

    await revealAllSections(page);

    // Capture screenshot
    await page.screenshot({
      path: "test-results/homepage-redesign-1440.png",
      fullPage: true,
    });
  });

  test("9. Tablet 768px layout: no horizontal overflow and captures screenshot", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBeFalsy();

    await revealAllSections(page);

    await page.screenshot({
      path: "test-results/homepage-redesign-768.png",
      fullPage: true,
    });
  });

  test("10. Mobile 390px layout: no horizontal overflow, functional mobile drawer, and captures screenshot", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBeFalsy();

    // Verify mobile hamburger button is visible
    const hamburger = page.locator(".mobile-menu-btn");
    await expect(hamburger).toBeVisible();

    // Open mobile navigation drawer
    await hamburger.click();
    const drawer = page.locator(".mobile-nav-drawer");
    await expect(drawer).toHaveClass(/is-open/);
    await expect(drawer.getByText("Events We Bring to Life")).toBeVisible();

    // Close mobile drawer
    const closeBtn = page.locator(".mobile-close-btn");
    await closeBtn.click();
    await expect(drawer).not.toHaveClass(/is-open/);

    await revealAllSections(page);

    // Capture mobile full-page screenshot
    await page.screenshot({
      path: "test-results/homepage-redesign-390.png",
      fullPage: true,
    });
  });

  test("11. Reduced-motion preference is respected", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    // Elements with data-reveal should be immediately visible without transition delays
    const revealElements = page.locator("[data-reveal]");
    const firstReveal = revealElements.first();
    await expect(firstReveal).toHaveClass(/is-revealed/);
  });
});
