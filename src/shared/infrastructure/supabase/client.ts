"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./public-config";

let browserClient: SupabaseClient | undefined;

export function createSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const config = getSupabasePublicConfig();
    browserClient = createBrowserClient(config.url, config.publishableKey);
  }

  return browserClient;
}
