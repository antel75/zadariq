import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "city_alerts",
  title: "Active city alerts",
  description:
    "List currently active alerts for Zadar (traffic, outages, weather, earthquakes), sorted by priority.",
  inputSchema: {
    limit: z.number().int().optional().describe("Maximum number of alerts to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const max = Math.min(Math.max(limit ?? 10, 1), 50);
    const { data, error } = await supabaseForUser(ctx)
      .from("city_alerts")
      .select("title, summary, type, priority, source, source_url, valid_until")
      .gt("valid_until", new Date().toISOString())
      .order("priority", { ascending: false })
      .limit(max);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data?.length) return { content: [{ type: "text", text: "No active alerts right now." }] };

    const text = data
      .map((a) => `- [${a.type}] ${a.title} — ${a.summary} (izvor: ${a.source})`)
      .join("\n");
    return { content: [{ type: "text", text }], structuredContent: { alerts: data } };
  },
});