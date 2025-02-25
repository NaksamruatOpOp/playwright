import { Page, Locator, test, expect } from "@playwright/test";
import {
  closeNewPromotion,
  suiteGoTo,
  suiteClick,
  suiteFill,
  log
} from "../../utils/commands";
import { el } from "../../utils/elements";
export { suiteGoTo, test, expect, el, closeNewPromotion };

export class HomePage {
  readonly page: Page;

  readonly logo: Locator;
  readonly homepage: Locator;
  readonly btnCart: Locator;
  readonly btnLogin: Locator;
  readonly btnLang: Locator;
  readonly btnMenu: Locator;
  readonly promoSection: Locator;

  constructor(page: Page) {
    this.page = page;

    this.logo = this.page.locator(el.logo);
    this.homepage = this.page.locator(el.homepage);
    this.btnCart = this.page.locator(el.btnCart);
    this.btnLogin = this.page.locator(el.btnLogin);
    this.btnLang = this.page.locator(el.btnLang);
    this.btnMenu = this.page.locator(el.btnMenu);
    this.promoSection = this.page.locator('[data-testid="promotion-section"]');
  }

  async navigateToHomePage() {
    await suiteGoTo({ url: "/", visible: el.homepage, page: this.page });
    await expect(this.page).toHaveTitle(/NocNoc/i);
  }

  // async verifyBtnAllMenu() {
  //   await suiteClick({
  //     selector: el.btnMenu,
  //     visible: ".DeptNavDropdown-grid .DeptNavDropdown-gridItem:nth-child(1)",
  //     page: this.page,
  //   });
  // }

  async verifyLogo() {
    await suiteClick({
      selector: el.logo,
      visible: el.homepage,
      page: this.page,
    });
    expect(this.page.url()).toBe("https://nocnoc.com/");
  }

  async verifySearch({
    value = "",
    waitApi = "",
    statusCode = 200,
  }: {
    value?: string;
    waitApi?: string;
    statusCode?: number;
  }) {
    await suiteFill({
      wrapper: el.fragmentSearch,
      selector: "input",
      value,
      page: this.page,
    });
    await suiteClick({
      wrapper: el.fragmentSearch,
      selector: 'button[name="searchButton"]',
      visible: "main.product-listing",
      waitApi,
      page: this.page,
    });
    expect(
      await this.page.locator(".product-listing h1").textContent()
    ).toContain("ผลการค้นหา");
    await expect(this.page).toHaveURL(/search/);
  }

  async verifyHighlight() {
    const selector = ".bu-row-start-1 .slick-slider >.slick-list";
    await this.page.waitForSelector(selector);
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: "visible" });
    await locator.scrollIntoViewIfNeeded();
    await expect(locator).toBeVisible();

    const stageCurrent = `${selector} [data-index='0'].slick-current`;
    while (!(await this.page.locator(stageCurrent).isVisible())) {
      log({ data: "not found" });
      const btnNext = this.page.locator(
        ".bu-row-start-1 .slick-slider:nth-child(1) > button:nth-child(1)"
      );
      await closeNewPromotion(this.page);
      await btnNext.click();
    }
    if (await locator.locator("[data-index='0'].slick-current").isVisible()) {
      await suiteClick({
        wrapper: selector,
        selector: '[data-index="0"] a',
        visible: ".promotionpage-default",
        waitApi: "stppaydayjan25",
        page: this.page,
      });
    }
  }

  async verifyProductRecommend() {
    const selector = `${el.fragmentRecommend} > .bu-grid a:nth-child(1)`;
    const locator = this.page.locator(selector);
    await expect(this.page.locator(el.fragmentRecommend)).toBeVisible();
    await locator.waitFor({ state: "visible" });
    await suiteClick({
      selector,
      visible: el.productDetailPage,
      // waitApi: "product-details",
      page: this.page,
    });
  }

  async verifyBtnLogin() {
    const locator = this.page.locator(el.btnLogin);
    await locator.waitFor({ state: "visible" });
    await suiteClick({
      selector: el.btnLogin,
      visible: el.loginInputSection,
      page: this.page,
    });
  }

  async preLogin() {
    const locatorBtnClose = this.page.locator(".login-modal button.close");
    if (await locatorBtnClose.isVisible()) {
      await locatorBtnClose.click();
    }
    await this.verifyBtnLogin();
  }

  async verifyFunctionLogin(loginType: string) {
    await this.preLogin();
    const login = {
      phone: {
        value: "0935758133",
        visible: el.loginOtpSection,
      },
      email: {
        value: "camp.103.camp@gmail.com",
        visible: el.loginPasswordSection,
      },
    };
    const { value, visible } = login[loginType];
    const locator = this.page.locator(el.btnLogin);
    await locator.waitFor({ state: "visible" });
    await suiteFill({
      wrapper: el.loginInputSection,
      selector: el.inputLogin,
      value,
      page: this.page,
    });
    await suiteClick({
      selector: el.btnLoginSubmit,
      visible,
      page: this.page,
    });
  }
}

