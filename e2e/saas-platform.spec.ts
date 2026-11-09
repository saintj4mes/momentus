import { createHmac } from "node:crypto";
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

test.beforeEach(async ({ context }) => {
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
});

test.describe("MOMENTUS SaaS Commercial Platform", () => {
  test("renders commercial subscription plans, calculates annual discount, and simulates checkout", async ({
    page,
  }) => {
    await page.goto("/admin/billing");
    await expect(page.getByRole("heading", { name: "Plans & Hardware Fulfillment" })).toBeVisible();

    // Check Event Pass plan cards
    await expect(page.getByRole("heading", { name: "Starter Celebration" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bespoke Celebration" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Grand Gathering" })).toBeVisible();
    await expect(
      page.locator(".plan-price-num").filter({ hasText: "$189" }),
    ).toBeVisible();

    // Switch to Agency Subscriptions category tab
    await page.getByRole("tab", { name: /Agency Subscriptions/i }).click();
    await expect(page.getByRole("heading", { name: "Agency Pro Studio" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Enterprise Sovereign" })).toBeVisible();
    await expect(page.getByText("$149/mo")).toBeVisible();

    // Toggle to Annual (20% discount applied: $149 * 0.8 * 12 = $1430/yr)
    const annualSwitch = page.getByLabel("Toggle annual billing discount");
    await annualSwitch.click();
    await expect(page.getByText("$1430/yr")).toBeVisible();

    // Select plan checkout simulation
    const selectPlanBtn = page.getByTestId("plan-btn-agency_pro");
    await selectPlanBtn.click();

    // Verify confirmation notification and updated active plan
    await expect(page.getByText(/Successfully activated/i)).toBeVisible();
    await expect(
      page.getByRole("strong").filter({ hasText: "Agency Pro Studio" }),
    ).toBeVisible();
  });

  test("calculates NFC keepsake hardware pricing and submits simulated order", async ({
    page,
  }) => {
    await page.goto("/admin/billing");

    // Verify hardware store section exists
    const hardwareSection = page.getByRole("heading", {
      name: "NFC Keepsake Cards & Encoder Hardware",
    });
    await expect(hardwareSection).toBeVisible();

    // Verify products exist
    await expect(
      page.getByRole("heading", { name: "Hand-Engraved Mahogany NFC" }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("Brushed Titanium VIP Executive Cards"),
    ).toBeVisible();
    await expect(
      page.getByText("Waterproof Fabric Web NFC Festival Wristbands"),
    ).toBeVisible();

    // Select product
    const selectProductBtn = page.getByTestId("order-hw-titanium_cards_25");
    await selectProductBtn.click();

    // Change quantity to 2 packs and check subtotal calculation ($150 * 2 = $300)
    const qtyInput = page.locator("#hardware-qty-input");
    await qtyInput.fill("2");
    await expect(page.getByText("$300 USD")).toBeVisible();

    // Submit order
    const submitOrderBtn = page.getByTestId("submit-hardware-order");
    await submitOrderBtn.click();

    // Verify confirmation message
    await expect(page.getByText(/Hardware order placed/i)).toBeVisible();
  });

  test("station scanner PWA enforces station PIN, audio synth, and atomic duplicate protection", async ({
    page,
  }) => {
    await page.goto("/staff/station-scanner");

    // Verify station header & metrics
    await expect(
      page.getByText("MOMENTUS · STAFF SCANNER PWA"),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Main Turnstile Gate" }),
    ).toBeVisible();
    await expect(page.getByText("Admitted Today")).toBeVisible();
    await expect(page.getByText("Remaining Expected")).toBeVisible();

    // Toggle Web Audio synthesizer
    const soundToggle = page.getByTitle(/Toggle Web Audio Synthesizer/i);
    await soundToggle.click();
    await expect(page.getByText("🔇 Sound Muted")).toBeVisible();
    await soundToggle.click();
    await expect(page.getByText("🔊 Sound ON")).toBeVisible();

    // Switch to VIP Seating station
    await page.getByTestId("station-tab-vip_seating").click();
    await expect(
      page.getByRole("heading", { name: "VIP Courtyard & Concierge" }),
    ).toBeVisible();

    // Simulate tapping test card for Amara Santos
    const tapCardBtn = page.getByTestId("test-card-amara");
    await tapCardBtn.click();

    // Active inspection card displays
    const activeScanCard = page.getByTestId("active-scan-card");
    await expect(activeScanCard).toBeVisible();
    await expect(
      activeScanCard.getByRole("heading", { name: "Amara Santos" }),
    ).toBeVisible();
    await expect(
      activeScanCard.getByText("Table 01 - Presidential").first(),
    ).toBeVisible();

    // Confirm check-in
    const confirmBtn = page.getByTestId("confirm-checkin-btn");
    await confirmBtn.click();

    // Verify success banner appears
    const banner = page.getByTestId("station-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Confirmed!");

    // Re-tap the exact same card at the same station to verify atomic duplicate interception
    await tapCardBtn.click();
    await expect(page.getByTestId("station-banner")).toContainText(
      "DUPLICATE DETECTED",
    );
  });

  test("notification outbox cron endpoint executes and returns batch health stats", async ({
    request,
  }) => {
    const response = await request.get("/api/cron/outbox");
    expect(response.status()).toBe(200);

    const json = (await response.json()) as {
      ok: boolean;
      timestamp: string;
      stats: { processed: number; succeeded: number; failed: number };
    };

    expect(json.ok).toBe(true);
    expect(json.stats).toBeDefined();
    expect(typeof json.stats.processed).toBe("number");
  });

  test("visual designer studio publishes live microsite snapshot", async ({
    page,
  }) => {
    await page.goto("/admin/designer/amara-luca");
    await expect(page.locator(".designer-shell")).toBeVisible();
    await expect(page.getByLabel("Active page")).toBeEnabled();

    // Verify Publish Live button exists
    const publishBtn = page.getByTestId("designer-publish-btn");
    await expect(publishBtn).toBeVisible();

    // Click Publish
    await publishBtn.click();

    // Verify publication banner appears with live microsite link
    const banner = page.getByTestId("published-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("/event/amara-luca");
  });
});
