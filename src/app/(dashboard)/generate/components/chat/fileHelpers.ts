export function getFileIconFromMimeType(mimeType: string): string {
  const type = mimeType.toLowerCase();
  if (type.includes("pdf")) return "📄";
  if (type.includes("image")) return "🖼️";
  if (type.includes("text")) return "📝";
  if (type.includes("excel") || type.includes("spreadsheet")) return "📊";
  if (type.includes("word") || type.includes("document")) return "📃";
  return "📎";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 0) {
    throw new Error("File size cannot be negative");
  }
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
