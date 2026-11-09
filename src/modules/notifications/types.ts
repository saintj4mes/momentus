export type NotificationStatus = "pending" | "processing" | "sent" | "failed";

export type NotificationChannel = "email" | "sms" | "webhook";

export interface NotificationOutboxItem {
  id: string;
  organizationId: string;
  eventId: string;
  aggregateId: string;
  aggregateVersion: number;
  kind: string;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  attempts: number;
  availableAt: string;
  createdAt: string;
}

export interface NotificationDispatchResult {
  success: boolean;
  externalMessageId?: string;
  channel: NotificationChannel;
  error?: string;
}

export interface OutboxBatchResult {
  processed: number;
  succeeded: number;
  failed: number;
  items: Array<{
    id: string;
    kind: string;
    status: NotificationStatus;
    error?: string;
  }>;
}

