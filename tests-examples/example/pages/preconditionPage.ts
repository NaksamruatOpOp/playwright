import {
  apiPublishContent,
  callApi,
  checkDuplicate,
  generateRandomValue,
  getContentType,
  page,
  readFile,
  readJSONFiles,
  settingEnrollContent,
  test,
  updateConfig,
  writeFile,
  waitForPageTimeout,
  getDefaultImage,
  waitApi,
} from "../../../utils/commands";

import {
  category,
  instructor,
  locationRoom,
  provider,
  material,
  activity,
  survey,
  exam,
  course,
} from "../../../utils/precontent/";
import { uploadFileToS3 } from "../../../utils/uploadS3";
import {
  UserParams,
  CreateUserParams,
  GroupUserParams,
  PreConParams,
  QuestionParams,
  choiceParams,
  courseParams,
  VerifyAssignUserParams,
  AssignUserParams,
  AddLearnerParams,
  AddContentParams,
  ConfirmAssignParams,
  SettingContentParams,
} from "../interfaces/precon.interface";

export { page, test };

const random = Math.floor(Math.random() * 10000) + 1;
const approvalName = "Learning Request Regression";
const bank_answer_question_name = "REGRESS Test Bank - ประเภทเติมคำตอบ (***ห้ามแก้!!!)";
const bank_choice_question_name = "REGRESS Test Bank - ประเภทตัวเลือก (***ห้ามแก้!!!)";
const bank_match_question_name = "REGRESS Test Bank - ประเภทจับคู่ (***ห้ามแก้!!!)";
const enrollName = "REGRESS Enroll Form";
const filePath = "data/regressPortal";
const dashboard_path_approval = "/api/dashboard/content-request/rule";
const dashboard_path_bank = "/api/dashboard/bank";
const coursePath = "/api/dashboard/course";

const contentMapping: Record<string, string> = {
  exvideo: "external-video",
  flashcard: "flash-card",
  class_program: "event",
};

export class PreconPage {
  async addEnrollForm({
    content,
    isMaterial = false,
  }: SettingContentParams): Promise<void> {
    const contentType = ["pathway_schedule", "pathway_duration"].includes(content)
      ? "learning-path"
      : content;
    const apiContent = contentMapping[contentType] || contentType;
    const contentData = await readFile(`${filePath}/${content}.json`);
    const idContent =
      content === "class_program" ? contentData[0].idClass : contentData.id;

    let attempts = 0;
    const maxRetries = 5;
    const delayMs = 5000;

    while (attempts < maxRetries) {
      const response = await callApi({
        endpoint: `/api/dashboard/${apiContent}/${idContent}/learner/?status=LEARNING`,
        method: "GET",
      });

      if (response.length >= 1) {
        break;
      }

      attempts++;
      if (attempts < maxRetries) {
        await waitForPageTimeout({ waitTime: delayMs });
      } else {
        console.error(
          `Max retry attempts (${maxRetries}) reached for content: ${content}`
        );
      }
    }

    const { id: enrollFormID } = await readFile(`${filePath}/enrollform.json`);
    const body = {
      form: enrollFormID,
      type_access: isMaterial ? -1 : 3,
    };

    await callApi({
      endpoint: `/api/dashboard/${apiContent}/${idContent}/enrollment/setting/`,
      method: "PATCH",
      body,
    });
  }

