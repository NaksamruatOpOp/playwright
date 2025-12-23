import {
  expect,
  page,
  readFile,
  test,
  waitForPageTimeout,
  writeFile,
} from "../../../utils/commands";

import { suiteGoto } from "../../../utils/page_goto";

import {
  fillTextField,
  hoverElement,
  suiteClick,
  suiteExpect,
} from "../../../utils/page_actions";

import { locators } from "../../../utils/locator";

import { CentralPage, filePath, UIPath } from "./centralPage";

import { DateTime } from "luxon";

export { page, test };

const centralPage = new CentralPage();

const contentMapping: Record<string, string> = {
  exvideo: "external video",
  flashcard: "flash_card",
  exam: "test",
  "survey-poll": "survey",
};

export class ClassProgramPage {
  async addContentUI(): Promise<void> {
    const contents = ["video", "audio", "exvideo", "document", "article", "flashcard"];

    // Click to create curriculum and section
    await suiteClick({
      selector: '[data-qa="btn-create-curriculum"]',
      visible: "#class-detail-material",
    });

    for (const [index, content] of contents.entries()) {
      const contentData = await readFile(`${filePath}/${content}.json`);
      const selectorElement = contentMapping[content] || content;
      const { name: expectedName } = await centralPage.getContentValue(
        content,
        contentData
      );

      // Handle material selection and content input
      await selectMaterial(content, selectorElement);
      await centralPage.handleContentSelection(content, contentData);

      // Handle additional content fields if needed (activity, exam, survey-poll)
      if (["exam", "survey-poll"].includes(content)) {
        await fillContentField(expectedName);
      }

      // Save content and switch material
      await saveContentAndSwitchMaterial(index);
    }
  }

