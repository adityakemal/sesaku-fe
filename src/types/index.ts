export type TransactionSource = "Web" | "AI";

export interface TaxItem {
  name: string;
  value: number;
  type: "percent" | "fixed";
}

export interface DiscountItem {
  name: string;
  value: number;
  type: "percent" | "fixed";
}

export interface TransactionItem {
  name: string;
  price: number;
}

export interface TransactionDetails {
  items?: TransactionItem[];
  tax?: TaxItem[];
  discount?: DiscountItem[];
}

export interface Transaction {
  id: string;
  name: string;
  nominal: number;
  kategori: string;
  keterangan: string;
  date: string;
  source: TransactionSource;
  details?: TransactionDetails;
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface MonthlyBudget {
  month: string; // "YYYY-MM" format
  amount: number;
}

export interface BudgetEntry {
  id: string;
  date: string; // ISO timestamp
  amount: number;
  note: string;
  createdAt: string;
}

export interface BudgetState {
  // Data
  budgetEntries: BudgetEntry[];
  transactions: Transaction[];
  initialized: boolean;
  dateRange: { start: Date; end: Date };

  // Budget actions
  getBudgetForMonth: (month: string) => number;
  setDateRange: (range: { start: Date; end: Date }) => void;
  addBudgetEntry: (
    entry: Omit<BudgetEntry, "id" | "createdAt" | "date"> & { date?: string },
  ) => Promise<void>;
  updateBudgetEntry: (
    id: string,
    updates: Partial<Pick<BudgetEntry, "amount" | "note" | "date">>,
  ) => Promise<void>;
  deleteBudgetEntry: (id: string) => Promise<void>;

  // Transaction actions
  addTransaction: (
    t: Omit<Transaction, "id" | "date" | "source"> & {
      source?: TransactionSource;
      date?: string;
    },
  ) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  initStore: () => Promise<void>;
  resetStore: () => void;
  importData: (transactions: Transaction[]) => Promise<void>;
}

export const DEFAULT_CATEGORIES = [
  "Makanan",
  "Transport",
  "Belanja",
  "Hiburan",
  "Tagihan",
] as const;

export const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

/** Helper to get "YYYY-MM" key from a Date */
export function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
