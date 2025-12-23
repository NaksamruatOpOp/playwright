import {
  callApi,
  closeNewsDialog,
  expect,
  page,
  readFile,
  test,
  waitForPageTimeout,
  writeFile,
} from "../../../utils/commands";
import { locators } from "../../../utils/locator";
import { fillTextField, suiteClick, suiteExpect } from "../../../utils/page_actions";

import { suiteGoto } from "../../../utils/page_goto";
import { verifylogIn5 } from "../../login/base/baseLogin";
import { CentralPage } from "./centralPage";
import {
  ContentGamiOptions,
  EditOptions,
  NavigationOptions,
  PublishOptions,
  VerifyCriteriaContentOptions,
  VerifyGamiContentOptions,
} from "../interfaces/gami.interface";

export { filePath, material_in_class, page, test, verifylogIn5 };

const material_in_class = ["article", "document", "audio", "exam"];
const filePath = "data/gami";
const TODAY = new Date();
const time = `${TODAY.getHours()}:${TODAY.getMinutes()}:${TODAY.getSeconds()}`;
const contentPoint = "500";
const centralPage = new CentralPage();

export class GamiPage {
  async addGamiContent({ content = "" }: ContentGamiOptions): Promise<void> {
    await addCriteria({ content });
    await addAchievement();
    await verifySummary({});
  }

  async editGamiContent({ content = "" }: ContentGamiOptions): Promise<void> {
    await editCriteria({ content });
    await editAchievement();
    await verifySummary({ isEdit: true });
  }

