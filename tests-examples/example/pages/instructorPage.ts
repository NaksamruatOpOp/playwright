import {
  expect,
  page,
  readFile,
  test,
  suiteGoto,
  waitForPageTimeout,
  writeFile,
} from "../../../utils/commands";

import { fillTextField, suiteClick, suiteExpect } from "../../../utils/page_actions";

import { locators } from "../../../utils/locator";

import { UIPath } from "./centralPage";

export { expect, page, test };

export class InstructorPage {
  async addAdminUser(): Promise<void> {
    const role = ["admin", "editor", "assistant"];

    await suiteClick({ selector: locators.tab.ADMIN, visible: locators.select.ACCOUNT });
    for (let item of role) {
      await suiteClick({ selector: locators.select.ACCOUNT });
      await fillTextField({
        selector: `${locators.select.ACCOUNT} input`,
        value: "wright999",
        delay: 500,
      });
      await waitForPageTimeout({});
      await suiteClick({ selector: '[data-qa="option-wright-middle-automate"]' });
      await suiteClick({ selector: '[data-qa="select-role"]' });
      await suiteClick({ selector: `[data-qa="option-${item}"]` });
      await suiteClick({ selector: locators.button.ADD });
      await suiteExpect({ selector: `[data-qa="acc-${item}-1"]` });
      await page.reload();
    }
    await suiteClick({ selector: locators.breadCrumb.ONE, visible: "#instructor-page" });
  }

  async deleteAdminUser(): Promise<void> {
    await suiteClick({
      wrapper: locators.buttonIcon.R1,
      selector: locators.buttonIcon.EDIT,
      visible: "#instructor-detail",
    });
    await suiteClick({ selector: locators.tab.ADMIN, visible: locators.select.ACCOUNT });
    await suiteClick({ selector: '[data-qa="btn-ico-remove"]' });
    await suiteClick({ selector: locators.button.CONFIRM });
    await waitForPageTimeout({});
    await suiteClick({ selector: locators.breadCrumb.ONE, visible: "#instructor-page" });
  }

  async deleteInstructor(): Promise<void> {
    await suiteClick({
      wrapper: locators.buttonIcon.R1,
      selector: locators.buttonIcon.DELETE,
    });
    await suiteClick({ selector: locators.button.CONFIRM });
    await waitForPageTimeout({});
    await suiteExpect({
      wrapper: locators.fragment.RESULT,
      selector: locators.txt.AMOUNT,
      value: 0,
      behavior: "number",
    });
  }

  async gotoInstructor(): Promise<void> {
    await suiteGoto({ url: "/dashboard/instructor", visible: "#instructor-page" });
  }

  async manageInstructor(mode: "create" | "edit"): Promise<void> {
    const rand = Math.floor(Math.random() * 100);
    const TODAY = new Date();
    const time = `${TODAY.getHours()}:${TODAY.getMinutes()}:${TODAY.getSeconds()}`;

    // Shared values
    const namePrefix =
      mode === "create" ? "Playwright Instructor" : "Edit Playwright Instructor";
    const codePrefix = mode === "create" ? "IN-" : "EdN";
    const imagePath =
      mode === "create" ? "fixtures/img/cat.jpg" : "fixtures/img/bunny.jpeg";
    const contractText =
      mode === "create" ? "contract playwright" : "Edit contract playwright";
    const profileText =
      mode === "create" ? "profile playwright" : "Edit profile playwright";

    const name = `${namePrefix}${rand}-${time}`;
    const code = `${codePrefix}${time}`;

    // Common flow for both modes
    if (mode === "create") {
      await this.gotoInstructor();
      await suiteClick({
        selector_hover: '[data-qa="btn-group-create-instructor"]',
        wrapper: '[data-qa="wrapper-create-new-instructor"]',
        selector: '[data-qa="btn-create-new-instructor"]',
        visible: "#instructor-create",
      });
    } else {
      await suiteClick({
        wrapper: locators.buttonIcon.R1,
        selector: locators.buttonIcon.EDIT,
        visible: "#instructor-detail",
      });
    }

    // Fill in common fields
    await fillTextField({ selector: locators.txtField.NAME, value: name });
    await fillTextField({ selector: locators.txtField.CODE, value: code });
    await fillTextField({
      selector: '[data-qa="txt-field-contact"]',
      value: contractText,
    });
    await fillTextField({
      selector: '[data-qa="txt-field-overview"]',
      value: profileText,
    });

    // Handle image upload
    await page.setInputFiles('input[type="file"]', imagePath);
    await suiteClick({ selector: locators.button.CROP_DIALOG });

    // Mode-specific actions
    if (mode === "edit") {
      await suiteClick({ selector: locators.switch.PUBLISH });
      await suiteClick({ selector: locators.button.SAVE, visible: "#instructor-detail" });
    } else {
      await suiteClick({
        selector: locators.button.SAVE_NEXT,
        visible: "#instructor-detail-admin",
      });
      await suiteClick({
        selector: locators.breadCrumb.ONE,
        visible: "#instructor-page",
      });
    }

    // Wait for page timeout and write data to file
    await waitForPageTimeout({});
    const write_data = { name, code, contract: contractText, profile: profileText };
    await writeFile({ filePath: `${UIPath}/instructor.json`, data: write_data });
  }

  async searchInstructor({ isPublic = false, admin = 0 }): Promise<void> {
    const instructorData = await readFile(`${UIPath}/instructor.json`);

    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: locators.txtField.SEARCH,
      value: instructorData.name,
      is_enter: true,
    });
    await suiteExpect({
      wrapper: locators.fragment.RESULT,
      selector: locators.txt.AMOUNT,
      value: 1,
      behavior: "number",
    });
    await suiteExpect({
      selector: locators.row1.NAME,
      value: instructorData.name,
      behavior: "text",
    });
    await suiteExpect({
      wrapper: locators.row1.CODE,
      selector: locators.row1.CODE,
      value: instructorData.code,
      behavior: "text",
    });
    await suiteExpect({
      selector: locators.row1.ADMIN,
      value: admin,
      behavior: "number",
    });

    const element = page.locator(locators.row1.PUBLISH);
    const className = await element.getAttribute("class");
    if (isPublic) expect(className).toContain("text-green");
    else expect(className).not.toContain("text-green");
  }

  async searchWebInstructor(): Promise<void> {
    const instructorData = await readFile(`${UIPath}/instructor.json`);
    await suiteGoto({ url: `/instructor/`, waitApi: "/api/instructor/" });
    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: locators.txtField.SEARCH,
      value: instructorData.name,
      is_enter: true,
    });
    await suiteExpect({
      wrapper: locators.fragment.RESULT,
      selector: locators.txt.AMOUNT,
      value: 1,
      behavior: "number",
    });
    await suiteClick({
      selector: '[data-qa="card-1"]',
      visible: "#instructor-detail-page",
    });
  }

  async verifyWebInstructor(): Promise<void> {
    const instructorData = await readFile(`${UIPath}/instructor.json`);
    await suiteExpect({
      selector: locators.txt.NAME,
      value: instructorData.name,
      behavior: "text",
    });
    await suiteExpect({
      selector: '[data-qa="txt-contact"]',
      value: instructorData.contract,
      behavior: "text",
    });
    await suiteExpect({
      selector: locators.txt.DESC,
      value: instructorData.desc,
      behavior: "text",
    });
  }
}
