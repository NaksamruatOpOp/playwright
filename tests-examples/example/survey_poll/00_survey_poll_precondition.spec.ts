import { PreconPage, test } from '../pages/preconditionPage';

const preconPage = new PreconPage();

const contents = [
'category',
'provider',
'survey-poll'
];


test("Precondition Content @5.2 @5.1", async () => {

await test.step("Create precontent", async () => {
    for (const item of contents) {
    await preconPage.checkContentExist({ content: item });
    }
})
})


