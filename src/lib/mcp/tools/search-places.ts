import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_places",
  title: "Search places",
  description:
    "Search approved places in Zadar (shops, cafes, services) by name or address. Returns address and coordinates.",
  inputSchema: {
    query: z.string().describe("Name or address fragment to search for."),
    category: z.string().optional().describe("Optional category filter, e.g. shop, cafes, pharmacy."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const term = query.trim();
    if (!term) return { content: [{ type: "text", text: "Empty query." }], isError: true };

    let q = supabaseForUser(ctx)
      .from("pending_places")
      .select("id, proposed_name, proposed_address, category, lat, lng, phone, website")
      .eq("status", "approved")
      .or(`proposed_name.ilike.%${term}%,proposed_address.ilike.%${term}%`)
      .limit(25);
    if (category) q = q.eq("category", category);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data?.length) return { content: [{ type: "text", text: `No places found for "${term}".` }] };

    const places = data.map((p) => ({
      id: `ap_${p.id}`,
      name: p.proposed_name,
      address: p.proposed_address,
      category: p.category,
      lat: p.lat,
      lng: p.lng,
      phone: p.phone,
      website: p.website,
    }));
    const text = places.map((p) => `- ${p.name} — ${p.address} (${p.category})`).join("\n");
    return { content: [{ type: "text", text }], structuredContent: { places } };
  },
});