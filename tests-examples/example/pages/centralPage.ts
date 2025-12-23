import {
  expect,
  page,
  readFile,
  suiteGoto,
  uploadFile,
  waitForPageTimeout,
  callApi,
  retrySuiteExpect,
  waitApi,
  test,
} from "../../../utils/commands";

import { fillTextField, suiteClick, suiteExpect } from "../../../utils/page_actions";

import {
  AnswerParams,
  BaseParams,
  QuestionParams,
} from "../interfaces/central.interface";
import { locators } from "../../../utils/locator";
import { logIn5, verifylogIn5 } from "../../../tests/login/base/baseLogin";

const filePath = "data/regressPortal";
const UIPath = "data/ui";
export { filePath, readFile, test, UIPath, verifylogIn5 };
export class CentralPage {
  async approveWaiting(): Promise<void> {
    await suiteClick({
      wrapper: '[data-qa="dropdown-in-col"]',
      selector: '[data-qa="select-dropdown-in-col"]',
      dropdown_text: "Approve",
      visible: ".confirm-dialog-dashboard-v5",
    });
    await suiteClick({
      wrapper: ".confirm-dialog-dashboard-v5",
      selector: ".btn-confirm",
    });
    await waitForPageTimeout({});
  }

  async doActivity(): Promise<void> {
    await suiteExpect({ wrapper: ".activity-detail", selector: locators.button.ENROLL });
    await suiteClick({
      wrapper: ".activity-detail",
      selector: locators.button.ENROLL,
      visible: locators.formItem.ATTACHMENT,
    });
    await uploadFile({
      selector: ".attach-dropzone",
      file_path: "fixtures/img/cat.jpg",
      is_dashboard: false,
    });
    await waitForPageTimeout({});
    await suiteExpect({ selector: '[data-qa="attach-progress"]' });
    await fillTextField({
      wrapper: locators.formItem.NOTE,
      selector: locators.txtField.TXT_FIELD,
      value: "auto learn activity",
    });
    await waitForPageTimeout({});
    await suiteClick({
      wrapper: '[data-qa="form-btn"]',
      selector: locators.button.SUBMIT,
      visible: '#activity-checklist-detail [data-qa="dialog-warning"]',
    });
    await suiteClick({
      wrapper: '[data-qa="dialog-warning"]',
      selector: locators.button.SUBMIT,
      visible: '[data-qa="txt-note"]',
    });
  }

  async doEnrollForm(): Promise<void> {
    await suiteClick({
      wrapper: '[data-qa="question-1"]',
      selector: '[data-qa="social-media"]',
    });
    await suiteClick({ wrapper: '[data-qa="question-2"]', selector: '[data-qa="qa"]' });
    await fillTextField({
      wrapper: '[data-qa="question-3"]',
      selector: locators.input.ANSWER,
      value: "Automate Playwright",
    });
    await fillTextField({
      wrapper: '[data-qa="question-4"]',
      selector: locators.input.ANSWER,
      value: "Robot",
    });
    await fillTextField({
      wrapper: '[data-qa="question-5"]',
      selector: `${locators.question.NUBMER} input`,
      value: "20",
    });
    await suiteClick({
      wrapper: '[data-qa="question-6"]',
      selector: '[data-qa="select-answer"]',
      dropdown_text: "LXP",
    });
    await suiteClick({
      wrapper: '[data-qa="question-7"]',
      selector: '[data-qa="date-picker"]',
    });
    await page.locator('button:has-text("Now")').click();
    await fillTextField({
      selector: '[data-qa="question-8"]',
      value: "21-01-2025",
      is_date_pick: true,
    });
    await fillTextField({
      wrapper: '[data-qa="question-9"]',
      selector: '[data-qa="time-select"] input',
      value: "10:00",
      is_enter: true,
    });
    await uploadFile({
      wrapper: '[data-qa="question-10"]',
      selector: '[data-qa="question-upload"]',
      file_path: "fixtures/img/cat.jpg",
      is_dashboard: false,
    });
    await waitForPageTimeout({ waitTime: 7000 });
    await suiteClick({
      wrapper: `${locators.dialog.DIALOG}`,
      selector: locators.button.CONFIRM,
    });
    await waitForPageTimeout({});
  }