  async checkinClass(): Promise<void> {
    const { 0: classData } = await readFile(`${filePath}/class_program.json`);
    const user = await readFile(`${filePath}/user.json`);
    const classID = classData.idClass;

    await verifylogIn5({});
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

  async checkUserExist(): Promise<void> {
    let attempt = 0;
    let userFound = false;
    const maxAttempts = 5;
    const random = Math.floor(Math.random() * 10000) + 1;
    const codeUser = `gamiUser${random}`;

    // Check if the user exists in the system
    while (attempt < maxAttempts && !userFound) {
      const response = await callApi({
        endpoint: `/api/om/dashboard/account?search=${codeUser}`,
        method: "GET",
      });

      if (Array.isArray(response) && response.length > 0) {
        const write_data = {
          id: response[0].id,
          username: response[0].username,
          pass: "adminadmin",
          code: response[0].code,
        };

        // Write user data to file if found
        await writeFile({ filePath: `${filePath}/user.json`, data: write_data });
        userFound = true; // Mark that the user is found
      } else {
        // If the user isn't found, import the user
        await createAccount({ codeUser });

        // Wait for 5 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Increment the attempt counter
        attempt++;
      }
    }

    // If the user is not found after maxAttempts, throw an error
    if (!userFound) {
      throw new Error("User not found after 5 attempts.");
    }
  }

  async deleteGami({ isContent = false }: { isContent?: boolean }): Promise<void> {
    // Click on the delete button and confirm the action
    await suiteClick({
      wrapper: locators.buttonIcon.R1,
      selector: locators.buttonIcon.DELETE,
      visible: ".btn-confirm",
    });
    await suiteClick({ selector: ".btn-confirm" });

    // Set the appropriate wrapper and selector based on the value of isContent
    const wrapperSelector = isContent
      ? locators.fragment.TOTAL
      : locators.fragment.RESULT;
    const amountSelector = locators.txt.AMOUNT;

    // Verify the amount is 0 in the appropriate section
    await suiteExpect({ wrapper: wrapperSelector, selector: amountSelector, value: 0 });
  }

  async enrollContent(): Promise<void> {
    await suiteClick({ selector: locators.button.ENROLL });
    await waitForPageTimeout({});
    const buttonLocator = page.locator('[data-qa="btn-confirm-to-enroll"]');
    const count = await buttonLocator.count();
    if (count > 0) {
      await buttonLocator.click();
    }
    await suiteClick({
      wrapper: locators.dialog.WARNING,
      selector: locators.button.CONFIRM,
    });
    await waitForPageTimeout({});
    await suiteExpect({
      behavior: "text",
      wrapper: locators.button.ENROLL,
      selector: locators.txt.BUTTON,
      value: /Start Learning|เริ่มเรียน|Enrolled|Continue Learning/,
    });
  }

  async gotoCriteriaContent({ content = "" }: ContentGamiOptions): Promise<void> {
    // Read the content data from the file
    const contentData = await readFile(`${filePath}/${content}.json`);
    let path = "";
    let courseID: string, classProgramID: string, classID: string, pathwayID: string;

    // Determine the path based on content type
    switch (content) {
      case "course":
        courseID = contentData.id;
        path = `/dashboard/course/${courseID}/gamification`;
        break;

      case "class_program":
        classProgramID = contentData[0].id;
        classID = contentData[0].idClass;
        path = `/dashboard/class-program/${classProgramID}/class/${classID}/gamification/`;
        break;

      case "pathway":
        pathwayID = contentData.id;
        path = `/dashboard/pathway/${pathwayID}/gamification`;
        break;

      default:
        throw new Error(`Unknown content type: ${content}`);
    }

    await suiteGoto({ url: path, visible: locators.buttonCreate.CHANLLENGE });
  }

  async gotoGamiMenu(section: string): Promise<void> {
    const sections: Record<string, NavigationOptions> = {
      criteria: {
        path: "/dashboard/gamification/criteria",
        waitApi: "/api/engagement/dashboard/criteria",
        selector: "#gamification-criteria-index",
      },
      achievement: {
        path: "/dashboard/gamification/achievement",
        waitApi: "/api/engagement/dashboard/achievement",
        selector: "#gamification-achievement-list",
      },
      point: {
        path: "/dashboard/gamification/point-management",
        waitApi: "/api/engagement/dashboard/point-budget",
        selector: "#gamification-point-management-list",
      },
    };

    const { path, waitApi, selector } = sections[section];

    await suiteGoto({ url: path, waitApi });
    await suiteExpect({ selector });
  }

  async gotoContent({ content = "" }: ContentGamiOptions): Promise<void> {
    // Read the content data from the file
    const contentData = await readFile(`${filePath}/${content}.json`);
    let path = "";
    let courseID: string, classProgramID: string, classID: string, pathwayID: string;

    // Determine the path based on content type
    switch (content) {
      case "course":
        courseID = contentData.id;
        path = `/course/${courseID}/`;
        break;

      case "class_program":
        classProgramID = contentData[0].id;
        classID = contentData[0].idClass;
        path = `/class-program/${classProgramID}/class/${classID}/`;
        break;

      case "pathway":
        pathwayID = contentData.id;
        path = `/pathway/${pathwayID}`;
        break;

      default:
        throw new Error(`Unknown content type: ${content}`);
    }

    await suiteGoto({ url: path, visible: locators.button.ENROLL });
  }

  async learnClass(): Promise<void> {
    await suiteClick({
      selector: '[data-qa="tab-curriculum"]',
      visible: '[data-qa="section-1"]',
    });
    await suiteClick({
      wrapper: '[data-qa="section-1"] [data-qa="material-1"]',
      selector: '[data-qa="btn-action"]',
    });
    await waitForPageTimeout({});

    for (const [index, material] of material_in_class.entries()) {
      switch (material) {
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
          break;
        case "exam":
          await centralPage.handleExam();
          break;
        default:
          console.log("No specific content type found.");
          break;
      }
      if (index < material_in_class.length - 1) {
        await suiteClick({
          wrapper: '[data-qa="section-1"]',
          selector: `[data-qa="material-${index + 2}"]`,
        });
      }
    }
  }

  async learnCourse({
    is_first_item = false,
    content = "",
    section = "",
  }): Promise<void> {
    const materialSlots = {
      article: 1,
      document: 2,
      audio: 3,
      exam: 4,
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
    const section_open = page.locator(
      `${locators.section.MATERIAL} [data-qa="section-${section}"]`
    );
    const isOpened = await section_open.evaluate((el) => el.classList.contains("opened"));

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
      default:
        console.log("No specific content type found.");
        break;
    }

    await suiteExpect({
      wrapper: `[data-qa="section-${section}"] [data-qa="material-${slot}"]`,
      selector: '[data-qa="ico-check"]',
    });
  }

  async learnPathway(): Promise<void> {
    const wrapper = ".progress-path-navigator-bar";

    await suiteClick({
      selector: locators.button.ENROLL,
      visible: "#pathway-detail-curriculum",
    });
    await suiteClick({
      selector: '[data-qa="ico-list"]',
    });

    const notShowCard =
      (await page.locator('[data-qa="section-content-list"]').count()) > 0;
    if (notShowCard) {
      await waitForPageTimeout({ waitTime: 3000 });
      await suiteClick({ selector: '[data-qa="btn-pathway-overview"]' });
    }
    await waitForPageTimeout({ waitTime: 3000 });
    await suiteClick({ selector: '[data-qa="card-material-1"]' });
    await waitForPageTimeout({ waitTime: 5000 });
    await centralPage.handleArticle();
    await suiteClick({
      selector: locators.ico.CHRIGHT,
      wrapper,
      visible: "div #learning-material-document-detail",
    });
    await centralPage.handleDocument();
    await suiteClick({
      selector: locators.ico.CHRIGHT,
      wrapper,
      visible: "div #learning-material-audio-detail",
    });
    await suiteClick({
      selector: locators.button.ENROLL,
      visible: "div #learning-material-audio-detail",
    });

    const totalSeconds = 50;

    await page.waitForTimeout(totalSeconds * 1000);
    await suiteClick({
      selector: locators.ico.CHRIGHT,
      wrapper,
      visible: "#test-detail-page",
    });
    await centralPage.handleExam();
  }

  async manageAchievement(mode: "create" | "edit"): Promise<void> {
    const rand = Math.floor(Math.random() * 100);
    const name = `${
      mode === "create" ? "Playwright Regress" : "Edit Playwright Regress"
    }${rand}-${time}`;
    const code = `AC-${time}`;
    const desc = `${
      mode === "create" ? "Playwright test regress" : "Edit Playwright test regress"
    }`;
    const point = mode === "create" ? "5000" : "10000";

    // Determine the correct button action and page verification
    if (mode === "create") {
      await suiteClick({
        selector: locators.buttonCreate.ACHIEVEMENT,
        visible: "#gamification-achievement-create",
      });
    } else {
      await suiteClick({
        wrapper: locators.buttonIcon.R1,
        selector: locators.buttonIcon.EDIT,
        visible: "#gamification-achievement-detail",
      });
    }

    // Fill the form fields
    await fillTextField({ selector: locators.txtField.NAME, value: name });
    await fillTextField({ selector: locators.txtField.CODE, value: code });
    await fillTextField({ selector: locators.txtField.DESC, value: desc });
    await fillTextField({
      selector: `${locators.input.NUMBER} input`,
      value: point,
      is_enter: true,
    });

    // Additional action for 'edit' mode
    if (mode === "edit") {
      await suiteClick({ selector: ".el-switch" });
    }

    // Save the changes
    await suiteClick({
      selector: locators.buttonSave.BACK,
      visible: '[data-qa="achievement-table"]',
    });

    // Write data to file
    const write_data = { name, code, point };
    await writeFile({ filePath: `${filePath}/achievement.json`, data: write_data });
  }

  async managePoint(mode: "create" | "edit"): Promise<void> {
    const rand = Math.floor(Math.random() * 100);
    const name = `${
      mode === "create" ? "Pointplay Regress" : "Edit Pointplay Regress"
    }${rand}-${time}`;
    const desc = `${
      mode === "create" ? "Playwright test regress" : "Edit Playwright test regress"
    }`;
    const point = mode === "create" ? "5000" : "20000";
    const taskPoint = "10000";

    // Determine the correct button action and page verification
    if (mode === "create") {
      await suiteClick({
        selector: locators.buttonCreate.ACHIEVEMENT,
        visible: "#gamification-achievement-create",
      });
    } else {
      await suiteClick({
        wrapper: locators.buttonIcon.R1,
        selector: locators.buttonIcon.EDIT,
        visible: "#gamification-point-budget-detail",
      });
    }

    // Fill the form fields
    await fillTextField({ selector: locators.txtField.NAME, value: name });
    await fillTextField({ selector: locators.txtField.DESC, value: desc });
    await fillTextField({
      selector: `${locators.input.NUMBER} input`,
      value: point,
      is_enter: true,
    });

    if (mode === "edit") {
      const startDate = await formatDate(TODAY);
      const endDate = await formatDate(new Date(TODAY.setMonth(TODAY.getMonth() + 1))); // 1 month after
      const expireDate = await formatDate(new Date(TODAY.setDate(TODAY.getDate() + 1))); // 1 day after end date

      await suiteClick({
        wrapper: '[data-qa="form-item-budget-period"]',
        selector: '[data-qa="set-expire-date"]',
      });
      await fillTextField({
        selector: '[placeholder="Start date"]',
        value: startDate,
        is_enter: true,
      });
      await fillTextField({
        selector: '[placeholder="End date"]',
        value: endDate,
        is_enter: true,
      });
      await suiteClick({
        wrapper: '[data-qa="form-item-redemption-expire"]',
        selector: '[data-qa="set-expire-date"]',
      });
      await fillTextField({
        selector: '[placeholder="Expire Date"]',
        value: expireDate,
        is_enter: true,
      });
      await suiteClick({
        selector: locators.buttonCreate.NEW,
        visible: '[data-qa="form-item-select-type"]',
      });
      await fillTextField({
        wrapper: '[data-qa="form-dialog"]',
        selector: `${locators.input.NUMBER} input`,
        value: taskPoint,
        is_enter: true,
      });
      await suiteClick({ selector: locators.button.ADD });
    }
    // Save the changes
    await suiteClick({
      selector: locators.buttonSave.BACK,
      visible: "#gamification-point-management-list",
    });

    // Write data to file
    const write_data = { name, point, taskPoint };
    await writeFile({ filePath: `${filePath}/point.json`, data: write_data });
  }

  async reviewContent(): Promise<void> {
    const buttonLocator = page.locator(
      '[data-qa="btn-congrats-content-dialog-okay-button"]'
    );
    const count = await buttonLocator.count();
    if (count > 0) {
      await buttonLocator.click();
    }
    await suiteClick({
      selector: '[data-qa="tab-info"]',
      visible: '[data-qa="comment-review"]',
    });
    await suiteClick({
      wrapper: '[data-qa="comment-review"]',
      selector: locators.button.CREATE,
      visible: '[data-qa="form-dialog"]',
    });
    await suiteClick({
      wrapper: '[data-qa="form-item-rating"]',
      selector: '[data-qa="rating"] :nth-child(5)',
    });
    await fillTextField({
      selector: '[data-qa="txt-field-comment"]',
      value: "playwright review",
    });
    await suiteClick({ selector: locators.button.SUBMIT });
    await page.reload();
    await suiteExpect({ selector: '[data-qa="fragment-review-list"]', timeout: 10000 });
  }

  async searchAchievement({ isPublic = false }: PublishOptions): Promise<void> {
    const achievementData = await readFile(`${filePath}/achievement.json`);

    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: locators.txtField.SEARCH,
      value: achievementData.name,
      is_enter: true,
    });
    await page.waitForLoadState("networkidle");
    await suiteExpect({
      wrapper: locators.fragment.RESULT,
      selector: locators.txt.AMOUNT,
      value: 1,
    });
    await suiteExpect({
      wrapper: locators.row1.ACHIEVEMENT,
      selector: locators.row1.ACHIEVEMENT,
      value: achievementData.name,
    });
    await suiteExpect({
      wrapper: '[data-qa="r1-txt-code"]',
      selector: '[data-qa="r1-txt-code"]',
      value: achievementData.code,
    });
    await suiteExpect({
      selector: '[data-qa="r1-maximum-point"]',
      value: achievementData.point,
    });

