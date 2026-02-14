import { Skeleton } from "@/components/ui/Skeleton";

export default function ChatbotChatSkeleton() {
  return (
    <div className="bg-white/70 rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-10 w-64 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Messages Area */}
      <div className="h-[600px] p-6 space-y-4">
        {/* Welcome skeleton */}
        <div className="flex flex-col items-center justify-center h-full">
          <Skeleton className="h-16 w-16 rounded-full mb-4" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-14 rounded-lg" />
          <Skeleton className="h-14 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
