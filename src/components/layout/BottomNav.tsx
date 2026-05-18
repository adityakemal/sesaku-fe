import { useLocation, Link } from "react-router-dom";
import { LuLayoutDashboard, LuArrowRightLeft, LuCircleArrowDown, LuClipboardList, LuSettings } from "react-icons/lu";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    tourId: "nav-dashboard",
    icon: (active: boolean) => (
      <LuLayoutDashboard size={22} color={active ? "var(--accent)" : "var(--text-secondary)"} />
    ),
  },
  {
    href: "/transaction",
    label: "Transaksi",
    tourId: "nav-transaction",
    icon: (active: boolean) => (
      <LuArrowRightLeft size={22} color={active ? "var(--accent)" : "var(--text-secondary)"} />
    ),
  },
  {
    href: "/income",
    label: "Income",
    tourId: "nav-income",
    icon: (active: boolean) => (
      <LuCircleArrowDown size={22} color={active ? "var(--accent)" : "var(--text-secondary)"} />
    ),
  },
  {
    href: "/plan",
    label: "Plan",
    tourId: "nav-plan",
    icon: (active: boolean) => (
      <LuClipboardList size={22} color={active ? "var(--accent)" : "var(--text-secondary)"} />
    ),
  },
  {
    href: "/settings",
    label: "Pengaturan",
    tourId: "nav-settings",
    icon: (active: boolean) => (
      <LuSettings size={22} color={active ? "var(--accent)" : "var(--text-secondary)"} />
    ),
  },
];

export function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <nav
      className="fixed bottom-0 z-40 left-0 right-0 max-w-4xl mx-auto"
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              data-tour={item.tourId}
              className="flex-1 flex flex-col items-center gap-1 py-3"
              style={{ textDecoration: "none" }}
            >
              {item.icon(active)}
              <span
                className="text-[10px] font-medium"
                style={{
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
