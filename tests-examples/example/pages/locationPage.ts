import {
  callApi,
  checkDuplicate,
  faker,
  generateRandomValue,
  page,
  readFile,
  suiteGoto,
  test,
  uploadFile,
  waitForPageTimeout,
  writeFile,
} from "../../../utils/commands";

import { fillTextField, suiteClick, suiteExpect } from "../../../utils/page_actions";

import { locators } from "../../../utils/locator";

export { page, test };

const path_file = "data/location";
const path_location = "api/dashboard/location/";
let locationCode = generateRandomValue({ content: "Location", variable: "code" });
let locationName = generateRandomValue({ content: "Location", variable: "name" });
let roomCode = generateRandomValue({ content: "Room", variable: "code" });
let roomName = generateRandomValue({ content: "Room", variable: "name" });
let locationCodeEdit,
  locationNameEdit,
  roomCodeEdit,
  roomNameEdit = "";

interface LocationParams {
  menu: string;
}

export class LocationPage {
  async createLocation({ menu }: LocationParams): Promise<void> {
    const address = faker.location.streetAddress();
    const latitude = faker.location.latitude();
    const longitude = faker.location.longitude();
    const code = menu === "Location" ? locationCode : roomCode;
    const name = menu === "Location" ? locationName : roomName;
    const button_save =
      menu === "Location" ? locators.button.SAVE_NEXT : locators.button.SAVE;
    if (menu === "Location") {
      locationCode = await checkDuplicate({
        path_api: path_location,
        value: locationCode,
      });
      await suiteGoto({ visible: "div #left-menu-dashboard" });
      await suiteClick({
        selector: '[data-qa="ico-menu-location"]',
        intercept: path_location,
        status_code: 200,
      });
      await suiteClick({
        selector_hover: '[data-qa="btn-group-create-location"]',
        selector: '[data-qa="btn-create-new-location"]',
        visible: "#location-create",
      });
      await fillTextField({
        wrapper: '[data-qa="input-number-latitude"] ',
        selector: "input",
        value: String(latitude),
      });
      await fillTextField({
        wrapper: '[data-qa="input-number-longitude"] ',
        selector: "input",
        value: String(longitude),
      });
    } else {
      await suiteClick({
        selector: '[data-qa="btn-create-room"]',
        visible: locators.dialog.FORMDIALOG,
      });
    }
    await fillTextField({
      wrapper: locators.formItem.NAME,
      selector: "input",
      value: name,
    });
    await fillTextField({
      wrapper: locators.formItem.CODE,
      selector: "input",
      value: code,
    });
    await fillTextField({
      wrapper: '[data-qa="form-item-address"]',
      selector: "textarea",
      value: address,
    });
    await uploadFile({
      selector: '[data-qa="input-file"]',
      file_path: `fixtures/img/baddog.jpeg`,
      is_dashboard: false,
      have_input_type: false,
    });
    await suiteClick({ selector: '[data-qa="crop-dialog-btn"]' });
    await suiteClick({ selector: '[data-qa="switch-publish"]' });
    waitForPageTimeout({});

    if (menu === "Location") {
      await suiteClick({ selector: button_save, visible: "body #location-detail-room" });
      const location = await callApi({
        endpoint: `${path_location}?search=${name}`,
        method: "GET",
      });
      const write_data = {
        id: location[0].id,
        name: location[0].name,
        code: location[0].code,
      };
      await writeFile({ filePath: `${path_file}/location.json`, data: write_data });
    } else {
      const location_data = await readFile(`${path_file}/location.json`);
      await suiteClick({
        selector: button_save,
        intercept: `${path_location}${location_data.id}/room/`,
        status_code: 201,
      });
      const room = await callApi({
        endpoint: `${path_location}${location_data.id}/room/?search=${name}`,
        method: "GET",
      });
      waitForPageTimeout({});
      const write_data = {
        id: room[0].id,
        name: room[0].name,
        code: room[0].code,
      };
      await writeFile({ filePath: `${path_file}/room.json`, data: write_data });
    }
  }

