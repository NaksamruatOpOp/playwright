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

export { page, test };

export class ProviderPage {
  async addAdminUser(): Promise<void> {
    const role = ["admin", "editor"];

    for (let item of role) {
      await suiteClick({
        selector: locators.tab.ADMIN,
        visible: locators.select.ACCOUNT,
      });
      await suiteClick({ selector: locators.select.ACCOUNT });
      await waitForPageTimeout({ waitTime: 1000 });
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
      await suiteClick({
        selector: locators.tab.HIGHLIGHT,
        visible: "#provider-detail-highlight",
      });
    }
    await suiteClick({ selector: locators.breadCrumb.ONE, visible: "#provider-page" });
  }

  async deleteAdminUser(): Promise<void> {
    await suiteClick({ selector: locators.tab.ADMIN, visible: locators.select.ACCOUNT });
    await suiteClick({ selector: '[data-qa="btn-ico-remove"]' });
    await suiteClick({ selector: locators.button.CONFIRM });
    await waitForPageTimeout({});
    await suiteClick({ selector: locators.breadCrumb.ONE, visible: "#provider-page" });
  }

  async deleteHightlight(): Promise<void> {
    await suiteClick({
      wrapper: locators.buttonIcon.R1,
      selector: locators.buttonIcon.EDIT,
      visible: "#provider-detail",
    });

    await suiteClick({
      selector: locators.tab.HIGHLIGHT,
      visible: "#provider-detail-highlight",
    });
    await suiteClick({
      wrapper: locators.buttonIcon.R1,
      selector: locators.buttonIcon.DELETE,
    });
    await suiteClick({ selector: locators.button.CONFIRM });
    await waitForPageTimeout({});
    await suiteExpect({
      wrapper: locators.fragment.TOTAL,
      selector: locators.txt.AMOUNT,
      value: 0,
      behavior: "number",
    });
  }

