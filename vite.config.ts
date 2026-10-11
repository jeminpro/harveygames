import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  // The dev server requires basename to start with base, so the trailing
  // slash is omitted there. Production needs it so URLs stay /harveygames/assets.
  base: command === "serve" ? "/harveygames" : "/harveygames/",
  plugins: [reactRouter()],
}));
