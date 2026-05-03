import { create } from "zustand";
import type { BudgetState, Transaction, BudgetEntry } from "@/types";
import { getState, saveMonthlyBudget } from "@/api/budgetApi";
import { createTransaction, updateTransaction, deleteTransaction } from "@/api/transactionApi";

export const useBudgetStore = create<BudgetState>()((set, get) => ({
  budgetEntries: [],
  transactions: [],
  initialized: false,

  initStore: async () => {
    try {
      const res = await getState();
      const data = res.data;

      const transactions: Transaction[] = (data.transactions || []).map(
        (tx: any) => ({
          ...tx,
          nominal: Number(tx.nominal) || 0,
          details: typeof tx.details === "string" ? JSON.parse(tx.details) : (tx.details || undefined),
        }),
      );

      const budgetEntries: BudgetEntry[] = (data.monthlyBudgets || []).map(
        (b: any, idx: number) => ({
          id: b.id || `budget-${idx}-${b.month}`,
          month: b.month,
          amount: Number(b.amount) || 0,
          note: b.note || "",
          createdAt: b.createdAt || new Date().toISOString(),
        }),
      );

      set({
        transactions,
        budgetEntries,
        initialized: true,
      });
    } catch (err) {
      console.error("Failed to init store from API", err);
      set({ initialized: true });
    }
  },

  resetStore: () => {
    set({
      transactions: [],
      budgetEntries: [],
      initialized: false,
    });
  },

  importData: async (transactions) => {
    for (const tx of transactions) {
      await createTransaction(tx);
    }
    get().initStore();
  },

  getBudgetForMonth: (month) => {
    const entries = get().budgetEntries.filter((e) => e.month === month);
    return entries.reduce((sum, e) => sum + e.amount, 0);
  },

  addBudgetEntry: async (entry) => {
    const newEntry: BudgetEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      budgetEntries: [newEntry, ...s.budgetEntries],
    }));
    try {
      await saveMonthlyBudget(entry.month, newEntry.amount);
    } catch (error) {
      set((s) => ({
        budgetEntries: s.budgetEntries.filter((e) => e.id !== newEntry.id),
      }));
      throw error;
    }
  },

  updateBudgetEntry: (id, updates) => {
    set((s) => ({
      budgetEntries: s.budgetEntries.map((e) =>
        e.id === id ? { ...e, ...updates } : e,
      ),
    }));
  },

  deleteBudgetEntry: (id) => {
    set((s) => ({
      budgetEntries: s.budgetEntries.filter((e) => e.id !== id),
    }));
  },

  addTransaction: async (t) => {
    const newTx = {
      ...t,
      id: t.id || crypto.randomUUID(),
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
        t.id === id ? { ...t, ...updates } : t
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