    const element = page.locator('[data-qa="r1-ico-publish"]');
    const className = await element.getAttribute("class");

    if (isPublic) expect(className).toContain("text-green");
    else expect(className).not.toContain("text-green");
  }

  async searchCriteria({ isPublic = false }: PublishOptions): Promise<void> {
    const search_data = ["enroll", "30", "50", "80", "completed", "review"];
    for (const item of search_data) {
      await fillTextField({
        wrapper: locators.fragment.SEARCH,
        selector: locators.txtField.SEARCH,
        value: item,
        is_enter: true,
      });
      await page.waitForLoadState("networkidle");
      await suiteExpect({
        wrapper: locators.fragment.RESULT,
        selector: locators.txt.AMOUNT,
        value: 1,
      });
      await suiteExpect({
        behavior: "text",
        wrapper: '[qa="r1-txt-achievement"]',
        selector: '[data-qa="text-wrapper"]',
        value: item,
      });
      const element = page.locator('[data-qa="switch-allow-criteria"]');
      let className = await element.getAttribute("class"); // Get initial class attribute

      if (!isPublic && className && className.includes("is-check")) {
        await element.click();
        className = await element.getAttribute("class");
        expect(className).not.toContain("is-check");
        continue; // Return early to avoid unnecessary "do nothing" else block
      }

      if (isPublic && className && !className.includes("is-check")) {
        await element.click();
        className = await element.getAttribute("class");
        expect(className).toContain("is-check");
        continue; // Return early to avoid unnecessary "do nothing" else block
      }

      console.log("do nothing");
    }
  }

  async searchPoint({ isEdit = false }: EditOptions): Promise<void> {
    const pointData = await readFile(`${filePath}/point.json`);
    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: locators.txtField.SEARCH,
      value: pointData.name,
      is_enter: true,
    });
    await suiteExpect({
      wrapper: locators.fragment.RESULT,
      selector: locators.txt.AMOUNT,
      value: 1,
    });
    await suiteExpect({
      wrapper: '[data-qa="r1-txt-point-budget"]',
      selector: locators.txt.NAME,
      value: pointData.name,
    });
    await suiteExpect({
      selector: '[data-qa="txt-total_budget"]',
      value: pointData.point,
    });
    await suiteExpect({
      selector: '[data-qa="txt-balance_allocation"]',
      value: pointData.point,
    });
    if (isEdit)
      await suiteExpect({
        selector: '[data-qa="txt-total_allocated"]',
        value: pointData.taskPoint,
      });
  }

  async settingCourseReview(): Promise<void> {
    const courseData = await readFile(`${filePath}/course.json`);
    const courseID = courseData.id;
    await callApi({
      endpoint: `/api/dashboard/course/${courseID}/setting/review/`,
      method: "PATCH",
      body: { is_review: true },
    });
  }

  async verifyContentManagement(): Promise<void> {
    await suiteClick({
      selector: '[data-qa="breadcrumb-2"]',
      visible: locators.panelCard.GAMI,
    });
    await suiteExpect({
      wrapper: locators.panelCard.GAMI,
      selector: '[data-qa="total-point"]',
      value: contentPoint,
    });
    await suiteExpect({
      wrapper: locators.panelCard.GAMI,
      selector: '[data-qa="total-challenge"]',
      value: 1,
    });
  }

  async verifyCriteriaContent({
    content = "",
    isPublic = false,
  }: VerifyCriteriaContentOptions): Promise<void> {
    // Click on the create challenge button and the first criteria
    await suiteClick({
      selector: locators.buttonCreate.CHANLLENGE,
      visible: locators.criteria.CRITERIA,
    });
    await suiteClick({ selector: locators.criteria.CRITERIA });

    // Determine the count based on the content type
    const count = content === "course" ? 6 : 5;

    // Iterate over the checkbox elements and verify their class based on isPublic flag
    for (let i = 1; i <= count; i++) {
      const element = page.locator(`[data-qa="checkbox-criteria-1-${i}"]`);
      const className = await element.getAttribute("class");

      // Assert if the class 'is-disabled' is present or not based on isPublic flag
      if (isPublic) {
        expect(className).not.toContain("is-disabled");
      } else {
        expect(className).toContain("is-disabled");
      }
    }
  }

  async verifyGamiContent({
    content = "",
    isEdit = false,
  }: VerifyGamiContentOptions): Promise<void> {
    const achievementData = await readFile(`${filePath}/achievement.json`);
    const count = content === "course" ? 6 : 5;
    const expectPoint = isEdit ? "1000" : contentPoint;
    const elements = await page.locator('[data-qa="txt-criteria-name"]').all();

    // Assert that the number of elements matches the expected count
    const expect_count = isEdit ? count - 1 : count;
    expect(elements.length).toBe(expect_count);

    await suiteExpect({
      selector: locators.row1.ACHIEVEMENT_NAME,
      value: achievementData.name,
    });
    await suiteExpect({ selector: locators.row1.POINT, value: expectPoint });
  }

  async verifyMyplay({
    progress = "",
    content = "",
  }: {
    progress?: string;
    content: string;
  }): Promise<void> {
    const contentData = await readFile(`${filePath}/${content}.json`);
    const countAchievement = progress === "inprogress" ? 0 : 1;
    const expectPoint = progress === "inprogress" ? 0 : contentPoint;
    const contentName =
      content === "class_program" ? contentData[0].codeClass : contentData.code;

    await suiteGoto({
      url: "/profile/point-gamification",
      visible: ".gamification-my-play",
    });
    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: locators.txtField.SEARCH,
      value: contentName,
      is_enter: true,
    });
    await suiteExpect({
      selector: '[data-qa="count-challenge"]',
      value: countAchievement,
      timeout: 60000,
    });
    await suiteExpect({ selector: '[data-qa="txt-count-point"]', value: expectPoint });
    await suiteExpect({
      selector: '[data-qa="txt-count-achievement"]',
      value: countAchievement,
    });
  }

  async verifyPointUser({ isLearn = false }: { isLearn?: boolean }): Promise<void> {
    await loginUserGami();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForPageTimeout({});
    await closeNewsDialog();
    await suiteClick({ selector: locators.button.PROFILE });

    const locator = page.locator('[data-qa="fragment-points"] [data-qa="txt-value"]');
    await locator.waitFor({ state: "visible" });
    await waitForPageTimeout({});

    const userPoint = await locator.textContent();

    if (userPoint !== null) {
      if (!isLearn) {
        await saveUserPoint(userPoint);
      } else {
        await attemptPointVerification();
      }
    }
  }

  async verifyWebGamiContent({ content = "" }: ContentGamiOptions): Promise<void> {
    const contentData = await readFile(`${filePath}/${content}.json`);
    const achievementData = await readFile(`${filePath}/achievement.json`);
    const count = content === "course" ? 6 : 5;
    let courseID: string,
      classProgramID: string,
      classID: string,
      pathwayID: string,
      path: string;
    switch (content) {
      case "course":
        courseID = contentData.id;
        path = `/course/${courseID}`;
        break;
      case "class_program":
        classProgramID = contentData[0].id;
        classID = contentData[0].idClass;
        path = `/class-program/${classProgramID}/class/${classID}/`;
        break;
      case "pathway":
        pathwayID = contentData.id;
        path = `/pathway/${pathwayID}`;
        break;

      default:
        throw new Error(`Unknown content type: ${content}`);
    }

    await suiteGoto({ url: path, visible: locators.fragment.PLAY_BOX });
    await suiteExpect({
      wrapper: locators.fragment.PLAY_BOX,
      selector: '[data-qa="txt-total-challenge"]',
      value: 1,
    });
    await suiteExpect({
      wrapper: locators.fragment.PLAY_BOX,
      selector: locators.txt.TOTAL_ACHIEVEMENT,
      value: 1,
    });
    await suiteExpect({
      wrapper: locators.fragment.PLAY_BOX,
      selector: locators.txt.POINT,
      value: contentPoint,
    });
    await suiteClick({
      selector: locators.fragment.PLAY_BOX,
      visible: '[data-qa="dialog-gamification-challenge"] [data-qa="dialog"]',
    });
    await suiteExpect({
      wrapper: '[data-qa="gamification-challenge-item"]',
      selector: locators.txt.TOTAL_ACHIEVEMENT,
      value: 1,
      timeout: 60000,
    });
    await suiteExpect({
      wrapper: '[data-qa="gamification-challenge-item"]',
      selector: locators.txt.POINT,
      value: contentPoint,
    });
    await suiteExpect({
      wrapper: locators.fragment.ACHIEVEMENT1,
      selector: '[data-qa="achievemnt-name"]',
      value: achievementData.name,
    });
    await suiteExpect({
      wrapper: locators.fragment.ACHIEVEMENT1,
      selector: '[data-qa="txt-achievement-point"]',
      value: contentPoint,
    });

    for (let i = 1; i <= count; i++) {
      await suiteExpect({ selector: `[data-qa="txt-criteria-${i}"]` });
    }
    await suiteClick({ selector: locators.buttonIcon.CLOSE });
  }
}

