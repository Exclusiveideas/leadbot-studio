"use client";

import type { SourceReference } from "@/hooks/useChatbotChat";

interface SourceCitationsProps {
  sources?: SourceReference[];
}

export function SourceCitations({ sources }: SourceCitationsProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
        Sources:
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => (
          <div
            key={`${source.id}-${index}`}
            className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700"
          >
            <span className="font-medium">{source.name}</span>
            {source.pageNumber && (
              <span className="text-gray-500 dark:text-gray-400">
                {" "}
                (p. {source.pageNumber})
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
