import { PlaywrightTestConfig } from "@playwright/test";

export interface CustomConfig extends PlaywrightTestConfig {
  use?: PlaywrightTestConfig["use"] & {
    baseURL: string;
  };
}
