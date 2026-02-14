import type { ComponentPropsWithoutRef } from "react";

interface SkeletonProps extends ComponentPropsWithoutRef<"div"> {
  className?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      {...props}
    />
  );
}
