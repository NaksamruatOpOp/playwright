import EncryptRSA from "encrypt-rsa";
import * as $ from "../../../utils/commands";
import { baseUrl, base_account } from "./env";
import { fs, readFile, request, writeFile } from "../../../utils/commands";
export let HEADERS: Record<string, string> | undefined;
const encryptRSA = new EncryptRSA();
const today = new Date();
const todayFormatted = today.toISOString().split("T")[0];
let retryCount = 0;
const retryLogin = 5;

interface LoginParams {
  userData?: { username: string; password: string } | undefined;
  isBeforeEach?: boolean;
  isClosePrivacyData?: boolean;
}

export async function logIn5(
  {
    userData = { username: "", password: "" },
    isBeforeEach = false,
    isClosePrivacyData = true,
  }: LoginParams,
  page = $.page
) {
  $.log({ text: "Validating site:", data: baseUrl });

  // Set user data
  const data = {
    username: userData.username || base_account.username,
    password: userData.password || base_account.password,
  };
  console.log(`Current user:`, data.username);
  $.log({ text: `Current user:`, data: data.username });

  // Get CSRF Token
  const maxRetries = 5;
  let retries = 0;
  let get_csrf_token: any = null;

  while (retries < maxRetries) {
    try {
      // Call the API
      get_csrf_token = await $.callApi({
        endpoint: "/api/csrf/",
        method: "GET",
        retry: retryLogin,
      });

      // If the response is valid, break the loop
      if (get_csrf_token) {
        break;
      }
    } catch (error) {
      console.error(`Attempt ${retries + 1} failed:`, error);
    }

    retries++;
    $.log({ data: `Retrying (${retries}/${maxRetries})...` });
  }

  if (!get_csrf_token) {
    throw new Error("Failed to fetch CSRF token after maximum retries.");
  }

  const csrfCookies: string = get_csrf_token.headers()["set-cookie"];
  const CSRFToken: string = csrfCookies.split(";")[0].split("=")[1];

  // Get Public Key
  const get_publickey = await $.callApi({
    endpoint: "/api/auth/key",
    method: "GET",
    retry: retryLogin,
  });
  // $.log({ text: 'get_publickey', data: get_publickey })

  // Encrypt password using encrypt-rsa
  const encryptedPassword = encryptRSA.encryptStringWithRsaPublicKey({
    text: data.password,
    publicKey: get_publickey.toString(),
  });
  // $.log({ ('encryptedPassword', encryptedPassword)

  // Perform login
  const get_login = await $.callApi({
    endpoint: "/api/auth/account/login",
    method: "POST",
    body: {
      username: data.username,
      password: encryptedPassword,
      is_remember: false,
      is_conicle_login: true,
    },
    retry: retryLogin,
  });
  const accessToken: string = get_login["access_token"];
  const refreshToken: string = get_login["refresh_token"];
  const accessTokenExpire: string = get_login["access_token_datetime_expire"];

  //set default headers
  HEADERS = {
    "X-csrftoken": CSRFToken,
    Authorization: "Bearer " + accessToken,
    cookie: "csrftoken=" + CSRFToken + ";accessToken" + accessToken,
  };

  // Set cookies and headers
  await $.page.context().addCookies([
    { name: "csrftoken", value: CSRFToken, url: baseUrl },
    { name: "Authorization", value: `Bearer ${accessToken}`, url: baseUrl },
    { name: "accessToken", value: accessToken, url: baseUrl },
    // {
    //   name: "cookie",
    //   value: "csrftoken=" + CSRFToken + "accessToken" + accessToken,
    //   url: baseUrl,
    // },
    { name: "refreshToken", value: refreshToken, url: baseUrl },
    { name: "accessTokenDatetimeExpire", value: accessTokenExpire, url: baseUrl },
  ]);

  await writeCacheFile({
    CSRFToken,
    accessToken,
    refreshToken,
    accessTokenDatetimeExpire: accessTokenExpire,
    user: data.username,
  });
  console.log("login complete ✅");

  if (isClosePrivacyData) {
    await $.context.addInitScript(() => {
      window.localStorage.setItem("showAnnouncementPopup", "1715066392906");
    });

    const get_pdpa = await $.callApi({
      endpoint: "/api/om/account/detail",
      method: "GET",
      retry: retryLogin,
    });
    // $.log({ text: 'res', data: get_pdpa })
    $.log({ text: "is_accepted_privacy: ", data: get_pdpa["is_accepted_privacy"] });
    $.log({ text: "is_accepted_term:", data: get_pdpa["is_accepted_term"] });
    $.log({
      text: "is_accepted_data_consent:",
      data: get_pdpa["is_accepted_data_consent"],
    });

    const body: any = {
      is_submit: true,
    };
    if (get_pdpa["is_accepted_privacy"] === false)
      await $.callApi({
        statusCode: [200, 202],
        method: "POST",
        endpoint: "/api/term/privacy/accept/",
        body,
      });
    if (get_pdpa["is_accepted_term"] === false)
      await $.callApi({
        statusCode: [200, 202],
        method: "POST",
        endpoint: "/api/term/accept/",
        body,
      });
    if (get_pdpa["is_accepted_data_consent"] === false)
      await $.callApi({
        statusCode: 200,
        method: "POST",
        endpoint: "/api/term/data-consent/accept/",
        body: {
          is_submit: true,
          selected_subscribe_list: [1, 2, 3],
        },
      });
  }
}

