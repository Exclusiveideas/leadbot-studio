// Comprehensive audit event types and categories

// Event categories
export const AuditEventCategory = {
  AUTH: "AUTH",
  DATA: "DATA",
  USER_MANAGEMENT: "USER_MANAGEMENT",
  SYSTEM: "SYSTEM",
  SECURITY: "SECURITY",
  DOCUMENT: "DOCUMENT",
  CASE: "CASE",
  EXPORT: "EXPORT",
  SEARCH: "SEARCH",
  COMPLIANCE: "COMPLIANCE",
} as const;

export type AuditEventCategoryType =
  (typeof AuditEventCategory)[keyof typeof AuditEventCategory];

// Authentication events
export const AuthEvents = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  SIGNUP: "SIGNUP",
  PASSWORD_RESET: "PASSWORD_RESET",
  PASSWORD_RESET_REQUEST: "PASSWORD_RESET_REQUEST",
  MFA_ENABLE: "MFA_ENABLE",
  MFA_DISABLE: "MFA_DISABLE",
  MFA_BACKUP_REGENERATE: "MFA_BACKUP_REGENERATE",
  LOGIN_FAILED: "LOGIN_FAILED",
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  EMAIL_VERIFICATION_RESENT: "EMAIL_VERIFICATION_RESENT",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SESSION_INVALIDATED: "SESSION_INVALIDATED",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  ACCOUNT_UNLOCKED: "ACCOUNT_UNLOCKED",
  SIGNUP_CODE_GENERATED: "SIGNUP_CODE_GENERATED",
  SIGNUP_CODE_USED: "SIGNUP_CODE_USED",
  SIGNUP_CODE_REVOKED: "SIGNUP_CODE_REVOKED",
  SIGNUP_CODE_REGENERATED: "SIGNUP_CODE_REGENERATED",
} as const;

// Data operation events
export const DataEvents = {
  CREATE: "CREATE",
  READ: "READ",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  EXPORT: "EXPORT",
  IMPORT: "IMPORT",
  BULK_UPDATE: "BULK_UPDATE",
  BULK_DELETE: "BULK_DELETE",
  RESTORE: "RESTORE",
  ARCHIVE: "ARCHIVE",
  UNARCHIVE: "UNARCHIVE",
} as const;

// User management events
export const UserManagementEvents = {
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DEACTIVATED: "USER_DEACTIVATED",
  USER_REACTIVATED: "USER_REACTIVATED",
  USER_DELETED: "USER_DELETED",
  ROLE_ASSIGNED: "ROLE_ASSIGNED",
  ROLE_REMOVED: "ROLE_REMOVED",
  PERMISSION_GRANTED: "PERMISSION_GRANTED",
  PERMISSION_REVOKED: "PERMISSION_REVOKED",
  ROLE_CREATED: "ROLE_CREATED",
  ROLE_UPDATED: "ROLE_UPDATED",
  ROLE_DELETED: "ROLE_DELETED",
} as const;

// Document events
export const DocumentEvents = {
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_VIEWED: "DOCUMENT_VIEWED",
  DOCUMENT_DOWNLOADED: "DOCUMENT_DOWNLOADED",
  DOCUMENT_DELETED: "DOCUMENT_DELETED",
  DOCUMENT_SHARED: "DOCUMENT_SHARED",
  DOCUMENT_UNSHARED: "DOCUMENT_UNSHARED",
  DOCUMENT_TAGGED: "DOCUMENT_TAGGED",
  DOCUMENT_UNTAGGED: "DOCUMENT_UNTAGGED",
  DOCUMENT_REDACTED: "DOCUMENT_REDACTED",
  DOCUMENT_OCR_COMPLETED: "DOCUMENT_OCR_COMPLETED",
  DOCUMENT_CLASSIFICATION_COMPLETED: "DOCUMENT_CLASSIFICATION_COMPLETED",
  DOCUMENT_PII_DETECTED: "DOCUMENT_PII_DETECTED",
  DOCUMENT_PROCESSING_FAILED: "DOCUMENT_PROCESSING_FAILED",
  DOCUMENT_METADATA_UPDATED: "DOCUMENT_METADATA_UPDATED",
  DOCUMENT_MOVED: "DOCUMENT_MOVED",
  DOCUMENT_COPIED: "DOCUMENT_COPIED",
} as const;

