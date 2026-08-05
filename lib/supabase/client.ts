import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { withPublicStoreRevalidation } from "@/lib/supabase/public-fetch";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

const publicStoreFetch: typeof fetch = (input, init) => {
  if (typeof window !== "undefined") {
    return fetch(input, init);
  }

  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();

  if (method !== "GET" && method !== "HEAD") {
    return fetch(input, init);
  }

  return fetch(input, withPublicStoreRevalidation(init));
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: {
        fetch: publicStoreFetch,
      },
    })
  : null;
