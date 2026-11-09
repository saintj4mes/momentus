import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  getSupabasePublicConfig,
  hasSupabasePublicConfig,
} from "./shared/infrastructure/supabase/public-config";

// Known platform root hosts that do not trigger tenant subdomain rewrite
const rootPlatformHosts = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "momentus.events",
  "www.momentus.events",
]);

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase()?.split(":")[0] ?? "";
  const pathname = request.nextUrl.pathname;

  // Multi-tenant custom domain and subdomain routing
  // If host is a subdomain like <event-slug>.momentus.events or a dedicated custom domain
  if (
    host &&
    !rootPlatformHosts.has(host) &&
    pathname === "/" &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api")
  ) {
    let slug = "";
    if (host.endsWith(".momentus.events")) {
      slug = host.replace(".momentus.events", "");
    } else if (host.endsWith(".localhost")) {
      slug = host.replace(".localhost", "");
    }

    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/event/${slug}`;
      return NextResponse.rewrite(url);
    }
  }

  const localDemoRequest =
    process.env.NODE_ENV === "development" &&
    process.env.MOMENTUS_LOCAL_DEMO_ENABLED === "true" &&
    (pathname === "/sign-in" ||
      pathname === "/login" ||
      pathname === "/signin" ||
      pathname.startsWith("/admin") ||
      pathname === "/organizer/billing" ||
      pathname.startsWith("/staff/") ||
      pathname.startsWith("/event/") ||
      pathname.startsWith("/demo/microsites/"));
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
