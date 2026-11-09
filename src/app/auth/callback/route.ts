import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code)
    return NextResponse.redirect(
      new URL("/sign-in?error=verification", request.url),
    );

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error)
    return NextResponse.redirect(
      new URL("/sign-in?error=verification", request.url),
    );
  return NextResponse.redirect(new URL("/setup/mfa", request.url));
}
