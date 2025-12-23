import {
  callApi,
  checkDuplicate,
  generateRandomValue,
  page,
  readFile,
  readJSONFiles,
  suiteGoto,
  test,
  uploadFile,
  waitForPageTimeout,
  writeFile,
} from "../../../utils/commands";

import {
  fillTextField,
  hoverElement,
  suiteClick,
  suiteExpect,
} from "../../../utils/page_actions";

import { locators } from "../../../utils/locator";
import {
  PathwayOptions,
  ContentOptions,
  ReturnValue,
} from "../interfaces/pathway.interface";
import { filePath, CentralPage } from "./centralPage";
import { PreconPage } from "./preconditionPage";

export { test, page, CentralPage, PreconPage };

const centralPage = new CentralPage();
const path_pathway = "api/dashboard/learning-path";
const contentMapping: Record<string, string> = {
  exvideo: "external_video",
  flashcard: "flash_card",
  exam: "test",
  "survey-poll": "survey",
};

export class PathwayPage {
  async addContent({ content }: PathwayOptions): Promise<void> {
    const contents_schedule = [
      "video",
      "audio",
      "exvideo",
      "document",
      "article",
      "flashcard",
      "course",
      "class_program",
      "class",
      "activity",
      "exam",
      "survey-poll",
    ];
    const contents_duration = [
      "video",
      "audio",
      "exvideo",
      "document",
      "article",
      "flashcard",
      "course",
      "class_program",
      "activity",
      "exam",
      "survey-poll",
    ];

    const pathway_data = await readFile(`${filePath}/${content}.json`);
    const contents_section =
      content === "pathway_schedule" ? contents_schedule : contents_duration;

    await createCurriculum();

    if (content === "pathway_schedule") {
      await setPathwaySchedule();
    }

    await fillSectionDescription();
    await selectContent(contents_section, pathway_data);
    await page.reload();
  }

  async createPathway({ content }: PathwayOptions): Promise<void> {
    const jsonData = await readJSONFiles({
      jsonFiles: ["category.json", "provider.json"],
      path_file: filePath,
    });
    const categoryData = jsonData["category"]; // data from category.json
    const providerData = jsonData["provider"]; // data from provider.json
    const today = new Date();
    const rand = Math.floor(Math.random() * 1000) + 1;
    const name_type = content === "pathway_schedule" ? "Schedule" : "Duration";
    const name =
      `Regress Pathway ${name_type} Waiting and Enrollform (***ห้ามแก้!!!)` +
      today.getMinutes() +
      today.getSeconds() +
      rand;

    let code = generateRandomValue({ content: "Pathway", variable: "code" });
    code = await checkDuplicate({ path_api: path_pathway, value: code });

    const resSearch = await callApi({
      endpoint: `${path_pathway}/?search=${name}&page=1`,
      method: "GET",
    });

    if (Array.isArray(resSearch) && resSearch.length > 0) {
      const write_data = {
        id: resSearch[0].id,
        name: name,
      };

      await writeFile({
        filePath: `${filePath}/${content}.json`,
        data: write_data,
      });
      return;
    }
    await suiteGoto({ visible: "div #left-menu-dashboard" });
    await suiteClick({
      selector: '[data-qa="ico-menu-pathway"]',
      intercept: "api/dashboard/learning-path/?is_coniclex=false",
      status_code: 200,
    });

    const resList = await callApi({
      endpoint: `${path_pathway}/`,
      method: "GET",
    });

    if (Array.isArray(resList) && resList.length > 0) {
      await hoverElement({ selector: '[data-qa="btn-group-create-pathway"]' });
      await suiteClick({
        selector: '[data-qa="btn-create-new-pathway"]',
        visible: locators.dialog.FORMDIALOG,
      });
    } else {
      await suiteClick({
        selector: '[data-qa="btn-create-new"]',
        visible: locators.dialog.FORMDIALOG,
      });
    }
    await fillTextField({ selector: locators.txtField.NAME, value: name });
    await fillTextField({ selector: locators.txtField.CODE, value: code });

    const selector =
      content === "pathway_duration"
        ? '[data-qa="option-duration"]'
        : '[data-qa="option-schedule"]';

    await suiteClick({ selector });
    await suiteClick({
      wrapper: locators.dialog.FORMDIALOG,
      selector: '[data-qa="select-category"]',
    });

    const categoryTree = page
      .locator("span.custom-tree-node")
      .filter({ hasText: categoryData.name });

    await categoryTree.click();
    await suiteClick({
      wrapper: "body > .select-category-tree",
      selector: '[data-qa="btn-close"]',
    });
    await suiteClick({
      wrapper: locators.dialog.FORMDIALOG,
      selector: '[data-qa="select-provider"]',
      inputText: "REGRESS Provider (***ห้ามแก้!!!)",
    });

    await waitForPageTimeout({});
    await suiteClick({ selector: '[data-qa="option-regress-provider"]' });
    await suiteClick({
      selector: locators.button.SAVE_NEXT,
      visible: "#pathway-detail",
    });
    await suiteExpect({
      wrapper: locators.identity.PATHWAY,
      selector: locators.txt.TITLE,
      behavior: "text",
      value: name,
    });
    await suiteExpect({
      wrapper: locators.identity.PATHWAY,
      selector: '[data-qa="fragment-id"]',
      behavior: "text",
      value: code,
    });
    await suiteExpect({
      wrapper: locators.identity.PATHWAY,
      selector: '[data-qa="txt-category"]',
      behavior: "text",
      value: categoryData.name,
    });
    await suiteExpect({
      wrapper: locators.identity.PATHWAY,
      selector: '[data-qa="txt-content-provider"]',
      behavior: "text",
      value: providerData.name,
    });
    await uploadFile({
      selector: '[data-qa="input-file"]',
      file_path: `fixtures/img/baddog.jpeg`,
      is_dashboard: false,
      have_input_type: false,
    });
    await suiteClick({ selector: locators.button.CROP_DIALOG });

    const pathway = await callApi({
      endpoint: `api/dashboard/learning-path/?search=${name}`,
      method: "GET",
    });
    const write_data = { id: pathway[0].id, name: pathway[0].name };

    await writeFile({
      filePath: `${filePath}/${content}.json`,
      data: write_data,
    });
  }

