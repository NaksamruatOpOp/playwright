import {
  callApi,
  expect,
  page,
  readFile,
  test,
  waitForPageTimeout,
} from "../../../utils/commands";

import { fillTextField, suiteClick, suiteExpect } from "../../../utils/page_actions";

import { suiteGoto } from "../../../utils/page_goto";

import { locators } from "../../../utils/locator";

import { CentralPage } from "./centralPage";

export { centralPage, test };

const filePath = "data/regressPortal";
const centralPage = new CentralPage();

interface ActivityData {
  id: number;
  code: string;
  name: string;
}
let activity_data: ActivityData;

test.beforeAll(async () => {
  activity_data = await readFile(`${filePath}/activity.json`);
});

export class ActivityPage {
  async handleActivity(): Promise<void> {
    await gotoActivity();
    await centralPage.doActivity();
    await centralPage.verifyMyLibrary({ status: "verifying", content: "activity" });
    await gotoActivityCheckIn();
    await waitForPageTimeout({});
    await checkinActivity();
    await verifyActivity();
    await suiteGoto({ url: "/" });
  }

  async verifyEnrollForm(): Promise<void> {
    await gotoActivity();
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

/**
 * Function that will check in activity.
 */
async function checkinActivity(): Promise<void> {
  await fillTextField({
    wrapper: locators.fragment.SEARCH,
    selector: locators.txtField.SEARCH,
    value: activity_data.code,
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

  const userDetail = await readFile(`${filePath}/standuser_user.json`);
  const DIALOG_BUTTON_LOCATOR = `#activity-overall-check-in ${locators.dialog.DIALOG} [data-qa="btn-confirm"]`;

  await fillTextField({
    wrapper: locators.fragment.SEARCH,
    selector: locators.txtField.SEARCH,
    value: userDetail.username,
    is_enter: true,
    waitTime: 5000,
  });
  await suiteClick({
    wrapper: '[data-qa="check-in-0"]',
    selector: '[data-qa="ico-clear2"]',
    visible: DIALOG_BUTTON_LOCATOR,
  });
  await suiteClick({ selector: DIALOG_BUTTON_LOCATOR });

  const checkInIcon = page.locator('[data-qa="ico-check-in"]');

  await expect(checkInIcon).toBeVisible();
  await expect(checkInIcon).toHaveClass(/(^|\s)text-green(\s|$)/);
}

/**
 * Function go to activty base on search.
 */
async function gotoActivity(): Promise<void> {
  const [response] = await Promise.all([
    await callApi({
      endpoint: `/api/activity/?search=${activity_data.name}`,
      method: "GET",
    }),
  ]);
  const activityId = response[0].id;

  await centralPage.loginUser({ user: "standuser" });
  await suiteGoto({
    url: `/activity/${activityId}/`,
    waitApi: `/api/activity/${activityId}/`,
  });
}

/**
 * Function that go to page activty check in.
 */
async function gotoActivityCheckIn(): Promise<void> {
  await centralPage.loginUser({ user: "standmanager" });

  const activityId = activity_data.id;

  await suiteGoto({
    url: `/dashboard/activity/${activityId}/overall/check-in/`,
    visible: "#activity-overall-check-in-content-usage",
    waitApi: `/api/dashboard/activity/${activityId}/content-usage/`,
  });
}

/**
 * Function that will add score in activity Checklist.
 */
async function verifyActivity(): Promise<void> {
  await suiteClick({
    selector: '[data-qa="tab-waiting-to-verify"]',
    visible: "#activity-overall-verify-content-usage",
  });
  await fillTextField({
    wrapper: locators.fragment.SEARCH,
    selector: locators.txtField.SEARCH,
    value: activity_data.code,
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
  const index = await centralPage.findIndexUser({ content: "activity" });
  await waitForPageTimeout({});
  await fillTextField({
    selector: `.el-table__body tr:nth-child(${index}) [type="number"]`,
    value: "10",
    is_enter: true,
  });
}
