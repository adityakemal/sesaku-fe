import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Category } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function isDuplicateCategory(list: Category[], name: string, excludeId?: number) {
  return list.some(
    (c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== excludeId
  );
}
