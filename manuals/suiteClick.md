# Sample Function Script

## Suite CLICK

---------------------------------------Suite CLICK---------------------------------------------

```typescript
import { suiteClick } from '../../page_action.ts'
import { suiteGoto } from '../../page_goto.ts'

$.test("Test suiteClick", async () => {
  // Navigate to the course menu (DASHBOARD)
  await $.suiteGoto({ 
    url: '/dashboard/', //endpoint url
    visible: '#dashboard-page', //verify element visible after goto
    waitApi: api_list.dashboard.dashboard //wait api endpoint success 200
  });
  
  -------------------Suite CLICK (standard)-------------------------
  // standard usage function
  await $.suiteClick({ 
    wrapper: '#left-menu-dashboard'
    selector: '[data-qa="menu-course"]', // element for click
    visible: '#course-list', //optional expect element should visible
    intercept: api_list.dashboard.course // optional input api for check status api or get response from api intercept for use next action
    status_code: 200 // optional dependency with intercept for expect status code intercept
  });

  // Wait for 5 seconds
  await $.page.waitForTimeout(5000);

  -------------------Suite CLICK (dropdown_text)-------------------------
  // example suiteClick use dropdown_text
  //EX1
  await suiteClick({ selector: '[data-qa="select-title"]', dropdown_text: "Mr." }); // insert value text in dropdown_text for select
  //EX2
  await suiteClick ({ 
    wrapper: '[data-qa="dropdown-in-col"]',
    selector: '[data-qa="select-dropdown-in-col"]',
    dropdown_text: 'Approve', // insert value text in dropdown_text for select
    visible: '.confirm-dialog-dashboard-v5'
  })

  -------------------Suite CLICK (dropdown_selector)-------------------------
  // example suiteClick use dropdown_selector 
  await suiteClick({
    wrapper:'[data-qa="question-8"]',
    selector: '[data-qa="question-dropdown"]',
    dropdown_selector: '.el-select-dropdown__list [data-qa]:nth-child(3)'
  });
});
