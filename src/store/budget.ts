import { create } from "zustand";
import dayjs from "dayjs";
import type { BudgetState, Transaction, BudgetEntry } from "@/types";
import { getState, getBudget, saveMonthlyBudget, updateBudget, deleteBudget } from "@/api/budgetApi";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/api/transactionApi";

export const useBudgetStore = create<BudgetState>()((set, get) => ({
  budgetEntries: [],
  transactions: [],
  initialized: false,
  dateRange: (() => {
    const now = new Date();
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  })(),

  initStore: async () => {
    let transactions: Transaction[] = [];
    let budgetEntries: BudgetEntry[] = [];

    try {
      const stateRes = await getState();
      const stateData = stateRes.data;
      transactions = (stateData.transactions || []).map((tx: any) => ({
        ...tx,
        nominal: Number(tx.nominal) || 0,
        details:
          typeof tx.details === "string"
            ? JSON.parse(tx.details)
            : tx.details || undefined,
      }));
    } catch (err) {
      console.error("Failed to fetch state", err);
    }

    try {
      const budgetRes = await getBudget();
      budgetEntries = (budgetRes.data || []).map((b: any) => ({
        id: b.id,
        date: b.date || b.created_at,
        amount: Number(b.amount) || 0,
        note: b.note || "",
        createdAt: b.created_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.error("Failed to fetch budget", err);
    }

    set({
      transactions,
      budgetEntries,
      initialized: true,
    });
  },

  resetStore: () => {
    set({
      transactions: [],
      budgetEntries: [],
      initialized: false,
    });
  },

  setDateRange: (range) => set({ dateRange: range }),

  refreshBudget: async () => {
    try {
      const res = await getBudget();
      const budgetData = res.data;
      const budgetEntries: BudgetEntry[] = (budgetData.monthlyBudgets || []).map(
        (b: any, idx: number) => ({
          id: b.id || `budget-${idx}-${b.month}`,
          month: b.month,
          amount: Number(b.amount) || 0,
          note: b.note || "",
          createdAt: b.createdAt || new Date().toISOString(),
        }),
      );
      set({ budgetEntries });
    } catch (err) {
      console.error("Failed to refresh budget from API", err);
    }
  },

  importData: async (transactions) => {
    for (const tx of transactions) {
      await createTransaction(tx);
    }
    get().initStore();
  },

  getBudgetForMonth: (month) => {
    const entries = get().budgetEntries.filter((e) => {
      return dayjs(e.date).format("YYYY-MM") === month;
    });
    return entries.reduce((sum, e) => sum + e.amount, 0);
  },

  addBudgetEntry: async (entry) => {
    const newEntry: BudgetEntry = {
      ...entry,
      id: crypto.randomUUID(),
      date: entry.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      budgetEntries: [newEntry, ...s.budgetEntries],
    }));
    try {
      await saveMonthlyBudget({ id: newEntry.id, date: newEntry.date, amount: newEntry.amount, note: newEntry.note });
    } catch (error) {
      set((s) => ({
        budgetEntries: s.budgetEntries.filter((e) => e.id !== newEntry.id),
      }));
      throw error;
    }
  },

  updateBudgetEntry: async (id, updates) => {
    set((s) => ({
      budgetEntries: s.budgetEntries.map((e) =>
        e.id === id ? { ...e, ...updates } : e,
      ),
    }));
    const entry = get().budgetEntries.find((e) => e.id === id);
    if (entry) {
      await updateBudget(id, { amount: entry.amount, note: entry.note });
    }
  },

  deleteBudgetEntry: async (id) => {
    set((s) => ({
      budgetEntries: s.budgetEntries.filter((e) => e.id !== id),
    }));
    try {
      await deleteBudget(id);
    } catch {
      // optional: rollback or ignore
    }
  },

  addTransaction: async (t) => {
    const newTx = {
      ...t,
      id: crypto.randomUUID(),
      nominal: Number(t.nominal) || 0,
      date: t.date || new Date().toISOString(),
      source: t.source || "Web",
    } as Transaction;
    set((s) => ({
      transactions: [newTx, ...s.transactions],
    }));
    try {
      await createTransaction(newTx);
    } catch (error) {
      set((s) => ({
        transactions: s.transactions.filter((tx) => tx.id !== newTx.id),
      }));
      throw error;
    }
  },

  updateTransaction: (id, updates) => {
    set((s) => ({
      transactions: s.transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t,
      ),
    }));
    const tx = get().transactions.find((t) => t.id === id);
    if (tx) updateTransaction(id, tx);
  },

  deleteTransaction: (id) => {
    set((s) => ({
      transactions: s.transactions.filter((t) => t.id !== id),
    }));
    deleteTransaction(id);
  },
}));
