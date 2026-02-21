import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const LEGACY_SRC_ROOT = path.resolve(process.cwd(), "..", "src");

const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function resolveLegacyFile(parts: string[]) {
  const safeParts = parts
    .map((seg) => decodeURIComponent(seg))
    .map((seg) => seg.trim())
    .filter(Boolean);
  if (safeParts.some((seg) => seg.includes("..") || seg.includes("\\") || seg.includes("/"))) {
    return null;
  }
  const filePath = path.join(LEGACY_SRC_ROOT, ...safeParts);
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(path.normalize(LEGACY_SRC_ROOT))) {
    return null;
  }
  return normalized;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: requestPath } = await params;
  const filePath = resolveLegacyFile(requestPath || []);
  if (!filePath || !existsSync(filePath)) {
    return new Response("Not Found", { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
  const file = await readFile(filePath);
  return new Response(file, {
    status: 200,
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=3600",
    },
  });
}
