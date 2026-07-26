import { expect, test, type Page } from "@playwright/test";

type Track = "general" | "vasectomy_reversal" | "pre_treatment_preservation";

function monitor(page: Page) {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 500) failures.push(`${response.status()} ${response.request().method()} ${response.url()}`);
  });
  return failures;
}

async function choose(page: Page, name: string, value: string) {
  const input = page.locator(`input[name="${name}"][value="${value}"]`);
  await page.locator("label").filter({ has: input }).click();
  await expect(input).toBeChecked();
}

async function continueTo(page: Page, path: RegExp, buttonName = "Continue") {
  await page.getByRole("button", { name: buttonName, exact: true }).click();
  await expect(page).toHaveURL(path);
}

async function completeOnboarding(page: Page, track: Track) {
  await page.goto("/api/auth/bypass");
  await expect(page).toHaveURL(/\/start\/privacy$/);
  await continueTo(page, /\/start\/consent$/);
  await page.getByRole("button", { name: "I understand — continue" }).click();
  await expect(page).toHaveURL(/\/start\/disclaimer$/);
  await page.waitForTimeout(500);
  const disclaimer = page.getByRole("checkbox", {
    name: "I understand PreSeed is a research prototype and not a medical device.",
  });
  await page.getByText(
    "I understand PreSeed is a research prototype and not a medical device.",
    { exact: true },
  ).click();
  await expect(disclaimer).toBeChecked();
  await page.getByRole("button", { name: "I understand", exact: true }).click();
  await expect(page).toHaveURL(/\/start\/track$/);
  await choose(page, "track", track);
  await continueTo(page, /\/onboarding\/goal$/);
  await choose(page, "goalTiming", "trying_now");
  await continueTo(page, /\/onboarding\/lifestyle$/);
  for (const [name, value] of [
    ["sleepHours", "7to8"], ["sleepPattern", "regular"], ["smoking", "never"],
    ["alcoholUnits", "none"], ["dietPattern", "mediterranean"],
    ["produceServings", "over4"], ["activitySessions", "3to5"],
    ["sedentaryHours", "under4"], ["heatExposure", "none"],
  ] as const) await choose(page, name, value);
  await continueTo(page, /\/onboarding\/health$/);
  await choose(page, "conditions", "none");
  await choose(page, "medications", "none");
  await choose(page, "sexualHealth", "none");
  await continueTo(page, /\/onboarding\/exposure$/);
  await choose(page, "exposures", "none");
  await continueTo(page, /\/onboarding\/review$/);
  await expect(page).toHaveURL(/\/onboarding\/review$/);
}

test("bypass → general onboarding → simulated report", async ({ page }) => {
  const failures = monitor(page);
  const apiStatuses: number[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/functions/v1/api/v1/")) apiStatuses.push(response.status());
  });
  await completeOnboarding(page, "general");
  await page.getByRole("button", { name: "Continue with a simulated report" }).click();
  await expect(page).toHaveURL(/\/results$/);
  await expect(page.getByText("Simulated", { exact: false }).first()).toBeVisible();
  expect(apiStatuses.length).toBeGreaterThan(0);
  expect(apiStatuses.every((status) => status < 500)).toBe(true);
  expect(failures).toEqual([]);
});

test("bypass → vasectomy-reversal onboarding", async ({ page }) => {
  const failures = monitor(page);
  await completeOnboarding(page, "vasectomy_reversal");
  await page.getByRole("button", { name: "Go to tracking" }).click();
  await expect(page).toHaveURL(/\/reversal$/);
  expect(failures).toEqual([]);
});

test("bypass → preservation onboarding", async ({ page }) => {
  const failures = monitor(page);
  await completeOnboarding(page, "pre_treatment_preservation");
  await page.getByRole("button", { name: "Add a clinical result" }).click();
  await expect(page).toHaveURL(/\/tests\/new$/);
  expect(failures).toEqual([]);
});

test("authenticated primary routes expose named controls without server failures", async ({ page }) => {
  const failures = monitor(page);
  await page.goto("/api/auth/bypass");
  const routes = [
    "/today", "/results", "/results/profile", "/results/readiness", "/results/risks",
    "/results/confidence", "/score", "/sleep", "/food", "/goals", "/protocol",
    "/protocol/check-in", "/trends", "/evidence", "/ask", "/account",
    "/account/wearables", "/account/data", "/account/display", "/account/safety",
    "/tests/new", "/reversal", "/preservation",
  ];
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBeLessThan(400);
    await expect(page.locator("main")).toBeVisible();
    const unnamed = await page.locator("button:visible").evaluateAll((buttons) =>
      buttons.filter((button) => !(button.textContent?.trim() || button.getAttribute("aria-label") || button.getAttribute("title"))).length
    );
    expect(unnamed, `${route} unnamed buttons`).toBe(0);
  }
  expect(failures).toEqual([]);
});
