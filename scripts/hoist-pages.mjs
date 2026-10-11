import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";

const clientDir = path.resolve("build/client");
const nestedDir = path.join(clientDir, "harveygames");

if (!existsSync(nestedDir)) {
  console.error("Expected prerendered files in build/client/harveygames");
  process.exit(1);
}

cpSync(nestedDir, clientDir, { recursive: true });
rmSync(nestedDir, { recursive: true, force: true });
