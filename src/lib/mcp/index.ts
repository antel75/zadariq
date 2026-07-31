import { auth, defineMcp } from "@lovable.dev/mcp-js";
import sundayOpenShops from "./tools/sunday-open-shops";
import cityAlerts from "./tools/city-alerts";
import cityEvents from "./tools/city-events";
import searchPlaces from "./tools/search-places";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "zadariq-mcp",
  title: "ZadarIQ",
  version: "0.1.0",
  instructions:
    "Live city data for Zadar, Croatia. Use `sunday_open_shops` for shops working on a given working Sunday, `city_alerts` for active traffic/outage/weather alerts, `city_events` for upcoming events, and `search_places` to look up a place's address and coordinates. All times are Europe/Zagreb.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [sundayOpenShops, cityAlerts, cityEvents, searchPlaces],
});