  async enrollStandAlone({
    hasEnrollForm = true,
  }: {
    hasEnrollForm?: boolean;
  }): Promise<void> {
    await suiteClick({ selector: locators.button.ENROLL });
    await suiteClick({
      wrapper: locators.dialog.WARNING,
      selector: locators.button.CONFIRM,
    });
    await waitForPageTimeout({});
    if (hasEnrollForm)
      await page
        .locator(`${locators.dialog.DIALOG} [desc="REGRESS Enroll Form"]`)
        .isVisible();
  }

  async findIndexUser(params: BaseParams): Promise<number> {
    const { content } = params;
    const detail = await getFileAndUserDetails({ content });
    const container = page.locator(".el-table__body-wrapper.is-scrolling-none");
    const targetSelector = '[data-qa^="r"][data-qa$="-txt-name-id"]';
    const elements = container.locator(targetSelector);
    const count = await elements.count();
    const userDetail = await readFile(`${filePath}/${detail.read_file_user}.json`);
    const targetText = `${userDetail.username}`;
    let foundIndex = -1; // Default to -1 if not found
    // Iterate through each element to find the one containing the target text
    for (let i = 0; i < count; i++) {
      const element = elements.nth(i);
      // Locate the child element with data-qa="text-wrapper"
      const textWrapper = element.locator('[data-qa="text-wrapper"]');
      // Ensure the textWrapper is visible
      await expect(textWrapper).toBeVisible();
      // Get the text content of the textWrapper
      const textContent = await textWrapper.textContent();
      const textContent_modi = textContent ?? "";
      // Trim the text to remove any extra whitespace
      const trimmedText = textContent_modi.trim();
      // Check if the trimmed text matches the target text
      if (trimmedText.includes(targetText)) {
        foundIndex = i + 1;

        break; // Exit the loop once the target is found
      }
    }
    return foundIndex;
  }

  async gotoSurvey({ surveyData }: { surveyData: Record<string, any> }): Promise<void> {
    const [response] = await Promise.all([
      await callApi({
        endpoint: `/api/survey/?search=${surveyData.name}`,
        method: "GET",
      }),
    ]);
    const surveyId = response[0].id;

    await this.loginUser({ user: "standuser" });
    await suiteGoto({ url: `/survey/${surveyId}/`, waitApi: `/api/survey/${surveyId}/` });
  }

  async getContentValue(
    content: string,
    content_data: any
  ): Promise<{ name: string; selector_content: string }> {
    const selectorMap: Record<string, string> = {
      activity: '[data-qa="select-activity-form"]',
      exam: '[data-qa="select-test-form"]',
      "survey-poll": '[data-qa="select-survey-form"]',
      course: '[data-qa="select-select-content"]',
    };

    return {
      name: content_data.name_content ?? content_data.name ?? "",
      selector_content: selectorMap[content] ?? '[data-qa="select-select-material"]',
    };
  }

