import { HEADERS } from "../tests/login/base/baseLogin";
import { APIResponse, expect, request, writeFile, log } from "./commands";

// Define CallOptions interface for reusable typing
interface CallOptions {
  statusCode?: boolean | number | number[];
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: Record<string, any>;
  fullResponse?: boolean;
  expectFail?: boolean;
  noResponse?: boolean;
  timeout?: number;
  filePath?: string;
  headers?: Record<string, string> | {};
  getHeader?: boolean;
  hasResult?: boolean;
  keyword?: string;
  subKeyword?: string;
  childKeyword?: string;
  value?: any;
  retry?: number;
  statusDisplay?: string;
  includeValue?: string;
  includeField?: string;
  expectKey?: string;
  expectSubKey?: string;
  expectValue?: any;
  isWriteFile?: boolean;
  waitKey?: string;
}

// `callApi` function using `CallOptions`
export async function callApi({
  statusCode = false,
  endpoint = "",
  method = "GET",
  body = {},
  fullResponse = false,
  expectFail = false,
  noResponse = false,
  timeout = 120000,
  filePath = "data/responses/callApi.json",
  headers = HEADERS,
  getHeader = false,
  retry = 5,
  isWriteFile = true,
}: CallOptions): Promise<APIResponse | Record<string, any> | any> {
  let response: APIResponse;
  let attempt: number = 0;

  while (attempt < retry) {
    const requestContext = await request.newContext();
    try {
      console.log(
        `callApi > Attempt ${attempt + 1}, method: ${method}, endpoint: ${endpoint}`
      );

      // Make the API request
      response = await requestContext.fetch(endpoint, {
        method,
        headers,
        data: method !== "GET" ? body : undefined,
        timeout,
      });
      log({ text: "API Response STATUS CODE:", data: response.status() });

      // Check if the response is empty (no body)
      const responseBody = await response.body(); // Get the raw response body as a buffer

      let response_data: any = null;
      if (responseBody.length === 0) {
        console.warn("API Response body is empty");
        return response; // Return an empty object or handle accordingly
      } else {
        let response_data_json = await response.json();
        response_data = getResponseData(response_data_json, fullResponse);

        const expectedStatus = getStatusForMethod(method, statusCode);
        if (Array.isArray(statusCode)) {
          if (
            method === "GET" &&
            response.status() !== (statusCode[0] || statusCode[1]) &&
            !expectFail
          ) {
            console.warn(
              `Expected status ${expectedStatus}, but received ${response.status()}. Retrying...`
            );
          } else {
            if (isWriteFile) await writeFile({ filePath, data: response_data });
            expect(response).toBeOK();
            return response_data || response; // Return response if successful
          }
        } else {
          if (response.status() === expectedStatus) {
            if (isWriteFile) await writeFile({ filePath, data: response_data });
            expect(response).toBeOK();
            return response_data || response; // Return response if successful
          } else {
            console.warn(
              `Expected status ${expectedStatus}, but received ${response.status()}. Retrying...`
            );
          }
        }
      }
    } catch (error) {
      console.error(`Error on API call attempt ${attempt + 1}:`, error);
    }

    // Wait for 2 seconds before retrying
    attempt++;
    if (attempt < retry) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error(
    `API call failed after ${retry} attempts. Expected status: ${getStatusForMethod(
      method,
      statusCode
    )}`
  );
}

function getStatusForMethod(method: string, statusCode: boolean | number | number[]) {
  const statusCodes: { [key: string]: number } = {
    GET: 200,
    POST: 201,
    PATCH: 200,
    DELETE: 204,
  };
  return statusCode || statusCodes[method.toUpperCase()]; // Default to 400 if the method is unknown
}

interface ResponseBody {
  data?: {
    results?: any;
    result?: any;
  };
  body: any;
}

export function getResponseData(res: ResponseBody, fullResponse: boolean = false): any {
  if (fullResponse) return res;
  const data = res.body?.data || res?.body || res?.data || res;
  return data?.results || data?.result || data || null; // Return null if data is undefined or doesn't match
}

function getNestedProperty(obj: any, path: string): any {
  if (!path) return undefined;

  // Split the path by '.' to handle multiple levels
  const parts = path.split(".");

  let current = obj;
  for (const part of parts) {
    // Handle array indices, e.g., "checkpoint_list[0]"
    const arrayRegex = /^(\w+)\[(\d+)\]$/;
    const match = arrayRegex.exec(part);
    if (match) {
      const arrayName = match[1];
      const index = parseInt(match[2], 10);
      if (current[arrayName] && Array.isArray(current[arrayName])) {
        current = current[arrayName][index];
      } else {
        return undefined;
      }
    } else {
      current = current[part];
    }

    if (current === undefined || current === null) {
      return undefined;
    }
  }

  return current;
}

type HandleKeywordSearchParams = {
  resData: any[] | any;
  keyword: string;
  subKeyword?: string | any;
  childKeyword?: string;
  value: any;
  includeValue?: string;
  includeField?: string;
  expectKey?: string | any;
  expectSubKey?: string;
  expectValue?: any;
};

async function handleKeywordSearch({
  resData,
  keyword,
  subKeyword,
  childKeyword,
  value,
  includeValue,
  includeField,
  expectKey,
  expectSubKey,
  expectValue,
}: HandleKeywordSearchParams): Promise<any[] | any> {
  if (!Array.isArray(resData)) {
    resData = [resData];
  }

  const findField = (item: any, key: string, val: any): boolean => {
    const getFirstElement = (field: any) => {
      return Array.isArray(field) ? field[0] : field;
    };

    if (childKeyword) {
      const itemKey = getFirstElement(item[key]);
      const subKey = getFirstElement(itemKey && itemKey[subKeyword]);
      const childKey = getFirstElement(subKey && subKey[childKeyword]);
      return childKey === val;
    } else if (subKeyword) {
      const itemKey = getFirstElement(item[key]);
      console.log(`key is: ${itemKey}`);
      const subKey = getFirstElement(itemKey && itemKey[subKeyword]);
      console.log(`sub key is: ${subKey}`);
      return subKey === val;
    } else {
      const itemKey = getFirstElement(item[key]);
      return itemKey === val;
    }
  };

  // Find the result in the response data
  let result = resData.find((item) => findField(item, keyword, value));

  if (includeValue && includeField) {
    if (!result[includeField] || !result[includeField].includes(includeValue)) {
      result = null;
      throw new Error("Expected includeValue not matched");
    }
  }

  // If the result is null, wait for the specified time and reset the result
  if (!result) {
    result = [];
    throw new Error("No result found");
  } else if (result && (expectKey || expectSubKey) && expectValue) {
    // If expecting a value to match for validation
    const validateData = expectSubKey
      ? result[expectKey][expectSubKey]
      : result[expectKey];
    if (validateData === expectValue) {
      console.log("Expected value matched, returning result");
      return result;
    } else {
      result = [];
      throw new Error("Expected value not matched");
    }
  } else return result;
}

// waitApi Function
export async function waitApi({
  statusCode = false,
  endpoint = "",
  method = "GET",
  body = {},
  fullResponse = false,
  expectFail = false,
  noResponse = false,
  timeout = 12000,
  filePath = "data/responses/callApi.json",
  headers = HEADERS, // Ensure HEADERS is defined in your context
  getHeader = false,
  hasResult = false,
  keyword = "",
  subKeyword = "",
  childKeyword = "",
  value = "",
  retry = 15,
  statusDisplay = "",
  includeValue,
  includeField,
  expectKey,
  expectSubKey,
  expectValue,
  waitKey = "",
}: CallOptions): Promise<APIResponse | Record<string, any> | any> {
  let attempt: number = 0;

  while (attempt < retry) {
    try {
      let response = await callApi({
        // Ensure callApi is defined and handles the request appropriately
        endpoint,
        method,
        body,
      });

      // Optionally check for statusDisplay condition
      if (statusDisplay && response.status_display !== statusDisplay) {
        console.log("StatusDisplay condition not met");
        console.log(`Attempt: ${attempt + 1}`);
        console.log(`Response status_display: ${response.status_display}`);
        console.log(`Expected status_display: ${statusDisplay}`);
        throw new Error("StatusDisplay condition not met");
      }
      console.log("response", response);
      console.log("attempt", attempt);
      if (hasResult) response = await validateResults({ response, waitKey });

      if (keyword) {
        const result = await handleKeywordSearch({
          resData: response,
          keyword,
          subKeyword,
          childKeyword,
          value,
          includeValue,
          includeField,
          expectKey,
          expectSubKey,
          expectValue,
        });
        console.log("result", result);
        return result; // If result has data, return as usual
      }

      console.log("Returning response.");
      return response;
    } catch (error: any) {
      attempt++;
      if (attempt >= retry) {
        console.error(`Max retries reached (${retry}). Exiting.`);
        throw error; // or handle the failure as needed
      }
      console.warn(
        `Attempt ${attempt} failed: ${error.message}. Retrying in ${timeout}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, timeout));
    }
  }
}

async function validateResults({
  response,
  waitKey,
}: {
  response: any;
  waitKey: string;
}): Promise<void> {
  let hasData = false;

  if (waitKey) {
    if (Array.isArray(response)) {
      const firstItem = response[0];
      if (firstItem?.hasOwnProperty(waitKey) && firstItem[waitKey]?.length > 0) {
        hasData = true;
      }
    } else if (response?.hasOwnProperty(waitKey) && response[waitKey]?.length > 0) {
      hasData = true;
    }
  } else {
    // If waitKey is not provided, proceed with the condition as true
    hasData = true;
  }

  console.log("hasData" + hasData);
  console.log((response.length > 0 || Object.keys(response).length > 0) && hasData);
  if ((response.length > 0 || Object.keys(response).length > 0) && hasData) {
    return response;
  }

  throw new Error("Response does not have result");
}
