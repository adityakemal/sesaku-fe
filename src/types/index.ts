export type TransactionSource = "Web" | "AI";

export interface TaxItem {
  name: string;
  value: number;
  type: "fixed" | "percent";
}

export interface DiscountItem {
  name: string;
  value: number;
  type: "fixed" | "percent";
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

export interface PlanItem {
  category: string;
  nominal: number;
  actual?: number; // Backend-calculated actual spending for this category
}

export interface Plan {
  id: string;
  start_date: string;
  end_date: string;
  items: PlanItem[];
  total_amount: number;
  created_at: string;
  spent?: number; // Backend-calculated total spending during plan period
}

export interface MonthlyBudget {
  month: string; // "YYYY-MM" format
  amount: number;
}

export interface IncomeEntry {
  id: string;
  date: string; // ISO timestamp
  amount: number;
  note: string;
  createdAt: string;
}

export interface IncomeState {
  // Data
  incomeEntries: IncomeEntry[];
  transactions: Transaction[];
  initialized: boolean;
  dateRange: { start: Date; end: Date };
  totalIncome: number;
  totalTransaction: number;

  // Income actions
  getIncomeForMonth: (month: string) => number;
  setDateRange: (range: { start: Date; end: Date }) => void;
  addIncomeEntry: (
    entry: Omit<IncomeEntry, "id" | "createdAt" | "date"> & { date?: string },
  ) => Promise<void>;
  updateIncomeEntry: (
    id: string,
    updates: Partial<Pick<IncomeEntry, "amount" | "note" | "date">>,
  ) => Promise<void>;
  deleteIncomeEntry: (id: string) => Promise<void>;

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