  async handleArticle() {
    await waitForPageTimeout({ waitTime: 5000 });
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  async handleContentSelection(content: string, content_data: any): Promise<void> {
    const selectionMap = {
      exvideo: '[data-qa="option-regress-external-video"]',
      flashcard: '[data-qa="option-regress-flash"]',
      course: '[data-qa="option-regress-course"]',
      class_program: '[data-qa="option-regress-classprogrampw"]:nth-child(1)',
      exam: '[data-qa="option-regress-test-regression"]',
      "survey-poll": '[data-qa="option-regression-poll"]',
      activity: '[data-qa="option-regress-activity"]',
      class: '[data-qa="option-regress-classpropw"]:nth-child(1)',
    };

    const selectorItem = selectionMap[content] || `[data-qa="option-regress-${content}"]`;
    const getValue = await this.getContentValue(content, content_data);

    await suiteClick({ selector: getValue.selector_content });
    await waitForPageTimeout({});
    await fillTextField({
      wrapper: getValue.selector_content,
      selector: "input",
      value: getValue.name,
    });
    await waitForPageTimeout({});
    await suiteClick({ selector: selectorItem });
  }

  async handleDocument(): Promise<void> {
    await suiteExpect({ selector: '[data-qa="txt-pdf-name"]' });
    await suiteClick({ selector: '[data-qa="btn-fullscreen"]' });

    // Loop through the document thumbnails
    for (let index = 1; index < 5; index++) {
      await suiteClick({ selector: `#thumb-${index}` });
      await waitForPageTimeout({});
    }

    await page.keyboard.press("Escape");
  }

  async handleExam(): Promise<void> {
    await suiteExpect({ selector: locators.button.PROGRESS });
    await waitForPageTimeout({});
    await suiteClick({ selector: locators.button.PROGRESS, visible: "#test-section" });
    await waitForPageTimeout({});
    await doExamQuestion();
  }

  async handleFlashcard({
    is_stand_alone = false,
  }: {
    is_stand_alone?: boolean;
  }): Promise<void> {
    await suiteExpect({ selector: ".flashcard-view-page" });
    for (let index = 1; index < 2; index++) {
      if (!is_stand_alone)
        await page.getByTestId("material-player").getByLabel("Next slide").click();
      else
        suiteClick({
          wrapper: '[data-qa="icon-btn"]',
          selector: '[data-qa="ico-chevron-right"]',
        });
      await waitForPageTimeout({});
    }
  }

  async handleSurvey({ content }: { content: string }): Promise<void> {
    await suiteExpect({ selector: locators.button.TAKE_SURVEY });
    await suiteClick({
      selector: locators.button.TAKE_SURVEY,
      visible: ".question-page-sections",
    });
    await waitForPageTimeout({});
    await doSurvey({ content });
  }

  async handleVideoAudio(): Promise<void> {
    const durationElement = page.locator('[aria-label="Duration"]');
    const durationText = await durationElement.textContent();

    if (!durationText) {
      throw new Error("No duration text found.");
    }

    const [minutes, seconds] = durationText.split(":").map(Number);
    let totalSeconds = minutes * 60 + seconds;
    totalSeconds += 10; // Adding a 10-second buffer

    await page.waitForTimeout(totalSeconds * 1000);
  }

  async loginUser({ user = "" }: { user?: string }): Promise<void> {
    const userLogin = await readFile(`${filePath}/${user}_user.json`);

    await logIn5({
      userData: { username: userLogin["username"], password: "adminadmin" },
    });
    await page.goto(`/`, { waitUntil: "domcontentloaded" });
    await waitForPageTimeout({});

    const locator = `#announcementPopup ${locators.dialog.DIALOG}`;
    const dialogLocator = page.locator(locator);

    if (await dialogLocator.isVisible()) {
      await suiteClick({
        wrapper: "#announcementPopup",
        selector: locators.buttonIcon.CLOSE,
      });
    }
  }

  async reloadProgress(): Promise<void> {
    await this.loginUser({ user: "manager" });
    await callApi({
      endpoint: `/api/dashboard/progress-account/update/`,
      method: "POST",
    });

    await waitApi({
      method: "GET",
      endpoint: `/api/dashboard/progress-account/update/status/`,
      keyword: "status",
      value: 3,
    });
  }

  async verifyApproveRequest(): Promise<void> {
    await suiteExpect({ selector: ".step-result" });
    await suiteClick({
      selector: '[data-qa="btn-approve"]',
      visible: locators.dialog.WARNING,
    });
    await fillTextField({ selector: locators.txtField.NOTE, value: "Play wright test" });
    await waitForPageTimeout({});
    await suiteClick({
      selector: locators.button.CONFIRM,
      visible: '[data-qa="ico-check-circle"]',
    });
  }

  async verifyApprovalResultTab(params: BaseParams): Promise<void> {
    const { content } = params;
    const detail = await getFileAndUserDetails({ content });
    const user = await readFile(`${filePath}/${detail.read_file_user}.json`);

    await suiteGoto({ url: `/dashboard/learning-request/approval-result` });
    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: locators.txtField.SEARCH,
      value: user.username,
      is_enter: true,
    });
    await waitForPageTimeout({});
    await suiteExpect({
      behavior: "text",
      wrapper: locators.fragment.APPROVE_STATUS,
      selector: locators.txt.APPROVE_STATUS,
      value: "Approve",
      isFirstItem: true,
    });
  }

  async verifyMyLibrary(
    params: BaseParams & { status?: string; isMaterial?: boolean }
  ): Promise<void> {
    const { courseType, content, status, isMaterial } = params;
    const statusTextMap = {
      waiting: /Waiting List|อยู่ในรายการรอ/,
      approve: /Waiting for approve|รออนุมัติ/,
      "not-start": /Not start|ยังไม่เริ่ม/,
      "in-progress": /In progress|กำลังดำเนินการ/,
      complete: /Completed|เสร็จสมบูรณ์/,
      enrollform: /Not start|ยังไม่เริ่ม|In Progress|กำลังดำเนินการ/,
      verifying: /Verifying|กำลังตรวจสอบ/,
    };

    // Determine the expected status text based on the provided status or course
    let expectStatusText = statusTextMap[status as keyof typeof statusTextMap];

    if (courseType === "enrollform" && status === "not-start")
      expectStatusText = statusTextMap[courseType];

    // Validate if expectStatusText is found
    if (!expectStatusText) {
      throw new Error(`Invalid status: ${status} or course: ${courseType}`);
    }

    let read_file_content = "";

    const contentMapping: Record<string, string> = {
      "external-video": "exvideo",
      "flash-card": "flashcard",
      "survey-question": "survey-questionaire",
    };

    read_file_content = courseType
      ? `course_${courseType}`
      : contentMapping[content] || content;
    const contentData = await readFile(`${filePath}/${read_file_content}.json`);
    let tabContent = content;
    let contentSearch = contentData.name;

    await suiteGoto({ url: "/profile/library/public-request" });
    if (content && content.includes("survey")) tabContent = "survey";
    else if (content === "exam") tabContent = "test";
    else if (content && content.includes("pathway")) tabContent = "pathway";
    else if (content === "class_program") {
      tabContent = "class";
      contentSearch = contentData[0].nameClass;
    }

    if (isMaterial) {
      await suiteClick({ selector: `[data-qa="tab-submenu-learning-content"]` });
      contentSearch = contentData.name_content;
    } else await suiteClick({ selector: `[data-qa="tab-${tabContent}"]` });
    if (status === "in-progress" || status === "verifying")
      await suiteClick({ selector: ".doing" });
    if (status === "complete") await suiteClick({ selector: ".done" });
    await page.waitForLoadState("load");
    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: locators.txtField.SEARCH,
      value: contentSearch,
      is_enter: true,
    });
    await waitForPageTimeout({ waitTime: 5000 });
    await retrySuiteExpect({
      behavior: "text",
      wrapper: '[data-qa="fragment-card-4"]',
      selector: locators.txt.PROGRESS_STATUS,
      value: expectStatusText,
    });
  }

  async verifyLearnerManagement(params: BaseParams & { tab?: string }): Promise<void> {
    params.tab = params.tab ?? "WAITING";
    const { courseType, content, tab } = params;
    const detail = await getFileAndUserDetails({ courseType, content });
    const contentData = await readFile(`${filePath}/${detail.read_file_content}.json`);
    const user = await readFile(`${filePath}/${detail.read_file_user}.json`);
    let apiContent: string;

    if (content === "class_program") {
      apiContent = "class";
    } else if (content.includes("pathway")) {
      apiContent = "pathway";
    } else {
      apiContent = content;
    }

    const contentID =
      content === "class_program" ? contentData[0].idClass : contentData.id;
    const url =
      content === "class_program"
        ? `/dashboard/class-program/${contentData[0].id}/${apiContent}/${contentID}`
        : `/dashboard/${apiContent}/${contentID}`;

    await this.loginUser({ user: detail.modi_login_user });
    await suiteGoto({ url: `${url}/overall/learner?status=${tab}` });
    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: locators.txtField.SEARCH,
      value: user.username,
      is_enter: true,
    });
    await waitForPageTimeout({});
    await suiteExpect({
      behavior: "text",
      wrapper: locators.fragment.RESULT,
      selector: locators.txt.AMOUNT,
      value: "1",
    });
  }

  async verifyLearnerWaiting(params: BaseParams): Promise<void> {
    const { content, courseType } = params;
    const detail = await getFileAndUserDetails({ content, courseType });
    const contentData = await readFile(`${filePath}/${detail.read_file_content}.json`);
    let apiContent: string;

    if (content === "class_program") {
      apiContent = "class";
    } else if (content.includes("pathway")) {
      apiContent = "pathway";
    } else {
      apiContent = content;
    }

    const contentID =
      content === "class_program" ? contentData[0].idClass : contentData.id;
    const url =
      content === "class_program"
        ? `/dashboard/class-program/${contentData[0].id}/${apiContent}/${contentID}`
        : `/dashboard/${apiContent}/${contentID}`;
    await this.loginUser({ user: detail.modi_login_user });
    await suiteGoto({ url: `${url}/overall/learner/?status=WAITING` });
    await waitForPageTimeout({ waitTime: 5000 });
    await verifyWaitingTab({ content, courseType });
  }

  async verifyWaitingApproveTab(params: BaseParams): Promise<void> {
    const { content } = params;
    const detail = await getFileAndUserDetails({ content });
    const user = await readFile(`${filePath}/${detail.read_file_user}.json`);

    await this.loginUser({ user: detail.modi_login_user });
    await suiteGoto({ url: `/dashboard/learning-request/waiting` });
    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: locators.txtField.SEARCH,
      value: user.username,
      is_enter: true,
    });
    await waitForPageTimeout({});
    await suiteExpect({
      behavior: "text",
      selector: '[data-qa="r1-txt-count-step-complete"]',
      value: "0",
    });
    await suiteExpect({
      behavior: "text",
      selector: '[data-qa="r1-txt-count-step"]',
      value: "1",
    });
    await suiteClick({
      wrapper: locators.buttonIcon.R1,
      selector: '[data-qa="btn-ico-detail"]',
      visible: "#public-request-status",
    });
  }

  async HandleCheckInClass(): Promise<void> {
    await page.waitForLoadState("domcontentloaded");
    // Check if the first version exists
    const isFirstVersion =
      (await page.locator('[data-qa="fragment-checkin-row-1"]').count()) > 0;

    if (isFirstVersion) {
      await handle52Version();
    } else {
      // Check if the second version exists
      const isSecondVersion = (await page.locator('[data-qa="check-in-0"]').count()) > 0;

      if (isSecondVersion) {
        await handle51Version();
      } else {
        console.error("Neither version found.");
      }
    }
  }
}