// Case events
export const CaseEvents = {
  CASE_CREATED: "CASE_CREATED",
  CASE_UPDATED: "CASE_UPDATED",
  CASE_CLOSED: "CASE_CLOSED",
  CASE_REOPENED: "CASE_REOPENED",
  CASE_DELETED: "CASE_DELETED",
  CASE_ARCHIVED: "CASE_ARCHIVED",
  CASE_UNARCHIVED: "CASE_UNARCHIVED",
  CASE_ASSIGNED: "CASE_ASSIGNED",
  CASE_UNASSIGNED: "CASE_UNASSIGNED",
  CASE_PRIORITY_CHANGED: "CASE_PRIORITY_CHANGED",
  CASE_STATUS_CHANGED: "CASE_STATUS_CHANGED",
  CASE_EXPORTED: "CASE_EXPORTED",
  CASE_SHARED: "CASE_SHARED",
  CASE_UNSHARED: "CASE_UNSHARED",
} as const;

// Security events
export const SecurityEvents = {
  SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
  BRUTE_FORCE_DETECTED: "BRUTE_FORCE_DETECTED",
  UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS",
  API_KEY_CREATED: "API_KEY_CREATED",
  API_KEY_REVOKED: "API_KEY_REVOKED",
  IP_BLOCKED: "IP_BLOCKED",
  IP_UNBLOCKED: "IP_UNBLOCKED",
  SECURITY_ALERT: "SECURITY_ALERT",
} as const;

// System events
export const SystemEvents = {
  SYSTEM_STARTUP: "SYSTEM_STARTUP",
  SYSTEM_SHUTDOWN: "SYSTEM_SHUTDOWN",
  BACKUP_STARTED: "BACKUP_STARTED",
  BACKUP_COMPLETED: "BACKUP_COMPLETED",
  BACKUP_FAILED: "BACKUP_FAILED",
  MAINTENANCE_MODE_ENABLED: "MAINTENANCE_MODE_ENABLED",
  MAINTENANCE_MODE_DISABLED: "MAINTENANCE_MODE_DISABLED",
  CONFIGURATION_CHANGED: "CONFIGURATION_CHANGED",
  INTEGRATION_CONNECTED: "INTEGRATION_CONNECTED",
  INTEGRATION_DISCONNECTED: "INTEGRATION_DISCONNECTED",
  AUDIT_LOG_EXPORTED: "AUDIT_LOG_EXPORTED",
  AUDIT_LOG_PURGED: "AUDIT_LOG_PURGED",
} as const;

// Compliance events
export const ComplianceEvents = {
  RETENTION_POLICY_APPLIED: "RETENTION_POLICY_APPLIED",
  LEGAL_HOLD_PLACED: "LEGAL_HOLD_PLACED",
  LEGAL_HOLD_RELEASED: "LEGAL_HOLD_RELEASED",
  COMPLIANCE_REPORT_GENERATED: "COMPLIANCE_REPORT_GENERATED",
  DATA_SUBJECT_REQUEST: "DATA_SUBJECT_REQUEST",
  DATA_DELETION_REQUEST: "DATA_DELETION_REQUEST",
  DATA_EXPORT_REQUEST: "DATA_EXPORT_REQUEST",
} as const;

// All event types union
export type AuditEventType =
  | (typeof AuthEvents)[keyof typeof AuthEvents]
  | (typeof DataEvents)[keyof typeof DataEvents]
  | (typeof UserManagementEvents)[keyof typeof UserManagementEvents]
  | (typeof DocumentEvents)[keyof typeof DocumentEvents]
  | (typeof CaseEvents)[keyof typeof CaseEvents]
  | (typeof SecurityEvents)[keyof typeof SecurityEvents]
  | (typeof SystemEvents)[keyof typeof SystemEvents]
  | (typeof ComplianceEvents)[keyof typeof ComplianceEvents];

// Event metadata interface
export interface AuditEventMetadata {
  correlationId?: string;
  sessionId?: string;
  parentEventId?: string;
  tags?: string[];
  context?: Record<string, any>;
}

// Severity mappings for all events
export const EventSeverityMap: Record<
  string,
  "INFO" | "WARNING" | "ERROR" | "CRITICAL"
