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

export { test };

export class CategoryPage {
  async deleteCategory(): Promise<void> {
    await suiteClick({
      wrapper: locators.buttonIcon.R1,
      selector: locators.buttonIcon.DELETE,
    });
    await suiteClick({ selector: locators.button.CONFIRM });
    await waitForPageTimeout({});
    await page.reload();
    await suiteExpect({
      wrapper: locators.fragment.RESULT,
      selector: locators.txt.AMOUNT,
      value: 0,
      behavior: "number",
    });
  }

  async gotoCategory(): Promise<void> {
    await suiteGoto({ url: "/dashboard/category", visible: "#category-list" });
  }

  async manageCategory(mode: "create" | "edit"): Promise<void> {
    const rand = Math.floor(Math.random() * 100);
    const TODAY = new Date();
    const time = `${TODAY.getHours()}:${TODAY.getMinutes()}:${TODAY.getSeconds()}`;

    // Shared values
    const namePrefix =
      mode === "create" ? "Playwright Category" : "Edit Playwright Category";
    const codePrefix = mode === "create" ? "Pr-" : "EdP";
    const imagePath =
      mode === "create" ? "fixtures/img/cat.jpg" : "fixtures/img/bunny.jpeg";

    const name = `${namePrefix}${rand}-${time}`;
    const code = `${codePrefix}${time}`;

    // Common flow for both modes
    if (mode === "create") {
      await this.gotoCategory();
      await suiteClick({
        selector_hover: '[data-qa="btn-group-create-category"]',
        selector: '[data-qa="btn-create-new-category"]',
        visible: locators.dialog.FORMDIALOG,
      });
    } else {
      await suiteClick({
        wrapper: locators.buttonIcon.R1,
        selector: locators.buttonIcon.EDIT,
        visible: "#category-detail",
      });
    }

    // Fill in common fields
    if (mode === "create") {
      await fillTextField({ selector: locators.txtField.NAME, value: name });
      await fillTextField({ selector: locators.txtField.CODE, value: code });
    } else {
      await suiteClick({
        wrapper: locators.fragment.CATEGORY_NAME,
        selector: '[data-qa="text"]',
      });
      await fillTextField({
        wrapper: locators.fragment.CATEGORY_NAME,
        selector: locators.input.TEXT,
        value: name,
        is_enter: true,
      });
      await suiteClick({
        wrapper: locators.fragment.CATEGORY_ID,
        selector: '[data-qa="text"]',
      });
      await fillTextField({
        wrapper: locators.fragment.CATEGORY_ID,
        selector: locators.input.TEXT,
        value: code,
        is_enter: true,
      });
    }

    // Handle image upload
    await page.setInputFiles('input[type="file"]', imagePath);
    await suiteClick({ selector: locators.button.CROP_DIALOG });

    const selector = locators.switch.PUBLISH;
    const wrapper =
      mode === "create" ? undefined : '[data-qa="fragment-category-publish"]';
    await suiteClick({ wrapper, selector });
    await waitForPageTimeout({});

    // Mode-specific actions
    if (mode === "create") {
      await suiteClick({
        selector: locators.button.SAVE_NEXT,
        visible: "#category-detail",
      });
    }
    // Wait for page timeout and write data to file
    await waitForPageTimeout({});
    const write_data = { name, code };
    await writeFile({ filePath: `${UIPath}/category.json`, data: write_data });
  }