async function doExamQuestion(): Promise<void> {
  await doFirstSection();
  await waitForPageTimeout({});
  await doSecondSection();
  await waitForPageTimeout({});
  await doThirdSection();
}

async function doFirstSection(): Promise<void> {
  const questionsFirstSection = [
    { question: "โคนิเคิลอยู่ในซอยประดิพัทที่เท่าไหร่", answer: "17" },
    { question: "ปี 2025 โคนิเคิลอายุกี่ปี", answer: "11" },
    { question: "ถ้าจะมาออฟฟิศโคนิเคิล ต้องกดลิฟชั้นไหน", answer: "7" },
    { question: "กล้วย ภาษาอังกฤษคือ", answer: "Banana" },
    { question: "Cat ภาษาไทยเรียกว่า", answer: "แมว" },
    { question: "โคนิเคิลก่อตั้งปีที่เท่าไหร่", answer: "2014" },
  ];

  // Process each question
  for (let index = 1; index <= questionsFirstSection.length; index++) {
    const questionDesc = page.locator(
      `[data-qa="question-${index}"] [data-qa="question-desc"]`
    );
    const textContent = (await questionDesc.textContent()) ?? "";
    const found = questionsFirstSection.find((q) => q.question === textContent);
    if (found) {
      const answer = found?.answer ?? "";
      await fillAnswer({ index, questionText: textContent, answer });
    }
  }

  await suiteClick({ selector: locators.button.NEXT, visible: "#test-section" });
}

