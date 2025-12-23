import { page, defaultOperationTimeout as timeout } from "./commands";
import { api_list } from "../route/apiList";
import { suiteExpect } from "./page_actions";

interface gotoOptions {
  menu?: string,
  url?: string,
  visible?: string,
  is_dashboard?: boolean,
  waitApi?: string,
}
export async function suiteGoto(goto: gotoOptions) {
  const { menu = '', url = '', visible = '', is_dashboard = true, waitApi = ''  } = goto;

  // Default values for endpoints and page selectors
  let endpoint: string = is_dashboard ? '/dashboard' : '/';
  let page_id: string = is_dashboard ? '#dashboard-page' : '#home-page';
  let endpoint_api: string = is_dashboard ? api_list.dashboard.dashboard : api_list.web.homepage;

  // If a URL is provided, navigate to it directly
  if (url) {
    await gotoUrl({ url, visible, waitApi });
    return;
  }

  // Navigate using the dynamically chosen endpoint
  await gotoUrl({ 
    url: endpoint,
    visible: page_id,
    waitApi: endpoint_api
  });

  // Click the menu if it's provided
  if (menu) await validate_clickMenu({ menu, waitApi });
  if (visible) await suiteExpect({ selector: visible, behavior: 'visible' })
}

interface gotoUrlOption { 
  url: string,
  visible?: string, 
  waitApi?: string,
}
async function gotoUrl ({ url, visible, waitApi }: gotoUrlOption ) {
  await page.goto(url)
  await page.waitForLoadState("load")

  if (waitApi) await validate_response(waitApi)
  
  if (visible) {
    const element = page.locator(visible)
    await element.waitFor({ state: 'visible' }); //default timeout 30s = 30000 ms
  }
}

async function validate_clickMenu({ menu, waitApi }: { menu: string, waitApi: string }): Promise<void> {
  const map_menu: Record<string, string> = {
    'menu-sub-department': 'menu-user',
    'menu-sub-position': 'menu-user',
    'menu-sub-level': 'menu-user',
    'menu-learning-material-video': 'menu-learning-material',
  };

  const key_menu = map_menu[menu] || menu;
  const root_menu = page.locator(`[data-qa="${key_menu}"]`);
  const sub_menu = page.locator(`[data-qa="${menu}"]`)

  const verifyAndClick = async (element: any): Promise<void> => {
    await element.waitFor({ state: 'visible' });
    await element.click();
    await page.waitForLoadState("load")

    if (waitApi) await validate_response(waitApi)
  };
  
  switch (key_menu) {
    case 'menu-user':
      await root_menu.hover();
      await verifyAndClick(sub_menu);
      break;
    case 'menu-learning-material':
      await root_menu.click();
      await verifyAndClick(sub_menu);
      break;
    default:
      // Default case can be omitted if not needed
      await root_menu.click();
      break;
  }
}

async function validate_response(endpoint: string) {
  await page.waitForResponse((response) => {
    return response.url().includes(endpoint) && response.status() === 200; // Check if it's the right API and has status 200
  },
    { timeout }
  );
}