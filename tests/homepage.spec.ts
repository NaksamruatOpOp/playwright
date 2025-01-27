import {
  HomePage,
  test,
  expect,
} from "./page/homepage";

test.describe("NocNoc Homepage Smoke Test", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.navigateToHomePage();
  });

  test("Verify key element visible", async () => {
    await test.step("Verify all key element in homepage are visible", async () => {
      const elementsList = [
        { name: "Homepage section", element: homePage.homepage },
        { name: "Logo", element: homePage.logo },
        { name: "Cart button", element: homePage.btnCart },
        { name: "Login button", element: homePage.btnLogin },
        { name: "Language button", element: homePage.btnLang },
        { name: "Menu button", element: homePage.btnMenu },
        { name: "Promotion section", element: homePage.promoSection },
      ];

      elementsList.forEach(async ({ name, element }) => {
        await test.step(`Check visibility of ${name}`, async () => {
          await expect(element).toBeVisible();
        });
      })
    });
  })

  test("Verify home menu or image logo", async () => {
    await test.step("Verify click logo", async () => {
      await homePage.verifyLogo();
    });
  })

  test("Verify search", async () => {
    await test.step("Verify click search", async () => {
      await homePage.verifySearch({
        value: "ลำโพง",
        waitApi: "search-product-listing",
      });
    });
  });

  test("Verify highlight and functional btn next for slide highlight", async () => {
    await test.step("Verify click highlight", async () => {
      await homePage.verifyHighlight();
    });
  });

  test("Verify Recommends for you feature", async () => {
    await test.step("Verify click product", async () => {
      await homePage.verifyProductRecommend();
    });
  });

  test("Verify function Login", async () => {
    await test.step("Verify click btn login", async () => {
      await homePage.verifyBtnLogin();
    });
    await test.step("Verify fill email for login", async () => {
      await homePage.verifyFunctionLogin("email");
    });
    await test.step("Verify fill phone number for login", async () => {
      await homePage.verifyFunctionLogin("phone");
    });
  });
});
