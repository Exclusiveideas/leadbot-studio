import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-brand-border">
      <div className="mx-auto h-12 w-12 rounded-xl bg-brand-surface flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-brand-muted" />
      </div>
      <h3 className="text-sm font-semibold text-brand-primary">{title}</h3>
      <p className="mt-1 text-sm text-brand-muted max-w-sm mx-auto">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