async function doSecondSection(): Promise<void> {
  const questionsSecondSection = [
    {
      question: "พระยาพิชัยอะไรหัก",
      answer: "ดาบ",
    },
    {
      question: "คนเราควรกินอาหารกี่หมู่",
      answer: "5 หมู่",
    },
    {
      question: "Orange แปลว่า",
      answer: "สีส้ม",
    },
    {
      question: "มุมฉากมีขนาดเท่าไหร่",
      answer: "90 องศา",
    },
    {
      question: "สัญญาณไฟจราจรสีใด ถึงจะข้ามถนนได้",
      answer: "สีแดง",
    },
  ];
  for (let index = 1; index <= 3; index++) {
    const questionDesc = page.locator(
      `[data-qa="question-${index}"] [data-qa="question-desc"]`
    );
    const textContent = await questionDesc.textContent();
    const found = questionsSecondSection.find((q) => q.question === textContent);
    const answer = found?.answer ?? "";
    await page.getByRole("radio", { name: `${answer}` }).click();
  }
  await suiteClick({ selector: locators.button.NEXT, visible: "#test-section" });
}

async function doThirdSection(): Promise<void> {
  const questionsMinus = [
    {
      question: "5-2",
      answer: "3",
    },
    {
      question: "2-1",
      answer: "1",
    },
  ];

  const questionsPlus = [
    {
      question: "1+1",
      answer: "2",
    },
    {
      question: "2+2",
      answer: "4",
    },
    {
      question: "2+3",
      answer: "5",
    },
  ];
  const question = page.locator(`[data-qa="question-1"] [data-qa="question-desc"]`);
  const textContent = await question.textContent();

  if (textContent === "จงหาผลลบ") {
    // Perform all actions within the if block
    for (let index = 1; index <= questionsMinus.length; index++) {
      const subQuestion = page.locator(
        `[data-qa="subQuest-${index}"] [data-qa="subQuest-desc"]`
      );
      const subTextContent = await subQuestion.textContent(); // renaming to avoid collision with outer textContent
      const found = questionsMinus.find((q) => q.question === subTextContent);
      const answer = found?.answer ?? "";
      // Matching the answer choice
      const question_choice = await matchingAnswerQuestion({ answer });
      // Selecting the answer
      await suiteClick({
        wrapper: `[data-qa="subQuest-${index}"]`,
        selector: '[data-qa="select-answer-group"]',
      });
      await page.getByTestId(`${question_choice}`).nth(1).click();
    }
  } else if (textContent === "จงหาผลบวก") {
    for (let index = 1; index <= questionsPlus.length; index++) {
      const subQuestion = page.locator(
        `[data-qa="subQuest-${index}"] [data-qa="subQuest-desc"]`
      );
      const subTextContent = await subQuestion.textContent(); // renaming to avoid collision with outer textContent
      const found = questionsPlus.find((q) => q.question === subTextContent);
      const answer = found?.answer ?? "";
      // Matching the answer choice
      const question_choice = await matchingAnswerQuestion({ answer });
      // Selecting the answer
      await suiteClick({
        wrapper: `[data-qa="subQuest-${index}"]`,
        selector: '[data-qa="select-answer-group"]',
      });
      await page
        .locator(`.select-answer-group-dropdown [data-qa="${question_choice}"]:visible`)
        .click();
      await page.click("body");
      await waitForPageTimeout({});
    }
  }

  await suiteClick({
    selector: locators.button.SUBMIT,
    visible: `#test-section ${locators.dialog.WARNING}`,
  });
  await suiteClick({
    wrapper: locators.dialog.WARNING,
    selector: locators.button.CONFIRM,
    visible: '[data-qa="test-name"]',
  });

  const button = page.locator(
    `${locators.dialog.DIALOG} [data-qa="btn-congrats-content-dialog-okay-button"]`
  );

  if (await button.isVisible()) {
    await button.click();
  }
}