  async checkinClass(): Promise<void> {
    await centralPage.loginUser({ user: "manager" });
    const { 0: classData } = await readFile(`${filePath}/class_program.json`);
    const user = await readFile(`${filePath}/user_user.json`);
    const classID = classData.idClass;

    await suiteGoto({
      url: `/dashboard/class-program/${classData.id}/class/${classID}/overall/check-in/`,
      waitApi: `/api/dashboard/event/${classID}/participant/check-in/`,
    });
    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: locators.txtField.SEARCH,
      value: user.username,
      is_enter: true,
    });
    await waitForPageTimeout({ waitTime: 5000 });
    await centralPage.HandleCheckInClass();
  }

  async createClassProgramUI(): Promise<void> {
    const rand = Math.floor(Math.random() * 100);
    const TODAY = new Date();
    const time = `${TODAY.getHours()}:${TODAY.getMinutes()}:${TODAY.getSeconds()}`;
    const namePrefix = "Class program Regress Playwright";
    const codePrefix = "CRP-";
    const name = `${namePrefix}${rand}-${time}`;
    const code = `${codePrefix}${time}`;
    const category = "REGRESS Category (***ห้ามแก้!!!)";
    const provider = "REGRESS Provider (***ห้ามแก้!!!)";
    const imagePath = "fixtures/img/bunny.jpeg";

    await this.gotoClassUI();
    await suiteClick({
      selector_hover: locators.buttonGroup.CLASSPROGRAM,
      wrapper: '[data-qa="wrapper-create-new-class-program"]',
      selector: '[data-qa="btn-create-new-class-program"]',
      visible: "#class-program-create",
    });

    await fillTextField({
      wrapper: '[data-qa="form-item-name"]',
      selector: locators.txtField.NAME,
      value: name,
    });
    await fillTextField({
      wrapper: '[data-qa="form-item-code"]',
      selector: locators.txtField.CODE,
      value: code,
    });

    await suiteClick({
      wrapper: '[data-qa="form-item-category"]',
      selector: '[data-qa="select-category"]',
    });
    const categoryTree = page
      .locator("span.custom-tree-node")
      .filter({ hasText: category });
    await categoryTree.click();
    await suiteClick({
      wrapper: "body > .select-category-tree",
      selector: '[data-qa="btn-close"]',
    });

    await suiteClick({
      wrapper: '[data-qa="form-item-provider"]',
      selector: '[data-qa="select-provider"]',
    });
    await fillTextField({
      wrapper: '[data-qa="form-item-provider"]',
      selector: '[data-qa="select-provider"] input',
      value: provider,
    });

    await waitForPageTimeout({ waitTime: 2000 });
    await suiteClick({ selector: '[data-qa="option-regress-provider"]' });
    await page.setInputFiles('input[type="file"]', imagePath);
    await suiteClick({ selector: locators.button.CROP_DIALOG });
    await suiteClick({
      selector: locators.button.SAVE_NEXT,
      visible: "#class-program-detail",
    });
    await suiteClick({
      selector: locators.breadCrumb.TWO,
      visible: locators.identity.CLASS,
    });

    const currentUrl = await page.url();
    const match = currentUrl.match(/\/class-program\/(\d+)\//);
    let classProgramID: string | null = null;

    if (match) {
      classProgramID = match[1];
      console.log("Extracted courseId:", classProgramID);
    } else {
      console.log("Class program ID not found in the URL");
    }

    const write_data = { name, code, provider, category, id: classProgramID };
    await writeFile({ filePath: `${UIPath}/class.json`, data: write_data });
  }

  async createClassUI(): Promise<void> {
    const classData = await readFile(`${UIPath}/class.json`);
    const rand = Math.floor(Math.random() * 100);
    const TODAY = new Date();
    const time = `${TODAY.getHours()}:${TODAY.getMinutes()}:${TODAY.getSeconds()}`;
    const namePrefix = "Class Regress Playwright";
    const codePrefix = "CR-";
    const name = `${namePrefix}${rand}-${time}`;
    const code = `${codePrefix}${time}`;

    await suiteClick({
      selector: '[data-qa="btn-empty-list-create-new-class"]',
      visible: locators.dialog.FORMDIALOG,
    });
    await fillTextField({
      wrapper: locators.dialog.FORMDIALOG,
      selector: locators.txtField.NAME,
      value: name,
    });
    await fillTextField({
      wrapper: locators.dialog.FORMDIALOG,
      selector: locators.txtField.CODE,
      value: code,
    });
    await suiteClick({ selector: locators.button.SAVE, visible: locators.row1.NAME });

    const mergeData = { ...classData, nameClass: name, codeClass: code };

    await writeFile({ filePath: `${UIPath}/class.json`, data: mergeData });
  }

  async createSchedule(): Promise<void> {
    const sessionName = "Play wright session";
    const instructor = "REGRESS Instructor (***ห้ามแก้!!!)";
    const location = "REGRESS Location (***ห้ามแก้!!!)";

    const getRoundedTime = (): string => {
      const now = DateTime.now().setZone("Asia/Bangkok");
      let hours = now.hour;
      let minutes = Math.ceil(now.minute / 15) * 15;

      if (minutes === 60) {
        minutes = 0;
        hours = (hours + 1) % 24;
      }

      const formattedHours = String(hours).padStart(2, "0");
      const formattedMinutes = String(minutes).padStart(2, "0");

      return `${formattedHours}:${formattedMinutes}`;
    };
    const currentTime = getRoundedTime();

    const classData = await readFile(`${UIPath}/class.json`);

    await suiteClick({ selector: locators.row1.NAME, visible: locators.panel.SCHEDULE });
    const currentUrl = await page.url();
    const match = currentUrl.match(/\/class\/(\d+)\//);
    let classID: string | null = null;

    if (match) {
      classID = match[1];
      console.log("Extracted courseId:", classID);
    } else {
      console.log("Class program ID not found in the URL");
    }

    await suiteClick({
      wrapper: locators.panel.SCHEDULE,
      selector: '[data-qa="btn-create-schedule"]',
      visible: "#class-program-class-curriculum-create",
    });
    await fillTextField({
      wrapper: '[data-qa="form-item-name"]',
      selector: locators.txtField.NAME,
      value: sessionName,
    });
    await suiteClick({
      selector: '[data-qa="select-type"]',
      dropdown_selector: '[data-qa="option-class-room"]',
    });

    await suiteClick({
      wrapper: locators.fragment.DATE_TIME,
      selector: '[data-qa="date-time"] input',
    });
    await suiteClick({
      wrapper: '[class="el-date-table"]',
      selector: ' [class="available today"]',
    });
    await waitForPageTimeout({ waitTime: 1000 });

    await suiteClick({
      wrapper: locators.fragment.DATE_TIME,
      selector: '[data-qa="start-time"] input',
    });
    await fillTextField({
      wrapper: locators.fragment.DATE_TIME,
      selector: '[data-qa="start-time"] input',
      value: currentTime,
      is_enter: true,
    });

    await suiteClick({
      wrapper: '[data-qa="form-item-location"]',
      selector: '[data-qa="select-location"]',
      inputText: location,
      dropdown_selector: '[data-qa="option-regress-location"]',
    });
    await waitForPageTimeout({ waitTime: 1000 });
    await suiteClick({
      selector: '[data-qa="select-room"]',
      dropdown_selector: '[data-qa="option-regress-room"]',
    });

    await suiteClick({
      wrapper: '[data-qa="form-item-instructors"]',
      selector: '[data-qa="select-instructors"]',
      inputText: instructor,
      dropdown_selector: '[data-qa="option-regress-instructor"]',
      isFirstItem: true,
    });
    await suiteClick({ selector: locators.button.SAVE, visible: "#session-detail" });
    await suiteClick({
      selector: locators.breadCrumb.TWO,
      visible: '[data-qa="panel-card-curriculum"]',
    });

    const mergeData = { ...classData, instructor, location, classID };
    await writeFile({ filePath: `${UIPath}/class.json`, data: mergeData });
  }

  async gotoClassUI(): Promise<void> {
    await suiteGoto({
      url: "/dashboard/class-program/",
      visible: locators.buttonGroup.CLASSPROGRAM,
    });
  }

  async handleClass(): Promise<void> {
    await gotoClass();
    await doClass();
  }

  async searchClassProgram(): Promise<void> {
    const classData = await readFile(`${UIPath}/class.json`);

    await fillTextField({
      selector: locators.txtField.SEARCH,
      value: classData.name,
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
      value: classData.name,
      behavior: "text",
    });
    await suiteExpect({
      wrapper: locators.row1.CODE,
      selector: locators.row1.CODE,
      value: classData.code,
      behavior: "text",
    });
    await suiteExpect({
      selector: '[data-qa="r1-no-of-class"]',
      value: 1,
      behavior: "number",
    });

    const element = page.locator(locators.row1.PUBLISH);
    const className = await element.getAttribute("class");
    expect(className).toContain("text-green");
  }

  async verifyClassProgramUI(): Promise<void> {
    const classData = await readFile(`${UIPath}/class.json`);

    await suiteExpect({
      wrapper: locators.identity.CLASS,
      selector: locators.txt.TITLE,
      value: classData.name,
      behavior: "text",
    });
    await suiteExpect({
      wrapper: locators.identity.CLASS,
      selector: '[data-qa="txt-id"]',
      value: classData.code,
      behavior: "text",
    });
    await suiteExpect({
      wrapper: locators.identity.CLASS,
      selector: '[data-qa="txt-category"]',
      value: classData.category,
      behavior: "text",
    });
    await suiteExpect({
      wrapper: locators.identity.CLASS,
      selector: '[data-qa="txt-content-provider"]',
      value: classData.provider,
      behavior: "text",
    });
  }

  async verifyClassWeb(): Promise<void> {
    const classData = await readFile(`${UIPath}/class.json`);

    await suiteClick({ selector: '[data-qa="card-1"]', visible: '[data-qa="class-1"]' });
    await suiteClick({
      selector: '[data-qa="class-1"]',
      visible: locators.button.ENROLL,
    });
    await suiteExpect({
      selector: '[data-qa="txt-class-program-name"]',
      value: classData.name,
      behavior: "text",
    });
    await suiteExpect({
      wrapper: '[data-qa="fragment-class"]',
      selector: locators.txt.VAL,
      value: classData.nameClass,
      behavior: "text",
    });
    await suiteExpect({
      wrapper: '[data-qa="fragment-category"]',
      selector: locators.txt.VAL,
    });
    await suiteExpect({
      wrapper: '[data-qa="fragment-content-provider"]',
      selector: locators.txt.VAL,
    });
    await suiteClick({
      selector: '[data-qa="section1-1"]',
      visible: '[data-qa="section-material"]',
    });

    const selector = ["Video", "Audio", "External Video", "Document", "Article", "Flash"];

    for (const [index, content] of selector.entries()) {
      await suiteExpect({
        wrapper: `[data-qa="material-${index + 1}"]`,
        selector: locators.txt.NAME,
        value: content,
        behavior: "text",
      });
    }
  }

  async verifyCurriculum(): Promise<void> {
    const selector = [
      "external-video",
      "video",
      "audio",
      "document",
      "article",
      "flash-card",
    ];

    for (const item of selector) {
      await suiteExpect({
        wrapper: `[data-qa="fragment-${item}"]`,
        selector: locators.txt.AMOUNT,
        value: 1,
        behavior: "number",
      });
    }

    await suiteClick({
      selector: locators.breadCrumb.TWO,
      visible: locators.identity.CLASS,
    });
    await waitForPageTimeout({});
    await suiteExpect({
      wrapper: '[data-qa="panel-card-curriculum"]',
      selector: locators.txt.AMOUNT,
      value: selector.length,
      behavior: "number",
    });
  }

  async verifyEnrollForm(): Promise<void> {
    await gotoClass();
    await enrollClass();
    await centralPage.doEnrollForm();
    await suiteExpect({
      behavior: "text",
      wrapper: locators.button.ENROLL,
      selector: locators.txt.BUTTON,
      value: /Waiting List|อยู่ในรายการรอ/,
    });
  }

  async verifyOpenEnrollment(): Promise<void> {
    await suiteClick({
      wrapper: '[data-qa="panel-card-enrollment-settings"]',
      selector: locators.buttonIcon.EDIT,
      visible: "#class-program-class-detail-enrollment",
    });
    await suiteClick({
      wrapper: '[data-qa="form-item-enrollment-period"]',
      selector: '[data-qa="select-enrollment-period"]',
      dropdown_selector: '[data-qa="option-open-enroll"]',
    });
    await suiteClick({
      selector: locators.button.SAVE_BACK,
      visible: locators.identity.CLASS,
    });
    await suiteExpect({
      wrapper: '[data-qa="panel-card-enrollment-settings"]',
      selector: '[data-qa="enrollment-period"]',
      value: "Open Enrollment",
      behavior: "text",
    });
    await suiteClick({
      selector: '[data-qa="select-publish"]',
      dropdown_selector: '[data-qa="option-publish"]',
    });
    await waitForPageTimeout({ waitTime: 5000 });
    await suiteClick({
      selector: locators.breadCrumb.TWO,
      visible: "#class-program-detail",
    });
    await waitForPageTimeout({});
    await suiteClick({
      selector: '[data-qa="select-publish"]',
      dropdown_selector: '[data-qa="option-publish"]',
    });
  }

  async verifysearchClass(): Promise<void> {
    const classData = await readFile(`${UIPath}/class.json`);

    await fillTextField({
      selector: locators.txtField.SEARCH,
      value: classData.nameClass,
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
      value: classData.nameClass,
      behavior: "text",
    });
    await suiteExpect({
      wrapper: locators.row1.CODE,
      selector: locators.row1.CODE,
      value: classData.nameCode,
      behavior: "text",
    });
  }

  async verifySearchClassWeb(): Promise<void> {
    await suiteGoto({ url: "/class-program", waitApi: "/api/event-program/" });
    const classData = await readFile(`${UIPath}/class.json`);

    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: locators.txtField.SEARCH,
      value: classData.code,
      is_enter: true,
    });
    await suiteExpect({
      wrapper: locators.fragment.RESULT,
      selector: locators.txt.AMOUNT,
      value: 1,
      behavior: "number",
    });
    await suiteExpect({
      wrapper: '[data-qa="card-1"] [data-qa="fragment-card-1"]',
      selector: locators.txt.NAME,
      value: classData.name,
      behavior: "text",
    });
  }
}

