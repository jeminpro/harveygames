import type { Config } from "@react-router/dev/config";
import { catalog } from "./app/games/catalog";

export default {
  ssr: false,
  basename: "/harveygames",
  prerender: ["/", ...catalog.map((game) => `/play/${game.id}`)],
} satisfies Config;
