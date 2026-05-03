import { apiClient } from "./client";

export const getCategories = () => apiClient.get("/category");

export const createCategory = (name: string) =>
  apiClient.post("/category", { name });

export const updateCategory = (id: number, name: string) =>
  apiClient.put(`/category/${id}`, { name });

export const deleteCategory = (id: number) =>
  apiClient.delete(`/category/${id}`);
