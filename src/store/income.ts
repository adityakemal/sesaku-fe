import { create } from "zustand";
import dayjs from "dayjs";
import type { IncomeState, Transaction, IncomeEntry } from "@/types";
import {
  getState,
  getIncome,
  saveMonthlyIncome,
  updateIncome,
  deleteIncome,
} from "@/api/incomeApi";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/api/transactionApi";
import { queryClient } from "@/main";

export const useIncomeStore = create<IncomeState>()((set, get) => ({
  incomeEntries: [],
  transactions: [],
  initialized: false,
  totalIncome: 0,
  totalTransaction: 0,
  dateRange: (() => {
    const now = new Date();
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  })(),

  initStore: async () => {
    let transactions: Transaction[] = [];
    let incomeEntries: IncomeEntry[] = [];
    let totalIncome = 0;
    let totalTransaction = 0;

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
      totalIncome = Number(stateData.totalIncome) || 0;
      totalTransaction = Number(stateData.totalTransaction) || 0;
    } catch (err) {
      console.error("Failed to fetch state", err);
    }

    try {
      const incomeRes = await getIncome();
      incomeEntries = (incomeRes.data || []).map((b: any) => ({
        id: b.id,
        date: b.date || b.created_at,
        amount: Number(b.amount) || 0,
        note: b.note || "",
        createdAt: b.created_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.error("Failed to fetch income", err);
    }

    set({
      transactions,
      incomeEntries,
      totalIncome,
      totalTransaction,
      initialized: true,
    });
  },

  resetStore: () => {
    set({
      transactions: [],
      incomeEntries: [],
      totalIncome: 0,
      totalTransaction: 0,
      initialized: false,
    });
  },

  setDateRange: (range) => set({ dateRange: range }),

  refreshIncome: async () => {
    try {
      const res = await getIncome();
      const incomeData = res.data;
      const incomeEntries: IncomeEntry[] = (
        incomeData.monthlyIncomes || []
      ).map((b: any, idx: number) => ({
        id: b.id || `income-${idx}-${b.month}`,
        month: b.month,
        amount: Number(b.amount) || 0,
        note: b.note || "",
        createdAt: b.createdAt || new Date().toISOString(),
      }));
      set({ incomeEntries });
    } catch (err) {
      console.error("Failed to refresh income from API", err);
    }
  },

  importData: async (transactions) => {
    for (const tx of transactions) {
      await createTransaction(tx);
    }
    get().initStore();
  },

  getIncomeForMonth: (month) => {
    const entries = get().incomeEntries.filter((e) => {
      return dayjs(e.date).format("YYYY-MM") === month;
    });
    return entries.reduce((sum, e) => sum + e.amount, 0);
  },

  addIncomeEntry: async (entry) => {
    const newEntry: IncomeEntry = {
      ...entry,
      id: crypto.randomUUID(),
      date: entry.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      incomeEntries: [newEntry, ...s.incomeEntries],
      totalIncome: s.totalIncome + (newEntry.amount || 0),
    }));
    try {
      await saveMonthlyIncome({
        id: newEntry.id,
        date: newEntry.date,
        amount: newEntry.amount,
        note: newEntry.note,
      });
    } catch (error) {
      set((s) => ({
        incomeEntries: s.incomeEntries.filter((e) => e.id !== newEntry.id),
      }));
      throw error;
    }
  },

  updateIncomeEntry: async (id, updates) => {
    const prev = get().incomeEntries.find((e) => e.id === id);
    if (!prev) return;
    const merged = { ...prev, ...updates };
    const delta = (merged.amount || 0) - (prev.amount || 0);
    set((s) => ({
      incomeEntries: s.incomeEntries.map((e) => (e.id === id ? merged : e)),
      totalIncome: s.totalIncome + delta,
    }));
    await updateIncome(id, {
      date: merged.date,
      amount: merged.amount,
      note: merged.note,
    });
  },

  deleteIncomeEntry: async (id) => {
    const entry = get().incomeEntries.find((e) => e.id === id);
    set((s) => ({
      incomeEntries: s.incomeEntries.filter((e) => e.id !== id),
      totalIncome: s.totalIncome - (entry?.amount || 0),
    }));
    try {
      await deleteIncome(id);
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
      totalTransaction: s.totalTransaction + (newTx.nominal || 0),
    }));
    try {
      await createTransaction(newTx);
      queryClient.invalidateQueries({ queryKey: ["transactions-all"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["category-breakdown"] });
      queryClient.invalidateQueries({ queryKey: ["spending-trend"] });
      queryClient.invalidateQueries({ queryKey: ["plan-summary"] });
    } catch (error) {
      set((s) => ({
        totalTransaction: s.totalTransaction - (newTx.nominal || 0),
      }));
      throw error;
    }
  },

  updateTransaction: async (id, updates) => {
    const tx = { ...updates } as Transaction; // optimistic assumption, we don't have prev easily
    await updateTransaction(id, tx);
    queryClient.invalidateQueries({ queryKey: ["transactions-all"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    queryClient.invalidateQueries({ queryKey: ["category-breakdown"] });
    queryClient.invalidateQueries({ queryKey: ["spending-trend"] });
    queryClient.invalidateQueries({ queryKey: ["plan-summary"] });
  },

  deleteTransaction: async (id) => {
    await deleteTransaction(id);
    queryClient.invalidateQueries({ queryKey: ["transactions-all"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    queryClient.invalidateQueries({ queryKey: ["category-breakdown"] });
    queryClient.invalidateQueries({ queryKey: ["spending-trend"] });
    queryClient.invalidateQueries({ queryKey: ["plan-summary"] });
  },
}));
