import type { NotificationType } from "@/types/notification";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  FileCheck,
  Mail,
  MessageSquare,
  Send,
  ShieldAlert,
  UserCheck,
  UserMinus,
  UserPlus,
  Zap,
} from "lucide-react";

type NotificationIconConfig = {
  icon: typeof UserPlus;
  colorClass: string;
  bgClass: string;
};

const iconMap: Record<NotificationType, NotificationIconConfig> = {
  LEAD_CAPTURED: {
    icon: UserPlus,
    colorClass: "text-green-600",
    bgClass: "bg-green-50",
  },
  BOOKING_CREATED: {
    icon: Calendar,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-50",
  },
  TEXT_REQUEST_CREATED: {
    icon: MessageSquare,
    colorClass: "text-purple-600",
    bgClass: "bg-purple-50",
  },
  ORGANIZATION_INVITATION: {
    icon: Mail,
    colorClass: "text-indigo-600",
    bgClass: "bg-indigo-50",
  },
  INVITATION_ACCEPTED: {
    icon: UserCheck,
    colorClass: "text-green-600",
    bgClass: "bg-green-50",
  },
  INVITATION_DECLINED: {
    icon: UserMinus,
    colorClass: "text-red-600",
    bgClass: "bg-red-50",
  },
  EXPORT_STARTED: {
    icon: Send,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-50",
  },
  EXPORT_COMPLETED: {
    icon: FileCheck,
    colorClass: "text-green-600",
    bgClass: "bg-green-50",
  },
  EXPORT_FAILED: {
    icon: ShieldAlert,
    colorClass: "text-red-600",
    bgClass: "bg-red-50",
  },
  DOCUMENT_PROCESSED: {
    icon: BookOpen,
    colorClass: "text-teal-600",
    bgClass: "bg-teal-50",
  },
  CASE_UPDATED: {
    icon: Zap,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-50",
  },
  SYSTEM_ALERT: {
    icon: AlertTriangle,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-50",
  },
};

export function getNotificationIcon(
  type: NotificationType,
): NotificationIconConfig {
  return iconMap[type] ?? iconMap.SYSTEM_ALERT;
}
