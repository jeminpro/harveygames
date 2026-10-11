import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, type ConfigEnv } from "vite";

// Both games have a mount.ts. Same chunk names made the production build keep one game's CSS and drop the other's.
function chunkFileName(chunkInfo: { name: string; facadeModuleId: string | null }) {
  const facade = chunkInfo.facadeModuleId;
  if (facade) {
    const parts = facade.split(/[/\\]/);
    const file = parts.at(-1)?.replace(/\.[^.]+$/, "") ?? chunkInfo.name;
    const folder = parts.at(-2);
    if (folder && (file === "mount" || file === "session" || file === "markup")) {
      return `assets/${folder}-${file}-[hash].js`;
    }
  }
  return "assets/[name]-[hash].js";
}

export default defineConfig((_env: ConfigEnv) => ({
  base: "/harveygames/",
  plugins: [reactRouter()],
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: chunkFileName,
      },
    },
  },
}));
