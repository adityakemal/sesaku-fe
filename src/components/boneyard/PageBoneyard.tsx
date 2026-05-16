import type { CSSProperties, ReactNode } from "react";
import { Skeleton } from "boneyard-js/react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageLayout } from "@/components/layout/PageLayout";

type PageBoneyardVariant = "dashboard" | "list" | "settings" | "timeline";

interface PageBoneyardProps {
  name: string;
  title: string;
  loading: boolean;
  children: ReactNode;
  variant?: PageBoneyardVariant;
}

export function PageBoneyard({
  name,
  title,
  loading,
  children,
  variant = "list",
}: PageBoneyardProps) {
  const fallback = <PageBoneyardFallback title={title} variant={variant} />;

  return (
    <Skeleton
      name={`page-${name}`}
      loading={loading}
      fallback={fallback}
      fixture={fallback}
      animate="shimmer"
      stagger={40}
      transition={180}
      snapshotConfig={{
        captureRoundedBorders: true,
        excludeSelectors: ["[data-no-skeleton]", "nav", "svg", "button svg"],
      }}
    >
      {children}
    </Skeleton>
  );
}

export function PageBoneyardFallback({
  title,
  variant = "list",
}: {
  title: string;
  variant?: PageBoneyardVariant;
}) {
  return (
    <PageLayout>
      <AppHeader title={title} isShowDatepicker={false} />
      <div className="space-y-4" aria-hidden="true">
        {variant === "dashboard" && <DashboardBones />}
        {variant === "list" && <ListBones />}
        {variant === "settings" && <SettingsBones />}
        {variant === "timeline" && <TimelineBones />}
      </div>
      <BottomNav />
    </PageLayout>
  );
}

function Bone({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{ background: "var(--surface-raised)", ...style }}
    />
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--surface)" }}>
      {children}
    </div>
  );
}

function DashboardBones() {
  return (
    <>
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Bone className="h-3 w-20" />
            <Bone className="h-7 w-44" />
          </div>
          <Bone className="h-9 w-24 rounded-full" />
        </div>
        <Bone className="mt-4 h-2 w-full rounded-full" />
      </Card>
      <Card>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Bone className="h-3 w-14 mx-auto" />
              <Bone className="h-5 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <Bone className="h-4 w-28 mb-4" />
        <div className="flex items-end gap-2 h-36">
          {[35, 70, 45, 95, 55, 80, 40, 64].map((height, index) => (
            <Bone key={index} className="flex-1" style={{ height }} />
          ))}
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-5">
          <Bone className="h-36 w-36 rounded-full shrink-0" />
          <div className="space-y-3 flex-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Bone key={index} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}

function ListBones() {
  return (
    <>
      <Card>
        <div className="flex gap-3">
          <Bone className="h-10 flex-1" />
          <Bone className="h-10 w-20" />
        </div>
      </Card>
      <Card>
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Bone className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/2" />
              </div>
              <Bone className="h-4 w-16" />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function SettingsBones() {
  return (
    <>
      <Card>
        <div className="flex items-center gap-4">
          <Bone className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Bone className="h-4 w-36" />
            <Bone className="h-3 w-52" />
          </div>
          <Bone className="h-9 w-9" />
        </div>
      </Card>
      {Array.from({ length: 3 }).map((_, section) => (
        <div key={section} className="space-y-3">
          <Bone className="h-3 w-24 ml-2" />
          <Card>
            <div className="space-y-4">
              {Array.from({ length: section === 2 ? 2 : 3 }).map((_, item) => (
                <div key={item} className="flex items-center gap-3">
                  <Bone className="h-8 w-8 rounded-full" />
                  <Bone className="h-4 flex-1" />
                  <Bone className="h-4 w-4" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      ))}
    </>
  );
}

function TimelineBones() {
  return (
    <div className="relative pl-6">
      <div
        className="absolute left-[11px] top-2 bottom-2 w-px"
        style={{ background: "var(--border-visible)" }}
      />
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="relative">
            <Bone className="absolute -left-[23px] top-1.5 h-5 w-5 rounded-full" />
            <Card>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Bone className="h-4 w-32" />
                  <Bone className="h-5 w-10 rounded" />
                </div>
                <Bone className="h-3 w-4/5" />
                <Bone className="h-3 w-24" />
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
