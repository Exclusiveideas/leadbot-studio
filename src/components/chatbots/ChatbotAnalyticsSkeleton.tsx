import { Skeleton } from "@/components/ui/Skeleton";

export default function ChatbotAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/70 rounded-lg shadow p-6">
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white/70 rounded-lg shadow p-6">
        <Skeleton className="h-6 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>

      {/* Recent conversations */}
      <div className="bg-white/70 rounded-lg shadow p-6">
        <Skeleton className="h-6 w-56 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="border-b border-gray-200 pb-4 last:border-0"
            >
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
