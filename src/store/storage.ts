import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category } from "@/types";

export interface StoredUser {
  email: string;
  name: string;
  avatar: string;
}

interface StorageState {
  user: StoredUser | null;
  listCategory: Category[];
  setUser: (user: StoredUser | null) => void;
  setListCategory: (list: Category[]) => void;
  addToListCategory: (cat: Category) => void;
  removeFromListCategory: (id: number) => void;
  updateInListCategory: (id: number, name: string) => void;
}

export const useStorageStore = create<StorageState>()(
  persist(
    (set) => ({
      user: null,
      listCategory: [],
      setUser: (user) => set({ user }),
      setListCategory: (list) => set({ listCategory: list }),
      addToListCategory: (cat) =>
        set((s) => ({ listCategory: [...s.listCategory, cat] })),
      removeFromListCategory: (id) =>
        set((s) => ({
          listCategory: s.listCategory.filter((c) => c.id !== id),
        })),
      updateInListCategory: (id, name) =>
        set((s) => ({
          listCategory: s.listCategory.map((c) =>
            c.id === id ? { ...c, name } : c
          ),
        })),
    }),
    { name: "sesaku-storage" }
  )
);
