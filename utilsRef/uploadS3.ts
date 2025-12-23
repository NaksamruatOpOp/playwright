import { axios, browserName, callApi, expect, fs, log, path } from "./commands";
import { baseUrl } from "../tests/login/base/env";

const acl: string = "public-read";


interface UploadFileOptions {
  fixture: string;
  pathMenu: string;
  isEcer?: boolean;
  hasDate?: boolean;
}
// Function to upload a file to S3 using presigned URLs
export async function uploadFileToS3(
  options: UploadFileOptions
): Promise<{ filePath: string; fileName: string; urlFile: string  }> {
  const {
    fixture,
    pathMenu,
    isEcer = false,
    hasDate = true,
  } = options;

  const { fileName, extension, mime } = await getDataFile(fixture);
  const contentType =
    extension === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : mime;
  const encode: BufferEncoding = mime.includes("image") ? "base64" : "binary";
  log({ text: "contentType", data: contentType })
  log({ text: "fixture", data: fixture })
  log({ text: "acl", data: acl })
  // Generate a unique UUID for the file path
  let type_UUID = extension
  if (!hasDate) type_UUID = 'uuid'
  const uuid = await generateUUID({ type: isEcer ? 'ecer' : type_UUID });
  const filePath = `${pathMenu}${uuid}.${extension}`;
  log({ data: filePath })

  // POST /api/storage/get-presigned-upload
  const get_presignedUpload = await callApi({
    method: "POST",
    endpoint: "/api/storage/get-presigned-upload",
    body: {
      acl,
      file_path: filePath,
      "content-type": contentType,
    },
    statusCode: 200,
  });
  // log({ text: "get_presignedUpload", data: get_presignedUpload });

  // Extract formData
  const { fields, url } = await get_presignedUpload;
  const file = await createFileFromData(fixture, fileName, encode);
  const data = { ...fields, file };
  const formData = new FormData();
  for (let item in data) {
    formData.append(item, data[item]);
  }

  // POST url
  log({ text: "POST", data: url });
  await axios.post(url, formData).then((res) => {
    expect(res.status).toBe(204);
    log({ text: "Status", data: res.status });
  });

  //POST /api/storage/get-presigned
  const urlRequest = baseUrl + "/api/storage/get-presigned";
  log({ text: "POST", data: urlRequest });
  const payload = {
    acl,
    file_path: [filePath],
    "content-type": mime,
  };
  const res = await callApi({
    method: "POST",
    endpoint: "/api/storage/get-presigned",
    body: payload,
    statusCode: 200,
  });
  return { filePath, fileName, urlFile: res[0].url };
}

interface multipartOption {
  fixture: string;
  pathMenu: string;
}
export async function uploadStorageMultipart(options: multipartOption) {
  const { fixture, pathMenu } = options;
  const { fileName, extension, mime } = await getDataFile(fixture);

  // Generate a unique UUID for the file path
  const uuid = await generateUUID({ type: "uuid" });
  const filePath = `${pathMenu}${uuid}.${extension}`;

  const chunkList = await splitChunk(fixture);
  const form = {
    part_total: chunkList.length,
    file_path: filePath,
    acl,
  };

  // POST /api/storage/multipart-get-presigned-upload
  const get_presignedMultipart = await callApi({
    method: "POST",
    endpoint: "/api/storage/multipart-get-presigned-upload",
    body: form,
    statusCode: 200,
  });
  const { upload_id, url_list } = await get_presignedMultipart;
  // log({ data: get_presignedMultipart });

  const get_uploadCompletedList = await putChunkToS3({
    storage_url: url_list,
    chunkList,
  });
  log({ data: get_uploadCompletedList });

  await multipartCompleteUpload({
    uploadId: upload_id,
    filePath,
    partData: get_uploadCompletedList,
  });
  return { filePath, fileName };
}

