import {
    callApi,
    page,
    readFile,
    test,
    suiteGoto,
    waitForPageTimeout,
    waitApi
} from "../../../utils/commands";

import {
    suiteClick,
} from '../../../utils/page_actions'

import { 
    locators 
} from '../../../utils/locator';

import { CentralPage } from "./centralPage";


export { 
    page,
    test,
};

const filePath = 'data/regressPortal'
const centralPage = new CentralPage();


interface ExamData {
    id: number;
    code: string;
    name: string;
}

let exam_data : ExamData

test.beforeAll(async () => {
    exam_data = await readFile(`${filePath}/exam.json`);
})


export class ExamPage {
    async doExam(): Promise<void> {
        await gotoExam()
        await enrollExam()
        await centralPage.handleExam()
        await waitApi({method:'GET',endpoint: `/api/exam/${exam_data.id}/`,keyword: 'progress',subKeyword:'progress_exam',childKeyword:'status',value: 30})
        await centralPage.reloadProgress()
        await centralPage.loginUser({user: 'standuser'})
    }
}

async function enrollExam(): Promise<void> {
    await suiteClick({ selector: locators.button.ENROLL });
    await suiteClick({ wrapper: '.confirm-dialog-web-v5' , selector: '.btn-confirm' });
    await waitForPageTimeout({})
}

async function gotoExam(): Promise<void> {
    const [response] = await Promise.all([ await callApi({
            endpoint: `/api/exam/?search=${exam_data.name}`,
            method: "GET" }) ]);
    const examId = response[0].id

    await centralPage.loginUser({user: 'standuser'})
    await suiteGoto({url: `/test/${examId}/` ,waitApi: `/api/exam/${examId}/`})
}