  async gotoPathway({ content }: PathwayOptions): Promise<void> {
    const pathway_data = await readFile(`${filePath}/${content}.json`);
    const pathway_id = pathway_data.id;
    await centralPage.loginUser({ user: "user" });
    await suiteGoto({
      url: `/pathway/${pathway_id}/`,
      waitApi: `api/learning-path/${pathway_id}/web/`,
    });
  }

  async verifyEnrollForm({ content }: PathwayOptions): Promise<void> {
    await this.gotoPathway({ content });
    await centralPage.enrollStandAlone({});
    await centralPage.doEnrollForm();
    await suiteExpect({
      behavior: "text",
      wrapper: locators.button.ENROLL,
      selector: locators.txt.BUTTON,
      value: /Waiting List|อยู่ในรายการรอ/,
    });
  }
}

async function handleContentSelection({
  content,
  content_data,
}: ContentOptions): Promise<void> {
  const selectionMap = {
    exvideo: '[data-qa="option-regress-external-video"]',
    flashcard: '[data-qa="option-regress-flash"]',
    course: '[data-qa="option-regress-course"]',
    class_program: '[data-qa="option-regress-classprogrampw"]',
    exam: '[data-qa="option-regress-test-regression"]',
    "survey-poll": '[data-qa="option-regression-poll"]',
    activity: '[data-qa="option-regress-activity"]',
    class: '[data-qa="option-regress-classpropw"]',
  };

  const selector_item = selectionMap[content] || `[data-qa="option-regress-${content}"]`;
  const get_value = await getContentValue({ content, content_data });

  await suiteClick({ selector: get_value.selector_content });

  await fillTextField({
    wrapper: get_value.selector_content,
    selector: "input",
    value: get_value.name,
  });

  await suiteClick({ selector: selector_item });
}

