import { type NextRequest, NextResponse } from "next/server";
import { processNotificationOutbox } from "@/modules/notifications/worker";

export async function GET(request: NextRequest) {
  return handleOutboxCron(request);
}

export async function POST(request: NextRequest) {
  return handleOutboxCron(request);
}

async function handleOutboxCron(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In production, require valid Bearer CRON_SECRET
  if (cronSecret && process.env.NODE_ENV === "production") {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const searchParams = request.nextUrl.searchParams;
  const batchSize = Number.parseInt(searchParams.get("batchSize") || "25", 10);

  const result = await processNotificationOutbox({ batchSize });

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    stats: result,
  });
}
