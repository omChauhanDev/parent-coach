import { expect, test } from "@playwright/test";
import { modelCount, resetModelCount } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetModelCount(request);
});

test("Urdu crisis escalates from the pre-screen without calling the model (AC-4, AC-12)", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const box = page.getByRole("textbox", { name: "Describe what's happening" });
  await box.fill("میرا چودہ سال کا بیٹا کہہ رہا ہے کہ وہ خودکشی کرنا چاہتا ہے");
  await page.getByRole("button", { name: "Send" }).click();

  const card = page.locator("article[data-kind='escalation']");
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("lang", "ur");
  await expect(card).toHaveAttribute("dir", "rtl");

  const alert = page.locator("article[data-kind='escalation']").getByRole("alert");
  await expect(alert).toBeVisible();
  await expect(alert.locator("a[href='tel:999']")).toBeVisible();
  await expect(alert.locator("a[href='tel:800725462']")).toBeVisible();
  await expect(alert.getByRole("link", { name: "ماخذ" }).first()).toHaveAttribute(
    "href",
    /^https:\/\//,
  );

  // The model was never asked.
  expect(await modelCount(request)).toBe(0);
});

test("Pakistan toggle switches escalation and footer contacts (AC-12)", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "Pakistan" }).click();
  const footer = page.getByRole("contentinfo", { name: "Emergency numbers" });
  await expect(footer.locator("a[href='tel:1122']")).toBeVisible();
  await expect(footer.locator("a[href='tel:999']")).toHaveCount(0);

  await page
    .getByRole("textbox", { name: "Describe what's happening" })
    .fill("Mera beta keh raha hai ke woh khudkushi kar lega");
  await page.keyboard.press("Enter");

  const alert = page.locator("article[data-kind='escalation']").getByRole("alert");
  await expect(alert.locator("a[href='tel:1122']")).toBeVisible();
  await expect(alert.locator("a[href='tel:+923168275336']")).toBeVisible();
  expect(await modelCount(request)).toBe(0);
});
