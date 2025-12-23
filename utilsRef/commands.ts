import {
  test,
  expect,
  APIRequestContext,
  APIResponse,
  BrowserContext,
  Page,
  request,
} from "@playwright/test";
import axios from "axios";
import { verifylogIn5 } from "../tests/login/base/baseLogin";
import { baseUrl } from "../tests/login/base/env";
import { callApi, getResponseData, waitApi } from "./request";
import { suiteGoto } from "./page_goto";
import { suiteClick, suiteExpect } from "./page_actions";
import { faker } from "@faker-js/faker";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import configList from "../playwright.config";

let browserName: string;
let context: BrowserContext;
let page: Page;
const config: { [key: string]: boolean | number | string } = {
  log: configList.use?.logEnabled ?? false, // Default to false if undefined
  baseUrl: configList.use?.baseURL ?? "",
};
const defaultOperationTimeout = 180000;
const timeoutLocator = 60000;
const TODAY = new Date();
const time = `${TODAY.getHours()}:${TODAY.getMinutes()}:${TODAY.getSeconds()}`;

export {
  APIRequestContext,
  APIResponse,
  fs,
  fsPromises,
  axios,
  browserName,
  config,
  context,
  defaultOperationTimeout,
  expect,
  faker,
  page,
  path,
  request,
  test,
  timeoutLocator,
  apiPublishContent,
  callApi,
  checkDuplicate,
  closeNewsDialog,
  convertDuration,
  delay,
  generateRandomValue,
  readJSONFiles,
  settingEnrollContent,
  suiteGoto,
  waitApi,
  updateConfig,
  waitForPageTimeout,
  verifyExportFile,
};

test.beforeAll(async ({ browser }) => {
  browserName = browser.browserType().name().toLowerCase();
  context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  page = await context.newPage();
  await verifylogIn5({});
  await page.goto(`/dashboard`, { waitUntil: "domcontentloaded" });
});

// Another reusable function to capture a screenshot
export async function captureScreenshot(filePath: string) {
  await page.screenshot({ path: filePath });
}

export async function log({ text = "", data }: { text?: string; data: any }) {
  if (config.log) console.log("LOG: ", text, data);
}

export async function writeFile({
  filePath,
  data,
}: {
  filePath: string;
  data: any;
}): Promise<void> {
  const dirPath = path.dirname(filePath); // Extracts 'data/aaaa'
  const fileName = path.basename(filePath); // Extracts 'data.json'
  const ext = path.extname(fileName).toLowerCase();

  log({ text: "dirPath", data: dirPath });
  log({ text: "fileName", data: fileName });
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log({ text: `Directory created: `, data: dirPath });
  } else {
    log({ text: `Directory already exists: `, data: dirPath });
  }

  // Write data to JSON file
  if (ext === ".json") data = JSON.stringify(data, null, 2);
  else if (ext === ".txt") data = String(data);
  else log({ data: "Please Verify Extension File" });

  fs.writeFileSync(filePath, data);
  log({ text: `JSON file created: `, data: filePath });
}

interface CallOptions {
  selector: string;
  wrapper?: string;
  file_path: string;
  is_dashboard?: boolean;
  have_input_type?: boolean;
}
export async function uploadFile({
  selector = "",
  wrapper = "",
  file_path = "",
  is_dashboard = true,
  have_input_type = true,
}: CallOptions) {
  const fileInput = have_input_type
    ? page.locator(`${wrapper} ${selector} input[type="file"]`)
    : page.locator(`${wrapper} ${selector}`); // Replace with the correct selector
  await fileInput.setInputFiles(file_path);
  if (is_dashboard) await expect(page.locator("#import-history")).toBeVisible();
}

export async function readFile(pathFile: string): Promise<any> {
  return new Promise((resolve, reject) => {
    fs.readFile(pathFile, "utf-8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      try {
        resolve(JSON.parse(data)); // Parse the JSON data
      } catch (parseErr) {
        reject(parseErr); // Handle any JSON parsing errors
      }
    });
  });
}

export async function interceptApiPage({
  url,
  status_code,
}: {
  url: string;
  status_code: number;
}) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes(url) && response.status() === status_code,
      { timeout: defaultOperationTimeout }
    ),
  ]);

  // Check if the response is OK
  if (response.ok()) {
    if (status_code === 204) {
      return response;
    }
    const response_data_json = await response.json();
    const response_data = getResponseData(response_data_json);

    // let response_data: ResponseBody | null = null;
    return response_data;
  }
}

