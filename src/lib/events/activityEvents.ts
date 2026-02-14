/**
 * Global Event Emitter for Activity Updates
 *
 * This system allows components to emit events when audit-worthy actions occur,
 * enabling real-time updates in the Activity Feed without constant polling.
 */

export type ActivityEventType =
  | "document:upload"
  | "document:download"
  | "document:view"
  | "document:delete"
  | "document:reprocess"
  | "case:create"
  | "case:update"
  | "case:delete"
  | "case:archive"
  | "case:status_change"
  | "auth:login"
  | "auth:logout"
  | "auth:mfa_setup"
  | "permission:assign"
  | "permission:revoke"
  | "filter:save"
  | "filter:delete"
  | "filter:apply"
  | "system:sample_data"
  | "audit:activity";

export interface ActivityEventDetail {
  type: ActivityEventType;
  action: string;
  resource: string;
  resourceId?: string;
  description?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

export interface ActivityEventOptions {
  debounce?: number; // Milliseconds to debounce similar events
  immediate?: boolean; // Skip debouncing for this event
}

class ActivityEventEmitter extends EventTarget {
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private eventQueue: Map<string, ActivityEventDetail[]> = new Map();

  /**
   * Emit an activity event that will trigger UI updates
   */
  emit(
    type: ActivityEventType,
    detail: Omit<ActivityEventDetail, "type" | "timestamp">,
    options: ActivityEventOptions = {},
  ) {
    const event: ActivityEventDetail = {
      ...detail,
      type,
      timestamp: new Date(),
    };

    // If immediate, dispatch right away
    if (options.immediate) {
      this.dispatchActivityEvent([event]);
      return;
    }

    // Otherwise, use debouncing to batch similar events
    const debounceKey = `${type}:${detail.resource}`;
    const debounceTime = options.debounce ?? 1000; // Default 1 second

    // Add to queue
    const queue = this.eventQueue.get(debounceKey) || [];
    queue.push(event);
    this.eventQueue.set(debounceKey, queue);

    // Clear existing timer
    const existingTimer = this.debounceTimers.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      const events = this.eventQueue.get(debounceKey) || [];
      if (events.length > 0) {
        this.dispatchActivityEvent(events);
        this.eventQueue.delete(debounceKey);
      }
      this.debounceTimers.delete(debounceKey);
    }, debounceTime);

    this.debounceTimers.set(debounceKey, timer);
  }

  /**
   * Dispatch the actual event to listeners
   */
  private dispatchActivityEvent(events: ActivityEventDetail[]) {
    const customEvent = new CustomEvent("activity", {
      detail: {
        events,
        isBatch: events.length > 1,
        timestamp: new Date(),
      },
    });
    this.dispatchEvent(customEvent);
  }

  /**
   * Helper method to emit document-related activities
   */
  emitDocument(
    action: "upload" | "download" | "view" | "delete" | "reprocess",
    documentId: string,
    documentName?: string,
    metadata?: Record<string, any>,
  ) {
    this.emit(`document:${action}`, {
      action: action.toUpperCase(),
      resource: "DOCUMENT",
      resourceId: documentId,
      description: documentName,
      metadata,
    });
  }

  /**
   * Helper method to emit case-related activities
   */
  emitCase(
    action: "create" | "update" | "delete" | "archive" | "status_change",
    caseId: string,
    caseNumber?: string,
    metadata?: Record<string, any>,
  ) {
    this.emit(`case:${action}`, {
      action: action.toUpperCase().replace("_", " "),
      resource: "CASE",
      resourceId: caseId,
      description: caseNumber,
      metadata,
    });
  }

  /**
   * Helper method to emit auth-related activities
   */
  emitAuth(
    action: "login" | "logout" | "mfa_setup",
    userId?: string,
    metadata?: Record<string, any>,
  ) {
    this.emit(
      `auth:${action}`,
      {
        action: action.toUpperCase().replace("_", " "),
        resource: "AUTH",
        userId,
        metadata,
      },
      { immediate: true },
    ); // Auth events should be immediate
  }

  /**
   * Helper method to emit filter-related activities
   */
  emitFilter(
    action: "save" | "delete" | "apply",
    filterId: string,
    filterName?: string,
    metadata?: Record<string, any>,
  ) {
    this.emit(`filter:${action}`, {
      action: action.toUpperCase().replace("_", " "),
      resource: "FILTER",
      resourceId: filterId,
      description: filterName,
      metadata,
    });
  }

  /**
   * Clear all pending events (useful for cleanup)
   */
  clearPendingEvents() {
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
    this.eventQueue.clear();
  }
}

// Singleton instance
export const activityEvents = new ActivityEventEmitter();

// Type for event listeners
export interface ActivityEvent extends Event {
  detail: {
    events: ActivityEventDetail[];
    isBatch: boolean;
    timestamp: Date;
  };
}

// Helper hook for React components (optional, can be created separately)
export function useActivityEvents(
  callback: (event: ActivityEvent) => void,
  deps: React.DependencyList = [],
) {
  if (typeof window !== "undefined") {
    // This will be implemented in a separate React hooks file
    // to avoid mixing DOM APIs with React hooks
  }
}
