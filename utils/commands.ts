import { Page, expect } from "@playwright/test";
import { el } from "./elements";
interface gotoOption {
  url?: string,
  visible?: string,
  page: Page
}
export async function suiteGoTo({ url = '/', visible = '', page }: gotoOption) {
  await page.goto(url);
  await suiteWait(page);
  await page.waitForSelector(visible);
  expect(page.url()).toContain("nocnoc");
}

interface clickOption {
  readonly wrapper?: string;
  selector: string;
  visible?: string;
  readonly hidden?: string;
  readonly waitApi?: string;
  readonly statusCode?: number;
  page: Page;
}
export async function suiteClick(paramClick: clickOption) {
  let { wrapper = "", selector, visible = "", hidden = "", waitApi = "", statusCode = 200, page } = paramClick;
  selector = `${wrapper} ${selector}`;
  const element = page.locator(selector);
  await element.waitFor({ state: "visible" });
  await element.scrollIntoViewIfNeeded();
  // await closeNewPromotion(page);
  log({ data: "will click" });
  await element.click();

  await suiteWait(page);

  if (waitApi) {
    await page.waitForResponse(
      (response) =>
        response.url().includes(waitApi) && response.status() === statusCode
    );
  }
  if (visible) {
    const elVisible = page.locator(visible);
  await expect(elVisible).toBeVisible();
  }
  if (hidden) {
    const elHidden = page.locator(hidden).first();
    await expect(elHidden).toBeHidden();
  }
}

interface fillOption {
  readonly wrapper?: string;
  selector: string;
  value: string;
  page: Page;
}
export async function suiteFill({ wrapper = '', selector, value, page }: fillOption) {
  selector = `${wrapper} ${selector}`;
  const element = page.locator(selector);
  await element.waitFor({ state: "visible" });
  await element.scrollIntoViewIfNeeded();
  await element.fill(value);
  await suiteWait(page);
  await expect(element).toHaveValue(value);
}

export async function log({ text = '', data }: { text?: string, data?: any }) {
  console.log("LOG:", text, data);
}

async function suiteWait(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500)
}

export async function closeNewPromotion(page: Page) {
  const locator = page.locator(el.new);
  await page.waitForTimeout(2000);
  if (await locator.isVisible()) {
    await suiteClick({
      wrapper: el.new,
      selector: ".ins-close-button",
      hidden: el.new,
      page,
    });
  } 
}