interface optionUser {
  username?: string;
  manager?: number | "";
  is_admin?: boolean;
  filePath?: string;
}
export async function preUser(paramUser: optionUser): Promise<Record<string, any>> {
  let {
    username,
    manager,
    is_admin = true,
    filePath = "data/user/preuser.json",
  } = paramUser;
  const image = await getDefaultImage();

  if (!image) {
    throw new Error("Default image not found");
  }

  const { fakeUsername, idCard, birthdate, onboardDate, address } = randomUserInfo();
  username = username ?? fakeUsername;

  const body = {
    image: image.image,
    image_url: image.image_url,
    email: username + "@conicle.com",
    phone_country_code: "+66",
    phone_phone_number: "123456789",
    code: username,
    username: username,
    department: "",
    department_id: null,
    password: "adminadmin",
    confirm_password: "adminadmin",
    id_card: idCard,
    title: "Mr.",
    first_name: username,
    middle_name: "Middle",
    last_name: "Automate",
    gender: 1,
    address,
    date_birth: birthdate,
    date_start: onboardDate,
    is_active: true,
    custom_fields: [],
    count_service: 0,
  };
  const response = await callApi({
    endpoint: "/api/om/dashboard/account",
    method: "POST",
    body,
    filePath,
  });

  log({ data: body });
  log({ data: response });

  if (is_admin) {
    await callApi({
      endpoint: "/api/om/dashboard/role/1/member",
      method: "POST",
      body: { account_id: response["id"] },
    });
  }
  return { username, id: response["id"] };
}

export function randomUserInfo() {
  return {
    userId: faker.string.uuid(),
    idCard: faker.number.int({ min: 100000000000, max: 9999999999999 }).toString(),
    fakeUsername: faker.internet.username(), // before version 9.1.0, use userName()
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    address: faker.location.county(),
    password: faker.internet.password(),
    birthdate: faker.date.birthdate().toISOString(),
    onboardDate: faker.date.past().toISOString(),
  };
}

interface ImageDataParams {
  image: string;
  image_url: string;
  is_default: boolean;
  is_selected: boolean;
}
export async function getDefaultImage(): Promise<ImageDataParams | undefined> {
  const expectImage = "default_01";
  const response = await callApi({
    endpoint: "/api/om/dashboard/account/avatar/5",
    method: "GET",
    retry: 1,
  });
  const imageData = response["image_list"].find((item) =>
    item.image.includes(expectImage)
  );

  return imageData;
}

export async function getContentType(pathFile = "data/responses") {
  console.log("API: GET /api/e2e/content-type/");

  const response = await callApi({
    endpoint: "/api/e2e/content-type/",
    method: "GET",
  });

  await writeFile({ filePath: `${pathFile}/content_type.json`, data: response });
}

function generateRandomValue({ content, variable }) {
  const rand = Math.floor(Math.random() * 10);
  const randomInt2 = Math.floor(Math.random() * 100);

  const CONTENT_CODE = {
    Course: "Co-",
    Instructor: "Ins-",
    "Content Provider": "Pro",
    Category: "Cat",
    "Learning Program": "Lp-",
    Location: "LR-",
    Room: "Ro-",
    video: "vid-",
    audio: "aud-",
    "external-video": "ext-",
    document: "doc-",
    article: "art-",
    "flash-card": "fla-",
    Activity: "act-",
    Survey: "Sur-",
    Exam: "Exm-",
    Live: "Liv-",
    Pathway: "PW-",
    "Class program": "Cp",
    Class: "Cl",
    "External training": "Et",
  };

  if (variable === "name") {
    return `${content} - ${randomInt2}${rand}-${time}`;
  } else if (variable === "code") {
    const prefix = CONTENT_CODE[content] || "";
    return `${prefix}${TODAY.getDate()}${TODAY.getMonth()}${rand}${TODAY.getMilliseconds()}`;
  } else {
    throw new Error(`Unsupported variable type: ${variable}`);
  }
}

async function checkDuplicate({ path_api, value }: { path_api: string; value: string }) {
  const endpoints = ["event-program", "event", "course", "activity"];

  const pathSegments = path_api.split("/").some((path) => endpoints.includes(path));

  if (pathSegments) {
    value = await generateNewCode({ path_api, type: "request", value });
  }

  const new_value = await generateNewCode({ path_api, value });

  // Log and return the new code
  console.log("newCode_onShelf", new_value);

  return new_value;
}

