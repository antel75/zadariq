import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser, upcomingSunday } from "../supabase";

export default defineTool({
  name: "sunday_open_shops",
  title: "Shops open on Sunday",
  description:
    "List shops in Zadar that work on a given working Sunday, with address and opening hours. Defaults to the upcoming Sunday.",
  inputSchema: {
    sunday_date: z
      .string()
      .optional()
      .describe("Sunday date in YYYY-MM-DD format. Defaults to the upcoming Sunday."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ sunday_date }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const date = sunday_date ?? upcomingSunday();

    const { data: schedule, error } = await supabase
      .from("shop_sunday_schedule")
      .select("business_id, open_time, close_time, notes")
      .eq("sunday_date", date);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!schedule?.length) {
      return { content: [{ type: "text", text: `No shops recorded for ${date}.` }] };
    }

    const placeIds = schedule
      .map((s) => s.business_id)
      .filter((id) => id.startsWith("ap_"))
      .map((id) => id.slice(3));

    const places = placeIds.length
      ? (
          await supabase
            .from("pending_places")
            .select("id, proposed_name, proposed_address, lat, lng")
            .in("id", placeIds)
        ).data ?? []
      : [];
    const byId = new Map(places.map((p) => [p.id, p]));

    const shops = schedule.map((s) => {
      const p = s.business_id.startsWith("ap_") ? byId.get(s.business_id.slice(3)) : undefined;
      return {
        id: s.business_id,
        name: p?.proposed_name ?? s.business_id,
        address: p?.proposed_address ?? null,
        lat: p?.lat ?? null,
        lng: p?.lng ?? null,
        open_time: s.open_time,
        close_time: s.close_time,
        notes: s.notes,
      };
    });

    const text = [
      `Working Sunday ${date} — ${shops.length} shops:`,
      ...shops.map(
        (s) =>
          `- ${s.name}${s.address ? `, ${s.address}` : ""} — ${s.open_time ?? "?"}–${s.close_time ?? "?"}`,
      ),
    ].join("\n");

    return { content: [{ type: "text", text }], structuredContent: { sunday_date: date, shops } };
  },
});