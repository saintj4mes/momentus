import type { NotificationDispatchResult } from "./types";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SmsPayload {
  to: string;
  body: string;
  from?: string;
}

export interface NotificationProvider {
  name: string;
  sendEmail(payload: EmailPayload): Promise<NotificationDispatchResult>;
  sendSms(payload: SmsPayload): Promise<NotificationDispatchResult>;
}

// In-Memory / Sandbox Provider for testing & local development
export class SandboxNotificationProvider implements NotificationProvider {
  name = "sandbox";
  private static dispatchedEmails: EmailPayload[] = [];
  private static dispatchedSms: SmsPayload[] = [];

  async sendEmail(payload: EmailPayload): Promise<NotificationDispatchResult> {
    SandboxNotificationProvider.dispatchedEmails.push(payload);
    return {
      success: true,
      externalMessageId: `sandbox-msg-${crypto.randomUUID()}`,
      channel: "email",
    };
  }

  async sendSms(payload: SmsPayload): Promise<NotificationDispatchResult> {
    SandboxNotificationProvider.dispatchedSms.push(payload);
    return {
      success: true,
      externalMessageId: `sandbox-sms-${crypto.randomUUID()}`,
      channel: "sms",
    };
  }

  static getDispatchedEmails(): readonly EmailPayload[] {
    return [...SandboxNotificationProvider.dispatchedEmails];
  }

  static getDispatchedSms(): readonly SmsPayload[] {
    return [...SandboxNotificationProvider.dispatchedSms];
  }

  static clear(): void {
    SandboxNotificationProvider.dispatchedEmails = [];
    SandboxNotificationProvider.dispatchedSms = [];
  }
}

// Resend Email Provider Adapter
export class ResendNotificationProvider implements NotificationProvider {
  name = "resend";
  private apiKey: string;
  private defaultFrom: string;

  constructor(apiKey: string, defaultFrom = "MOMENTUS <notifications@momentus.events>") {
    this.apiKey = apiKey;
    this.defaultFrom = defaultFrom;
  }

  async sendEmail(payload: EmailPayload): Promise<NotificationDispatchResult> {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: payload.from || this.defaultFrom,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          success: false,
          channel: "email",
          error: `Resend HTTP ${res.status}: ${errText}`,
        };
      }

      const data = (await res.json()) as { id?: string };
      return {
        success: true,
        channel: "email",
        externalMessageId: data.id,
      };
    } catch (err) {
      return {
        success: false,
        channel: "email",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async sendSms(payload: SmsPayload): Promise<NotificationDispatchResult> {
    // Resend is email-only; fallback to sandbox or log
    return {
      success: false,
      channel: "sms",
      error: "Resend provider does not support SMS dispatch.",
    };
  }
}

// Factory function
export function getNotificationProvider(): NotificationProvider {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && process.env.NODE_ENV === "production") {
    return new ResendNotificationProvider(resendKey);
  }
  return new SandboxNotificationProvider();
}
