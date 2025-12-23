import {
  callApi,
  page,
  readFile,
  test,
  waitForPageTimeout,
  preUser,
  writeFile,
} from "../../../utils/commands";

import { fillTextField, suiteClick, suiteExpect } from "../../../utils/page_actions";

import { suiteGoto } from "../../../utils/page_goto";

import { locators } from "../../../utils/locator";

import { CentralPage, filePath, UIPath } from "./centralPage";
import { MaterialParams, MaterialUIData } from "../interfaces/material.interface";
import { verifylogIn5 } from "../../login/base/baseLogin";

export { CentralPage, filePath, readFile, page, test, verifylogIn5 };

const centralPage = new CentralPage();

export class MaterialPage {
  async verifyEnrollForm(): Promise<void> {
    await centralPage.enrollStandAlone({});
    await centralPage.doEnrollForm();
    await suiteExpect({
      behavior: "text",
      wrapper: locators.button.ENROLL,
      selector: locators.txt.BUTTON,
      value: /Waiting List|อยู่ในรายการรอ/,
    });
  }

  async gotoMaterial(params: MaterialParams): Promise<void> {
    const { material, materialData } = params;
    const [response] = await Promise.all([
      await callApi({
        endpoint: `/api/learning-content/?search=${materialData.name_content}`,
        method: "GET",
      }),
    ]);
    const materialId = response[0].id;

    await centralPage.loginUser({ user: "standuser" });
    await suiteGoto({
      url: `/${material}/${materialId}/`,
      waitApi: `/api/${material}/${materialId}/`,
    });
  }

  async gotoCreate({ material = "" }: MaterialUIData): Promise<void> {
    let path = "";
    switch (material) {
      case "article":
        path = "dashboard/article";
        break;

      case "video":
        path = "dashboard/video";
        break;

      case "audio":
        path = "dashboard/audio";
        break;

      case "document":
        path = "dashboard/document";
        break;

      case "external-video":
        path = "dashboard/external-video";
        break;

      default:
        throw new Error(`Unknown content type: ${material}`);
    }

    await suiteGoto({ url: path, visible: locators.button.CREATE });
  }

  async learnMaterial(params: MaterialParams): Promise<void> {
    const { material, materialData } = params;

    if (material !== "article") {
      await suiteClick({ selector: locators.button.ENROLL });
    }
    await waitForPageTimeout({});

    if (material) {
      await handleMaterial(material, materialData);
      await validateProgress({ material });
    } else {
      console.warn("Material type is undefined. Skipping processing.");
    }
  }

  async verifyLearnerInContent({
    path_file = "data/regressPortal",
    content = "",
  }: {
    path_file?: string;
    content: string;
  }): Promise<void> {
    const isExternal = ["external-video", "external_video"].includes(content);

    const contentDetail = {
      filename: isExternal ? "external_video" : content,
      apiContent: isExternal ? "external-video" : content,
    };
    const contentData = await readFile(`${path_file}/${contentDetail.filename}.json`);
    const idContent = contentData.id;
    const userData = await readFile(`${path_file}/standuser_user.json`);
    const response = await callApi({
      endpoint: `/api/dashboard/${contentDetail.apiContent}/${idContent}/learner/?status=LEARNING&search=${userData.code}&page=1&format=json`,
      method: "GET",
      fullResponse: true,
    });
    console.log("check user existing", response.data.results.length);
    console.log("check user List", response.data.results);
    if (response.data.results.length) {
      await preUser({ filePath: `${path_file}/standuser_user.json` });
    }
  }

  async createMaterialUI({ material = "" }: MaterialUIData): Promise<void> {
    const random = Math.floor(Math.random() * 10000) + 1;
    const contentName = `${material} UI ${random}`;
    const cutName = material.slice(0, 3);
    const TODAY = new Date();
    const time = `${TODAY.getHours()}:${TODAY.getMinutes()}`;
    const contentCode = `${cutName}-ui-${time}`;
    const category = "REGRESS Category (***ห้ามแก้!!!)";
    const provider = "REGRESS Provider (***ห้ามแก้!!!)";

    await this.gotoCreate({ material });
    if (material != "flashcard") {
      await suiteClick({
        selector: locators.button.CREATE,
        visible: '[data-qa="form-dialog"]',
      });
      await fillTextField({
        wrapper: locators.formItem.NAME_CONTENT,
        selector: locators.txtField.NAME_CONTENT,
        value: contentName,
      });
      await fillTextField({
        wrapper: locators.formItem.CODE,
        selector: locators.txtField.CODE,
        value: contentCode,
      });
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
      await suiteClick({ selector: locators.button.SAVE_NEXT });
      await waitForPageTimeout({});
      if (material !== "article") {
        await expectMaterialDetail({ name: contentName, code: contentCode });
      }

      const writeData = {
        name: contentName,
        code: contentCode,
      };
      await writeFile({ filePath: `${UIPath}/${material}.json`, data: writeData });
    }
  }

