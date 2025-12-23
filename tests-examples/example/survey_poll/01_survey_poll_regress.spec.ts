import { SurveyData } from "../interfaces/survey.interface";
import { CentralPage, filePath, readFile, test, } from "../pages/centralPage";
const centralPage = new CentralPage();


const content = 'survey-poll'


let surveyData : SurveyData

test.beforeAll(async () => {
    surveyData = await readFile(`${filePath}/${content}.json`);
})

test("Verify survey regress @5.2 @5.1", async () => {
    await test.step("[Web] Verify do enroll form", async () => {
        await centralPage.gotoSurvey({surveyData})
        await centralPage.handleSurvey({content})
    })

    await test.step("[Web] Verify my library status complete", async () => {
        await centralPage.verifyMyLibrary({status: 'complete',content});
    })

})