  async checkContentExist({ content = "" }: { content: string }): Promise<void> {
    const question_survey = [
      {
        name: "ข้อมูลแบบสำรวจ",
        type: 0,
        desc: "จัดทำขึ้นเพื่อสำรวจความคิดเห็นต่อ Content",
        is_optional: true,
      },
      {
        name: "ความพึงพอใจ",
        sort: 2,
        type: 7,
        ratingDetails: {
          sort: 8,
          max_select: 1,
          label_max: "มาก",
          label_min: "น้อย",
          value_max: 5,
          value_min: 0,
          is_average: true,
          is_optional: true,
        },
      },
      {
        name: "เนื้อหาน่าสนใจ",
        sort: 2,
        type: 7,
        ratingDetails: {
          sort: 8,
          max_select: 1,
          label_max: "มาก",
          label_min: "น้อย",
          value_max: 5,
          value_min: 0,
          is_average: true,
          is_optional: false,
        },
      },
      {
        name: "ระดับความรู้ของครูผู้สอน",
        sort: 3,
        type: 1,
        is_optional: false,
      },
      {
        name: "ให้คะแนนครูผู้สอนกี่คะแนน (เต็ม 10)",
        type: 6,
      },
      {
        name: "ชอบส่วนไหนของวิชา",
        type: 3,
        choices: ["เนื้อหา", "ครู", "สื่อการสอน"],
        max_select: 2,
        is_optional: true,
      },
      {
        name: "เลือกสิ่งที่คิดว่าดีที่สุด",
        type: 2,
        choices: ["เนื้อหา", "ครู", "สื่อการสอน"],
        is_optional: true,
      },
      {
        name: "อยากให้ปรับปรุงอะไรที่สุด",
        type: 8,
        choices: ["เนื้อหา", "ครู", "สื่อการสอน"],
        is_optional: true,
      },
      {
        name: "อธิบายสิ่งที่คิดว่าควรปรับปรุง สั้นๆ",
        type: 5,
      },
      {
        name: "ข้อเสนอแนะเพิ่มเติม",
        type: 6,
      },
    ];

    const question_linkert = [
      {
        name: "เนื้อหาน่าสนใจเป็นอย่างมาก",
        type: 9,
      },

      {
        name: "ครูผู้สอนมีความรู้",
        type: 9,
      },

      {
        name: "สื่อการเรียนการสอนสวยงาม เข้าใจง่าย",
        type: 9,
      },

      {
        name: "อยากเรียนอีก",
        type: 9,
      },

      {
        name: "แนะนำผู้อื่นมั้ย",
        type: 9,
      },
    ];

    const contentConfig: Record<
      string,
      { api: string; search: string; action: () => Promise<void> }
    > = {
      instructor: {
        api: "api/dashboard/instructor/",
        search: "REGRESS Instructor (***ห้ามแก้!!!)",
        action: async () => {
          await instructor({ name: "REGRESS Instructor (***ห้ามแก้!!!)", filePath });
        },
      },

      category: {
        api: "api/dashboard/category/",
        search: "REGRESS Category (***ห้ามแก้!!!)",
        action: async () => {
          await category({ name: "REGRESS Category (***ห้ามแก้!!!)", filePath });
        },
      },

      provider: {
        api: "api/dashboard/provider/",
        search: "REGRESS Provider (***ห้ามแก้!!!)",
        action: async () => {
          await provider({ name: "REGRESS Provider (***ห้ามแก้!!!)", filePath });
        },
      },

      location: {
        api: "api/dashboard/location/",
        search: "REGRESS Location (***ห้ามแก้!!!)",
        action: async () => {
          await locationRoom({
            locationName: "REGRESS Location (***ห้ามแก้!!!)",
            filePath,
            roomName: "REGRESS Room (***ห้ามแก้!!!)",
          });
        },
      },

      video: {
        api: "api/dashboard/video/",
        search: "REGRESS Video (***ห้ามแก้!!!)",
        action: async () => {
          await material({
            name: "REGRESS Video (***ห้ามแก้!!!)",
            filePath,
            materialType: "video",
            preContentPath: filePath,
          });
        },
      },

      audio: {
        api: "api/dashboard/audio/",
        search: "REGRESS Audio (***ห้ามแก้!!!)",
        action: async () => {
          await material({
            name: "REGRESS Audio (***ห้ามแก้!!!)",
            filePath,
            materialType: "audio",
            preContentPath: filePath,
          });
        },
      },

      document: {
        api: "api/dashboard/document/",
        search: "REGRESS Document (***ห้ามแก้!!!)",
        action: async () => {
          await material({
            name: "REGRESS Document (***ห้ามแก้!!!)",
            filePath,
            materialType: "document",
            preContentPath: filePath,
          });
        },
      },

      exvideo: {
        api: "api/dashboard/external-video/",
        search: "REGRESS External Video (***ห้ามแก้!!!)",
        action: async () => {
          await material({
            name: "REGRESS External Video (***ห้ามแก้!!!)",
            filePath,
            materialType: "external-video",
            preContentPath: filePath,
          });
        },
      },

      article: {
        api: "api/dashboard/article/",
        search: "REGRESS Article (***ห้ามแก้!!!)",
        action: async () => {
          await material({
            name: "REGRESS Article (***ห้ามแก้!!!)",
            filePath,
            materialType: "article",
            preContentPath: filePath,
          });
        },
      },

      flashcard: {
        api: "api/dashboard/flash-card/",
        search: "REGRESS Flash (***ห้ามแก้!!!)",
        action: async () => {
          await material({
            name: "REGRESS Flash (***ห้ามแก้!!!)",
            filePath,
            materialType: "flash-card",
            preContentPath: filePath,
          });
        },
      },

      "survey-poll": {
        api: "api/dashboard/survey/",
        search: "แบบสอบถามสำหรับ Regression (Poll) (***ห้ามแก้!!!)",
        action: async () => {
          await survey({
            name: "แบบสอบถามสำหรับ Regression (Poll) (***ห้ามแก้!!!)",
            filePath,
            preContentPath: filePath,
            questions: question_survey,
            type: 0,
            surveyType: 0,
            isContentRegress: true,
          });
        },
      },

      "survey-questionaire": {
        api: "api/dashboard/survey/",
        search: "แบบสอบถามสำหรับ Regression (Questionaire) (***ห้ามแก้!!!)",
        action: async () => {
          await survey({
            name: "แบบสอบถามสำหรับ Regression (Questionaire) (***ห้ามแก้!!!)",
            filePath,
            preContentPath: filePath,
            questions: question_survey,
            type: 1,
            surveyType: 1,
            isContentRegress: true,
          });
        },
      },

      "survey-linkert": {
        api: "api/dashboard/survey/",
        search: "แบบสอบถามสำหรับ Regression (Linkert) (***ห้ามแก้!!!)",
        action: async () => {
          await survey({
            name: "แบบสอบถามสำหรับ Regression (Linkert) (***ห้ามแก้!!!)",
            filePath,
            preContentPath: filePath,
            questions: question_linkert,
            type: 2,
            surveyType: 3,
            isContentRegress: true,
          });
        },
      },

      activity: {
        api: "api/dashboard/activity/",
        search: "REGRESS Activity (***ห้ามแก้!!!)",
        action: async () => {
          await activity({
            name: "REGRESS Activity (***ห้ามแก้!!!)",
            filePath,
            preContentPath: filePath,
          });
        },
      },

      enrollform: {
        api: "api/dashboard/form/",
        search: "REGRESS Enroll Form",
        action: async () => {
          await preconEnrollForm();
        },
      },

      "bank-fill-in-answer": {
        api: "api/dashboard/bank/",
        search: bank_answer_question_name,
        action: async () => {
          await preconBank({ type: "fill-in-answer" });
        },
      },

      "bank-choice": {
        api: "api/dashboard/bank/",
        search: bank_choice_question_name,
        action: async () => {
          await preconBank({ type: "choice" });
        },
      },

      "bank-matching": {
        api: "api/dashboard/bank/",
        search: bank_match_question_name,
        action: async () => {
          await preconBank({ type: "matching" });
        },
      },

      exam: {
        api: "api/dashboard/exam/",
        search: "REGRESS TEST - ชุดข้อสอบสำหรับ Regression (***ห้ามแก้!!!)",
        action: async () => {
          await preconExamRegress();
        },
      },

      course: {
        api: "api/dashboard/course/",
        search: "REGRESS Course (***ห้ามแก้!!!)",
        action: async () => {
          await course({
            name: "REGRESS Course (***ห้ามแก้!!!)",
            filePath,
            preContentPath: filePath,
          });
        },
      },
    };

    const config = contentConfig[content];
    const { api, search, action } = config;
    let response = await callApi({ endpoint: `${api}?search=${search}`, method: "GET" });

    if (Array.isArray(response) && response.length === 0) {
      await action();
      response = await callApi({ endpoint: `${api}?search=${search}`, method: "GET" });
    }

    if (content === "location") {
      const res_location = response[0];
      const location_id = res_location.id;
      const { 0: res_room } = await callApi({
        endpoint: `${api}${location_id}/room/`,
        method: "GET",
      });

      const write_data = {
        location_name: res_location.name,
        location_code: res_location.code,
        location_id,
        latitude: res_location.latitude,
        longitude: res_location.longitude,
        address: res_location.address,
        room_name: res_room?.name ?? null,
        room_code: res_room?.code ?? null,
        room_id: res_room?.id ?? null,
      };
      await writeFile({ filePath: `${filePath}/${content}.json`, data: write_data });
    } else {
      await writeFile({ filePath: `${filePath}/${content}.json`, data: response[0] });
    }
  }

