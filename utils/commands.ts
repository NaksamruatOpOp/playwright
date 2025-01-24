import {
  BrowserContext,
  expect,
  Page,
  request,
  test,
} from "@playwright/test";

let browserName: string;
let context: BrowserContext;
let page: Page;

export { 
  browserName,
  context,
  expect,
  page,
  request 
};

test.beforeAll(async ({ browser }) => {
  browserName = browser.browserType().name().toLowerCase();
  context = await browser.newContext();
  page = await context.newPage();
});
