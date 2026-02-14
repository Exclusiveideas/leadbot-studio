import { Skeleton } from "@/components/ui/Skeleton";

export default function ChatbotEmbedSkeleton() {
  return (
    <div className="space-y-6">
      {/* Instructions section */}
      <div className="bg-white/70 rounded-lg shadow p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-2 mb-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>

      {/* Code snippet section */}
      <div className="bg-white/70 rounded-lg shadow p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-48 w-full rounded" />
        <Skeleton className="h-10 w-32 mt-4" />
      </div>

      {/* Preview section */}
      <div className="bg-white/70 rounded-lg shadow p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-96 w-full rounded" />
      </div>
    </div>
  );
}