  async createCourse({ course = "" }: courseParams): Promise<void> {
    let firstSectionContent = [
      "video",
      "audio",
      "exvideo",
      "document",
      "article",
      "flashcard",
    ];
    let secondSectionContent = [
      "exam",
      "activity",
      "survey-linkert",
      "survey-questionaire",
      "survey-poll",
    ];

    const jsonData = await readJSONFiles({
      jsonFiles: ["category.json", "provider.json", "instructor.json"],
      path_file: filePath,
    });

    const { category, provider, instructor } = jsonData;
    let code = generateRandomValue({ content: "Course", variable: "code" });
    const nameCourse = `Regress Course ${course} (***ห้ามแก้!!!)`;

    code = await checkDuplicate({ path_api: "api/dashboard/course/", value: code });

    await getContentType();

    const body = {
      name: nameCourse,
      code,
      category: category.id,
      provider: provider.id,
      instructor_list: [instructor.id],
    };

    // Check if course exists
    let resSearch = await callApi({
      endpoint: `${coursePath}/?search=${nameCourse}&page=1`,
      method: "GET",
    });

    if (Array.isArray(resSearch) && resSearch.length > 0) {
      await writeFile({
        filePath: `${filePath}/course_${course}.json`,
        data: { id: resSearch[0].id, name: nameCourse, code: resSearch[0].code },
      });
      return;
    }

    // Create new course
    const { id: courseId } = await callApi({
      endpoint: `${coursePath}/`,
      method: "POST",
      body,
    });

    // Create first section
    let { id: sectionId } = await callApi({
      endpoint: `${coursePath}/${courseId}/section/`,
      method: "POST",
      body: { name: "Material section" },
    });

    if (course !== "learn") {
      firstSectionContent = ["article"];
      secondSectionContent = ["activity"];
    }

    // Add first section content
    for (const material of firstSectionContent) {
      const materialData = await readFile(`${filePath}/${material}.json`);
      const name_material = materialData.name_content.trim();
      const content_type = materialData.content_type.id;
      const content_id = materialData.id;

      const body = {
        name: name_material,
        content_type,
        content_id,
        is_required: true,
        is_display: true,
        isSelectMaterial: true,
        section_content_id: sectionId,
        is_non_skippable: true,
        is_paused_inactive: true,
        is_preview: true,
      };

      await callApi({
        endpoint: `${coursePath}/${courseId}/section/${sectionId}/slot/`,
        method: "POST",
        body,
      });
    }

    // Create second section
    ({ id: sectionId } = await callApi({
      endpoint: `${coursePath}/${courseId}/section/`,
      method: "POST",
      body: { name: "แบบทดสอบและกิจกรรม" },
    }));

    // Add second section content
    for (const material of secondSectionContent) {
      const materialData = await readFile(`${filePath}/${material}.json`);
      const contentType = await readFile("data/responses/content_type.json");
      const name_material = materialData.name.trim();
      let content_type_data = "";

      if (material.includes("survey")) {
        content_type_data = contentType.find((item) => item.code === "survey.survey").id;
      } else {
        content_type_data = materialData.content_type.id;
      }
      const content_id = materialData.id;

      const body = {
        name: name_material,
        content_type: content_type_data,
        content_id,
        is_required: true,
        is_display: true,
        isSelectMaterial: true,
        section_content_id: sectionId,
        is_non_skippable: true,
        is_paused_inactive: true,
        is_preview: true,
      };

      await callApi({
        endpoint: `${coursePath}/${courseId}/section/${sectionId}/slot/`,
        method: "POST",
        body,
      });
    }

    // Save course data
    await writeFile({
      filePath: `${filePath}/course_${course}.json`,
      data: { id: courseId, name: nameCourse, code },
    });
  }

  async createUserGroup() {
    await createGroup("mag");
    await createGroup("user");
    await addUserGroup({ role: "manager" });
    await addUserGroup({ role: "user" });
    await addUserGroup({ role: "manager", IsStandAlone: true });
    await addUserGroup({ role: "user", IsStandAlone: true });
  }

  async createUser({ IsStandAlone = false }: UserParams): Promise<void> {
    const modi_name = IsStandAlone ? "StandAlone" : "Content";
    const random = Math.floor(Math.random() * 10000) + 1;
    const data = {
      manager: {
        code: `manager${modi_name}${random}`,
      },
      user: {
        code: `user${modi_name}${random}`,
      },
    };

    let manager_id = await createAccount({
      role: "manager",
      userData: data.manager,
      IsStandAlone,
    });

    if (!manager_id) {
      throw new Error("Manager ID is required to create a user.");
    }
    await createAccount({
      role: "user",
      userData: data.user,
      managerId: manager_id,
      IsStandAlone,
    });
  }

  async doConfigGrow({ value }: any): Promise<void> {
    await updateConfig({ list: ["grow-competency-is-enable"], value });
  }

  async inactiveCustomField(): Promise<void> {
    const response = await callApi({
      endpoint: "/api/om/dashboard/dynamic-field?",
      method: "GET",
    });

    const customFields = response.custom_fields || [];
    const activeCustomFields = customFields
      .filter((field: any) => field.is_active)
      .map((field: any) => ({
        column_name: field.column_name,
        id: field.id,
        field_code: field.field_code,
      }));

    if (activeCustomFields.length === 0) {
      console.log("No active custom fields to update.");
      return;
    }

    for (const field of activeCustomFields) {
      const body = [
        {
          id: field.id,
          field_code: field.field_code,
          is_require: false,
          is_active: false,
          is_sensitive: true,
        },
      ];

      await callApi({
        endpoint: "/api/om/dashboard/dynamic-field",
        method: "PATCH",
        body,
        retry: 1,
      });
    }
  }

  async importUser(): Promise<void> {
    const { filePath, fileName } = await uploadFileToS3({
      fixture: "fixtures/excel/ui/user_preuser.xlsx",
      pathMenu: "dashboard/import/account/",
      hasDate: false,
    });

    await callApi({
      endpoint: "/api/om/dashboard/import/account",
      method: "POST",
      body: { input_filename: fileName, s3Key: filePath },
      retry: 1,
    });
  }

  async preconApprovalFlow() {
    await getContentTypeApproval();
    const total_approval = await checkExistApprovalFlow();
    if (total_approval === 0) {
      await createApprovalFlow();
      await addCondition();
      await addApproval();
    }
  }

