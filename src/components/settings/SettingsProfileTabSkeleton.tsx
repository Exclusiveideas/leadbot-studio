import { Skeleton } from "@/components/ui/Skeleton";

export default function SettingsProfileTabSkeleton() {
  return (
    <div className="p-6">
      <Skeleton className="h-7 w-40 mb-6" />
      <div className="space-y-6">
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-3 w-48 mt-1.5" />
        </div>
      </div>
    </div>
  );
}
