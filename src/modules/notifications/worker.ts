import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";
import { getNotificationProvider, SandboxNotificationProvider } from "./providers";
import type { NotificationOutboxItem, OutboxBatchResult } from "./types";

export interface OutboxOptions {
  batchSize?: number;
  providerOverride?: ReturnType<typeof getNotificationProvider>;
}

export async function processNotificationOutbox(
  options: OutboxOptions = {},
): Promise<OutboxBatchResult> {
  const batchSize = Math.min(options.batchSize ?? 25, 100);
  const provider = options.providerOverride ?? getNotificationProvider();

  let itemsToProcess: NotificationOutboxItem[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("notification_outbox")
      .select("*")
      .eq("status", "pending")
      .lte("available_at", nowIso)
      .order("created_at", { ascending: true })
      .limit(batchSize);

    if (!error && Array.isArray(data) && data.length > 0) {
      itemsToProcess = data.map((row) => ({
        id: row.id,
        organizationId: row.organization_id,
        eventId: row.event_id,
        aggregateId: row.aggregate_id,
        aggregateVersion: row.aggregate_version,
        kind: row.kind,
        payload: (row.payload as Record<string, unknown>) || {},
        status: row.status,
        attempts: row.attempts,
        availableAt: row.available_at,
        createdAt: row.created_at,
      }));
    }
  } catch {
    // If Supabase is unavailable (e.g. offline dev or unit test), handle gracefully
  }

  // If no database rows found (e.g. test environment or local demo), create synthetic test batches if requested
  if (itemsToProcess.length === 0) {
    // Return empty completed batch
    return {
      processed: 0,
      succeeded: 0,
      failed: 0,
      items: [],
    };
  }

  const result: OutboxBatchResult = {
    processed: itemsToProcess.length,
    succeeded: 0,
    failed: 0,
    items: [],
  };

  for (const item of itemsToProcess) {
    try {
      const recipientEmail =
        typeof item.payload.email === "string"
          ? item.payload.email
          : typeof item.payload.recipient === "string"
          ? item.payload.recipient
          : "guest@example.com";

      const subject =
        item.kind === "rsvp.confirmed"
          ? "Your MOMENTUS Invitation & Access Pass Confirmed"
          : item.kind === "invitation.issued"
          ? "You are invited: Private Gathering Access"
          : item.kind === "card.assigned"
          ? "Your Keepsake NFC Card is Ready"
          : `Event Update · ${item.kind}`;

      const html = `
        <div style="font-family: serif; padding: 24px; color: #19352d;">
          <h1 style="color: #19352d; margin-bottom: 8px;">MOMENTUS</h1>
          <p style="font-size: 16px;">Hello,</p>
          <p>${subject}. Your atomic access pass is confirmed.</p>
          <div style="margin: 20px 0; padding: 16px; border: 1px solid #c8a870; border-radius: 6px;">
            <strong>Event Reference:</strong> ${item.eventId}<br/>
            <strong>Token / Aggregate:</strong> ${item.aggregateId}
          </div>
          <p style="font-size: 12px; color: #8b949e;">Powered by MOMENTUS · Online Atomic Verification</p>
        </div>
      `;

      const dispatch = await provider.sendEmail({
        to: recipientEmail,
        subject,
        html,
      });

      if (dispatch.success) {
        result.succeeded += 1;
        result.items.push({
          id: item.id,
          kind: item.kind,
          status: "sent",
        });

        // Update database record
        try {
          const supabase = await createSupabaseServerClient();
          await supabase
            .from("notification_outbox")
            .update({
              status: "sent",
              attempts: item.attempts + 1,
            })
            .eq("id", item.id);
        } catch {
          // ignore
        }
      } else {
        throw new Error(dispatch.error || "Dispatch failed");
      }
    } catch (err) {
      result.failed += 1;
      const nextAttempts = item.attempts + 1;
      const willRetry = nextAttempts < 5;
      const nextAvailable = new Date(
        Date.now() + Math.pow(2, nextAttempts) * 30 * 1000,
      ).toISOString();

      result.items.push({
        id: item.id,
        kind: item.kind,
        status: willRetry ? "pending" : "failed",
        error: err instanceof Error ? err.message : String(err),
      });

      try {
        const supabase = await createSupabaseServerClient();
        await supabase
          .from("notification_outbox")
          .update({
            status: willRetry ? "pending" : "failed",
            attempts: nextAttempts,
            available_at: nextAvailable,
          })
          .eq("id", item.id);
      } catch {
        // ignore
      }
    }
  }

  return result;
}

