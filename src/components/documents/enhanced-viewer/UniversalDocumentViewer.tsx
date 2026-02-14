"use client";

/**
 * Stub for UniversalDocumentViewer
 * The full e-discovery document viewer is not needed in LeadBotStudio.
 * This provides a simple file preview fallback.
 */

interface UniversalDocumentViewerProps {
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  analysis?: any;
  [key: string]: any;
}

export default function UniversalDocumentViewer({
  fileName,
  mimeType,
}: UniversalDocumentViewerProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-700 font-medium">{fileName || "Document"}</p>
        {mimeType && <p className="text-gray-500 text-sm mt-1">{mimeType}</p>}
      </div>
    </div>
  );
}