async function addCriteria({ content = "" }: ContentGamiOptions): Promise<void> {
  await suiteClick({
    selector: locators.buttonCreate.CHANLLENGE,
    visible: locators.criteria.CRITERIA,
  });
  await suiteClick({ selector: locators.criteria.CRITERIA });

  // Determine the count based on the content type
  const count = content === "course" ? 6 : 5;

  // Iterate over the checkbox elements and verify their class based on isPublic flag
  for (let i = 1; i <= count; i++) {
    await suiteClick({ selector: `[data-qa="checkbox-criteria-1-${i}"]` });
  }
  await suiteClick({
    wrapper: locators.fragment.CRITERIA,
    selector: locators.button.NEXT,
    visible: '[data-qa="gamification-challenge-achievement"]',
  });
}

async function editCriteria({ content = "" }: ContentGamiOptions): Promise<void> {
  const count = content === "course" ? 6 : 5;

  await suiteClick({
    wrapper: locators.criteria.CRITERIA,
    selector: '[data-qa="btn-ico-edit"]',
    visible: locators.criteria.CRITERIA,
  });
  await suiteClick({ selector: '[data-qa="criteria-1-type-name"]' });
  await waitForPageTimeout({});
  await suiteClick({ selector: `[data-qa="checkbox-criteria-1-${count}"]` });
  await suiteClick({
    wrapper: locators.fragment.CRITERIA,
    selector: locators.button.NEXT,
    visible: '[data-qa="gamification-challenge-achievement"]',
  });
}

