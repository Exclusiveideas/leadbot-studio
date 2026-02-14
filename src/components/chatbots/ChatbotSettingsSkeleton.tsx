import { Skeleton } from "@/components/ui/Skeleton";

export default function ChatbotSettingsSkeleton() {
  return (
    <div className="bg-white/70 rounded-lg shadow p-6">
      <div className="space-y-6">
        {/* Name field */}
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Description field */}
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-24 w-full" />
        </div>

        {/* Persona field */}
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-32 w-full" />
        </div>

        {/* Custom Instructions field */}
        <div>
          <Skeleton className="h-4 w-36 mb-2" />
          <Skeleton className="h-32 w-full" />
        </div>

        {/* Welcome Message field */}
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-20 w-full" />
        </div>

        {/* AI Model dropdown */}
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Status dropdown */}
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Allowed Domains field */}
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}
