# Sample Function Script

## Suite FILL TEXT FIELD

---------------------------------------Suite FILL TEXT FIELD---------------------------------------------

```typescript
import { suiteClick, fillTextField } from '../../page_action.ts'
import { suiteGoto } from '../../page_goto.ts'

$.test("Test fillTextField", async () => {
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

  ---------------------------------Suite fillTextField (standard)---------------------------------------
  await $.fillTextField({
    wrapper: '[data-qa="form-dialog"]',
    selector: '[data-qa="txt-field-name"]',
    value: 'Create Course 1234'
  })

  // Wait for 5 seconds
  await $.page.waitForTimeout(5000);

  ---------------------------------Suite fillTextField (is_date_pick)---------------------------------------
  // example fillTextField use is_date_pick
  // use case fill data is date-time (calendar)
  //EX1
    await fillTextField({
      wrapper: '[data-qa="section-personal"]',
      selector: "[data-qa=form-item-birthday]",
      value: birthday,
      is_date_pick: true,
  });

  //EX2
  await fillTextField({
      wrapper: '[data-qa="section-personal"]',
    selector: "[data-qa=form-item-onboard-date]",
    value: onboard_date,
    is_date_pick: true,
  });

  -------------------Suite fillTextField (is_enter)-------------------------
  // example fillTextField use is_enter
  // use case fill data input for search
  await fillTextField({
    wrapper:locators.fragment.SEARCH, 
    selector:locators.txtField.SEARCH,
    value: user.username,
    is_enter: true
  });
});
```