  async settingCourse({ course = "" }: courseParams): Promise<void> {
    const { id: courseID } = await readFile(`${filePath}/course_${course}.json`);

    if (course === "enrollform") {
      const { id: enrollFormID } = await readFile(`${filePath}/enrollform.json`);
      const body = { form: enrollFormID, type_access: 3 };

      await callApi({
        endpoint: `${coursePath}/${courseID}/enrollment/setting/`,
        method: "PATCH",
        body,
      });
    }

    const enrollConfig =
      course === "waiting"
        ? {
            contentPath: "course",
            idContent: courseID,
            status: "open",
            learner: 1,
            waitingList: true,
          }
        : { contentPath: "course", idContent: courseID, status: "open" };

    // Execute enrollment setting and publishing concurrently
    await Promise.all([
      settingEnrollContent(enrollConfig),
      apiPublishContent({
        contentPath: "course",
        idContent: courseID,
        status: "publish",
      }),
    ]);
  }

  async settingStandAlone({
    content,
    isMaterial = false,
  }: SettingContentParams): Promise<void> {
    const contentData = await readFile(`${filePath}/${content}.json`);
    const idContent = contentData.id;
    const contentType =
      content === "pathway_schedule" || content === "pathway_duration"
        ? "learning-path"
        : content;

    const body = {
      type_access: isMaterial ? -1 : 3,
    };

    const apiContent = contentMapping[contentType] || contentType;

    await callApi({
      endpoint: `/api/dashboard/${apiContent}/${idContent}/enrollment/setting/`,
      method: "PATCH",
      body,
    });

    await settingEnrollContent({
      contentPath: apiContent,
      idContent,
      status: "open",
      learner: 1,
      waitingList: true,
    });
    await apiPublishContent({ contentPath: apiContent, idContent, status: "publish" });
  }

  async verifyAssignUser({ content }: VerifyAssignUserParams): Promise<void> {
    await getContentType();
    const read_path_content = content === "course" ? "course_waiting" : `${content}`;
    const contentData = await readFile(`${filePath}/${read_path_content}.json`);
    const idContent =
      content === "class_program" ? contentData[0].idClass : contentData.id;
    const contentType =
      content === "pathway_schedule" || content === "pathway_duration"
        ? "learning-path"
        : content;
    const apiContent = contentMapping[contentType] || contentType;

    const response = await callApi({
      endpoint: `/api/dashboard/${apiContent}/${idContent}/learner/`,
      method: "GET",
      fullResponse: true,
    });
    const count_learner = response.data.count_transaction_status_list.LEARNING ?? 0;

    if (count_learner === 0) {
      await createAccount({ role: "assign", userData: { code: `assignPlay${random}` } });
      await assignUser({ idContent, content: contentType });
    }
  }

  async updatePreConfig() {
    await updateConfig({ list: ["event-change-check-in"], value: 0 });
    await updateConfig({
      list: ["learning-path-event-program-is-enabled", "learning-path-event-is-enabled"],
      value: 1,
    });
  }
}

async function assignUser({ idContent, content }: AssignUserParams): Promise<void> {
  const contentMap = {
    activity: "internal.activity",
    course: "internal.course",
    video: "internal.learning_material.video",
    audio: "internal.learning_material.audio",
    exvideo: "internal.learning_material.external_video",
    document: "internal.learning_material.document",
    article: "internal.learning_material.article",
    flashcard: "internal.learning_material.flash_card",
    class_program: "internal.class",
    "learning-path": "internal.learning_path.*",
  };

  // Get the corresponding external_code
  const external_code = contentMap[content];
  const response = await callApi({
    endpoint: "/api/dashboard/assignment/",
    method: "POST",
    fullResponse: true,
  });
  const assignmentId = response.data.id;
  await addLearner({ assignmentId });
  await addContent({ assignmentId, external_code, idContent });
  await confirmAssign({ assignmentId });
}

async function addContent({
  assignmentId,
  external_code,
  idContent,
}: AddContentParams): Promise<void> {
  const content_type_list = await readFile("data/responses/content_type.json");
  const materialType = content_type_list.find(
    (item) => item.external_code === external_code
  );
  const body = {
    content_type_id: materialType.id,
    content_list: [idContent],
  };

  await callApi({
    endpoint: `/api/dashboard/assignment/${assignmentId}/content/`,
    method: "POST",
    body,
  });

  const response = await waitApi({
    method: "GET",
    endpoint: `api/dashboard/assignment/${assignmentId}/preview/`,
    waitKey: "item_list",
    hasResult: true,
  });

  const assign = await readFile(`${filePath}/assign.json`);
  const newData = {
    previewcontentId: response[0].item_list[0].id,
    contentId: response[0].item_list[0].content_id,
  };

  const mergedData = { ...assign, ...newData };

  await writeFile({ filePath: `${filePath}/assign.json`, data: mergedData });
}

async function addLearner({ assignmentId }: AddLearnerParams): Promise<void> {
  const userData = await readFile(`${filePath}/assign_user.json`);
  const path_api = `/api/dashboard/assignment/${assignmentId}/member/`;
  const body = {
    members: [userData.id],
  };

  await callApi({
    endpoint: path_api,
    method: "POST",
    body,
  });

  const response = await callApi({
    endpoint: path_api,
    method: "GET",
  });

  const data = {
    previewAccountId: response[0].id,
  };

  await writeFile({ filePath: `${filePath}/assign.json`, data });
}

async function confirmAssign({ assignmentId }: ConfirmAssignParams): Promise<void> {
  const assign = await readFile(`${filePath}/assign.json`);

  const body = {
    assign_period_valid: false,
    assigned_time: 1,
    content_period_doing: {
      type: 3,
      datetime_start: null,
      datetime_end: null,
      duration: 0,
    },
    content_period_expand: {
      type: 0,
      datetime_start: null,
      datetime_end: null,
      duration: 0,
    },
    datetime_assign: null,
    expand_period_valid: false,
    is_confirm: true,
    is_expire: true,
    is_noti_supervisor: false,
    is_save_draft: false,
    is_select_all: false,
    type_approval_flow: 0,
    update_all_status: [],
    update_status: [
      {
        index: 0,
        previewAccountId: assign.previewAccountId,
        itemListIndex: 0,
        id: assign.previewcontentId,
        status: 10,
        content_id: assign.contentId,
      },
    ],
  };

  await callApi({
    endpoint: `/api/dashboard/assignment/${assignmentId}/preview/`,
    method: "POST",
    body,
  });

  await waitForPageTimeout({});
}

