import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageLayout } from "@/components/layout/PageLayout";
import { LoadingPage } from "@/components/layout/LoadingPage";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/api/categoryApi";
import { useStorageStore } from "@/store/storage";
import { isDuplicateCategory } from "@/lib/utils";
import { ErrorModal } from "@/components/ErrorModal";
import type { Category } from "@/types";
import { LuCheck, LuX, LuPenLine, LuTrash2 } from "react-icons/lu";

const MAX_CATEGORIES = 7;

export default function SettingsCategory() {
  const queryClient = useQueryClient();
  const setCategory = useStorageStore((s) => s.setListCategory);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories-list"],
    queryFn: () =>
      getCategories().then((res) => {
        setCategory(res.data);
        return res.data;
      }),
  });

  const addMutation = useMutation({
    mutationFn: (name: string) => createCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.message || "Gagal menambah kategori");
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateCategory(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.message || "Gagal mengedit kategori");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.message || "Gagal menambah kategori");
    },
  });

  const [newCatName, setNewCatName] = useState("");
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);

  const handleAdd = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (isDuplicateCategory(categories, trimmed)) {
      setError("Kategori sudah ada.");
      return;
    }
    if (categories.length >= MAX_CATEGORIES) {
      setError(`Maksimal ${MAX_CATEGORIES} kategori.`);
      return;
    }
    setError("");
    addMutation.mutate(trimmed);
    setNewCatName("");
  };

  const handleEdit = (cat: Category) => {
    setEditingCat(cat);
    setEditName(cat.name);
    setError("");
  };

  const handleSaveEdit = () => {
    if (!editingCat || !editName.trim()) return;
    if (isDuplicateCategory(categories, editName.trim(), editingCat.id)) {
      setError("Kategori dengan nama tersebut sudah ada.");
      return;
    }
    setError("");
    editMutation.mutate({ id: editingCat.id, name: editName.trim() });
    setEditingCat(null);
    setEditName("");
  };

  if (isLoading) return <LoadingPage />;

  return (
    <>
      <PageLayout>
        <AppHeader title="Kategori" isShowDatepicker={false} />

        <div
          className="p-4 rounded-xl space-y-4"
          style={{ background: "var(--surface)" }}
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => {
                setNewCatName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Nama kategori baru..."
              className="flex-1 h-11 px-4 rounded-lg text-[14px]"
              style={{
                border: "1px solid var(--border-visible)",
                background: "var(--black)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
            <button
              onClick={handleAdd}
              disabled={
                addMutation.isPending ||
                !newCatName.trim() ||
                categories.length >= MAX_CATEGORIES
              }
              className="h-11 px-4 rounded-lg text-[13px] font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{
                background: "var(--accent)",
                color: "white",
                border: "none",
              }}
            >
              {addMutation.isPending ? "..." : "Tambah"}
            </button>
          </div>

          {error && (
            <p className="text-[12px]" style={{ color: "var(--accent)" }}>
              {error}
            </p>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <p
                className="text-[13px]"
                style={{ color: "var(--text-disabled)" }}
              >
                Memuat...
              </p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <p
                className="text-[13px]"
                style={{ color: "var(--text-disabled)" }}
              >
                Belum ada kategori.
              </p>
            </div>
          ) : (
            <div
              className="overflow-hidden rounded-xl"
              style={{ border: "1px solid var(--border)" }}
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    style={{
                      background: "var(--surface-raised)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <th
                      className="p-3 text-[12px] font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Nama Kategori
                    </th>
                    <th
                      className="p-3 text-[12px] font-medium text-center w-[100px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, idx) => (
                    <tr
                      key={cat.id}
                      style={{
                        borderBottom:
                          idx < categories.length - 1
                            ? "1px solid var(--border)"
                            : "none",
                        background: "var(--black)",
                      }}
                    >
                      <td className="p-3">
                        {editingCat?.id === cat.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") setEditingCat(null);
                            }}
                            className="w-full h-9 px-3 rounded-lg text-[14px]"
                            style={{
                              border: "1px solid var(--accent)",
                              background: "var(--black)",
                              color: "var(--text-primary)",
                              outline: "none",
                            }}
                            autoFocus
                          />
                        ) : (
                          <span
                            className="px-2 py-1 rounded text-[13px] font-mono font-medium"
                            style={{
                              background: "var(--surface)",
                              color: "var(--text-primary)",
                            }}
                          >
                            {cat.name}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          {editingCat?.id === cat.id ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                className="w-7 h-7 flex items-center justify-center rounded hover:bg-green-500/10"
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                }}
                              >
                                <LuCheck size={16} color="var(--success)" />
                              </button>
                              <button
                                onClick={() => setEditingCat(null)}
                                className="w-7 h-7 flex items-center justify-center rounded"
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                }}
                              >
                                <LuX size={16} color="var(--text-disabled)" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(cat)}
                                className="w-7 h-7 flex items-center justify-center rounded hover:bg-blue-500/10"
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                }}
                              >
                                <LuPenLine
                                  size={16}
                                  className="text-[var(--text-secondary)] hover:text-blue-400 transition-colors"
                                />
                              </button>
                              <button
                                onClick={() => setDeletingCat(cat)}
                                className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10"
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                }}
                              >
                                <LuTrash2
                                  size={16}
                                  className="text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                                />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {categories.length >= MAX_CATEGORIES && (
            <p
              className="text-[11px] text-center"
              style={{ color: "var(--text-disabled)" }}
            >
              Maksimal {MAX_CATEGORIES} kategori
            </p>
          )}
        </div>

        {deletingCat && (
          <ConfirmModal
            title="Hapus Kategori"
            message={
              <>
                Yakin ingin menghapus{" "}
                <b style={{ color: "var(--text-primary)" }}>
                  &quot;{deletingCat.name}&quot;
                </b>
                ?
              </>
            }
            subMessage="Transaksi yang menggunakan kategori ini akan tetap memiliki nama kategori tersebut."
            loading={deleteMutation.isPending}
            onConfirm={() => {
              deleteMutation.mutate(deletingCat.id);
              setDeletingCat(null);
            }}
            onClose={() => setDeletingCat(null)}
          />
        )}

        <BottomNav />
      </PageLayout>

      <ErrorModal message={modalError} onClose={() => setModalError("")} />
    </>
  );
}

function ConfirmModal({
  title,
  message,
  subMessage,
  loading,
  onConfirm,
  onClose,
}: {
  title: string;
  message: React.ReactNode;
  subMessage?: string;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-visible)",
        }}
      >
        <div
          className="p-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <p
            className="text-[16px] font-semibold text-center"
            style={{ color: "var(--text-display)" }}
          >
            {title}
          </p>
        </div>
        <div className="p-5 text-center space-y-2">
          <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>
            {message}
          </p>
          {subMessage && (
            <p className="text-[12px]" style={{ color: "var(--warning)" }}>
              {subMessage}
            </p>
          )}
        </div>
        <div
          className="p-4 flex gap-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-10 text-[13px] font-bold rounded-lg disabled:opacity-40"
            style={{
              background: "var(--accent)",
              color: "white",
              border: "none",
            }}
          >
            {loading ? "..." : "Hapus"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-10 text-[13px] font-medium rounded-lg"
            style={{
              border: "1px solid var(--border-visible)",
              color: "var(--text-primary)",
              background: "transparent",
            }}
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