// Function to generate a new code
async function generateNewCode({
  path_api,
  type = "onShelf",
  value,
}: {
  path_api: string;
  type?: any;
  value: string;
}) {
  const res = await callApi({
    endpoint:
      path_api + (type === "onShelf" ? `?search=${value}` : `request/?search=${value}`),
    method: "GET",
    fullResponse: true,
  });
  let responses = res.data ? res.data : res;

  if (responses.count > 0) {
    // Modify the value if duplicates are found
    let slicedValue = value.slice(0, -3);
    let newRand = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    value = slicedValue + newRand;

    // Recursively check for duplicates with the new value
    await checkDuplicate({ path_api, value });
  }

  // Log the new value
  console.log("new value", value);

  // Return the new value
  return value;
}

async function readJSONFiles({
  content = "",
  jsonFiles = [],
  path_file = "data/response/variable", // Update this path to match your directory structure
  defaultFile = true,
}: {
  content?: string | string[];
  jsonFiles?: string[];
  path_file?: string;
  defaultFile?: boolean;
}): Promise<Record<string, any>> {
  if (!defaultFile) {
    if (content) {
      if (Array.isArray(content)) {
        content.forEach((item) => {
          jsonFiles.push(`${item}.json`);
        });
      } else jsonFiles = [`${content}.json`];
    }
  } else {
    if (content) {
      const defaultFiles = ["category.json", "provider.json", "content_type.json"];
      jsonFiles = [`${content}.json`, ...defaultFiles];
      if (content !== "survey")
        jsonFiles.push("instructor.json", "learning_program.json");
    }
  }

  const data: Record<string, any> = {};

  for (const file of jsonFiles) {
    const filePath = path.join(path_file, file);
    console.log(`Reading file: ${filePath}`);

    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      data[file.replace(".json", "")] = JSON.parse(content);
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }

  console.log("this is data" + data);

  return data;
}

async function convertDuration({
  duration = "00:01:05.359000",
}: {
  duration: string;
}): Promise<number> {
  const timeParts = duration.split(":");
  const totalSeconds = 
    Number(timeParts[0]) * 3600 + 
    Number(timeParts[1]) * 60 + 
    Number(timeParts[2]);
  return Math.round(totalSeconds);
}

async function settingEnrollContent({
  contentPath = "course",
  status = "",
  idContent = "",
  learner = 0,
  waitingList = false,
  reEnroll = false,
}: {
  contentPath: string;
  status: string;
  idContent: any;
  learner?: number;
  waitingList?: boolean;
  reEnroll?: boolean;
}) {
  const path_api = `/api/dashboard/${contentPath}/${idContent}/enrollment/setting/`;
  const type_waiting = learner !== 0 && !waitingList ? 1 : 0;

  const body = {
    content_period_enroll: {
      datetime_start: null,
      datetime_end: null,
      duration: 0,
      type_expire: 0,
    },
    enrollment_required: true,
    capacity: learner,
    type_waiting,
    is_rejected_able_re_enroll: reEnroll,
  };

  if (status != "open") {
    body.content_period_enroll.type_expire = 1;
  }

  const response = await callApi({ endpoint: path_api, method: "PATCH", body });

  const typeExpire = response.content_period_enroll.type_expire;
  if (typeExpire !== body.content_period_enroll.type_expire)
    await settingEnrollContent({
      contentPath,
      idContent,
      status,
      learner,
      waitingList,
      reEnroll,
    });
}

async function apiPublishContent({
  contentPath = "course",
  status = "",
  idContent = "",
}: {
  contentPath: string;
  status: string;
  idContent: any;
}) {
  let body = {};
  const path_api = `/api/dashboard/${contentPath}/${idContent}/publish/`;
  if (contentPath === "event-program") body = { is_display: true };
  else {
    body = {
      status,
      content_period_publish: {
        type_expire: status === "publish" ? 0 : -1,
        datetime_start: null,
        datetime_end: null,
      },
    };
  }

  await callApi({ endpoint: path_api, method: "PATCH", body });
}

