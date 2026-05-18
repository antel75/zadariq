// Generates public/sitemap.xml with static + dynamic routes.
// Runs before `vite dev` and `vite build` via predev/prebuild hooks.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://zadariq.lovable.app";
const SUPABASE_URL = "https://yxfaovaigwdbziewnppx.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZmFvdmFpZ3dkYnppZXducHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNjMyMzksImV4cCI6MjA4NjYzOTIzOX0.tlIFv3yq9tPRZ5Ush0SGPReLtjEEhqZ7uyX6_ypwj5g";

interface Entry { path: string; changefreq?: string; priority?: string; }

const staticEntries: Entry[] = [
  { path: "/", changefreq: "hourly", priority: "1.0" },
  { path: "/search", changefreq: "weekly", priority: "0.7" },
  { path: "/emergency", changefreq: "weekly", priority: "0.9" },
  { path: "/transport", changefreq: "daily", priority: "0.9" },
  { path: "/parking", changefreq: "weekly", priority: "0.8" },
  { path: "/cinema", changefreq: "daily", priority: "0.8" },
  { path: "/kino-zona", changefreq: "daily", priority: "0.6" },
  { path: "/events", changefreq: "daily", priority: "0.9" },
  { path: "/sunday-radar", changefreq: "daily", priority: "0.8" },
  { path: "/ev-chargers", changefreq: "weekly", priority: "0.7" },
  { path: "/znamenitosti", changefreq: "monthly", priority: "0.7" },
  { path: "/public-services", changefreq: "monthly", priority: "0.6" },
  { path: "/utility-companies", changefreq: "monthly", priority: "0.6" },
  { path: "/digital-zadar", changefreq: "monthly", priority: "0.6" },
  { path: "/for-business", changefreq: "monthly", priority: "0.5" },
  { path: "/pravne-informacije", changefreq: "yearly", priority: "0.3" },
  { path: "/data-sources", changefreq: "monthly", priority: "0.4" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
];

const categories = ['health','pharmacies','dentists','restaurants','cafes','shops','services','beauty','automotive','sports','culture','tourism'];
const publicServiceIds = ['grad-zadar','zadarska-zupanija','porezna-uprava','mup-zadar','fina','hzmo','hzzo','hzz','katastar','sudski-registar','obrtni-registar','dorh','centar-socijalna-skrb','dom-zdravlja','opca-bolnica'];

async function fetchBusinessIds(): Promise<string[]> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/pending_places?select=id&status=eq.approved&limit=1000`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    });
    if (!r.ok) return [];
    const rows = await r.json() as Array<{ id: string }>;
    return rows.map(r => `ap_${r.id}`);
  } catch { return []; }
}

(async () => {
  const businessIds = await fetchBusinessIds();
  const entries: Entry[] = [
    ...staticEntries,
    ...categories.map(c => ({ path: `/category/${c}`, changefreq: "daily", priority: "0.6" })),
    ...publicServiceIds.map(o => ({ path: `/public-services/${o}`, changefreq: "monthly", priority: "0.5" })),
    ...businessIds.map(id => ({ path: `/business/${id}`, changefreq: "weekly", priority: "0.5" })),
  ];

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries.map(e => `  <url><loc>${BASE_URL}${e.path}</loc>${e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : ''}${e.priority ? `<priority>${e.priority}</priority>` : ''}</url>`),
    `</urlset>`,
  ].join("\n");

  writeFileSync(resolve("public/sitemap.xml"), xml);
  console.log(`sitemap.xml written (${entries.length} entries, ${businessIds.length} dynamic)`);
})();