  async searchLocation({ menu }: LocationParams): Promise<void> {
    const location_data = await readFile(`${path_file}/location.json`);
    const room_data = await readFile(`${path_file}/room.json`);
    const name = menu === "Location" ? location_data.name : room_data.name;
    const code = menu === "Location" ? location_data.code : room_data.code;
    if (menu === "Location") {
      await suiteGoto({ visible: "div #left-menu-dashboard" });
      await suiteClick({
        selector: '[data-qa="ico-menu-location"]',
        intercept: path_location,
        status_code: 200,
      });
    } else {
      await suiteClick({
        wrapper: locators.buttonIcon.R1,
        selector: locators.buttonIcon.EDIT,
        visible: "body #location-detail-info",
      });
      await suiteClick({
        selector: '[data-qa="txt-tab-room"]',
        visible: "body #location-detail-room",
      });
    }
    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: "input",
      value: name,
      is_enter: true,
    });
    await suiteExpect({
      selector: '[data-qa="r1-txt-name"]',
      behavior: "text",
      value: name,
    });
    if (menu === "Location")
      await suiteExpect({
        selector: 'span[data-qa="r1-txt-code"]',
        behavior: "text",
        value: code,
      });
  }

  async editLocation({ menu }: LocationParams): Promise<void> {
    const location_data = await readFile(`${path_file}/location.json`);
    const room_data = await readFile(`${path_file}/room.json`);
    locationNameEdit = `${location_data.name}edit`;
    locationCodeEdit = `${location_data.code}e`;
    roomNameEdit = `${room_data.name}edit`;
    roomCodeEdit = `${room_data.code}e`;
    const nameEdit = menu === "Location" ? locationNameEdit : roomNameEdit;
    const codeEdit = menu === "Location" ? locationCodeEdit : roomCodeEdit;
    const button_save =
      menu === "Location" ? locators.buttonSave.BACK : locators.button.SAVE;
    if (menu === "Location") {
      await suiteGoto({ visible: "div #left-menu-dashboard" });
      await suiteClick({
        selector: '[data-qa="ico-menu-location"]',
        intercept: path_location,
        status_code: 200,
      });
    }
    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: "input",
      value: location_data.name,
      is_enter: true,
    });
    await suiteClick({
      wrapper: locators.buttonIcon.R1,
      selector: locators.buttonIcon.EDIT,
      visible: "body #location-detail-info",
    });

    if (menu === "Room") {
      await suiteClick({
        selector: '[data-qa="txt-tab-room"]',
        visible: "body #location-detail-room",
      });
      await fillTextField({
        wrapper: locators.fragment.SEARCH,
        selector: "input",
        value: room_data.name,
        is_enter: true,
      });
      await suiteClick({
        wrapper: locators.buttonIcon.R1,
        selector: locators.buttonIcon.EDIT,
        visible: locators.dialog.FORMDIALOG,
      });
    }

    await fillTextField({
      wrapper: locators.formItem.NAME,
      selector: "input",
      value: nameEdit,
    });
    await fillTextField({
      wrapper: locators.formItem.CODE,
      selector: "input",
      value: codeEdit,
    });
    if (menu === "Location") {
      await suiteClick({ selector: button_save, visible: "#location-page" });
    } else {
      const location_data = await readFile(`${path_file}/location.json`);
      const room_data = await readFile(`${path_file}/room.json`);
      await suiteClick({
        selector: button_save,
        intercept: `${path_location}${location_data.id}/room/${room_data.id}/`,
        status_code: 200,
      });
    }
  }

  async deleteLocation({ menu }: LocationParams): Promise<void> {
    const location_data = await readFile(`${path_file}/location.json`);
    const room_data = await readFile(`${path_file}/room.json`);
    const name = menu === "Location" ? locationNameEdit : roomNameEdit;
    const intercept_path =
      menu === "Location"
        ? `${path_location}${location_data.id}/`
        : `${path_location}${location_data.id}/room/${room_data.id}/`;
    if (menu === "Location") {
      await suiteGoto({ visible: "div #left-menu-dashboard" });
      await suiteClick({
        selector: '[data-qa="ico-menu-location"]',
        intercept: path_location,
        status_code: 200,
      });
    }
    await fillTextField({
      wrapper: locators.fragment.SEARCH,
      selector: "input",
      value: name,
      is_enter: true,
    });
    await suiteClick({
      wrapper: locators.buttonIcon.R1,
      selector: locators.ico.DELETE,
      visible: 'body .confirm-popper-class[aria-hidden="false"]',
    });
    await suiteClick({
      wrapper: 'body .confirm-popper-class[aria-hidden="false"]',
      selector: locators.button.CONFIRM,
      intercept: intercept_path,
      status_code: 204,
    });
  }
}