async function getContentValue({
  content,
  content_data,
}: ContentOptions): Promise<ReturnValue> {
  switch (content) {
    case "class":
      return {
        name: content_data[0].code,
        selector_content: '[data-qa="select-select-class-program"]',
      };
    case "class_program":
      return {
        name: content_data[0].code,
        selector_content: '[data-qa="select-select-content"]',
      };
    case "activity":
      return {
        name: content_data.name,
        selector_content: '[data-qa="select-activity-form"]',
      };
    case "exam":
      return {
        name: content_data.name,
        selector_content: '[data-qa="select-test-form"]',
      };
    case "survey-poll":
      return {
        name: content_data.name,
        selector_content: '[data-qa="select-survey-form"]',
      };
    case "course":
      return {
        name: content_data.name,
        selector_content: '[data-qa="select-select-content"]',
      };
    default:
      return {
        name: content_data.name_content,
        selector_content: '[data-qa="select-select-material"]',
      };
  }
}

async function createCurriculum(): Promise<void> {
  await suiteClick({
    selector: '[data-qa="btn-create-curriculum"]',
    visible: "div #pathway-detail-curriculum",
  });
  await suiteClick({
    selector: '[data-qa="btn-create-section"]',
    visible: '[data-qa="section-1"]',
  });
}

async function setPathwaySchedule(): Promise<void> {
  const currentYear = new Date().getFullYear();
  const startDate = `${currentYear}-01-01`;
  const endDate = `${currentYear}-12-31`;

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
}

async function fillSectionDescription(): Promise<void> {
  await fillTextField({
    selector: locators.txtField.TXT_FIELD,
    value: "Section desc",
  });
  await suiteClick({
    wrapper: '[data-qa="section-1"]',
    selector: '[data-qa="btn-select-content"]',
  });
  await waitForPageTimeout({});
}

async function selectContent(
  contents_section: string[],
  pathway_data: any
): Promise<void> {
  for (const [index, content] of contents_section.entries()) {
    const content_data = await getContentData({ content });
    const selector_element = contentMapping[content] || content;
    const adjustedIndex = index + 1;
    const get_value = await getContentValue({ content, content_data });
    const expect_name = await getExpectedContentName(content, content_data, get_value);

    await suiteClick({
      selector: `[data-qa="material-${selector_element}"]`,
      visible: `.slot-content-form-dialog ${locators.dialog.FORMDIALOG}`,
      selector_hover: '[data-qa="section-1"] [data-qa="btn-select-content"]',
    });

    await handleContentSelection({ content, content_data });
    await handleContentDetails(content, expect_name);

    await suiteClick({
      wrapper: ".slot-content-form-dialog",
      selector: locators.button.SAVE,
      intercept: `api/dashboard/learning-path/${pathway_data.id}/section/`,
      visible: '[data-qa="btn-select-content"]',
    });

    await suiteExpect({
      wrapper: `[data-qa="content-${adjustedIndex}"]`,
      selector: await getExpectedSelector({ content }),
      behavior: "text",
      value: expect_name,
    });

    await suiteClick({
      wrapper: `[data-qa="content-${adjustedIndex}"]`,
      selector: '[role="switch"]',
      intercept: `api/dashboard/learning-path/${pathway_data.id}/section/`,
      visible: `[data-qa="content-${adjustedIndex}"] [role="switch"].is-checked`,
    });
  }
}

async function getContentData({ content }: PathwayOptions): Promise<any> {
  const path_content =
    content === "class" ? `${filePath}/class/class_program` : `${filePath}/${content}`;
  return await readFile(`${path_content}.json`);
}

async function getExpectedContentName(
  content: string,
  content_data: any,
  get_value: any
): Promise<any> {
  if (content === "class") {
    return content_data[0].nameClass;
  } else if (content === "class_program") {
    return content_data[0].name;
  } else {
    return get_value.name;
  }
}

async function getExpectedSelector({ content }: PathwayOptions): Promise<string> {
  return content === "class"
    ? '[data-qa="txt-content-name"] span'
    : '[data-qa="txt-content-name"]';
}

async function handleContentDetails(content: string, expect_name: string): Promise<void> {
  if (content === "class") {
    await suiteClick({ selector: '[data-qa="select-select-content"]' });
    await fillTextField({
      wrapper: '[data-qa="select-select-content"]',
      selector: "input",
      value: expect_name,
    });
    await suiteClick({ selector: '[data-qa="option-regress-classpw"]' });
  }

  if (content === "activity" || content === "exam" || content === "survey-poll") {
    await suiteClick({ selector: locators.txtField.NAME });
    await fillTextField({
      selector: locators.txtField.NAME,
      value: expect_name,
    });
  }
}
