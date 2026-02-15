"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingMap = { none: "", sm: "p-4", md: "p-6", lg: "p-8" };

export default function DashboardCard({
  children,
  className,
  hoverable = false,
  padding = "md",
}: DashboardCardProps) {
  return (
    <div
      className={clsx(
        "bg-white rounded-xl border border-brand-border elevation-1",
        paddingMap[padding],
        hoverable && "card-hover-lift cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}
