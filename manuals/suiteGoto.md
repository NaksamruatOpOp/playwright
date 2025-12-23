# Sample Function Script

## Suite GOTO

-------------------Suite Goto (MENU)-------------------------

```typescript
import { api_list } from '../route/apiList.ts'

$.test("Test callApi", async () => {
  // Navigate to the user menu (DASHBOARD)
  await $.suiteGoto({ 
    menu: 'menu-user', // value from data-qa="menu-user" //only element has data-qa
    is_dashboard: true, 
    visible: '#user-list-page', //optional expect element should visible
    waitApi: api_list.dashboard.user //optional expect api menu is call success //import from "route/apiList.ts"
  });

  // Wait for 5 seconds
  await $.page.waitForTimeout(5000);

  // Navigate to the course menu (WEB)
  await $.suiteGoto({ 
    menu: 'quick-menu-course', 
    is_dashboard: false, 
    visible: '#course-list', //optional
    waitApi: api_list.web.course //optional
  });
});

-------------------Suite Goto (URL)-------------------------

await $.suiteGoto({ 
  url: '/dashboard/course/', //endpoint url
  visible: '#course-list', //verify element visible after goto
  waitApi: 'api/dashboard/course/' //wait api endpoint success 200
});
