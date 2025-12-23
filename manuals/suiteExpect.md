const { wrapper = '', selector = '', behavior = '', value = '' } = param;

# Sample Function Script

## Suite FILL TEXT FIELD

---------------------------------------Suite HOVER ELEMENT---------------------------------------------

```typescript

import { suiteClick, suiteExpect } from '../../page_action.ts'
import { suiteGoto } from '../../page_goto.ts'
import * as $ from '../../utils/commands.ts'

$.test("Test suiteExpect", async () => {
  // Navigate to the course menu (DASHBOARD)
  await suiteGoto({ 
    url: '/dashboard/', //endpoint url
    visible: '#dashboard-page', //verify element visible after goto
    waitApi: api_list.dashboard.dashboard //wait api endpoint success 200
  });
  
  // standard usage function
  await suiteClick({ 
    wrapper: '#left-menu-dashboard'
    selector: '[data-qa="menu-course"]', // element for click
    visible: '#course-list', //optional expect element should visible
    intercept: api_list.dashboard.course // optional input api for check status api or get response from api intercept for use next action
    status_code: 200 // optional dependency with intercept for expect status code intercept
  });

  ---------------------------------Suite suiteExpect (standard)---------------------------------------
  // expect element is visible
  await suiteExpect({
    wrapper: '[data-qa="course-identity"]',
    selector: '[data-qa="txt-title"]',
  })

  ---------------------------------Suite suiteExpect (value)---------------------------------------
  await suiteExpect({
    selector: '[data-qa="txt-field-name"]',
    behavior: "value",      // type value use expect input field
    value: "Course - 701-12:27:34",
  });

  ---------------------------------Suite suiteExpect (hidden)-----------------------------------------
  await suiteExpect({
    selector: '[data-qa="form-dialog"]',
    behavior: "hidden",      // type hidden use expect element should not visible
  });

  ---------------------------------Suite suiteExpect (text)---------------------------------------------
  await suiteExpect({
    wrapper: '[data-qa="course-identity"]',
    selector: '[data-qa="txt-title"]',
    behavior: "text",
    value: 'Course - 701-12:27:34'     // type text use expect text label Contain
  });

  ---------------------------------Suite suiteExpect (include-text)---------------------------------------
  await suiteExpect({
    wrapper: '[data-qa="course-identity"]',
    selector: '[data-qa="txt-title"]',
    behavior: "include-text",
    value: "Course"      // type text use expect text label include text
  })
  // Wait for 5 seconds
  await $.page.waitForTimeout(5000);
})
```
