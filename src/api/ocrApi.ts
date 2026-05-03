import { apiClient } from "./client";

export const scanReceipt = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post("/ocr", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