  async manageSubCategory(mode: "create" | "edit"): Promise<void> {
    const categoryData = await readFile(`${UIPath}/category.json`);
    const subcatArray: any = [];
    const rand = Math.floor(Math.random() * 100);
    const TODAY = new Date();
    const time = `${TODAY.getHours()}:${TODAY.getMinutes()}:${TODAY.getSeconds()}`;

    for (let i = 2; i < 5; i++) {
      // Shared values
      const namePrefix =
        mode === "create"
          ? `Playwright Category sub ${i}`
          : `Edit Playwright Category sub ${i}`;
      const codePrefix = mode === "create" ? `Ca-${i}` : `EDC-${i}`;
      const imagePath =
        mode === "create" ? "fixtures/img/cat.jpg" : "fixtures/img/bunny.jpeg";

      const name = `${namePrefix}${rand}-${time}`;
      const code = `${codePrefix}${time}`;

      if (mode === "create")
        await suiteClick({ selector: `[data-qa="btn-add-category-level-${i}"]` });
      else
        await suiteClick({
          wrapper: `[data-qa="level-${i}"]`,
          selector: locators.buttonIcon.EDIT,
        });
      await fillTextField({ selector: locators.txtField.NAME, value: name });
      await fillTextField({ selector: locators.txtField.CODE, value: code });
      await page.setInputFiles('.category-form-dialog input[type="file"]', imagePath);
      await suiteClick({ selector: locators.button.CROP_DIALOG });
      await waitForPageTimeout({});
      await suiteClick({
        wrapper: ".category-form-dialog",
        selector: locators.button.SAVE,
        visible: "#category-detail",
      });
      await waitForPageTimeout({});
      subcatArray.push({ name, code });
    }

    const merge_data = { ...categoryData, subcatArray };

    await writeFile({ filePath: `${UIPath}/category.json`, data: merge_data });
  }

  async searchCategory({ isPublic = false, subcat = 0 }): Promise<void> {
    const categoryData = await readFile(`${UIPath}/category.json`);

    await fillTextField({
      selector: locators.txtField.SEARCH,
      value: categoryData.name,
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
      value: categoryData.name,
      behavior: "text",
    });
    await suiteExpect({
      wrapper: locators.row1.CODE,
      selector: locators.row1.CODE,
      value: categoryData.code,
      behavior: "text",
    });
    await suiteExpect({
      selector: '[data-qa="r1-subcategory"]',
      value: subcat,
      behavior: "number",
    });

    const element = page.locator(locators.row1.PUBLISH);
    const className = await element.getAttribute("class");

    if (isPublic) expect(className).toContain("text-green");
    else expect(className).not.toContain("text-green");
  }

  async searchWebCategory(): Promise<void> {
    const categoryData = await readFile(`${UIPath}/category.json`);

    await suiteGoto({ url: `/category/`, waitApi: "/api/sub-category/" });
    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: locators.txtField.SEARCH,
      value: categoryData.name,
      is_enter: true,
    });
    await waitForPageTimeout({});
    await suiteExpect({
      wrapper: locators.fragment.RESULT,
      selector: locators.txt.AMOUNT,
      value: 1,
      behavior: "number",
    });
    await suiteClick({
      selector: '[data-qa="card-1"]',
      visible: "#category-detail-page",
    });
  }

  async verifySubCategory(): Promise<void> {
    const categoryData = await readFile(`${UIPath}/category.json`);

    for (let i = 0; i < categoryData.subcatArray.length; i++) {
      const subCategory = categoryData.subcatArray[i];

      await suiteExpect({
        wrapper: `[data-qa="level-${i + 2}"]`,
        selector: '[data-qa="txt-name"]',
        value: subCategory.name,
        behavior: "text",
      });
    }
    await suiteClick({ selector: locators.breadCrumb.ONE, visible: "#category-list" });
  }

  async verifyWebCategory(): Promise<void> {
    const categoryData = await readFile(`${UIPath}/category.json`);

    await suiteExpect({
      selector: locators.txt.TITLE,
      value: categoryData.name,
      behavior: "text",
    });

    for (const element of categoryData.subcatArray) {
      const subCategory = element;

      await suiteExpect({
        selector: '[data-qa="btn-subcategory-1"]',
        value: subCategory.name,
        behavior: "text",
      });
      await suiteClick({ selector: '[data-qa="btn-subcategory-1"]' });
    }
  }
}
