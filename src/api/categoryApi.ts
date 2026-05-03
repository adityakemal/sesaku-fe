import { apiClient } from "./client";

export const getCategories = () => apiClient.get("/categories");

export const createCategory = (name: string) =>
  apiClient.post("/categories", { name });

export const updateCategory = (id: number, name: string) =>
  apiClient.put(`/categories/${id}`, { name });

export const deleteCategory = (id: number) =>
  apiClient.delete(`/categories/${id}`);

export const deleteCategoryByName = (name: string) =>
  apiClient.delete(`/categories/name/${encodeURIComponent(name)}`);
