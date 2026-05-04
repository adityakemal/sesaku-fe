
import { useQuery } from "@tanstack/react-query";
import { useStorageStore } from "@/store/storage";
import { getWorkspaces } from "@/api/memberApi";
import { useBudgetStore } from "@/store/budget";

export function WorkspaceSelector() {
  const { workspaceId, workspaceName, setWorkspace } = useStorageStore();
  const resetStore = useBudgetStore((s) => s.resetStore);
  const initStore = useBudgetStore((s) => s.initStore);

  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => getWorkspaces().then((r) => r.data),
    staleTime: 0,
  });

  const switchWorkspace = async (id: string | null, name: string | null) => {
    setWorkspace(id, name);
    resetStore();
    initStore();
  };

  const all = [...workspaces] as any[];

  return (
    <div className="flex items-center gap-2">
      <select
        value={workspaceId || ""}
        onChange={(e) => {
          const val = e.target.value;
          if (!val) {
            switchWorkspace(null, null);
          } else {
            const ws = all.find((w: any) => w.owner_id === val);
            switchWorkspace(ws?.owner_id || null, ws?.owner_name || null);
          }
        }}
        className="h-9 px-3 text-[12px] rounded-lg"
        style={{
          border: "1px solid var(--border-visible)",
          background: "var(--black)",
          color: "var(--text-primary)",
          outline: "none",
        }}
      >
        <option value="">Budget Saya</option>
        {all.map((ws: any) => (
          <option key={ws.owner_id} value={ws.owner_id}>
            {ws.owner_name || ws.owner_email}
          </option>
        ))}
      </select>
      {workspaceName && (
        <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
          ({workspaceName})
        </span>
      )}
    </div>
  );
}
