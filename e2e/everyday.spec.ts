import { expect, test } from "@playwright/test";
import { lastHistoryTurns, modelCount, resetModelCount } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetModelCount(request);
});

test("everyday English concern gets a structured plan; Clear resets history (AC-1, AC-16)", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.getByRole("contentinfo", { name: "Emergency numbers" })).toContainText("999");

  const box = page.getByRole("textbox", { name: "Describe what's happening" });
  await box.fill(
    "My 4-year-old screams every night at bedtime and it takes two hours to settle him.",
  );
  await box.press("Enter");

  const reply = page.locator("article[data-kind='coach']");
  await expect(reply).toBeVisible();
  await expect(reply).toHaveAttribute("data-risk", "routine");
  await expect(reply).toContainText("Bedtime battles are really common");
  await expect(reply.locator("ol > li")).toHaveCount(3);
  await expect(reply).toContainText("Check in");
  await expect(page.locator("article").getByRole("alert")).toHaveCount(0);
  expect(await modelCount(request)).toBe(1);

  expect(await lastHistoryTurns(request)).toBe(0);

  // A follow-up carries the previous turns as history.
  await box.fill("He also wakes at 3am.");
  await box.press("Enter");
  await expect(page.locator("article[data-kind='coach']")).toHaveCount(2);
  expect(await lastHistoryTurns(request)).toBe(2);

  // Clear empties the conversation AND the history sent next; nothing is stored (AC-16).
  await page.getByRole("button", { name: "Clear conversation" }).click();
  await expect(page.locator("article")).toHaveCount(0);
  await box.fill("New topic: she refuses to brush her teeth.");
  await box.press("Enter");
  await expect(page.locator("article[data-kind='coach']")).toHaveCount(1);
  expect(await lastHistoryTurns(request)).toBe(0);
  const stored = await page.evaluate(() => localStorage.length + sessionStorage.length);
  expect(stored).toBe(0);
});
