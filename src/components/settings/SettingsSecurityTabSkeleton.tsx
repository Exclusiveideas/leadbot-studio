import { Skeleton } from "@/components/ui/Skeleton";

export default function SettingsSecurityTabSkeleton() {
  return (
    <div className="p-6">
      <Skeleton className="h-7 w-48 mb-6" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton className="h-6 w-56 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <Skeleton className="h-5 w-5 rounded mr-2 flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <Skeleton className="h-11 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
