import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { isoDate, notAuthenticated, supabaseForUser, zagrebNow } from "../supabase";

export default defineTool({
  name: "city_events",
  title: "Upcoming city events",
  description: "List upcoming events in Zadar and the surrounding region.",
  inputSchema: {
    days_ahead: z.number().int().optional().describe("How many days ahead to look (default 14)."),
    category: z.string().optional().describe("Optional category filter."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days_ahead, category }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const days = Math.min(Math.max(days_ahead ?? 14, 1), 120);
    const from = zagrebNow();
    const to = new Date(from);
    to.setDate(to.getDate() + days);

    let query = supabaseForUser(ctx)
      .from("city_events")
      .select("title, description, venue, location, category, event_date_from, event_date_to, website_url")
      .gte("event_date_from", isoDate(from))
      .lte("event_date_from", isoDate(to))
      .order("event_date_from", { ascending: true })
      .limit(50);
    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data?.length) return { content: [{ type: "text", text: "No upcoming events found." }] };

    const text = data
      .map((e) => `- ${e.event_date_from ?? "?"} · ${e.title}${e.venue ? ` @ ${e.venue}` : ""}`)
      .join("\n");
    return { content: [{ type: "text", text }], structuredContent: { events: data } };
  },
});