async function doSurvey({ content }: { content: string }): Promise<void> {
  if (content === "survey-linkert") {
    const get_total_question = await page
      .locator('[data-qa="question-count"]')
      .textContent();
    const total_question = get_total_question ? parseInt(get_total_question) : 0;
    for (let index = 1; index <= total_question; index++) {
      // Generate a random number between 1 and 7
      const randomChild = Math.floor(Math.random() * 7) + 1;
      // Construct the selector with the random child number
      const selector = `[data-qa="question-${index}"] [role="radiogroup"] .el-radio:nth-child(${randomChild})`;
      // Click the randomly selected child
      await suiteClick({ selector });
    }
  } else if (content === "survey-question" || content === "survey-poll") {
    const get_total_question = await page
      .locator('[data-qa="question-count"]')
      .textContent();
    if (get_total_question != "10") throw new Error("Question wrong");
    else {
      await doSurveyRating();
      await doSurveyInput();
      await doSurveyCheckbox();
      await doSurveyDropDown();
    }
  }

  await waitForPageTimeout({});
  await suiteClick({ selector: locators.button.CONFIRM });
  await waitForPageTimeout({});
  await suiteClick({
    selector: '[data-qa="btn-return-to-survey-detail"]',
    visible: '[data-qa="btn-survey-already-taken"]',
  });
}