  async deleteMaterialUI(): Promise<void> {
    await suiteClick({
      wrapper: '[data-qa="r1-button-icons"]',
      selector: '[data-qa="btn-ico-delete"]',
    });
    await page.getByRole("button", { name: "Confirm" }).click();
    await waitForPageTimeout({});
    await page.reload();
    await suiteExpect({
      wrapper: locators.fragment.RESULT,
      selector: locators.txt.AMOUNT,
      value: 0,
      behavior: "number",
    });
  }

  async addMaterialUI({ material = "" }: MaterialUIData): Promise<void> {
    const materialConfig = {
      video: {
        file: "fixtures/vdo/1min-Morning!.mp4",
        checkDuration: true,
        button: '[data-qa="btn-to-video"]',
        visible: "#video-material-detail",
      },
      audio: {
        file: "fixtures/audio/30sec.mp3",
        checkDuration: true,
        button: '[data-qa="btn-to-audio"]',
        visible: "#audio-material-detail",
      },
      document: {
        file: "fixtures/doc/sample.pdf",
        checkDuration: false,
        button: '[data-qa="btn-to-document"]',
        visible: "#document-material-detail",
      },
      "external-video": {
        file: "fixtures/vdo/1min-Morning!.mp4",
        checkDuration: true,
        button: '[data-qa="btn-to-external-video"]',
        visible: "#external-video-material-detail",
      },
      article: {
        file: "fixtures/img/cat.jpg",
        checkDuration: false,
        button: '[data-qa="btn-to-article"]',
        visible: "#article-material-detail",
      },
    };

    const config = materialConfig[material as keyof typeof materialConfig];
    if (!config) {
      throw new Error(`Unsupported material type: ${material}`);
    }

    await waitForPageTimeout({});

    if (material === "external-video") {
      await fillTextField({
        wrapper: '[data-qa="form-item-url"]',
        selector: '[data-qa="txt-field-url"]',
        value: "https://www.youtube.com/watch?v=8UVNT4wvIGY",
        is_enter: true,
      });
      await suiteExpect({
        selector: '[data-qa="cover-2"]',
        timeout: 60000,
      });
    } else if (material === "article") {
      const currentUrl = await page.url();
      const match = currentUrl.match(/\/article\/(\d+)\//);
      let articleID: string | null = null;

      if (match) {
        articleID = match[1];
      }
      await callApi({
        method: "PATCH",
        endpoint: `/api/dashboard/article/${articleID}/content/`,
        body: {
          content: `<div>article ui test</div>\n`,
        },
      });
      await page.reload();
      await suiteClick({
        selector: locators.button.SAVE_NEXT,
        visible: "#article-detail-overall",
      });
      await waitForPageTimeout({});
    } else {
      await page.setInputFiles('input[type="file"]', config.file);
      await checkVisibility();
    }

    if (config.checkDuration) {
      await suiteExpect({
        wrapper: '[data-qa="fragment-time"]',
        selector: '[data-qa="txt-duration"]',
      });
    }

    await suiteExpect({
      wrapper: locators.txt.NAME,
      selector: '[data-qa="text-wrapper"]',
    });

    await fillTextField({
      selector: locators.txtField.DESC,
      value: `${material.charAt(0).toUpperCase() + material.slice(1)} desc`,
    });

    await suiteClick({
      selector: locators.button.SAVE_NEXT,
      visible: '[data-qa="form-item-complete-condition"]',
    });

    await doStep2();
    await settingEnrollment();
    await settingPublic();

    await suiteClick({
      selector: config.button,
      visible: config.visible,
    });
  }

  async searchMaterialUI({ material = "" }: MaterialUIData): Promise<void> {
    const materialData = await readFile(`${UIPath}/${material}.json`);
    const materialName = materialData.name;
    const materialCode = materialData.code;

    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: locators.txtField.SEARCH,
      value: materialCode,
      is_enter: true,
    });
    await suiteExpect({
      selector: locators.row1.NAME,
      value: materialName,
      behavior: "text",
    });
    await suiteExpect({
      wrapper: locators.row1.CODE,
      selector: locators.row1.CODE,
      value: materialCode,
      behavior: "text",
    });

    await suiteExpect({
      wrapper: locators.fragment.RESULT,
      selector: locators.txt.AMOUNT,
      value: 1,
      behavior: "number",
    });
  }
}

