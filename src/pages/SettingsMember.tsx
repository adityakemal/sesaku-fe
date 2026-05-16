import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageLayout } from "@/components/layout/PageLayout";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { getMembers, inviteMember, removeMember } from "@/api/memberApi";

export default function SettingsMember() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: () => getMembers().then((r) => r.data),
  });

  const addMutation = useMutation({
    mutationFn: (email: string) => inviteMember(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member ditambahkan");
      setEmail("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menambahkan");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (email: string) => removeMember(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member dihapus");
    },
    onError: () => toast.error("Gagal menghapus"),
  });

  if (isLoading) return <LoadingPage />;

  return (
    <PageLayout>
      <AppHeader title="Member" isShowDatepicker={false} />

      <div
        className="p-4 rounded-xl space-y-4"
        style={{ background: "var(--surface)" }}
      >
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              email.trim() &&
              addMutation.mutate(email.trim())
            }
            placeholder="Email member..."
            className="flex-1 h-11 px-4 rounded-lg text-[14px]"
            style={{
              border: "1px solid var(--border-visible)",
              background: "var(--black)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
          <button
            onClick={() => email.trim() && addMutation.mutate(email.trim())}
            disabled={!email.trim() || addMutation.isPending}
            className="h-11 px-4 rounded-lg text-[13px] font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{
              background: "var(--accent)",
              color: "white",
              border: "none",
            }}
          >
            {addMutation.isPending ? "..." : "Invite"}
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p
              className="text-[13px]"
              style={{ color: "var(--text-disabled)" }}
            >
              Memuat...
            </p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8">
            <p
              className="text-[13px]"
              style={{ color: "var(--text-disabled)" }}
            >
              Belum ada member.
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
                    Email
                  </th>
                  <th
                    className="p-3 text-[12px] font-medium text-center w-[60px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((m: any, idx: number) => (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom:
                        idx < members.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                      background: "var(--black)",
                    }}
                  >
                    <td className="p-3">
                      <span
                        className="text-[13px]"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {m.member_email}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => removeMutation.mutate(m.member_email)}
                        className="text-[12px] font-bold"
                        style={{
                          color: "var(--accent)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BottomNav />
    </PageLayout>
  );
}
