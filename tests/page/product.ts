import { Page, Locator, test, expect } from "@playwright/test";
import {
  closeNewPromotion,
  suiteGoTo,
  suiteClick,
  suiteFill,
  log,
} from "../../utils/commands";
import { el } from "../../utils/elements";
export { test, expect, el, closeNewPromotion };

export class ProductPage {
  readonly page: Page;
  readonly productName: Locator;
  readonly productPrice: Locator;
  readonly productImage: Locator;
  readonly productImageChoice1: Locator;
  readonly productImageChoice2: Locator;
  readonly selectUnit: Locator;
  readonly btnCheckout: Locator;
  readonly btnAddCart: Locator;

  constructor(page: Page) {
    this.page = page;

    this.productName = this.page.locator(`${el.fragmentProductDetail} h1`);
    this.productPrice = this.page.locator(
      `${el.fragmentProductDetail} ${el.fragmentPrice}`
    );
    this.productImage = this.page.locator(
      `${el.fragmentProductDetail} .full-image-section img[loading="eager"]`
    );
    this.productImageChoice1 = this.page.locator(
      `${el.fragmentProductDetail} .variant-items .items img[alt="Black"]`
    );
    this.productImageChoice2 = this.page.locator(
      `${el.fragmentProductDetail} .variant-items .items img[alt="Cream"]`
    );
    this.selectUnit = this.page.locator('.calculate-area [name="quantity"]');
    this.btnCheckout = this.page.locator("#cartItems-checkout-now");
    this.btnAddCart = this.page.locator(el.btnAddToCart);
  }

  async navigateToProductPage(page: Page) {
    await suiteGoTo({
      url: "p/Bluetooth--Portable-Speakers/ลำโพง-Marshall-Woburn-III-Blue/10788372",
      visible: el.productDetailPage,
      page,
    });
    await expect(page).toHaveTitle(/Marshall/);
  }

  async checkProductName() {
    const txtProductName = await this.page.textContent(
      `${el.fragmentProductDetail} h1`
    );
    expect(txtProductName).not.toBeNull();
    expect(txtProductName?.trim().length).toBeGreaterThan(0);
    expect(txtProductName).toContain("Marshall Woburn III Bluetooth Speaker");
  }

  async checkDefaultMenuTab() {
    const tabDefault = this.page.locator(
      `${el.fragmentProductTab} > .tab-list > li:nth-child(1)`
    );
    await this.btnAddCart.scrollIntoViewIfNeeded();
    await this.page
      .locator(el.fragmentProductTab)
      .waitFor({ state: "visible" });
    await tabDefault.waitFor({ state: "visible" });
    await tabDefault.scrollIntoViewIfNeeded();
    expect(tabDefault).toBeVisible();
    expect(tabDefault).toHaveClass(/active/);
  }

  async checkInfoMenu({ tab = "desc" }: { tab: string }) {
    const indexMenu = tab === "desc" ? 1 : tab === "spec" ? 2 : 3;
    const locator = this.page.locator(
      `${el.fragmentProductTab} > .tab-list > li:nth-child(${indexMenu})`
    );
    const locatorInfo = this.page.locator(
      `${el.fragmentProductTab} .tab-content > div:nth-child(${indexMenu})`
    );
    await locator.waitFor({ state: "visible" });
    await locator.scrollIntoViewIfNeeded();
    await locator.click();
    await locatorInfo.waitFor({ state: "visible" });
    await expect(locator).toBeVisible();
    await expect(locator).toHaveClass(/active/);
    await expect(locatorInfo).toBeVisible();
    await log({ data: locator });
    await expect(locatorInfo).toHaveClass(/active/);
  }

  async selectProduct() {
    await this.btnAddCart.scrollIntoViewIfNeeded();
    await suiteClick({
      wrapper: `${el.fragmentProductDetail} .variant-items`,
      selector: '.items img[alt="Cream"]',
      visible: `${el.fragmentProductDetail} .variant-items .variant-image-item:nth-child(2) .variant-selected`,
      page: this.page,
    });
  }

  async checkAddToCart() {
    await this.btnAddCart.scrollIntoViewIfNeeded();
    await suiteClick({
      selector: el.btnAddToCart,
      visible: el.dialogSummaryAddToCart,
      page: this.page,
    });
    await expect(this.page.locator(el.dialogSummaryAddToCart)).toBeVisible();
  }

  async checkSummaryDialog() {
    const txtTitle = await this.page.textContent(
      `${el.dialogSummaryAddToCart} h6`
    );
    expect(txtTitle).toContain("เพิ่มสินค้าจำนวน 1 รายการแล้ว");
    await expect(
      this.page.locator(`${el.dialogSummaryAddToCart} .bu-items-start img`)
    ).toBeVisible();
    const txtName = await this.page.textContent(
      `${el.dialogSummaryAddToCart} .bu-items-start h6`
    );
    expect(txtName).toContain("Marshall Woburn III Bluetooth Speaker");
    await expect(
      this.page.locator(
        `${el.dialogSummaryAddToCart} ${el.fragmentConfirmPrice}`
      )
    ).toBeVisible();
    await expect(
      this.page.locator(
        `${el.dialogSummaryAddToCart} [data-testid="final-price-coupons"]`
      )
    ).toBeVisible();
    await expect(this.page.locator(el.btnCancelSummary)).toBeVisible();
    await expect(this.page.locator(el.btnConfirmSummary)).toBeVisible();
  }

  async preConAddCart() {
    await this.navigateToProductPage(this.page);
    await this.checkAddToCart();
  }

  async checkFunctionButton(btnType: string) {
    const setElement = {
      cancel: {
        selector: el.btnCancelSummary,
        visible: el.productDetailPage,
      },
      confirm: {
        selector: el.btnConfirmSummary,
        visible: el.cartPage,
      },
    };

    const { selector, visible } = setElement[btnType];
    await suiteClick({
      selector,
      visible,
      hidden: el.dialogSummaryAddToCart,
      page: this.page,
    });
  }
}


/*



    const addToCartButton = this.page.locator(".add-to-cart-button");
    await addToCartButton.click();
    const cartCount = this.page.locator(".cart-count");
    expect(await cartCount.innerText()).toBe("1");

  async clickAddToCart() {
    await this.page.click(this.addToCartButtonSelector);
  }

  async isCartIconVisible(): Promise<boolean> {
    return this.page.isVisible(this.cartIconSelector);
  }
*/