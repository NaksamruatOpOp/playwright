# Sample Function Script

## Suite FILL TEXT FIELD

---------------------------------------Suite HOVER ELEMENT---------------------------------------------

```typescript

import { suiteClick, hoverElement } from '../../page_action.ts'
import { suiteGoto } from '../../page_goto.ts'

$.test("Test hoverElement", async () => {
  // Navigate to the course menu (DASHBOARD)
  await $.suiteGoto({ 
    url: '/dashboard/', //endpoint url
    visible: '#dashboard-page', //verify element visible after goto
    waitApi: api_list.dashboard.dashboard //wait api endpoint success 200
  });
  
  // standard usage function
  await $.suiteClick({ 
    wrapper: '#left-menu-dashboard'
    selector: '[data-qa="menu-course"]', // element for click
    visible: '#course-list', //optional expect element should visible
    intercept: api_list.dashboard.course // optional input api for check status api or get response from api intercept for use next action
    status_code: 200 // optional dependency with intercept for expect status code intercept
  });

  ---------------------------------Suite hoverElement (standard)---------------------------------------
  await $.hoverElement({
    wrapper: '#course-list',
    selector: '[data-qa="btn-group-create-course"]',
  })

  // Wait for 5 seconds
  await $.page.waitForTimeout(5000);
})
```