async function transformString(input: string): Promise<string> {
  // Convert the string to lowercase
  let transformed = input.toLowerCase();

  // Replace spaces with hyphens
  transformed = transformed.replace(/\s+/g, "-");

  // Replace colon (:) with hyphen (-)
  transformed = transformed.replace(/:/g, "-");

  // Add the prefix "option-" to the string
  transformed = "option-" + transformed;

  return transformed;
}

async function addAchievement(): Promise<void> {
  const achievementData = await readFile(`${filePath}/achievement.json`);
  await suiteClick({ selector: '[data-qa="select-achievement-name"]' });
  const option_locator = await transformString(achievementData.name);
  await suiteClick({ selector: `[data-qa="${option_locator}"]` });
  await waitForPageTimeout({});
  await fillTextField({
    selector: `${locators.input.NUMBER} input`,
    value: contentPoint,
    is_enter: true,
  });
  await suiteClick({
    wrapper: locators.fragment.ACHIEVEMENT,
    selector: locators.button.NEXT,
    visible: '[data-qa="fragment-summary"]',
  });
}

async function editAchievement(): Promise<void> {
  await fillTextField({
    selector: `${locators.input.NUMBER} input`,
    value: "1000",
    is_enter: true,
  });
  await suiteClick({
    wrapper: locators.fragment.ACHIEVEMENT,
    selector: locators.button.NEXT,
    visible: '[data-qa="fragment-summary"]',
  });
}

