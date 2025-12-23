import {
  page,
  expect,
  interceptApiPage,
  timeoutLocator,
  waitForPageTimeout,
} from "./commands";

export async function backPage() {
  await page.goBack();
  await page.waitForLoadState("networkidle");
}

export async function hoverElement({
  wrapper = "",
  selector = "",
  force = false,
}: {
  wrapper?: string;
  selector: string;
  force?: boolean;
}) {
  const locator = `${wrapper} ${selector}`;
  const element = page.locator(locator);
  await element.scrollIntoViewIfNeeded();
  await element.hover({ force });
  console.log(`Hovered on ${selector} successfully`);
}

interface clickOptions {
  wrapper?: string;
  selector: string;
  dropdown_selector?: string;
  dropdown_text?: string;
  visible?: string;
  intercept?: string;
  status_code?: number;
  selector_hover?: string;
  force_hover?: boolean;
  checkHover?: string;
  inputText?: string;
  isFirstItem?: boolean;
}
export async function suiteClick({
  wrapper = "",
  selector = "",
  dropdown_text = "",
  dropdown_selector = "",
  visible = "",
  intercept = "",
  status_code = 200,
  selector_hover = "",
  force_hover = false,
  inputText = "",
  isFirstItem = false,
}: clickOptions) {
  const locator = `${wrapper} ${selector}`;
  const element = isFirstItem ? page.locator(locator).first() : page.locator(locator);
  let response: any;
  if (selector_hover) {
    await hoverElement({ selector: selector_hover, force: force_hover });
  }
  await element.waitFor({ state: "visible" });
  await element.scrollIntoViewIfNeeded();
  await element.click();

  if (intercept) response = await interceptApiPage({ url: intercept, status_code });
  if (inputText) {
    const locator_input = `${wrapper} ${selector} input`;
    const inputLocator = isFirstItem
      ? page.locator(locator_input).first()
      : page.locator(locator_input);
    await page.waitForLoadState("load");
    await waitForPageTimeout({ waitTime: 3000 });
    await inputLocator.fill(inputText, { noWaitAfter: false });
  }
  if (dropdown_text) await page.getByText(dropdown_text).click();
  if (dropdown_selector) await page.locator(dropdown_selector).click();
  if (visible) {
    await page.waitForLoadState("load");
    await expect(page.locator(visible)).toBeVisible({
      timeout: timeoutLocator,
    });
  }

  return response;
}

interface fillOptions {
  wrapper?: string;
  selector: string;
  value: string;
  is_date_pick?: boolean;
  is_enter?: boolean;
  isFirstItem?: boolean;
  waitTime?: number;
  delay?: number;
}
export async function fillTextField({
  wrapper = "",
  selector = "",
  value = "",
  is_date_pick = false,
  is_enter = false,
  isFirstItem = false,
  waitTime = 500,
  delay,
}: fillOptions) {
  const locator = `${wrapper} ${selector}`;
  let input = isFirstItem ? page.locator(locator).first() : page.locator(locator);

  if (is_date_pick) {
    await page.locator(`${locator} [data-qa="date-picker"]`).click();
    input = page.locator(`${locator} input`);
  }

  // Clear any pre-filled value before typing
  await input.fill("");

  if (delay !== undefined && delay > 0) {
    await input.type(value, { delay });
  } else {
    await input.fill(value, { noWaitAfter: false });
  }

  await page.waitForLoadState("load");

  if (is_date_pick || is_enter) {
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2000);
  }

  await waitForPageTimeout({ waitTime });
}

interface expectOption {
  wrapper?: string;
  selector: string;
  behavior?: string;
  value?: any;
  isFirstItem?: boolean;
  timeout?: number;
}
export async function suiteExpect(param: expectOption) {
  const {
    wrapper = "",
    selector = "",
    behavior = "",
    value = "",
    isFirstItem,
    timeout = 5000,
  } = param;
  const locator = `${wrapper} ${selector}`;
  let selector_expect = page.locator(locator);

  if (isFirstItem) selector_expect = selector_expect.first();

  switch (behavior) {
    case "value":
      await expect(selector_expect).toHaveValue(value, { timeout });
      break;
    case "hidden":
      await expect(selector_expect).toBeHidden({ timeout });
      break;
    case "text":
      await expect(selector_expect).toContainText(value, { timeout });
      break;
    case "include-text":
      await expect(selector_expect).toHaveText(value, { timeout });
      break;
    case "number":
      const textContent = await selector_expect.textContent();
      await expect(Number(textContent)).toBe(value);
      break;
    default:
      await expect(selector_expect).toBeVisible({ timeout });
      break;
  }
}