> = {
  // Auth events
  [AuthEvents.LOGIN]: "INFO",
  [AuthEvents.LOGOUT]: "INFO",
  [AuthEvents.SIGNUP]: "INFO",
  [AuthEvents.PASSWORD_RESET]: "INFO",
  [AuthEvents.PASSWORD_RESET_REQUEST]: "INFO",
  [AuthEvents.MFA_ENABLE]: "INFO",
  [AuthEvents.MFA_DISABLE]: "WARNING",
  [AuthEvents.MFA_BACKUP_REGENERATE]: "INFO",
  [AuthEvents.LOGIN_FAILED]: "WARNING",
  [AuthEvents.EMAIL_VERIFICATION]: "INFO",
  [AuthEvents.EMAIL_VERIFICATION_RESENT]: "INFO",
  [AuthEvents.SESSION_EXPIRED]: "INFO",
  [AuthEvents.SESSION_INVALIDATED]: "WARNING",
  [AuthEvents.PERMISSION_DENIED]: "WARNING",
  [AuthEvents.TOKEN_EXPIRED]: "WARNING",
  [AuthEvents.INVALID_TOKEN]: "ERROR",
  [AuthEvents.PASSWORD_CHANGED]: "INFO",
  [AuthEvents.ACCOUNT_LOCKED]: "CRITICAL",
  [AuthEvents.ACCOUNT_UNLOCKED]: "INFO",
  [AuthEvents.SIGNUP_CODE_GENERATED]: "INFO",
  [AuthEvents.SIGNUP_CODE_USED]: "INFO",
  [AuthEvents.SIGNUP_CODE_REVOKED]: "WARNING",
  [AuthEvents.SIGNUP_CODE_REGENERATED]: "INFO",

  // Data events
  [DataEvents.CREATE]: "INFO",
  [DataEvents.READ]: "INFO",
  [DataEvents.UPDATE]: "INFO",
  [DataEvents.DELETE]: "WARNING",
  [DataEvents.EXPORT]: "INFO",
  [DataEvents.IMPORT]: "INFO",
  [DataEvents.BULK_UPDATE]: "WARNING",
  [DataEvents.BULK_DELETE]: "CRITICAL",
  [DataEvents.RESTORE]: "INFO",
  [DataEvents.ARCHIVE]: "INFO",
  [DataEvents.UNARCHIVE]: "INFO",

  // User management events
  [UserManagementEvents.USER_CREATED]: "INFO",
  [UserManagementEvents.USER_UPDATED]: "INFO",
  [UserManagementEvents.USER_DEACTIVATED]: "WARNING",
  [UserManagementEvents.USER_REACTIVATED]: "INFO",
  [UserManagementEvents.USER_DELETED]: "CRITICAL",
  [UserManagementEvents.ROLE_ASSIGNED]: "INFO",
  [UserManagementEvents.ROLE_REMOVED]: "WARNING",
  [UserManagementEvents.PERMISSION_GRANTED]: "INFO",
  [UserManagementEvents.PERMISSION_REVOKED]: "WARNING",
  [UserManagementEvents.ROLE_CREATED]: "INFO",
  [UserManagementEvents.ROLE_UPDATED]: "INFO",
  [UserManagementEvents.ROLE_DELETED]: "WARNING",

  // Document events
  [DocumentEvents.DOCUMENT_UPLOADED]: "INFO",
  [DocumentEvents.DOCUMENT_VIEWED]: "INFO",
  [DocumentEvents.DOCUMENT_DOWNLOADED]: "INFO",
  [DocumentEvents.DOCUMENT_DELETED]: "WARNING",
  [DocumentEvents.DOCUMENT_SHARED]: "INFO",
  [DocumentEvents.DOCUMENT_UNSHARED]: "INFO",
  [DocumentEvents.DOCUMENT_TAGGED]: "INFO",
  [DocumentEvents.DOCUMENT_UNTAGGED]: "INFO",
  [DocumentEvents.DOCUMENT_REDACTED]: "WARNING",
  [DocumentEvents.DOCUMENT_OCR_COMPLETED]: "INFO",
  [DocumentEvents.DOCUMENT_CLASSIFICATION_COMPLETED]: "INFO",
  [DocumentEvents.DOCUMENT_PII_DETECTED]: "WARNING",
  [DocumentEvents.DOCUMENT_PROCESSING_FAILED]: "ERROR",
  [DocumentEvents.DOCUMENT_METADATA_UPDATED]: "INFO",
  [DocumentEvents.DOCUMENT_MOVED]: "INFO",
  [DocumentEvents.DOCUMENT_COPIED]: "INFO",

  // Case events
  [CaseEvents.CASE_CREATED]: "INFO",
  [CaseEvents.CASE_UPDATED]: "INFO",
  [CaseEvents.CASE_CLOSED]: "INFO",
  [CaseEvents.CASE_REOPENED]: "INFO",
  [CaseEvents.CASE_DELETED]: "CRITICAL",
  [CaseEvents.CASE_ARCHIVED]: "INFO",
  [CaseEvents.CASE_UNARCHIVED]: "INFO",
  [CaseEvents.CASE_ASSIGNED]: "INFO",
  [CaseEvents.CASE_UNASSIGNED]: "INFO",
  [CaseEvents.CASE_PRIORITY_CHANGED]: "INFO",
  [CaseEvents.CASE_STATUS_CHANGED]: "INFO",
  [CaseEvents.CASE_EXPORTED]: "INFO",
  [CaseEvents.CASE_SHARED]: "INFO",
  [CaseEvents.CASE_UNSHARED]: "INFO",

  // Security events
  [SecurityEvents.SUSPICIOUS_ACTIVITY]: "CRITICAL",
  [SecurityEvents.BRUTE_FORCE_DETECTED]: "CRITICAL",
  [SecurityEvents.UNAUTHORIZED_ACCESS]: "CRITICAL",
  [SecurityEvents.API_KEY_CREATED]: "INFO",
  [SecurityEvents.API_KEY_REVOKED]: "WARNING",
  [SecurityEvents.IP_BLOCKED]: "WARNING",
  [SecurityEvents.IP_UNBLOCKED]: "INFO",
  [SecurityEvents.SECURITY_ALERT]: "CRITICAL",

  // System events
  [SystemEvents.SYSTEM_STARTUP]: "INFO",
  [SystemEvents.SYSTEM_SHUTDOWN]: "WARNING",
  [SystemEvents.BACKUP_STARTED]: "INFO",
  [SystemEvents.BACKUP_COMPLETED]: "INFO",
  [SystemEvents.BACKUP_FAILED]: "ERROR",
  [SystemEvents.MAINTENANCE_MODE_ENABLED]: "WARNING",
  [SystemEvents.MAINTENANCE_MODE_DISABLED]: "INFO",
  [SystemEvents.CONFIGURATION_CHANGED]: "WARNING",
  [SystemEvents.INTEGRATION_CONNECTED]: "INFO",
  [SystemEvents.INTEGRATION_DISCONNECTED]: "WARNING",
  [SystemEvents.AUDIT_LOG_EXPORTED]: "INFO",
  [SystemEvents.AUDIT_LOG_PURGED]: "WARNING",

  // Compliance events
  [ComplianceEvents.RETENTION_POLICY_APPLIED]: "INFO",
  [ComplianceEvents.LEGAL_HOLD_PLACED]: "WARNING",
  [ComplianceEvents.LEGAL_HOLD_RELEASED]: "INFO",
  [ComplianceEvents.COMPLIANCE_REPORT_GENERATED]: "INFO",
  [ComplianceEvents.DATA_SUBJECT_REQUEST]: "INFO",
  [ComplianceEvents.DATA_DELETION_REQUEST]: "WARNING",
  [ComplianceEvents.DATA_EXPORT_REQUEST]: "INFO",
};

// Helper function to get event category
export function getEventCategory(
  event: AuditEventType,
): AuditEventCategoryType {
  if (Object.values(AuthEvents).includes(event as any))
    return AuditEventCategory.AUTH;
  if (Object.values(DocumentEvents).includes(event as any))
    return AuditEventCategory.DOCUMENT;
  if (Object.values(CaseEvents).includes(event as any))
    return AuditEventCategory.CASE;
  if (Object.values(UserManagementEvents).includes(event as any))
    return AuditEventCategory.USER_MANAGEMENT;
  if (Object.values(SecurityEvents).includes(event as any))
    return AuditEventCategory.SECURITY;
  if (Object.values(SystemEvents).includes(event as any))
    return AuditEventCategory.SYSTEM;
  if (Object.values(ComplianceEvents).includes(event as any))
    return AuditEventCategory.COMPLIANCE;
  return AuditEventCategory.DATA; // Default for data operations
}

// Helper function to get event severity
export function getEventSeverity(
  event: AuditEventType,
): "INFO" | "WARNING" | "ERROR" | "CRITICAL" {
  return EventSeverityMap[event] || "INFO";
}