async function getPointValue(): Promise<string> {
  const selector = page.locator('[data-qa="fragment-points"] [data-qa="txt-value"]');
  const actualValue = await selector.textContent();

  // Return an empty string or handle error if actualValue is null
  if (actualValue === null) {
    throw new Error("Point value is not found");
  }

  return actualValue.replace(/,/g, "");
}

async function saveUserPoint(userPoint: string): Promise<void> {
  const writeData = {
    point_user: userPoint,
  };
  await writeFile({ filePath: `${filePath}/user_point.json`, data: writeData });
}

async function verifySummary({ isEdit = false }: EditOptions): Promise<void> {
  const achievementData = await readFile(`${filePath}/achievement.json`);
  const expectPoint = isEdit ? "1000" : contentPoint;
  await suiteExpect({
    selector: locators.row1.ACHIEVEMENT_NAME,
    value: achievementData.name,
  });
  await suiteExpect({ selector: locators.row1.POINT, value: expectPoint });
  await suiteClick({
    selector: locators.button.DONE,
    visible: locators.criteria.CRITERIA,
  });
}

async function attemptPointVerification(): Promise<void> {
  const pointData = await readFile(`${filePath}/user_point.json`);
  const cleanedUserPoint = pointData.point_user.replace(/,/g, "");
  const expectedPoint = String(Number(cleanedUserPoint) + Number(contentPoint));
  let attempt = 0;

  while (attempt < 5) {
    await page
      .locator('[data-qa="fragment-points"] [data-qa="txt-value"]')
      .waitFor({ state: "visible" });
    await waitForPageTimeout({});

    const actualValue = await getPointValue();
    console.log("actual", actualValue);
    console.log("expected", expectedPoint);

    if (actualValue === expectedPoint) {
      console.log("Expected value matches!");
      break;
    }

    console.log(`Attempt ${attempt + 1} failed. Retrying...`);
    await retryLoginAndPageReload();

    attempt++;

    if (attempt === 5) {
      throw new Error(
        `Failed to verify point after 5 attempts. Expected value: ${expectedPoint}, Actual value: ${actualValue}`
      );
    }
  }
}

