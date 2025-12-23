export let config: any;
try {
  // Dynamically import the local configuration
  config = require('../../../local_setting').default;
  console.log('Local configuration loaded:', config);
} catch (error) {
  console.warn('local-setting.ts not found. Using default configuration.');
}

export let baseUrl: string =
  config?.BASEURL ||
  config?.TEMPLATE ||
  process?.env.TEMPLATE ||
  "https://internal-e2e.conicle.co";  // Default base URL

interface EnvConfig {
  store: {
    DEVELOP_URL: string;
    SANDBOX_URL: string;
    STAGING_URL: string;
    MASTER_URL: string;
  };
  product: {
    E2E_DEV_URL: string;
    E2E_5_URL: string;
    config_5_BASE_URL: string;
    E2E_2_5_URL: string;
    E2E_3_5_URL: string;
    E2E_multiTenant_1: string;
    E2E_multiTenant_2: string;
    DEV_multiTenant_1: string;
    DEV_multiTenant_2: string;
    STG_multiTenant_1: string;
    PRD_multiTenant_1: string;
  };
  USERNAME: string;
  IS_ADMIN: boolean;
  CONFIG_USERNAME: string;
  CONFIG_PASSWORD: string;
  DATABASES: {
    user: string;
    host: string;
    password: string | undefined;
    port: number;
  };
}

export const env: EnvConfig = {
  store: {
    DEVELOP_URL: 'https://develop-store.coniclex.com',
    SANDBOX_URL: 'https://sandbox-store.coniclex.com',
    STAGING_URL: 'https://stg-store.coniclex.com',
    MASTER_URL: 'https://master-store.coniclex.com',
  },
  product: {
    E2E_DEV_URL: 'https://dev-e2e.conicle.co',
    E2E_5_URL: 'https://internal-e2e.conicle.co',
    config_5_BASE_URL: 'https://config-5.conicle.co',
    E2E_2_5_URL: 'https://internal-e2e-2.conicle.co',
    E2E_3_5_URL: 'https://internal-e2e-3.conicle.co',
    E2E_multiTenant_1: 'https://5-2-e2e-1.conicle.co',
    E2E_multiTenant_2: 'https://5-2-e2e-2.conicle.co',
    DEV_multiTenant_1: 'https://5-2-develop-1.conicle.co',
    DEV_multiTenant_2: 'https://5-2-develop-2.conicle.co',
    STG_multiTenant_1: 'https://multi-tenant-staging.conicle.co',
    PRD_multiTenant_1: 'https://multi-tenant-production.conicle.co',
  },
  USERNAME: 'qa.conicle',
  IS_ADMIN: true,
  CONFIG_USERNAME: 'wachirasak',
  CONFIG_PASSWORD: 'sysadminConicle',
  DATABASES: {
    user: 'conicle',
    host: 'cy.ipSite', // Replace `cy.ipSite` with the correct type (string) or logic
    password: config?.PASSWORD_DB || process.env.PASSWORD_DB,
    port: 3306,
  },
};

export const base_account: Record<string, string> = {
  username: config?.USER || env.USERNAME,
  password: config?.PASS || process.env.PASSWORD,
};

const siteMap: Record<string, string> = {
  'dev-e2e': env.product.E2E_DEV_URL,
  'internal-e2e': env.product.E2E_5_URL,
  'internal-e2e-2': env.product.E2E_2_5_URL,
  '5-2-e2e-1': env.product.E2E_multiTenant_1,
  '5-2-e2e-2': env.product.E2E_multiTenant_2,
  '5-2-develop-1': env.product.DEV_multiTenant_1,
  '5-2-develop-2': env.product.DEV_multiTenant_2,
};

baseUrl = siteMap[baseUrl] || baseUrl;
if (baseUrl.endsWith('/')) {
  baseUrl = baseUrl.slice(0, -1);
}

// Export both as default
export default {
  base_account,
  baseUrl,
  env,
};