export async function verifylogIn5(
  {
    userData = { username: base_account.username, password: base_account.password },
    isClosePrivacyData = true,
  }: LoginParams,
  page = $.page
) {
  await page.context().clearCookies();

  // Check if the cache file exists
  const isExist = await checkFileIsExist("data/auth/om.json");
  if (!isExist) {
    console.log("no file cache ❌");
    await logIn5({ userData, isClosePrivacyData });
  } else {
    await settingCacheLogin({ user: userData, isClosePrivacyData });
  }

  const requestContext = await request.newContext();
  const response = await requestContext.fetch("/api/content/my-content/", {
    method: "GET",
    headers: HEADERS,
    data: undefined,
  });

  if (response.status() === 401) {
    if (retryCount < 5) {
      retryCount++;
      console.log(`Retry attempt ${retryCount}...`);
      await verifylogIn5({ userData });
    } else {
      console.error("Error: Exceeded maximum retry attempts (5) for 401 status.");
    }
  }
}

async function checkFileIsExist(path = "data/auth/om.json") {
  try {
    await fs.promises.access(path, fs.constants.F_OK);
    return true;
  } catch (error) {
    console.error(`Error checking file existence: ${error.message}`);
    return false;
  }
}

async function writeCacheFile({
  CSRFToken,
  accessToken,
  refreshToken,
  accessTokenDatetimeExpire,
  user,
}) {
  let cacheData: any;
  let conditionUpdate: boolean = false;
  const filePath = "data/auth/om.json";
  const isExist = await checkFileIsExist(filePath);
  const userObject = {
    [user]: {
      accessToken,
      CSRFToken,
      refreshToken,
      accessTokenDatetimeExpire,
    },
  };

  if (isExist) {
    cacheData = await readFile(filePath);
    conditionUpdate = cacheData.date !== todayFormatted || cacheData.site !== baseUrl;
  }

  if (!isExist || conditionUpdate) {
    const data = [{ site: baseUrl, date: todayFormatted }, userObject];
    await writeFile({ filePath, data });
  } else {
    const userExists = cacheData.some((item) => item[user]);
    if (!userExists) {
      cacheData.push(userObject);

      const updatedData = [{ site: baseUrl, date: todayFormatted }, ...cacheData];
      await writeFile({ filePath, data: updatedData });
    }
  }
}

async function settingCacheLogin({ user, isClosePrivacyData }) {
  const username = user.username;
  const cacheData = await readFile("data/auth/om.json");
  const userIndex = cacheData.findIndex((item) => item[username]);

  if (cacheData[0].date != todayFormatted || userIndex == -1) {
    await logIn5({ userData: user, isClosePrivacyData });
  } else {
    const userData = cacheData[userIndex][username];
    const accessToken = userData.accessToken;
    const CSRFToken = userData.CSRFToken;
    const refreshToken = userData.refreshToken;
    const accessTokenExpire = userData.accessTokenDatetimeExpire;

    HEADERS = {
      "X-csrftoken": CSRFToken,
      Authorization: "Bearer " + accessToken,
      cookie: "csrftoken=" + CSRFToken + ";accessToken" + accessToken,
    };

    await $.page.context().addCookies([
      { name: "csrftoken", value: CSRFToken, url: baseUrl },
      { name: "Authorization", value: `Bearer ${accessToken}`, url: baseUrl },
      { name: "accessToken", value: accessToken, url: baseUrl },
      // {
      //   name: "cookie",
      //   value: "csrftoken=" + CSRFToken + "accessToken" + accessToken,
      //   url: baseUrl,
      // },
      { name: "refreshToken", value: refreshToken, url: baseUrl },
      { name: "accessTokenDatetimeExpire", value: accessTokenExpire, url: baseUrl },
    ]);
    console.log("set cache complete ✅");
  }
}