async function createFileFromData(
  fixture: string,
  fileName: string,
  encode: BufferEncoding,
): Promise<File> {
  let blob: Blob;
  const filePath = path.join(__dirname, "..", fixture);
  const fileData = fs.readFileSync(filePath, encode);

  const baseFile =
    encode === "base64" ? fileData.replace(/^data:.*,/, "") : fileData;

  const binaryData = Buffer.from(baseFile, encode);
  blob = new Blob([binaryData], { type: getFileType(fileName) });
  
  // Create a File from the Blob
  return new File([blob], fileName, { type: getFileType(fileName) });
}

function getFileType(filename: string): string {
  // Extract the file extension
  const extension = filename.split(".").pop()?.toLowerCase();

  if (!extension) {
    throw new Error("No file extension found");
  }

  // Map of common file extensions to MIME types
  const mimeTypes: { [key: string]: string } = {
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    pdf: "application/pdf",
    txt: "text/plain",
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    mp4: "video/mp4",
    mp3: "audio/mp3",
    xlsx: "text/csv",
    // Add more mappings as needed
  };

  // Return the corresponding MIME type
  return mimeTypes[extension] || "application/octet-stream"; // Default to binary stream
}

async function getDataFile(file_path: string): Promise<Record<string, any>> {
  // Extract the file name and extension from the fixture
  const fileName = file_path.split("/").pop()?.toLowerCase() || "";
  const extension = file_path.split(".").pop()?.toLowerCase();
  const mime = getFileType(fileName);
  if (!extension) {
    throw new Error("No file extension found");
  }
  return { fileName, extension, mime };
}

async function generateUUID({
  type = "",
}: {
  type?: string;
}): Promise<string> {
  const curDate = new Date();
  const year = curDate.getFullYear();
  const month = curDate.getMonth() + 1;
  let d = new Date().getTime();

  // Generate UUID based on the provided pattern
  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c) {
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    }
  );

  // Return the generated UUID based on the conditions
  switch (type) {
    // case "png":
    // case "jpg":
    // case "jpeg":
    // return `${year}/${month}/${browserName}-${uuid}`;
    case "uuid":
    case "xlsx":
      return `${browserName}-${uuid}`;
    case "ecer":
      return `${year}/${month}/certificate/${browserName}-${uuid}`;
    default:
      return `${year}/${month}/${browserName}-${uuid}`;
  }
}

async function splitChunk(
  filePath: string,
  chunkSize: number = 1048576 * 5
): Promise<Blob[]> {
  const fileData = fs.readFileSync(filePath);
  const chunkList: Blob[] = [];
  for (let start = 0; start < fileData.length; start += chunkSize) {
    const chunk = fileData.slice(
      start,
      Math.min(start + chunkSize, fileData.length)
    );
    chunkList.push(new Blob([chunk]));
  }
  return chunkList;
}

interface putS3Option {
  storage_url: string[];
  chunkList: Blob[];
}
interface uploadCompletedListOption {
  ETag: string;
  PartNumber: number;
}
async function putChunkToS3(option: putS3Option) {
  const { storage_url, chunkList } = option;
  let size: number = 0;
  let uploadCompletedList: uploadCompletedListOption[] = [];
  for (let index = 0; index < storage_url.length; index++) {
    log({ text: `index>`, data: index });
    const url = storage_url[index];
    let blob = chunkList[index];
    size = chunkList[index].size + size;
    log({ text: `chunkList size>`, data: size });
    await axios.put(url, blob).then((res) => {
      expect(res.status).toBe(200);
      log({ text: "Status", data: res.status });
      // log({ text: "response headers:", data: res.headers });
      uploadCompletedList.push({
        ETag: res.headers.etag.replaceAll('"', ""),
        PartNumber: index + 1,
      });
    });
    // log({ data: uploadCompletedList });
  }
  return uploadCompletedList;
}

interface multiCompleteUploadOption {
  uploadId: string;
  filePath: string;
  partData: uploadCompletedListOption[];
}
async function multipartCompleteUpload(option: multiCompleteUploadOption) {
  const { uploadId, filePath, partData } = option;
  const body = {
    upload_id: uploadId,
    file_path: filePath,
    part_data: partData,
  };
  const response = await callApi({
    method: "POST",
    endpoint: "/api/storage/multipart-complete-upload",
    body,
    statusCode: 200,
  });
  log({ text: "location", data: response.Location });
  return response.Location;
}
