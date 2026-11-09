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

test.describe("MOMENTUS 5-Stage Guided Event Studio", () => {
  test("walks through all 5 lifecycle stages seamlessly from setup to live command center", async ({
    page,
  }) => {
    await page.goto("/admin/studio/amara-luca");

    // Top Header & Studio Breadcrumb
    await expect(page.getByText("MOMENTUS · EVENT STUDIO")).toBeVisible();

    // Verify all 5 stages in the lifecycle navigation bar
    await expect(page.getByTestId("stage-tab-setup")).toBeVisible();
    await expect(page.getByTestId("stage-tab-designer")).toBeVisible();
    await expect(page.getByTestId("stage-tab-guests")).toBeVisible();
    await expect(page.getByTestId("stage-tab-credentials")).toBeVisible();
    await expect(page.getByTestId("stage-tab-live_ops")).toBeVisible();

    // STAGE 01: Setup & Plan
    await expect(page.getByRole("heading", { name: "Amara Santos & Luca Reyes" })).toBeVisible();
    await expect(page.getByText("Guest Capacity Quota")).toBeVisible();
    await expect(page.getByText("184 / 300 Guests")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Multi-Tenant Domain & Subdomain Routing" })).toBeVisible();

    // Advance to STAGE 02: Microsite Studio
    await page.getByRole("button", { name: /Next: Open Microsite Studio/i }).click();
    await expect(page.getByRole("heading", { name: "Bespoke Microsite & Interactive RSVP Island" })).toBeVisible();
    await expect(page.getByText("Published Snapshot Active")).toBeVisible();
    await expect(page.getByRole("link", { name: /Launch Visual Studio/i })).toBeVisible();

    // Advance to STAGE 03: Guests & Seating
    await page.getByRole("button", { name: /Next: Guest Management & Seating/i }).click();
    await expect(page.getByText("Confirmed Attending")).toBeVisible();
    await expect(page.getByText("Dietary Flagged")).toBeVisible();
    await expect(page.getByText("Amara Santos & Family")).toBeVisible();
    await expect(page.getByText("Table 01 - Presidential").first()).toBeVisible();

    // Filter guests
    await page.getByRole("button", { name: "Pending" }).click();
    await expect(page.getByText("Governor Andres Soriano")).toBeVisible();
    await page.getByRole("button", { name: "All" }).click();

    // Advance to STAGE 04: NFC Cards & QR Credentials
    await page.getByRole("button", { name: /Next: NFC Cards & QR Credentials/i }).click();
    await expect(page.getByRole("heading", { name: "NFC Keepsake Programming & Badge Manifest" })).toBeVisible();
    await expect(page.getByText("MOMENTUS · KEEPSAKE CREDENTIAL")).toBeVisible();

    // Simulate Card Encoding
    const encodeBtn = page.getByRole("button", { name: /Tap to Program NFC Card|Re-Encode/i });
    await encodeBtn.click();
    await expect(page.getByText(/Success! Card NFC-/i)).toBeVisible();

    // Advance to STAGE 05: Live Turnstile Command Center
    await page.getByRole("button", { name: /Next: Turnstile Command Center/i }).click();
    await expect(page.getByRole("heading", { name: "Event Operations & Turnstile Throughput" })).toBeVisible();
    await expect(page.getByText("Total Turnout")).toBeVisible();
    await expect(page.getByText("Turnstile Gate 01")).toBeVisible();
    await expect(page.getByText("Atomic Interceptions")).toBeVisible();

    // Perform Manual VIP Override
    const vipInput = page.getByPlaceholder(/Search VIP attendee name/i);
    await vipInput.fill("Don Jaime Zobel");
    await page.getByRole("button", { name: "Admit VIP Manually" }).click();

    // Verify supervisor override is recorded in the live stream
    await expect(page.getByText("Manual override granted for Don Jaime Zobel")).toBeVisible();
    await expect(page.getByText("COMMAND-DESK")).toBeVisible();
  });
});

