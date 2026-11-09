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

test("onboards a client and configures an independent event with a local RSVP preview", async ({
  page,
}) => {
  await page.goto("/admin/onboarding");
  await page
    .getByLabel("Client or organization name")
    .fill("Northstar Gathering Co.");
  await page.getByLabel("Client category").fill("Community organization");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Event name").fill("Spring Forum");
  await page.getByLabel("Event type").selectOption("conference");
  await page.getByLabel("Capacity").fill("1");
  await page.getByLabel("Registration & RSVP").check();
  await page.getByLabel("Admission & check-in").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Northstar Gathering Co.")).toBeVisible();
  await page.getByRole("button", { name: "Save onboarding" }).click();

  await page.goto("/admin/events");
  await expect(
    page.getByRole("heading", { name: "Spring Forum" }),
  ).toBeVisible();
  await expect(page.getByText("0 synthetic registrations")).toBeVisible();
  await page
    .locator(".platform-question-preview")
    .first()
    .getByRole("combobox")
    .selectOption("Attending");
  await page.getByLabel("Name", { exact: true }).fill("Ari Example");
  await page.getByLabel("Email", { exact: true }).fill("ari@example.test");
  await page.getByRole("button", { name: "Submit local preview" }).click();
  await expect(page.getByRole("status")).toContainText("Thank you");
  await expect(page.getByText("1 synthetic registrations")).toBeVisible();
  await expect(page.getByText("Ari Example", { exact: true })).toBeVisible();
  await page.getByLabel("Name", { exact: true }).fill("Duplicate Guest");
  await page.getByLabel("Email", { exact: true }).fill("ari@example.test");
  await page
    .locator(".platform-question-preview")
    .first()
    .getByRole("combobox")
    .selectOption("Attending");
  await page.getByRole("button", { name: "Submit local preview" }).click();
  await expect(page.getByRole("status")).toContainText(
    "already has a local registration",
  );
  await page.getByLabel("Name", { exact: true }).fill("Second Guest");
  await page.getByLabel("Email", { exact: true }).fill("second@example.test");
  await page
    .locator(".platform-question-preview")
    .first()
    .getByRole("combobox")
    .selectOption("Attending");
  await page.getByRole("button", { name: "Submit local preview" }).click();
  await expect(page.getByRole("status")).toContainText(
    "capacity has been reached",
  );
  const persisted = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("momentus-platform-management-v1") ?? "{}"),
  );
  expect(
    persisted.clients.some(
      (client: { name: string }) => client.name === "Northstar Gathering Co.",
    ),
  ).toBe(true);
  expect(persisted.registrations).toHaveLength(1);
  expect(
    persisted.events.find(
      (event: { name: string }) => event.name === "Spring Forum",
    ).services,
  ).toEqual({
    registration: true,
    admission: true,
    entitlements: false,
    memories: false,
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Spring Forum" }),
  ).toBeVisible();
  await expect(page.getByText("Ari Example", { exact: true })).toBeVisible();
});

test("stage-specific local Designer Studio drafts use separate project keys", async ({
  page,
}) => {
  await page.goto("/admin/designer/local-meetup?experience=after");
  await expect(page.locator(".designer-shell")).toBeVisible();
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.locator(".designer-status")).toContainText(
    "Saved in this browser",
  );
  const keys = await page.evaluate(() =>
    Object.keys(localStorage).filter((key) =>
      key.includes("momentus-designer-draft-v1:local-meetup"),
    ),
  );
  expect(keys).toContain("momentus-designer-draft-v1:local-meetup:after");
  expect(keys).not.toContain("momentus-designer-draft-v1:local-meetup:before");
});

test("local demo supports companion attendance and audited approval transitions", async ({
  page,
}) => {
  await page.goto("/admin/events");
  await page.getByLabel("Registration mode").selectOption("approval");
  await page.getByLabel("Name", { exact: true }).fill("Rina Organizer");
  await page.getByLabel("Email", { exact: true }).fill("rina@example.test");
  await page
    .locator(".platform-question-preview")
    .first()
    .getByRole("combobox")
    .selectOption("Attending");
  await page.getByRole("button", { name: /Add companion/ }).click();
  await page.getByLabel("Companion 1 name").fill("Mei Companion");
  await page.getByRole("button", { name: "Submit local preview" }).click();
  await expect(page.getByText("pending", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve" })).toBeVisible();
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("confirmed", { exact: true })).toBeVisible();
  await page.getByText("Response details").click();
  const details = page.locator(".platform-guest-response-details").last();
  await expect(details).toContainText("Rina Organizer · attending");
  await expect(details).toContainText("Mei Companion · attending");
  await expect(details).toContainText("pending");
  await expect(details).toContainText("confirmed");
  await page.reload();
  await expect(page.getByText("confirmed", { exact: true })).toBeVisible();
  await page.getByText("Response details").click();
  await expect(
    page.locator(".platform-guest-response-details").last(),
  ).toContainText("Mei Companion · attending");
});

test("required conditional fields stay hidden and are omitted from local answers", async ({
  page,
}) => {
  await page.goto("/admin/events");
  await page.getByPlaceholder("Add a question").fill("Dietary details");
  await page.getByRole("button", { name: "Add question" }).click();
  const dietaryQuestion = page.locator(".platform-question").last();
  await dietaryQuestion.getByRole("checkbox").check();
  await page
    .getByLabel("Conditional parent for Dietary details")
    .selectOption({ label: "When Will you attend? matches…" });
  await page
    .locator(".platform-question-preview")
    .first()
    .getByRole("combobox")
    .selectOption("Declining");
  await expect(
    page
      .locator(".platform-question-preview")
      .filter({ hasText: "Dietary details" }),
  ).toHaveCount(0);
  await page.getByLabel("Name", { exact: true }).fill("Declining Guest");
  await page
    .getByLabel("Email", { exact: true })
    .fill("declining@example.test");
  await page.getByRole("button", { name: "Submit local preview" }).click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("momentus-platform-management-v1") ?? "{}"),
  );
  const registration = saved.registrations.at(-1);
  expect(registration.answers.attendance).toBe("Declining");
  expect(registration.answers).not.toHaveProperty(
    saved.registrationConfigs[registration.eventId].questions.find(
      (question: { label: string }) => question.label === "Dietary details",
    ).id,
  );
});
