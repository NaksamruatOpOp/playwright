import { test, expect } from "@playwright/test";
import { LoginPage } from "./page/LoginPage";

test.describe("Login Functionality", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigateToLogin("https://example.com/login"); // Replace with your login page URL
  });

  test("Valid credentials should login successfully", async () => {
    await loginPage.login("validUser", "validPassword"); // Replace with valid credentials
    await expect(page).toHaveURL("https://example.com/dashboard"); // Replace with expected URL after login
  });

  test("Invalid credentials should show an error message", async () => {
    await loginPage.login("invalidUser", "invalidPassword"); // Replace with invalid credentials
    const error = await loginPage.getErrorMessage();
    expect(error).toBe("Invalid username or password"); // Replace with the actual error message
  });

  test("Empty fields should show validation errors", async () => {
    await loginPage.login("", "");
    const error = await loginPage.getErrorMessage();
    expect(error).toBe("Username and password are required"); // Replace with the actual validation message
  });
});
