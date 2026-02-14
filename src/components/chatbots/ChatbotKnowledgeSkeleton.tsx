import { Skeleton } from "@/components/ui/Skeleton";

export default function ChatbotKnowledgeSkeleton() {
  return (
    <div className="space-y-4">
      {/* Knowledge items list */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white/70 rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-4 mt-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