  async deleteProvider(): Promise<void> {
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

  async gotoProvider(): Promise<void> {
    await suiteGoto({ url: "/dashboard/provider", visible: "#provider-page" });
  }

  async manageHighlight(mode: "create" | "edit"): Promise<void> {
    const imagePath =
      mode === "create" ? "fixtures/img/cat.jpg" : "fixtures/img/bunny.jpeg";
    const titleText =
      mode === "create" ? "Highlight Playwright" : "Edit Highlight Playwright";

    await suiteClick({
      selector: locators.tab.HIGHLIGHT,
      visible: "#provider-detail-highlight",
    });

    if (mode === "edit") {
      await suiteClick({
        wrapper: locators.buttonIcon.R1,
        selector: locators.buttonIcon.EDIT,
        visible: locators.dialog.FORMDIALOG,
      });
    } else
      await suiteClick({
        selector: '[data-qa="btn-create-highlight"]',
        visible: locators.dialog.FORMDIALOG,
      });
    await fillTextField({ selector: '[data-qa="txt-field-title"]', value: titleText });
    await page.setInputFiles('input[type="file"]', imagePath);
    await suiteClick({ selector: locators.button.CROP_DIALOG });

    if (mode === "edit") {
      await suiteClick({ selector: locators.switch.PUBLISH });
    }
    await suiteClick({
      wrapper: locators.dialog.FORMDIALOG,
      selector: locators.button.SAVE,
    });

    const providerData = await readFile(`${UIPath}/provider.json`);
    const mergeData = { ...providerData, titleHighlight: titleText };

    await writeFile({ filePath: `${UIPath}/provider.json`, data: mergeData });
  }

  async manageProvider(mode: "create" | "edit"): Promise<void> {
    const rand = Math.floor(Math.random() * 100);
    const TODAY = new Date();
    const time = `${TODAY.getHours()}:${TODAY.getMinutes()}:${TODAY.getSeconds()}`;

    // Shared values
    const namePrefix =
      mode === "create" ? "Playwright Provider" : "Edit Playwright Provider";
    const codePrefix = mode === "create" ? "Pr-" : "EdP";
    const imagePath =
      mode === "create" ? "fixtures/img/cat.jpg" : "fixtures/img/bunny.jpeg";
    const descText = mode === "create" ? "desc playwright" : "Edit desc playwright";
    const aboutText = mode === "create" ? "about playwright" : "Edit about playwright";

    const name = `${namePrefix}${rand}-${time}`;
    const code = `${codePrefix}${time}`;

    // Common flow for both modes
    if (mode === "create") {
      await this.gotoProvider();
      await suiteClick({
        selector_hover: '[data-qa="btn-group-create-provider"]',
        wrapper: '[data-qa="wrapper-create-new-provider"]',
        selector: '[data-qa="btn-create-new-provider"]',
        visible: "#provider-create",
      });
    } else {
      await suiteClick({
        wrapper: locators.buttonIcon.R1,
        selector: locators.buttonIcon.EDIT,
        visible: "#provider-detail",
      });
    }

    // Fill in common fields
    await fillTextField({ selector: locators.txtField.NAME, value: name });
    await fillTextField({ selector: '[data-qa="txt-field-id"]', value: code });
    await fillTextField({ selector: locators.txtField.DESC, value: descText });
    await fillTextField({
      selector: '[data-qa="input-editor-lite-text-about"]',
      value: aboutText,
    });

    // Handle image upload
    await page.setInputFiles('input[type="file"]', imagePath);
    await suiteClick({ selector: locators.button.CROP_DIALOG });

    // Mode-specific actions
    if (mode === "edit") {
      await suiteClick({ selector: locators.switch.PUBLISH });
      await suiteClick({ selector: locators.button.SAVE, visible: "#provider-detail" });
    } else {
      await suiteClick({
        selector: locators.button.SAVE_NEXT,
        visible: "#provider-detail-highlight",
      });
    }

    // Wait for page timeout and write data to file
    await waitForPageTimeout({});
    const write_data = { name, code, desc: descText, about: aboutText };
    await writeFile({ filePath: `${UIPath}/provider.json`, data: write_data });
  }

  async searchHightlight({ isPublic = false }): Promise<void> {
    const providerData = await readFile(`${UIPath}/provider.json`);

    await fillTextField({
      selector: locators.txtField.SEARCH,
      value: providerData.titleHighlight,
      is_enter: true,
    });
    await suiteExpect({
      wrapper: locators.fragment.RESULT,
      selector: locators.txt.AMOUNT,
      value: 1,
      behavior: "number",
    });
    await suiteExpect({
      selector: '[data-qa="r1-txt-title"]',
      value: providerData.titleHighlight,
      behavior: "text",
    });
    await suiteExpect({
      selector: '[data-qa="link-to-unlink"]',
      value: "-",
      behavior: "text",
    });

    const element = page.locator(locators.row1.PUBLISH);
    const className = await element.getAttribute("class");
    if (isPublic) expect(className).toContain("text-green");
    else expect(className).not.toContain("text-green");

    if (!isPublic)
      await suiteClick({ selector: locators.breadCrumb.ONE, visible: "#provider-page" });
    else
      await suiteClick({
        selector: locators.tab.ADMIN,
        visible: "#provider-detail-admin",
      });
  }

  async searchProvider({ isPublic = false, admin = 0, highlight = 0 }): Promise<void> {
    const providerData = await readFile(`${UIPath}/provider.json`);

    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: locators.txtField.SEARCH,
      value: providerData.name,
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
      value: providerData.name,
      behavior: "text",
    });
    await suiteExpect({
      wrapper: locators.row1.CODE,
      selector: locators.row1.CODE,
      value: providerData.code,
      behavior: "text",
    });
    await suiteExpect({
      selector: locators.row1.ADMIN,
      value: admin,
      behavior: "number",
    });
    await suiteExpect({
      selector: '[data-qa="r1-highlight"]',
      value: highlight,
      behavior: "number",
    });

    const element = page.locator(locators.row1.PUBLISH);
    const className = await element.getAttribute("class");
    if (isPublic) expect(className).toContain("text-green");
    else expect(className).not.toContain("text-green");
  }

  async searchWebProvider(): Promise<void> {
    const providerData = await readFile(`${UIPath}/provider.json`);
    await suiteGoto({ url: `/provider/`, waitApi: "/api/provider/" });
    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: locators.txtField.SEARCH,
      value: providerData.name,
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
      visible: "#provider-detail-page",
    });
  }

  async verifyWebProvider(): Promise<void> {
    const providerData = await readFile(`${UIPath}/provider.json`);
    await waitForPageTimeout({ waitTime: 15000 });
    await suiteExpect({
      selector: locators.txt.NAME,
      value: providerData.name,
      behavior: "text",
    });
    await suiteExpect({
      selector: locators.txt.DESC,
      value: providerData.desc,
      behavior: "text",
    });
    const targetSelector = page.locator('[data-qa="img-swiper-slide-1"]');
    const count = await targetSelector.count();
    if (count === 0) {
      console.error("Highlight not found");
    }
  }
}
