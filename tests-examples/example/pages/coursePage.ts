import {
  callApi,
  expect,
  page,
  readFile,
  test,
  waitForPageTimeout,
  writeFile,
} from "../../../utils/commands";

import {
  fillTextField,
  hoverElement,
  suiteClick,
  suiteExpect,
} from "../../../utils/page_actions";

import { suiteGoto } from "../../../utils/page_goto";

import { locators } from "../../../utils/locator";

import { CentralPage, filePath, UIPath } from "./centralPage";
export { test };

let courseID = "";
let saveUrl = "";
const sectionName = "playwright section";
const centralPage = new CentralPage();
const contentMapping: Record<string, string> = {
  exvideo: "external video",
  flashcard: "flash_card",
  exam: "test",
  "survey-poll": "survey",
};

export class CoursePage {
  async addContentUI(): Promise<void> {
    const contents = [
      "video",
      "audio",
      "exvideo",
      "document",
      "article",
      "flashcard",
      "activity",
      "exam",
      "survey-poll",
    ];

    // Click to create curriculum and section
    await createCurriculumAndSection();

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
      if (["activity", "exam", "survey-poll"].includes(content)) {
        await fillContentField(expectedName);
      }

      // Save content and switch material
      await saveContentAndSwitchMaterial(index);
    }
  }

  async createCourseUI(): Promise<void> {
    const rand = Math.floor(Math.random() * 100);
    const TODAY = new Date();
    const time = `${TODAY.getHours()}:${TODAY.getMinutes()}:${TODAY.getSeconds()}`;
    const namePrefix = "Course Regress Playwright";
    const codePrefix = "CRP-";
    const name = `${namePrefix}${rand}-${time}`;
    const code = `${codePrefix}${time}`;
    const instructor = "REGRESS Instructor (***ห้ามแก้!!!)";
    const category = "REGRESS Category (***ห้ามแก้!!!)";
    const provider = "REGRESS Provider (***ห้ามแก้!!!)";
    const imagePath = "fixtures/img/bunny.jpeg";

    await this.gotoCourseUI();
    await suiteClick({
      selector_hover: '[data-qa="btn-group-create-course"]',
      wrapper: '[data-qa="wrapper-create-new-course"]',
      selector: '[data-qa="btn-create-new-course"]',
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
    await suiteClick({ selector: '[data-qa="select-instructor"]' });
    await page
      .getByTestId("select-instructor")
      .getByRole("textbox")
      .first()
      .fill("REGRESS");
    await page.getByText(instructor).click();

    await suiteClick({
      wrapper: locators.dialog.FORMDIALOG,
      selector: '[data-qa="select-category"]',
      inputText: category,
    });
    await waitForPageTimeout({});
    const categoryTree = page
      .locator("span.custom-tree-node")
      .filter({ hasText: category });
    await categoryTree.click();
    await suiteClick({
      wrapper: "body > .select-category-tree",
      selector: '[data-qa="btn-close"]',
    });
    await suiteClick({
      wrapper: locators.dialog.FORMDIALOG,
      selector: '[data-qa="select-provider"]',
      inputText: provider,
    });
    await waitForPageTimeout({});
    await suiteClick({ selector: '[data-qa="option-regress-provider"]' });
    await suiteClick({ selector: locators.button.SAVE_NEXT, visible: "#course-detail" });

    await page.setInputFiles('[data-qa="course-identity"] input[type="file"]', imagePath);
    await suiteClick({ selector: locators.button.CROP_DIALOG });
    await waitForPageTimeout({});

    const currentUrl = page.url();
    const match = RegExp(/\/course\/(\d+)\//).exec(currentUrl);
    let courseId: string | null = null;
    if (match) {
      courseId = match[1]; // The number will be in the first capture group
      console.log("Extracted courseId:", courseId);
    } else {
      console.log("Course ID not found in the URL");
    }

    const write_data = { name, code, instructor, provider, category, id: courseId };
    await writeFile({ filePath: `${UIPath}/course.json`, data: write_data });
  }

  async verifyEnrollForm(): Promise<void> {
    await this.gotoCourse({ course: "enrollform" });
    await this.enrollCourse({ isEnrollForm: true });
    await centralPage.doEnrollForm();
    await suiteExpect({
      behavior: "text",
      wrapper: locators.button.ENROLL,
      selector: locators.txt.BUTTON,
      value: /Waiting for Approve|รออนุมัติ/,
    });
  }

  async gotoCourse({ course = "" }): Promise<void> {
    const courseData = await readFile(`${filePath}/course_${course}.json`);
    const [response] = await Promise.all([
      await callApi({
        endpoint: `/api/course/?search=${courseData.name}`,
        method: "GET",
      }),
    ]);
    courseID = response[0].id;

    await centralPage.loginUser({ user: "user" });
    await suiteGoto({
      url: `/course/${courseID}/`,
      waitApi: `/api/course/v2/${courseID}/`,
    });
  }

  async gotoCourseUI(): Promise<void> {
    await suiteGoto({
      url: "/dashboard/course/",
      visible: '[data-qa="btn-group-create-course"]',
    });
  }

  async enrollCourse({
    isEnrollForm = false,
    isWaiting = false,
  }: { isEnrollForm?: boolean; isWaiting?: boolean } = {}): Promise<void> {
    await suiteClick({ selector: locators.button.ENROLL });
    await suiteClick({
      wrapper: locators.dialog.WARNING,
      selector: locators.button.CONFIRM,
    });
    await waitForPageTimeout({});
    if (isEnrollForm)
      await page
        .locator(`${locators.dialog.DIALOG} [desc="REGRESS Enroll Form"]`)
        .isVisible();
    else if (isWaiting)
      await suiteExpect({
        behavior: "text",
        wrapper: locators.button.ENROLL,
        selector: locators.txt.BUTTON,
        value: /Waiting List|อยู่ในรายการรอ/,
      });
    else
      await suiteExpect({
        behavior: "text",
        wrapper: locators.button.ENROLL,
        selector: locators.txt.BUTTON,
        value: /Start Learning|เริ่มเรียน/,
      });
  }

  async learnContent({
    is_first_item = false,
    content = "",
    section = "",
  }: {
    is_first_item?: boolean;
    content: string;
    section: string;
  }): Promise<void> {
    const materialSlots = {
      video: 1,
      audio: 2,
      exvideo: 3,
      document: 4,
      article: 5,
      flashcard: 6,
      exam: 1,
      activity: 2,
      "survey-linkert": 3,
      "survey-question": 4,
      "survey-poll": 5,
    };

    const slot = materialSlots[content] ?? null;

    // Perform initial item actions if it's the first item
    if (is_first_item) {
      await suiteClick({
        wrapper: '[data-qa="section-title-box"]',
        selector: locators.button.ENROLL,
        visible: '[data-qa="section-1"]',
      });
    }

    // Wait for the page to load properly
    await waitForPageTimeout({});

    // Open the specific section if it's not already open
    const sectionOpen = page.locator(
      `${locators.section.MATERIAL} [data-qa="section-${section}"]`
    );
    const isOpened = await sectionOpen.evaluate((el) => el.classList.contains("opened"));

    if (!isOpened) {
      await suiteClick({
        wrapper: `${locators.section.MATERIAL} [data-qa="section-${section}"]`,
        selector: locators.button.EXPAND,
      });
    }

    // Click on the material slot
    await suiteClick({
      wrapper: `[data-qa="section-${section}"] [data-qa="material-${slot}"]`,
      selector: locators.slot.MATERIAL,
    });

    // Ensure the material slot is in "viewing" state
    await expect(
      page.locator(
        `[data-qa="section-${section}"] [data-qa="material-${slot}"] [data-qa="material-slot"]`
      )
    ).toHaveClass(/is-viewing/);

    // Handle different content types with a switch-case
    switch (content) {
      case "video":
      case "audio":
        await centralPage.handleVideoAudio();
        break;
      case "document":
        await centralPage.handleDocument();
        break;
      case "article":
        await waitForPageTimeout({ waitTime: 5000 });
        await centralPage.handleArticle();
        await suiteClick({
          wrapper: `[data-qa="section-${section}"] [data-qa="material-${slot + 1}"]`,
          selector: locators.slot.MATERIAL,
        });
        break;
      case "flashcard":
        await centralPage.handleFlashcard({});
        break;
      case "exam":
        await centralPage.handleExam();
        break;
      case "activity":
        saveUrl = page.url();
        await handleActivity();
        await centralPage.loginUser({ user: "user" });
        await suiteGoto({ url: saveUrl });
        break;
      case "survey-linkert":
      case "survey-question":
      case "survey-poll":
        await centralPage.handleSurvey({ content });
        break;
      default:
        console.log("No specific content type found.");
        break;
    }

    await suiteExpect({
      wrapper: `[data-qa="section-${section}"] [data-qa="material-${slot}"]`,
      selector: '[data-qa="ico-check"]',
    });
  }

  async updateExvideo(): Promise<void> {
    const courseData = await readFile(`${filePath}/course_learn.json`);
    const exvideoData = await readFile(`${filePath}/exvideo.json`);
    const course_data_id = courseData.id;

    const response_section = await callApi({
      endpoint: `/api/course/v2/${course_data_id}/section/`,
      method: "GET",
      filePath: `${filePath}/section.json`,
    });

    const res_section_id = response_section[0]["id"];

    const responseSlot = await callApi({
      endpoint: `/api/course/v2/${course_data_id}/section/${res_section_id}/slot/`,
      method: "GET",
    });
    if (Array.isArray(responseSlot)) {
      const materialType = responseSlot.find(
        (item) => item.content.name === exvideoData.name
      );
      const slotID = materialType.id;

      await callApi({
        endpoint: `/api/course/${courseID}/slot/${slotID}/stamp/?device=web&action=10&duration=196&duration_use=196&duration_diff=196&duration_max=1969&stack=1`,
        method: "GET",
      });
    } else {
      console.error("Expected an array but got:", responseSlot);
    }
  }

  async verifyCourseUI(): Promise<void> {
    const courseData = await readFile(`${UIPath}/course.json`);
    await suiteExpect({
      wrapper: locators.identity.COURSE,
      selector: locators.txt.TITLE,
      value: courseData.name,
      behavior: "text",
    });
    await suiteExpect({
      wrapper: locators.identity.COURSE,
      selector: '[data-qa="txt-id"]',
      value: courseData.code,
      behavior: "text",
    });
    await suiteExpect({
      wrapper: locators.identity.COURSE,
      selector: '[data-qa="txt-category"]',
      value: courseData.category,
      behavior: "text",
    });
    await suiteExpect({
      wrapper: locators.identity.COURSE,
      selector: '[data-qa="txt-content-provider"]',
      value: courseData.provider,
      behavior: "text",
    });
    await suiteExpect({
      wrapper: locators.identity.COURSE,
      selector: '[data-qa="fragment-instructors"] [data-qa="txt-amount"]',
      value: 1,
      behavior: "number",
    });
  }

  async verifyCurriculum(): Promise<void> {
    const selector = [
      "external-video",
      "video",
      "audio",
      "document",
      "article",
      "test",
      "activity",
      "survey",
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

    await suiteExpect({
      wrapper: '[data-qa="curriculum-summary"]',
      selector: '[data-qa="total-section"]',
      value: 1,
      behavior: "number",
    });
    await suiteClick({
      selector: '[data-qa="breadcrumb-2"]',
      visible: "#course-overall",
    });
    await suiteExpect({
      wrapper: '[data-qa="panel-card-curriculum"] [data-qa="section-0"]',
      selector: '[data-qa="total-material"]',
      value: selector.length,
      behavior: "number",
    });
    await suiteExpect({
      wrapper: '[data-qa="section-0"]',
      selector: locators.section.NAME,
      value: sectionName,
      behavior: "text",
    });
  }

  async verifyOpenEnrollment(): Promise<void> {
    await suiteClick({
      wrapper: '[data-qa="panel-card-enrollment-settings"]',
      selector: '[data-qa="btn-ico-edit"]',
      visible: '[data-qa="enrollment-settings-form"]',
    });
    await suiteClick({
      wrapper: '[data-qa="form-item-enrollment-period"]',
      selector: '[data-qa="select-enrollment-period"]',
      dropdown_selector: '[data-qa="option-open-enroll"]',
    });
    await suiteClick({ selector: locators.button.SAVE_BACK, visible: "#course-overall" });
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
  }

  async searchCourse(): Promise<void> {
    const courseData = await readFile(`${UIPath}/course.json`);

    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: locators.txtField.SEARCH,
      value: courseData.code,
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
      value: courseData.name,
      behavior: "text",
    });
    await suiteExpect({
      wrapper: locators.row1.CODE,
      selector: locators.row1.CODE,
      value: courseData.code,
      behavior: "text",
    });

    const element = page.locator('[data-qa="r1-ico-enrollment"]');
    const className = await element.getAttribute("class");
    expect(className).toContain("text-green");
  }

  async verifySearchCourseWeb(): Promise<void> {
    await suiteGoto({ url: "/course/", waitApi: "/api/course/" });
    const courseData = await readFile(`${UIPath}/course.json`);

    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: locators.txtField.SEARCH,
      value: courseData.code,
      is_enter: true,
    });
    await suiteExpect({
      wrapper: locators.fragment.RESULT,
      selector: locators.txt.AMOUNT,
      value: 1,
      behavior: "number",
    });
    await suiteExpect({
      wrapper: `${locators.card.ONE} [data-qa="fragment-card-1"]`,
      selector: locators.txt.NAME,
      value: courseData.name,
      behavior: "text",
    });
  }

  async verifyCourseWeb(): Promise<void> {
    const courseData = await readFile(`${UIPath}/course.json`);

    await suiteClick({ selector: locators.card.ONE, visible: "#course-detail" });
    await suiteExpect({
      wrapper: '[data-qa="section-title-box"]',
      selector: '[data-qa="txt-content-name"]',
      value: courseData.name,
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

    const selector = [
      "Video",
      "Audio",
      "External Video",
      "Document",
      "Article",
      "Flash",
      "Activity",
      "TEST",
      "Poll",
    ];

    for (const [index, content] of selector.entries()) {
      await suiteExpect({
        wrapper: `[data-qa="material-${index + 1}"]`,
        selector: '[data-qa="txt-name"]',
        value: content,
        behavior: "text",
      });
    }
  }
}

async function createCurriculumAndSection(): Promise<void> {
  await suiteClick({
    selector: '[data-qa="btn-create-curriculum"]',
    visible: "#course-detail-curriculum",
  });

  await suiteClick({
    selector: '[data-qa="btn-create-section"]',
    visible: '[data-qa="session-material-1"]',
  });

  await suiteClick({
    wrapper: locators.section.NAME,
    selector: '[data-qa="text"]',
  });

  await fillTextField({
    wrapper: locators.section.NAME,
    selector: locators.input.TEXT,
    value: sectionName,
    is_enter: true,
  });
}

async function handleActivity(): Promise<void> {
  await centralPage.doActivity();
  await gotoActivity();
  await waitForPageTimeout({});
  await checkinActivity();
  await verifyActivity();
  await suiteGoto({ url: "/" });
}

async function fillContentField(expectedName: string): Promise<void> {
  await suiteClick({ selector: locators.txtField.NAME });
  await fillTextField({ selector: locators.txtField.NAME, value: expectedName });
}

async function gotoActivity(): Promise<void> {
  await centralPage.loginUser({ user: "manager" });

  const acitvityData = await readFile(`${filePath}/activity.json`);
  const activityId = acitvityData.id;

  await suiteGoto({
    url: `/dashboard/activity/${activityId}/overall/check-in/`,
    visible: "#activity-overall-check-in-content-usage",
    waitApi: `/api/dashboard/activity/${activityId}/content-usage/`,
  });
}

async function checkinActivity(): Promise<void> {
  const courseData = await readFile(`${filePath}/course_learn.json`);

  await fillTextField({
    wrapper: locators.fragment.SEARCH,
    selector: locators.txtField.SEARCH,
    value: courseData.code,
    is_enter: true,
  });
  await suiteExpect({
    wrapper: locators.fragment.RESULT,
    selector: locators.txt.AMOUNT,
    value: 1,
  });
  await suiteClick({
    selector: ".el-table__body td:nth-child(8)",
    visible: ".activity-checkin-table",
  });

  const userDetail = await readFile(`${filePath}/user_user.json`);
  const DIALOG_BUTTON_LOCATOR = `#activity-overall-check-in ${locators.dialog.DIALOG} [data-qa="btn-confirm"]`;

  await fillTextField({
    wrapper: locators.fragment.SEARCH,
    selector: locators.txtField.SEARCH,
    value: userDetail.username,
    is_enter: true,
  });
  await suiteClick({
    wrapper: '[data-qa="check-in-0"]',
    selector: '[data-qa="ico-clear2"]',
    visible: DIALOG_BUTTON_LOCATOR,
  });
  await suiteClick({ selector: DIALOG_BUTTON_LOCATOR });

  const check_in_icon = page.locator('[data-qa="ico-check-in"]');

  await expect(check_in_icon).toBeVisible();
  await expect(check_in_icon).toHaveClass(/(^|\s)text-green(\s|$)/);
}

async function saveContentAndSwitchMaterial(index: number): Promise<void> {
  const courseData = await readFile(`${UIPath}/course.json`);
  await suiteClick({
    wrapper: ".slot-content-form-dialog",
    selector: locators.button.SAVE,
    intercept: `api/dashboard/course/${courseData.id}/section/`,
    visible: locators.button.SELECT_MATERIAL,
  });

  await waitForPageTimeout({ waitTime: 5000 });

  await suiteClick({
    wrapper: `[data-qa="material-${index + 1}"]`,
    selector: '[data-qa="switch-material"]',
  });

  await waitForPageTimeout({ waitTime: 5000 });
}

async function selectMaterial(content: string, selectorElement: string): Promise<void> {
  await hoverElement({
    selector: `[data-qa="session-material-1"] ${locators.button.SELECT_MATERIAL}`,
    force: true,
  });
  const element_locator = content === "exvideo" ? "external_video" : selectorElement;

  await suiteClick({
    selector: `[data-qa="${element_locator}-name"]`,
    isFirstItem: true,
  });

  await waitForPageTimeout({});
}

async function verifyActivity(): Promise<void> {
  const courseData = await readFile(`${filePath}/course_learn.json`);

  await suiteClick({
    selector: '[data-qa="tab-waiting-to-verify"]',
    visible: "#activity-overall-verify-content-usage",
  });
  await fillTextField({
    wrapper: locators.fragment.SEARCH,
    selector: locators.txtField.SEARCH,
    value: courseData.name,
    is_enter: true,
  });
  await suiteExpect({
    wrapper: locators.fragment.RESULT,
    selector: locators.txt.AMOUNT,
    value: 1,
  });
  await suiteClick({
    selector: ".el-table__body td:nth-child(8)",
    visible: ".activity-checklist-table",
  });
  await suiteClick({
    selector: ".el-table__body td:nth-child(5)",
    visible: "#activity-checklist-evaluation-new",
    intercept: "",
  });
  const index = await centralPage.findIndexUser({ content: "course" });

  await fillTextField({
    selector: `.el-table__body tr:nth-child(${index}) [type="number"]`,
    value: "10",
    is_enter: true,
  });
}
