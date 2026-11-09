import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  getSupabasePublicConfig,
  hasSupabasePublicConfig,
} from "./shared/infrastructure/supabase/public-config";

export async function proxy(request: NextRequest) {
  const localDemoRequest =
    process.env.NODE_ENV === "development" &&
    process.env.MOMENTUS_LOCAL_DEMO_ENABLED === "true" &&
    (request.nextUrl.pathname === "/sign-in" ||
      request.nextUrl.pathname.startsWith("/admin") ||
      request.nextUrl.pathname.startsWith("/event/") ||
      request.nextUrl.pathname.startsWith("/demo/microsites/"));
  if (localDemoRequest) return NextResponse.next({ request });
  if (!hasSupabasePublicConfig()) {
    return NextResponse.next({ request });
  }

  const supabaseConfig = getSupabasePublicConfig();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    supabaseConfig.url,
    supabaseConfig.publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
