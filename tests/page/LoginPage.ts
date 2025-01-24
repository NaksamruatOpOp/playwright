import { Page } from "playwright";

export class LoginPage {
  readonly page: Page;
  readonly usernameField: string;
  readonly passwordField: string;
  readonly loginButton: string;
  readonly errorMessage: string;

  constructor(page: Page) {
    this.page = page;
    this.usernameField = "#username"; // Replace with your username field selector
    this.passwordField = "#password"; // Replace with your password field selector
    this.loginButton = "#login"; // Replace with your login button selector
    this.errorMessage = "#error-message"; // Replace with your error message selector
  }

  async navigateToLogin(url: string) {
    await this.page.goto(url);
  }

  async login(username: string, password: string) {
    await this.page.fill(this.usernameField, username);
    await this.page.fill(this.passwordField, password);
    await this.page.click(this.loginButton);
  }

  async getErrorMessage(): Promise<string> {
    return await this.page.textContent(this.errorMessage);
  }
}