function delay(time: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

async function updateConfig({
  list,
  value = false,
  is_array_value = true,
}: {
  list: Array<string>;
  value: any;
  is_array_value?: boolean;
}) {
  let x = "";
  let payload: any;
  if (typeof value === "object" && is_array_value) {
    for (x in list) {
      console.log("config List: ", list[x]);
      console.log("value List: ", value[x]);
      payload = {
        site: baseUrl,
        code: list[x],
        value: value[x],
        account_id: "QA Automate",
      };

      await callApi({
        statusCode: 200,
        endpoint: "https://config-5.conicle.co/api/config/update/",
        method: "POST",
        body: payload,
        headers: {},
      });
    }
  } else {
    for (x in list) {
      console.log("config List: ", list[x]);
      console.log("value List: ", value);
      payload = {
        site: baseUrl,
        code: list[x],
        value: value === false ? 1 : value,
        account_id: "QA Automate",
      };

      await callApi({
        statusCode: 200,
        endpoint: "https://config-5.conicle.co/api/config/update/",
        method: "POST",
        body: payload,
        headers: {},
      });
    }
  }

  await callApi({
    endpoint: `${baseUrl}/api/base/config/trigger/`,
    method: "GET",
    body: payload,
    headers: {},
  });
}

async function waitForPageTimeout({ waitTime }: { waitTime?: number }) {
  if (waitTime == undefined) waitTime = 3000;

  await page.waitForTimeout(waitTime);
}

async function verifyExportFile({
  trackerPath, 
  downloadPath = 'downloads' 
}: {
  trackerPath: string
  downloadPath?: string
}): Promise<any> {
  const requestContext = await request.newContext();
  const tracker = await readFile(trackerPath);

  const detailData = await verifyWaitDetail({
    pathApi: `api/report-management/dashboard/report/${tracker.id}/download_url/`
  });
  console.log('detailData', detailData)

  const url = detailData.detail?.[0]?.url;
  console.log('url', url)
  if (!url) {
    throw new Error('Download Report Failed, Please Check the API Response');
  }

  const response = await requestContext.get(url);
  const contentDisposition = response.headers()['content-disposition'];
  const fileName = decodeURIComponent(
    contentDisposition.replace(/^attachment; filename\*=utf-8''/, '')
  );
  const buffer = await response.body();
  const exportPath = path.join(downloadPath, fileName);
  await fsPromises.mkdir(downloadPath, { recursive: true });
  await fsPromises.writeFile(exportPath, buffer);
  expect(fs.existsSync(exportPath)).toBe(true);
  return exportPath;
}

async function verifyWaitDetail({
  pathApi = '',
  round = 15,
  wait = 10000
}: {
  pathApi: string
  round?: number
  wait?: number
}): Promise<any> {
  for (let i = 0; i < round; i++) {
    try {
      const response = await callApi({
        endpoint: pathApi,
        method: "GET",
      });

      const responses = response.data?.results || response.data || response.results || response;

      console.log(`Current status: ${response.status} | Attempt: ${i + 1}`);

      if ('detail' in responses) {
        return responses;
      }

      if (i === round - 1) {
        throw new Error('Failed to get the detail after all attempts');
      }

      await new Promise(resolve => setTimeout(resolve, wait));
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      
      await new Promise(resolve => setTimeout(resolve, wait));
    }
  }

  throw new Error('verifyWaitDetail exhausted all attempts without success');
}

// async function verifyExportFile({
//   pathDownloads = "",
//   wrapper = "",
//   selector = "",
//   visible = "",
// }: {
//   pathDownloads?: string;
//   wrapper?: string;
//   selector: string;
//   visible?: string;
// }) {
//   if (!pathDownloads) pathDownloads = "downloads";
//   const downloadPromise = page.waitForEvent("download");
//   // Trigger the download action (e.g., clicking a button or link)
//   await suiteClick({ wrapper, selector, visible });

//   // Get the download object
//   const download = await downloadPromise;
//   // Get the suggested filename of the downloaded file
//   const fileName = download.suggestedFilename();
//   console.log("Downloaded file name:", fileName);
//   // Define the path to save the file
//   const downloadPath = `${pathDownloads}/${fileName}`;

//   // Save the file to the specified location
//   await download.saveAs(downloadPath);

//   // const downloadPath = `${pathDownloads}/${fileName}`;
//   await expect(fs.existsSync(downloadPath)).toBe(true); // File must exist
// }

export async function retrySuiteExpect({
  behavior = "",
  value,
  maxRetries = 5,
  delay = 5000,
  wrapper = "",
  selector = "",
}) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Perform the expectation check
      await suiteExpect({
        behavior: behavior,
        wrapper: wrapper,
        selector: selector,
        value,
      });

      // If expectation succeeds, exit the function
      return;
    } catch (error) {
      if (attempt < maxRetries) {
        console.log(`Attempt ${attempt} failed. Retrying in ${delay / 1000} seconds...`);
        await page.reload();
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // If max retries are reached, throw an error
        throw new Error(
          `Expectation failed after ${maxRetries} attempts: ${error.message}`
        );
      }
    }
  }
}

async function closeNewsDialog(): Promise<void> {
  const newsLocator = page.locator('[data-qa="dialog"] [data-qa="btn-ico-close"]');
  const count = await newsLocator.count();
  if (count > 0) {
    await newsLocator.click();
  }
}