async function getPreconditionUser(): Promise<PreConParams | undefined> {
  const searchData = "Automate+Playwright";
  const maxRetries = 5;
  const retryDelay = 5000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Initiate API calls concurrently
      const [departmentResponse, positionResponse, levelResponse] = await Promise.all([
        callApi({
          endpoint: `/api/om/dashboard/department?search=${searchData}`,
          method: "GET",
          retry: 1,
        }),
        callApi({
          endpoint: `/api/om/dashboard/position?search=${searchData}`,
          method: "GET",
          retry: 1,
        }),
        callApi({
          endpoint: `/api/om/dashboard/level?search=${searchData}`,
          method: "GET",
          retry: 1,
        }),
      ]);

      const departmentId = departmentResponse[0]?.id;
      const positionId = positionResponse[0]?.id;
      const levelId = levelResponse[0]?.id;

      console.log(`Attempt ${attempt}:`, { departmentId, positionId, levelId });

      if (departmentId && positionId && levelId) {
        return {
          departmentId,
          positionId,
          levelId,
        };
      }

      throw new Error("One or more IDs could not be retrieved.");
    } catch (error) {
      console.error(`Attempt ${attempt} failed: ${error.message}`);

      if (attempt === maxRetries) {
        throw new Error(
          "Failed to fetch IDs after multiple attempts. Please check the API or input data."
        );
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
}

async function createAccount(params: CreateUserParams): Promise<number> {
  const { role, userData, managerId, IsStandAlone } = params;

  const image = await getDefaultImage();
  if (!image) {
    throw new Error("Default image not found");
  }

  const { departmentId, levelId, positionId } = (await getPreconditionUser()) ?? {};
  const password = "adminadmin";
  const phone = "1234567890";
  const id_card = "1234567890123";
  const address = "Test Address";
  const date_birth = "1996-10-24T00:00:00.000Z";
  const date_start = "2023-11-01T00:00:00.000Z";
  const modi_name = IsStandAlone ? "stand" : "";
  const name_file = `${modi_name}${role}`;
  const code = await checkDuplicate({
    path_api: "api/om/dashboard/account",
    value: userData.code,
  });

  const body: Record<string, any> = {
    image: image.image,
    image_url: image.image_url,
    email: `${code}@conicle.com`,
    phone_country_code: "+66",
    phone_phone_number: phone,
    code,
    username: code,
    password,
    confirm_password: password,
    id_card,
    title: "Mr.",
    first_name: code,
    middle_name: "Middle",
    last_name: "Automate",
    gender: 1,
    address,
    date_birth,
    date_start,
    is_active: true,
    department: departmentId,
    department_id: departmentId,
    level_id: levelId,
    position_id: positionId,
  };

  if (role === "user") {
    body["supervisor_id"] = managerId;
  }

  const response = await callApi({
    endpoint: "/api/om/dashboard/account",
    method: "POST",
    body,
    retry: 1,
  });

  await writeFile({ filePath: `${filePath}/${name_file}_user.json`, data: response });

  const user_id = response["id"];

  if (role === "manager") {
    const roleBody = { account_id: user_id };
    await callApi({
      endpoint: "/api/om/dashboard/role/1/member",
      method: "POST",
      body: roleBody,
      retry: 1,
    });
  }

  return user_id;
}

async function createGroup(role: string): Promise<void> {
  const today = new Date();
  const groupName = `group regress playwright ${role}`;
  let groupCode = `Gro${today.getMinutes()}${today.getSeconds()}${role}`;
  let groupId = "";

  const body = { name: groupName, code: groupCode };

  // Check if the group already exists
  const existingGroup = await callApi({
    endpoint: `/api/om/dashboard/group?search=${groupName}`,
    method: "GET",
  });

  if (existingGroup.length > 0) {
    groupId = existingGroup[0].id;
    groupCode = existingGroup[0].code;
  } else {
    const response = await callApi({
      endpoint: "/api/om/dashboard/group",
      method: "POST",
      body,
      retry: 1,
    });

    groupId = response.id;
  }

  // Prepare data to write
  const groupData =
    role === "mag"
      ? { admin_name: groupName, admin_code: groupCode, admin_id: groupId }
      : await readFile(`${filePath}/group.json`);

  if (role !== "mag") {
    groupData.user_name = groupName;
    groupData.user_code = groupCode;
    groupData.user_id = groupId;
  }

  await writeFile({ filePath: `${filePath}/group.json`, data: groupData });
}

async function addUserGroup(params: GroupUserParams): Promise<void> {
  const { role, IsStandAlone } = params;
  const modiName = IsStandAlone ? "stand" : "";
  const nameFile = `${modiName}${role}`;
  const pathFileUser = `${filePath}/${nameFile}_user.json`;

  const groupData = await readFile(`${filePath}/group.json`);
  const user = await readFile(pathFileUser);

  const groupId = role === "manager" ? groupData.admin_id : groupData.user_id;
  const endpointPath = `/api/om/dashboard/group/${groupId}`;

  // Add user to the group
  await callApi({
    endpoint: `${endpointPath}/member`,
    method: "POST",
    body: { account_id_list: [user.id] },
    retry: 1,
  });

  // Update group display
  await callApi({
    endpoint: endpointPath,
    method: "PATCH",
    body: { is_display: true },
    retry: 1,
  });
}

async function getContentTypeApproval(): Promise<void> {
  const path_content_type =
    "/api/dashboard/filter/content-type/?exclude=survey.survey,video.video,video.externalvideo,audio.audio,material.pdf,material.article,flashcard.flashcard,learning_content.learningcontent&is_coniclex=true&format=json";
  await callApi({
    endpoint: path_content_type,
    method: "GET",
    filePath: `${filePath}/content_type.json`,
  });
}

async function checkExistApprovalFlow(): Promise<number> {
  const response = await callApi({
    endpoint: `/api/dashboard/content-request/rule/?search=${approvalName}`,
    method: "GET",
  });
  const response_length = Object.keys(response).length;
  return response_length;
}

async function checkSort(): Promise<number> {
  let sort = 1;

  while (true) {
    const response = await callApi({
      endpoint: "/api/dashboard/content-request/rule/?page_size=100&type_rule=0",
      method: "GET",
      retry: 1,
    });

    const responseArray = Array.isArray(response) ? response : [];
    if (responseArray.length > 0) {
      sort = responseArray[responseArray.length - 1].sort + 1;
    }

    const resData = await callApi({
      endpoint: `/api/dashboard/content-request/rule/priority-check/?type_rule=0&priority=${sort}`,
      method: "GET",
    });

    if (resData.is_available) {
      return sort;
    }
  }
}

async function createApprovalFlow(): Promise<void> {
  const today = new Date();
  const randomNum = Math.floor(Math.random() * 100) + 1;
  const approvalCode = `play-${today.getMinutes()}${today.getSeconds()}${randomNum}`;

  const contentType = await readFile(`${filePath}/content_type.json`);
  const idsString = contentType.map((item) => item.id).join(",");

  const sort = await checkSort();

  const body = {
    code: approvalCode,
    content_type_list: idsString,
    id: null,
    name: approvalName,
    sort,
    type_request_list: "1,2",
    type_rule: 0,
    create_step: 1,
  };

  await callApi({
    endpoint: "/api/dashboard/content-request/rule/",
    method: "POST",
    body,
    filePath: `${filePath}/approval.json`,
  });
}

async function addApproval(): Promise<void> {
  const group = await readFile(`${filePath}/group.json`);
  const approval = await readFile(`${filePath}/approval.json`);

  const approvalBody = {
    approver_list: [
      {
        step: 1,
        duration_expire: 0,
        is_notification: true,
        is_notification_final: false,
        condition: {
          fields_list: [
            {
              column_name: "Group",
              field_code: "group",
              type_field: 1,
              type_data: 3,
              value: [group.admin_id],
              training_group: null,
            },
          ],
        },
      },
    ],
  };

  const stepBody = { create_step: 3, status: 2 };

  // Add approval step
  await callApi({
    endpoint: `${dashboard_path_approval}/${approval.id}/step/approver/`,
    method: "POST",
    body: approvalBody,
  });

  // Update approval step status
  await callApi({
    endpoint: `${dashboard_path_approval}/${approval.id}/`,
    method: "PATCH",
    body: stepBody,
  });
}

async function addCondition(): Promise<void> {
  const group = await readFile(`${filePath}/group.json`);
  const approval = await readFile(`${filePath}/approval.json`);

  const conditionBody = {
    fields_list: [
      {
        column_name: "Group",
        field_code: "group",
        training_group: null,
        type_data: 3,
        type_field: 1,
        value: [group.user_id],
      },
    ],
  };

  const stepBody = { create_step: 2 };

  await callApi({
    endpoint: `${dashboard_path_approval}/${approval.id}/condition/`,
    method: "PATCH",
    body: conditionBody,
  });

  await callApi({
    endpoint: `${dashboard_path_approval}/${approval.id}/`,
    method: "PATCH",
    body: stepBody,
  });
}

async function preconBank({ type = "" }: { type: string }): Promise<void> {
  const typeBank: Record<string, { name: string; level: number; type_question: number }> =
    {
      "fill-in-answer": {
        level: 2,
        type_question: 6,
        name: bank_answer_question_name,
      },
      choice: {
        level: 1,
        type_question: 1,
        name: bank_choice_question_name,
      },
      matching: {
        level: 1,
        type_question: 2,
        name: bank_match_question_name,
      },
    };

  if (!typeBank[type]) {
    throw new Error(`Invalid question type: ${type}`);
  }

  const { name, type_question, level } = typeBank[type];

  const jsonData = await readJSONFiles({
    jsonFiles: ["category.json", "provider.json"],
    path_file: filePath,
  });

  const categoryData = jsonData.category;
  const providerData = jsonData.provider;

  const body = {
    category: categoryData.id,
    category_list: [],
    content_level: level,
    name,
    provider: providerData.id,
    provider_list: [],
    type_question,
  };

  const res = await callApi({
    endpoint: `${dashboard_path_bank}/`,
    method: "POST",
    body,
  });

  const bankID = res.id;

  // Process based on question type
  const typeHandlers: Record<string, (args: { bankID: string }) => Promise<void>> = {
    "fill-in-answer": createFillInAnswer,
    choice: createChoiceBank,
    matching: createMatching,
  };

  await typeHandlers[type]({ bankID });

  // Save the created bank data
  await writeFile({
    filePath: `${filePath}/bank-${type}.json`,
    data: { id: bankID },
  });
}

async function createFillInAnswer({ bankID }: { bankID: string }): Promise<void> {
  const totalQuestions = [
    {
      question: "กล้วย ภาษาอังกฤษคือ",
      hint: "Banana",
      totalChoice: ["Banana", "Nanana"],
    },
    {
      question: "Cat ภาษาไทยเรียกว่า",
      hint: "แมว",
      totalChoice: ["แมวน้ำ", "แมว"],
    },
    {
      question: "สีประจำวันจันทร์คือ",
      hint: "เหลือง",
      totalChoice: ["เหลือง", "เขียว"],
    },
  ];

  for (const { question, hint, totalChoice } of totalQuestions) {
    // Step 1: Create the question (POST)
    const { number: questionId } = await callApi({
      endpoint: `${dashboard_path_bank}/${bankID}/question/`,
      method: "POST",
    });

    // Step 2: Patch the created question (PATCH)
    await callApi({
      endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/`,
      method: "PATCH",
      body: {
        desc: question,
        desc_hint: hint,
        desc_answer: hint,
        type: 6,
        answer_gap: 0,
        tag_list: [],
        tags: [],
      },
    });

    // Step 3: Create choices (POST for each)
    const choiceResponses = await Promise.all(
      totalChoice.map(() =>
        callApi({
          endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/choice/`,
          method: "POST",
        })
      )
    );

    // Step 4: Patch each choice with its corresponding text (PATCH)
    await Promise.all(
      choiceResponses.map(({ id }, index) =>
        callApi({
          endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/choice/${id}/`,
          method: "PATCH",
          body: {
            desc: totalChoice[index],
            is_answer: false,
          },
        })
      )
    );

    // Step 5: Create the correct answer choice (POST)
    const { id: correctID } = await callApi({
      endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/choice/`,
      method: "POST",
    });

    // Step 6: Patch the correct answer with the correct hint (PATCH)
    await callApi({
      endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/choice/${correctID}/`,
      method: "PATCH",
      body: {
        desc: hint,
        is_answer: true,
        is_case_sensitive: true,
      },
    });
  }
}

async function createChoiceBank({ bankID }: { bankID: string }): Promise<void> {
  const totalQuestions = [
    {
      question: "มุมฉากมีขนาดเท่าไหร่",
      hint: "90 องศา",
      totalChoice: ["90 องศา", "90 เซลเซียส", "90 องค์บาก", "90 ต้มยำกุ้ง"],
    },
    {
      question: "คนเราควรกินอาหารกี่หมู่",
      hint: "5 หมู่",
      totalChoice: ["5 หมู่", "50 หมู่", "500,000 หมู่", "500,000,000 หมู่"],
    },
    {
      question: "สัญญาณไฟจราจรสีใด ถึงจะข้ามถนนได้",
      hint: "สีแดง",
      totalChoice: ["สีแดง", "สีดอกอัญชัน", "สีโปสเตอร์", "สีซอให้ควายฟัง"],
    },
    {
      question: "Orange แปลว่า",
      hint: "สีส้ม",
      totalChoice: [
        "สีส้ม",
        "ยัยส้มปี๊ด",
        "อัศวินส้มฮอลแลนด์",
        "คุยกันมากขึ้น นาทีละ 3 บาท",
      ],
    },
    {
      question: "พระยาพิชัยอะไรหัก",
      hint: "ดาบ",
      totalChoice: ["เครื่องยิงจรวดมิไซล์", "กระบองสองท่อน", "หอก", "ดาบ"],
    },
  ];

  for (const { question, hint, totalChoice } of totalQuestions) {
    // Step 1: Create question (POST)
    const { number: questionId } = await callApi({
      endpoint: `${dashboard_path_bank}/${bankID}/question/`,
      method: "POST",
    });

    // Step 2: Patch created question (PATCH)
    await callApi({
      endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/`,
      method: "PATCH",
      body: {
        desc: question,
        desc_hint: hint,
        desc_answer: hint,
        type: 1,
        answer_gap: 0,
        tag_list: [],
        tags: [],
      },
    });

    // Step 3: Create choices (POST for each)
    const choiceResponses = await Promise.all(
      totalChoice.map(() =>
        callApi({
          endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/choice/`,
          method: "POST",
        })
      )
    );

    // Step 4: Patch each choice with correct answer status (PATCH)
    await Promise.all(
      choiceResponses.map(({ id }, index) =>
        callApi({
          endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/choice/${id}/`,
          method: "PATCH",
          body: {
            desc: totalChoice[index],
            is_answer: totalChoice[index] === hint,
          },
        })
      )
    );
  }
}

async function createMatching({ bankID }: { bankID: string }): Promise<void> {
  let id_answer: Array<string> = [];
  const total_question = [
    {
      question_desc: "จงหาผลบวก",
      total_choice: ["1", "2", "3", "4", "5"],
      question: ["1+1", "2+2", "2+3"],
      answer: ["2", "4", "5"],
    },

    {
      question_desc: "จงหาผลลบ",
      total_choice: ["1", "2", "3", "4", "5"],
      question: ["2-1", "5-2"],
      answer: ["1", "3"],
    },
  ];

  for (const question_desc of total_question) {
    const body = {
      desc: question_desc.question_desc,
      type: 2,
    };

    const res = await callApi({
      endpoint: `${dashboard_path_bank}/${bankID}/question/`,
      method: "POST",
    });

    const questionId = res.number;

    await callApi({
      endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/`,
      method: "PATCH",
      body,
    });

    for (const choice of question_desc.total_choice) {
      const res = await callApi({
        endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/choice/`,
        method: "POST",
      });

      const choiceID = res.id;

      const body = {
        desc: choice,
        is_answer: true,
      };

      await callApi({
        endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/choice/${choiceID}/`,
        method: "PATCH",
        body,
      });

      if (question_desc.answer.includes(choice)) {
        id_answer.push(choiceID);
      }
    }

    for (const [index, question] of question_desc.question.entries()) {
      const res = await callApi({
        endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/choice/`,
        method: "POST",
      });

      const choiceID = res.id;
      const body = {
        desc: question,
        is_answer: false,
        choice_list: [id_answer[index]],
      };

      await callApi({
        endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/choice/${choiceID}/`,
        method: "PATCH",
        body,
      });
    }
    id_answer = [];
  }
}

async function preconExamRegress(): Promise<void> {
  await exam({
    name: "REGRESS TEST - ชุดข้อสอบสำหรับ Regression (***ห้ามแก้!!!)",
    noSection: true,
    filePath,
    preContentPath: filePath,
  });
  await createSectionQuestion();
  await settingExam();
}

async function createSectionQuestion(): Promise<void> {
  try {
    const examData = await readFile(`${filePath}/exam.json`);
    const sectionsConfig = [
      {
        name: "Part 1",
        full_score: 6,
        pass_score: 2,
      },
      {
        name: "Part 2",
        full_score: 3,
        pass_score: 2,
        question_number: 3,
      },
      {
        name: "Part 3",
        full_score: 1,
        pass_score: 1,
        question_number: 1,
      },
    ];
    const totalQuestions: QuestionParams[] = [
      {
        question: "โคนิเคิลก่อตั้งปีที่เท่าไหร่",
        hint: "2014",
      },
      {
        question: "ปี 2025 โคนิเคิลอายุกี่ปี",
        hint: "11",
      },
      {
        question: "โคนิเคิลอยู่ในซอยประดิพัทที่เท่าไหร่",
        hint: "17",
      },
      {
        question: "ถ้าจะมาออฟฟิศโคนิเคิล ต้องกดลิฟชั้นไหน",
        hint: "7",
      },
      {
        question: "กล้วย ภาษาอังกฤษคือ",
        hint: "Banana",
        total_choice: ["Banana", "Nanana"],
        desc: "Banana",
      },
      {
        question: "Cat ภาษาไทยเรียกว่า",
        hint: "แมว",
        total_choice: ["แมวน้ำ", "แมว"],
        desc: "แมว",
      },
    ];

    for (const sectionConfig of sectionsConfig) {
      const sectionBody = {
        name: sectionConfig.name,
        full_score: sectionConfig.full_score,
        pass_score: sectionConfig.pass_score,
        pass_condition_type: 0,
        is_question_shuffle: true,
        is_choice_shuffle: true,
      };

      const res_section = await callApi({
        endpoint: `/api/dashboard/exam/${examData.id}/section/`,
        method: "POST",
        body: sectionBody,
      });

      const { id: idSection, bank: bankID } = res_section;

      if (sectionConfig.name === "Part 1") {
        for (const question of totalQuestions) {
          await createExamQuestion(bankID, question);
        }
      } else if (sectionConfig.name === "Part 2") {
        const bankData = await readFile(`${filePath}/bank-choice.json`);
        const slotBody = {
          bank: bankData.id,
          number: sectionConfig.question_number,
          questions: [],
          range: "",
          tag_list: [],
          type_method: 1,
          type_random: 1,
          type_select: 1,
        };

        await callApi({
          endpoint: `/api/dashboard/exam/${examData.id}/section/${idSection}/slot/`,
          method: "POST",
          body: slotBody,
        });
      } else if (sectionConfig.name === "Part 3") {
        const bankData = await readFile(`${filePath}/bank-matching.json`);
        const slotBody = {
          bank: bankData.id,
          number: sectionConfig.question_number,
          questions: [],
          range: "",
          tag_list: [],
          type_method: 1,
          type_random: 1,
          type_select: 1,
        };

        await callApi({
          endpoint: `/api/dashboard/exam/${examData.id}/section/${idSection}/slot/`,
          method: "POST",
          body: slotBody,
        });
      }
    }
    console.log("All sections and questions created successfully.");
  } catch (error) {
    console.error("Error creating sections and questions:", error);
  }
}

async function createExamQuestion(
  bankID: string,
  question: QuestionParams
): Promise<void> {
  try {
    const typeQuestion = question.total_choice ? 6 : 3;

    console.log(`Creating question of type ${typeQuestion}: ${question.question}`);
    // Create the question
    const res_question = await callApi({
      endpoint: `${dashboard_path_bank}/${bankID}/question/`,
      method: "POST",
    });
    const questionId = res_question.number as string; // Assuming 'number' holds the question ID
    const questionBody = {
      desc: question.question,
      desc_hint: question.hint,
      desc_answer: question.hint,
      type: typeQuestion,
      answer_gap: 0,
      tag_list: [],
      tags: [],
    };

    await callApi({
      endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/`,
      method: "PATCH",
      body: questionBody,
    });

    if (typeQuestion === 3) {
      const answerBody = {
        answer: question.hint,
        answerhint: "",
      };

      await callApi({
        endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/`,
        method: "PATCH",
        body: answerBody,
      });
    } else if (typeQuestion === 6 && question.total_choice) {
      await createChoicesExam({
        bankID,
        questionId,
        choices: question.total_choice,
        correctAnswer: question.hint,
      });
    }

    await callApi({
      endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/save/`,
      method: "POST",
      statusCode: 200,
      noResponse: true,
    });
  } catch (error) {
    console.error(`Error creating question "${question.question}":`, error);
  }
}

async function createChoicesExam({
  bankID,
  questionId,
  choices,
  correctAnswer,
}: choiceParams): Promise<void> {
  try {
    const choicePromises = choices.map(async (choice) => {
      const res_choice = await callApi({
        endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/choice/`,
        method: "POST",
      });

      const choiceID = res_choice.id;
      const choiceBody = {
        desc: choice,
        is_answer: false,
      };

      await callApi({
        endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/choice/${choiceID}/`,
        method: "PATCH",
        body: choiceBody,
      });
    });

    await Promise.all(choicePromises);

    const res_correct = await callApi({
      endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/choice/`,
      method: "POST",
    });

    const correctID = res_correct.id;
    const correctBody = {
      desc: correctAnswer,
      is_answer: true,
      is_case_sensitive: true,
    };

    await callApi({
      endpoint: `${dashboard_path_bank}/${bankID}/question/${questionId}/choice/${correctID}/`,
      method: "PATCH",
      body: correctBody,
    });
  } catch (error) {
    console.error(`Error creating choices for question ID "${questionId}":`, error);
  }
}

async function settingExam(): Promise<void> {
  const examData = await readFile(`${filePath}/exam.json`);
  const examId = examData.id;
  const body = {
    max_submit: 3,
    pass_condition_type: 2,
    pass_condition_type_display: "always_pass",
    pass_score: 5,
  };

  await callApi({
    endpoint: `/api/dashboard/exam/${examId}/condition/`,
    method: "PATCH",
    body,
    statusCode: 200,
  });

  await settingEnrollContent({ contentPath: "exam", idContent: examId, status: "open" });
  await apiPublishContent({ contentPath: "exam", idContent: examId, status: "publish" });
}

async function preconEnrollForm(): Promise<void> {
  await createEnrollForm();
  await createSectionEnrollForm();
  await createQuestionEnrollFom();
  await publicEnrollForm();
}

async function createEnrollForm(): Promise<void> {
  const body = {
    name: enrollName,
    desc: enrollName,
    is_display: false,
  };

  const response = await callApi({
    endpoint: "/api/dashboard/form/",
    method: "POST",
    body,
  });

  const dataCreate = {
    name: response.name,
    desc: response.desc,
    id: response.id,
  };

  await writeFile({ filePath: `${filePath}/enrollform.json`, data: dataCreate });
}

async function createSectionEnrollForm(): Promise<void> {
  const sectionName = "แบบฟอร์มสมัครเรียน";
  const enrollForm = await readFile(`${filePath}/enrollform.json`);

  const body = {
    name: sectionName,
  };

  const response = await callApi({
    endpoint: `api/dashboard/form/${enrollForm.id}/section/`,
    method: "POST",
    body,
  });

  const sectionID = response.id;

  const sectionData = {
    sectionID,
    sectionName,
  };
  const mergedData = { ...enrollForm, ...sectionData };

  await writeFile({ filePath: `${filePath}/enrollform.json`, data: mergedData });
}

async function createQuestionEnrollFom(): Promise<void> {
  const enrollForm = await readFile(`${filePath}/enrollform.json`);

  const questions = [
    {
      name: "รู้จัก content นี้ได้ยังไง",
      type: 2,
      choices: ["Social Media", "Friends", "Company", "Advertising"],
    },
    {
      name: "What is your Role?",
      type: 3,
      choices: ["PO", "Design", "Dev", "QA"],
    },
    { name: "What is your full name?", type: 4 },
    { name: "What is your nick name?", type: 5 },
    { name: "How old are you?", type: 6 },
    {
      name: "Please select your Team",
      type: 8,
      choices: ["Core", "LMS", "LXP", "Project", "Coniverse"],
    },
    { name: "Register Date & Time", type: 9 },
    { name: "Register Date", type: 10 },
    { name: "Register Time", type: 11 },
    { name: "Please attach your picture", type: 20 },
  ];

  for (const { name, type, choices } of questions) {
    // Create the question
    const { id: questionId } = await callApi({
      endpoint: `api/dashboard/form/section/${enrollForm.sectionID}/question/`,
      method: "POST",
      body: { name, type },
    });

    // Add choices if applicable
    if (choices?.length) {
      await Promise.all(
        choices.map((choice) =>
          callApi({
            endpoint: `api/dashboard/form/question/${questionId}/choice/`,
            method: "POST",
            body: { name: choice },
          })
        )
      );
    }
  }
}

async function publicEnrollForm(): Promise<void> {
  const enrollForm = await readFile(`${filePath}/enrollform.json`);
  await callApi({
    endpoint: `api/dashboard/form/${enrollForm.id}/`,
    method: "PATCH",
    body: { is_display: true },
  });
}