async function doSurveyRating(): Promise<void> {
  for (let i = 2; i < 5; i++) {
    await suiteClick({
      wrapper: `[data-qa="question-${i}"]`,
      selector: `[data-qa="${i}"]`,
    });
  }
}

async function doSurveyDropDown(): Promise<void> {
  await suiteClick({
    wrapper: '[data-qa="question-8"]',
    selector: '[data-qa="question-dropdown"]',
    dropdown_selector: '[data-qa="answer-3"]',
  });
}

async function doSurveyInput(): Promise<void> {
  const questions = [
    {
      wrapper: '[data-qa="question-5"]',
      selector: `${locators.question.NUBMER} input`,
      value: "5",
    },
    {
      wrapper: '[data-qa="question-9"]',
      selector: '[data-qa="question-text-input"] input',
      value: "สั้นๆ",
    },
    {
      wrapper: '[data-qa="question-10"]',
      selector: `${locators.question.NUBMER} input`,
      value: "10",
    },
  ];

  for (const question of questions) {
    await fillTextField(question);
  }
}

async function doSurveyCheckbox(): Promise<void> {
  const actions = [
    {
      wrapper: '[data-qa="question-6"]',
      selector: '[data-qa="checkbox-group-question-checkedbox"] [data-qa]:nth-child(1)',
    },
    {
      wrapper: '[data-qa="question-7"]',
      selector: '[data-qa="radio-group-question-radio"] [data-qa]:nth-child(1)',
    },
  ];

  for (const action of actions) {
    await suiteClick(action);
  }
}

