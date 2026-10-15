import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { catalog } from "../app/games/catalog.ts";
import { absoluteUrl, siteUrl } from "../app/site.ts";

const locs = [siteUrl, ...catalog.map((game) => absoluteUrl(`play/${game.id}/`))];
const body = locs.map((loc) => `  <url>\n    <loc>${loc}</loc>\n  </url>`).join("\n");
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

const out = path.resolve("build/client/sitemap.xml");
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, xml);
