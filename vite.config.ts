import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/harveygames/",
  plugins: [reactRouter()],
});