async function fillAnswer(params: AnswerParams): Promise<void> {
  const { index, questionText, answer } = params;
  const isTextQuestion =
    questionText === "Cat ภาษาไทยเรียกว่า" || questionText === "กล้วย ภาษาอังกฤษคือ";
  const inputSelector = isTextQuestion
    ? locators.input.ANSWER
    : '[data-qa="input-number"]';

  await fillTextField({
    wrapper: `[data-qa="question-${index}"]`,
    selector: inputSelector,
    value: answer,
  });
}

async function getFileAndUserDetails(params: BaseParams): Promise<any> {
  const { content, courseType } = params;
  // Default values for read_file_user and modi_login_user
  let read_file_user = "standuser_user";
  let modi_login_user = "standmanager";
  let read_file_content = `${content}`;

  // Check for special conditions where we need to override default values
  if (courseType || content === "course") {
    read_file_content = `course_${courseType}`;
    read_file_user = "user_user";
    modi_login_user = "manager";
  } else if (
    content === "class_program" ||
    content === "pathway_duration" ||
    content === "pathway_schedule"
  ) {
    read_file_user = "user_user";
    modi_login_user = "manager";
  }

  // Final values for read_file_user, modi_login_user, and read_file_content are already set above

  const contentMapping: Record<string, string> = {
    "external-video": "exvideo",
    "flash-card": "flashcard",
  };

  read_file_content = contentMapping[content] || read_file_content;
  return { read_file_content, read_file_user, modi_login_user };
}

async function matchingAnswerQuestion(params: QuestionParams): Promise<void> {
  const { answer } = params;
  for (let index = 1; index < 6; index++) {
    const test = await page
      .locator(`[data-qa="answer-${index}"] [data-qa="answer-desc"]`)
      .textContent();
    const convertString = test ? test.trim() : "";
    if (convertString === answer) {
      const choice_index = {
        1: "a",
        2: "b",
        3: "c",
        4: "d",
        5: "e",
      };
      const question_choice = choice_index[index] ?? null;
      return question_choice;
    }
  }
}

async function verifyWaitingTab(params: BaseParams): Promise<void> {
  const { content, courseType } = params;
  const detail = await getFileAndUserDetails({ content, courseType });
  const user = await readFile(`${filePath}/${detail.read_file_user}.json`);

  await fillTextField({
    wrapper: locators.fragment.SEARCH,
    selector: locators.txtField.SEARCH,
    value: user.username,
    is_enter: true,
  });
  await waitForPageTimeout({});
  await suiteExpect({
    behavior: "text",
    wrapper: locators.fragment.RESULT,
    selector: locators.txt.AMOUNT,
    value: "1",
  });
}

async function handle52Version(): Promise<void> {
  await suiteClick({
    wrapper: '[data-qa="fragment-checkin-row-1"]',
    selector: '[data-qa="ico-check-1"]',
    isFirstItem: true,
  });
  await page.click('button:has-text("Submit")');

  const dialogs = page.locator('div[data-qa="dialog-warning"]');

  // Iterate over each dialog and check if it's visible
  for (let i = 0; i < (await dialogs.count()); i++) {
    const dialog = dialogs.nth(i);

    // Check if the dialog is visible (not `display: none`)
    const isVisible = await dialog.evaluate((element) => {
      return window.getComputedStyle(element).display !== "none";
    });

    // If the dialog is visible, find and click the confirm button inside it
    if (isVisible) {
      const confirmButton = dialog.locator('[data-qa="btn-confirm"]');
      await confirmButton.click();
    }
  }

  const targetSelector = page.locator(
    '[data-qa="fragment-checkin-row-1"] [data-qa="ico-check-circle"]'
  );
  const count = await targetSelector.count();
  if (count === 0) {
    console.error("Error checkin class");
  }
}

async function handle51Version(): Promise<void> {
  await suiteClick({
    selector: '[data-qa="check-in-0"]',
    isFirstItem: true,
  });

  await waitForPageTimeout({});
  await suiteClick({
    wrapper: locators.dialog.DIALOG,
    selector: locators.button.CONFIRM,
    isFirstItem: true,
  });
}
