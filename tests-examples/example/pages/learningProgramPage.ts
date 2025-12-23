import {
    expect,
    page,
    readFile,
    test,
    suiteGoto,
    waitForPageTimeout,
    writeFile
} from "../../../utils/commands";

import {
    fillTextField,
    suiteClick,
    suiteExpect,
} from '../../../utils/page_actions'

import { 
    locators 
} from '../../../utils/locator';


export {  
    page,
    test, 
};

import { UIPath } from "./centralPage";


export class LearningProgramPage {
    async gotoLP(): Promise<void> {
        await suiteGoto({url: '/dashboard/learning-program/',visible: '#learning-program-page'})
    }

    async manageLP(mode: 'create' | 'edit'): Promise<void> {
        const rand = Math.floor(Math.random() * 100);
        const TODAY = new Date();
        const time = `${TODAY.getHours()}:${TODAY.getMinutes()}:${TODAY.getSeconds()}`;
        
        // Shared values
        const namePrefix = mode === 'create' ? 'Playwright LP' : 'Edit Playwright LP';
        const codePrefix = mode === 'create' ? 'LP-' : 'EdL';
        const imagePath = mode === 'create' ? 'fixtures/img/cat.jpg' : 'fixtures/img/bunny.jpeg';
        const aboutText = mode === 'create' ? 'about playwright' : 'Edit about playwright';
    
        const name = `${namePrefix}${rand}-${time}`;
        const code = `${codePrefix}${time}`;
    
        // Common flow for both modes
        if (mode === 'create') {
            await this.gotoLP();
            await suiteClick({
                selector_hover: '[data-qa="btn-group-create-learning-program"]',
                wrapper: '[data-qa="wrapper-create-new-learning-program"]',
                selector: '[data-qa="btn-create-new-learning-program"]',
                visible: '#learning-program-create'
            });
        } else {
            await suiteClick({
                wrapper: locators.buttonIcon.R1,
                selector: locators.buttonIcon.EDIT,
                visible: '#learning-program-detail-info'
            });
        }
    
        // Fill in common fields
        await fillTextField({ selector: locators.txtField.NAME, value: name });
        await fillTextField({ selector: locators.txtField.CODE, value: code });
        await fillTextField({ selector: '[data-qa="input-editor-lite-text-about"]', value: aboutText });
    
        // Handle image upload
        await page.setInputFiles('input[type="file"]', imagePath);
        await suiteClick({ selector: locators.button.CROP_DIALOG });
    
        // Mode-specific actions
        if (mode === 'edit') {
            await suiteClick({ selector: locators.switch.PUBLISH });
        }
            await suiteClick({ selector: locators.button.SAVE_BACK,visible: '#learning-program-page' });
        
    
        // Wait for page timeout and write data to file
        await waitForPageTimeout({});
        const write_data = { name, code, about: aboutText };
        await writeFile({ filePath: `${UIPath}/lp.json`, data: write_data });
    }

    async searchLP({isPublic = false}): Promise<void> {
        const lpData = await readFile(`${UIPath}/lp.json`)
    
        await fillTextField({ selector: locators.txtField.SEARCH, value: lpData.name,is_enter: true });
        await suiteExpect({ wrapper: locators.fragment.RESULT, selector: locators.txt.AMOUNT,value: 1,behavior: 'number' });
        await suiteExpect({ selector: locators.row1.NAME, value: lpData.name, behavior: 'text'});
        await suiteExpect({ wrapper: locators.row1.CODE,selector: locators.row1.CODE, value: lpData.code,behavior: 'text' });
        await suiteExpect({ selector: '[data-qa="r1-content"]', value: 0,behavior: 'number' });
    
        const element = page.locator(locators.row1.PUBLISH);
        const className = await element.getAttribute('class');
        if (isPublic) expect(className).toContain('text-green')
        else expect(className).not.toContain('text-green')
    }
    
    async deleteLP(): Promise<void> {
        await suiteClick({wrapper: locators.buttonIcon.R1,selector: locators.buttonIcon.DELETE})
        await suiteClick({selector: locators.button.CONFIRM})
        await waitForPageTimeout({})
        const totalText = await page.locator('[data-qa="fragment-total"] [data-qa="txt-amount"]').textContent();
        const total = totalText ? parseInt(totalText, 10) : 0;
        if (total > 0) {
            await suiteExpect({ wrapper: locators.fragment.RESULT, selector: locators.txt.AMOUNT,value: 0,behavior: 'number' });
    
        } else {
            await suiteExpect({ wrapper: '[data-qa="fragment-total"]', selector: locators.txt.AMOUNT,value: 0,behavior: 'number' });
        }
    }
}