async function handleMaterial(material: string, materialData: any): Promise<void> {
  const materialPage = new MaterialPage();
  switch (material) {
    case "audio":
    case "video":
      await centralPage.handleVideoAudio();
      break;
    case "external-video":
      await updateExvideo({ materialData });
      await materialPage.gotoMaterial({ material, materialData });
      break;
    case "article":
      await centralPage.handleArticle();
      await page.reload();
      break;
    case "document":
      await centralPage.handleDocument();
      break;
    case "flash-card":
      await centralPage.handleFlashcard({ is_stand_alone: true });
      await materialPage.gotoMaterial({ material, materialData });
      break;
    default:
      break;
  }
}

async function validateProgress({ material = "" }: MaterialUIData): Promise<void> {
  if (material !== "article") {
    await suiteExpect({
      value: "100%",
      selector: '[data-qa="txt-progress-percent"] span',
      wrapper: '[data-qa="card-progress"]',
      behavior: "text",
    });
  }
}

async function makeApiStamp(
  content: string,
  id: string,
  params: any
): Promise<() => void> {
  const url = `/api/${content}/${id}/stamp`;
  const queryParams = new URLSearchParams(params).toString();
  const path_api = queryParams ? `${url}/?${queryParams}` : url;

  return callApi({
    endpoint: path_api,
    method: "GET",
  });
}

async function checkVisibility(): Promise<void> {
  const locator = '[data-qa="txt-drop-zone-file-name"]';
  const maxAttempts = 15;
  const waitTimeInSeconds = 30;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isVisible = await page.isVisible(locator);

    if (isVisible) {
      console.log(`Locator ${locator} is visible after ${attempt} attempt(s).`);
      return; // Exit loop early if the locator becomes visible
    }

    console.log(
      `Locator ${locator} is not visible. Attempt ${attempt}/${maxAttempts}. Retrying in ${waitTimeInSeconds} seconds...`
    );

    // Wait for the specified time (30 seconds) before checking again
    await page.waitForTimeout(waitTimeInSeconds * 1000);
  }

  // If after 15 attempts the locator is still not visible, log an error
  console.error(`Locator ${locator} is not visible after ${maxAttempts} attempts.`);
}

async function doStep2(): Promise<void> {
  await suiteClick({
    selector: '[data-qa="btn-next-step"]',
    visible: locators.formItem.ENROLLMENT_SETTING,
  });
}

async function settingEnrollment(): Promise<void> {
  await suiteClick({
    wrapper: locators.formItem.ENROLLMENT_SETTING,
    selector: '[data-qa="ico-edit"]',
    visible: '[data-qa="enrollment-settings-form"]',
  });

  await suiteClick({
    wrapper: '[data-qa="form-item-enrollment-required"]',
    selector: '[data-qa="switch-enrollment"]',
    visible: locators.formItem.ENROLLMENT_PERIOD,
  });

  await suiteClick({
    wrapper: locators.formItem.ENROLLMENT_PERIOD,
    selector: '[data-qa="select-enrollment-period"]',
    dropdown_selector: '[data-qa="option-open-enroll"]',
  });

  await waitForPageTimeout({});

  await suiteClick({
    selector: locators.buttonSave.BACK,
    visible: locators.formItem.ENROLLMENT_SETTING,
  });

  await waitForPageTimeout({});

  await suiteExpect({
    wrapper: locators.formItem.ENROLLMENT_SETTING,
    selector: locators.fragment.ENROLLMENT_PERIOD,
    value: "Open Enrollment",
    behavior: "text",
  });
}

async function settingPublic(): Promise<void> {
  await suiteClick({
    selector: '[data-qa="select-publish"]',
    dropdown_selector: '[data-qa="option-publish"]',
  });
  await waitForPageTimeout({});
}

async function expectMaterialDetail({
  name,
  code,
}: {
  name: string;
  code: string;
}): Promise<void> {
  await suiteExpect({
    wrapper: locators.identity.MATERIAL,
    selector: locators.txt.TITLE,
    value: name,
    behavior: "text",
  });
  await suiteExpect({
    wrapper: locators.identity.MATERIAL,
    selector: locators.txt.ID,
    value: code,
    behavior: "text",
  });
}

async function updateExvideo(params: MaterialParams): Promise<void> {
  const { materialData } = params;
  const material_data_id = materialData.id;
  const duration = 29;
  await makeApiStamp("external-video", material_data_id, {
    action: 10,
    duration,
    duration_use: duration,
    duration_diff: duration,
    duration_max: duration,
  });

  const userData = await readFile(`data/regressPortal/standuser_user.json`);
  await centralPage.loginUser({ user: "standmanager" });
  const response = await callApi({
    method: "GET",
    endpoint: `/api/dashboard/external-video/${materialData.id}/progress/?search=${userData.code}`,
  });
  const progress_id = response[0].id;
  const body = { status: 30 };

  await callApi({
    endpoint: `/api/dashboard/external-video/${material_data_id}/progress/${progress_id}/`,
    method: "PATCH",
    body,
  });
}
