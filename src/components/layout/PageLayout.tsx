import type { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <main className="flex-1 pb-20 px-4 pt-0 space-y-4 text-[var(--text-primary)]">
      {children}
    </main>
  );
}
