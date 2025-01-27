import { ProductPage, test, expect, el } from "./page/product";

test.describe("NocNoc Product Detail Smoke Test", () => {
  let product: ProductPage;

  test.beforeEach(async ({ page }) => {
    product = new ProductPage(page);
    await product.navigateToProductPage();
  });

  test("Verify product detail", async () => {
    await test.step("Verify display product info ", async () => {
      const elementsList = [
        { name: "Product Name", element: product.productName },
        { name: "Product Price", element: product.productPrice },
        { name: "Product Image", element: product.productImage },
        { name: "Product Choice 1", element: product.productImageChoice1 },
        { name: "Product Choice 2", element: product.productImageChoice2 },
        { name: "Select Unit", element: product.selectUnit },
        { name: "Add to Cart Button", element: product.btnAddCart },
        { name: "Checkout Button", element: product.btnCheckout },
      ];

      elementsList.forEach(({ name, element }) => {
        test.step(`Check visibility of ${name}`, async () => {
          await expect(element).toBeVisible();
        });
      });
    });

    await test.step("Verify product Name", async () => {
      await product.checkProductName();
    });

    await test.step("Verify product description", async () => {
      await test.step("Verify default tab", async () => {
        await product.checkDefaultMenuTab();
      });

      const tabMenu = ["desc", "spec", "other"];
      for (const tab of tabMenu) {
        await test.step(`Verify ${tab} tab`, async () => {
          await product.checkInfoMenu({ tab });
        });
      }
    });
  });

  test("Verify add product to cart", async ({ page }) => {
    const locatorAmountProductInCart = page.locator(`${el.btnCart} > div`);
    await test.step("Verify click add to cart", async () => {
      await expect(locatorAmountProductInCart).not.toBeVisible();
      await product.selectProduct();
      await product.checkAddToCart();
      await product.checkSummaryDialog();
      const AmountProductInCart = await page.textContent(`${el.btnCart} > div`);
      expect(AmountProductInCart).toEqual("1");
    });
    await test.step("Verify click cancel on summary cart", async () => {
      await product.preConAddCart();
      await product.checkFunctionButton('cancel');
      await expect(locatorAmountProductInCart).toBeVisible();
      const AmountProductInCart = await page.textContent(`${el.btnCart} > div`);
      expect(AmountProductInCart).toEqual("2");
    });
    await test.step("Verify click confirm on summary cart", async () => {
      await product.preConAddCart();
      await product.checkFunctionButton("confirm");
      await expect(locatorAmountProductInCart).toBeVisible();
      const AmountProductInCart = await page.textContent(`${el.btnCart} > div`);
      expect(AmountProductInCart).toEqual("2");
    });
  });
});