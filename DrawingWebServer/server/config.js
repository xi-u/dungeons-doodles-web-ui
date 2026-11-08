import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * This module defines configuration constants for the DrawingWebServer application.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

export const PORT = Number(process.env.PORT ?? 3000);
export const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? "https://dungeons-doodles-web-ui.onrender.com";
export const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS ?? 30 * 60 * 1000);
export const DRAWING_SIZE = Object.freeze({ width: 200, height: 200 });
export const ROOT_DIR_PATH = ROOT_DIR;
export const SRC_DIR = path.join(ROOT_DIR, "src");
export const DIST_DIR = path.join(ROOT_DIR, "dist");
export const PUBLIC_DIR = path.join(ROOT_DIR, "public");