async function doClass(): Promise<void> {
  await suiteClick({
    selector: '[data-qa="tab-curriculum"]',
    visible: '[data-qa="section-1"]',
  });
  await suiteClick({
    wrapper: '[data-qa="material-1"]',
    selector: locators.button.ACTION,
  });
  await centralPage.handleArticle();
  await suiteClick({
    wrapper: '[data-qa="material-2"]',
    selector: '[data-qa="material-slot"]',
  });
  await centralPage.handleExam();
}

async function enrollClass(): Promise<void> {
  await suiteClick({ selector: locators.button.ENROLL });
  await suiteClick({
    wrapper: locators.dialog.WARNING,
    selector: locators.button.CONFIRM,
  });
  await waitForPageTimeout({});
  await page
    .locator(`${locators.dialog.DIALOG} [desc="REGRESS Enroll Form"]`)
    .isVisible();
}

async function fillContentField(expectedName: string) {
  await suiteClick({ selector: locators.txtField.NAME });
  await fillTextField({ selector: locators.txtField.NAME, value: expectedName });
}

async function gotoClass(): Promise<void> {
  const { 0: classData } = await readFile(`${filePath}/class_program.json`);
  const classID = classData.idClass;

  await centralPage.loginUser({ user: "user" });
  await suiteGoto({
    url: `/class-program/${classData.id}/class/${classID}/`,
    waitApi: `/api/event/${classID}/`,
  });
}

async function selectMaterial(content: string, selectorElement: string) {
  await hoverElement({
    selector: '[data-qa="session-material-1"] [data-qa="btn-select-material"]',
    force: true,
  });

  const element_locator = content === "exvideo" ? "external_video" : selectorElement;
  await suiteClick({
    wrapper: '[data-qa="session-material-1"]',
    selector: `[data-qa="${element_locator}-name"]`,
    isFirstItem: true,
  });
}

async function saveContentAndSwitchMaterial(index: number): Promise<void> {
  const classData = await readFile(`${UIPath}/class.json`);
  await suiteClick({
    wrapper: ".slot-content-form-dialog",
    selector: locators.button.SAVE,
    intercept: `/api/dashboard/event/${classData.classID}/slot`,
    visible: '[data-qa="session-material-1"] [data-qa="btn-select-material"]',
  });

  await waitForPageTimeout({});

  await suiteClick({
    wrapper: `[data-qa="material-${index + 1}"]`,
    selector: '[data-qa="switch-material"]',
  });

  await waitForPageTimeout({});
}