async function formatDate(date: any): Promise<any> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function createAccount({ codeUser }: { codeUser: string }): Promise<void> {
  let user_id: string;
  const image = await getDefaultImage();
  const password = "adminadmin";
  const phone = "1234567890";
  const id_card = "1234567890123";
  const address = "Test Address";
  const date_birth = "1996-10-24T00:00:00.000Z";
  const date_start = "2023-11-01T00:00:00.000Z";
  const code = codeUser;
  const body = {
    image: image.image,
    image_url: image.image_url,
    email: `${code}@conicle.com`,
    phone_country_code: "+66",
    phone_phone_number: phone,
    code,
    username: code,
    password: password,
    confirm_password: password,
    id_card: id_card,
    title: "Mr.",
    first_name: code,
    middle_name: "Middle",
    last_name: "Automate",
    gender: 1,
    address: address,
    date_birth: date_birth,
    date_start: date_start,
    is_active: true,
  };

  const response = await callApi({
    endpoint: "/api/om/dashboard/account",
    method: "POST",
    body,
    retry: 1,
  });

  user_id = response["id"];

  const body_role = {
    account_id: user_id,
  };
  await callApi({
    endpoint: "/api/om/dashboard/role/1/member",
    method: "POST",
    body: body_role,
    retry: 1,
  });
}

async function getDefaultImage(): Promise<any> {
  const expectImage = "default_01";
  const response = await callApi({
    endpoint: "/api/om/dashboard/account/avatar/5",
    method: "GET",
    retry: 1,
  });
  const imageData = await response["image_list"].find((item) =>
    item.image.includes(expectImage)
  );

  return imageData;
}

async function loginUserGami(): Promise<void> {
  const userLogin = await readFile(`${filePath}/user.json`);
  await verifylogIn5({
    userData: { username: userLogin["username"], password: "adminadmin" },
  });
}

async function retryLoginAndPageReload(): Promise<void> {
  await waitForPageTimeout({ waitTime: 5000 }); // Wait for 5 seconds before retrying
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await loginUserGami();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForPageTimeout({});
  await closeNewsDialog();
  await suiteClick({ selector: locators.button.PROFILE });
}
