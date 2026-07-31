import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

export function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export function notAuthenticated() {
  return {
    content: [{ type: "text" as const, text: "Not authenticated." }],
    isError: true,
  };
}

export function zagrebNow(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Zagreb" }),
  );
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Next Sunday (or today if today is Sunday) in Europe/Zagreb. */
export function upcomingSunday(): string {
  const d = zagrebNow();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return isoDate(d);
}