import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const LEGACY_ROOT = path.resolve(process.cwd(), "..");
const LEGACY_PAGES = path.join(LEGACY_ROOT, "src", "pages");

function sanitizeSegment(seg: string) {
  return seg.replace(/[^a-zA-Z0-9\-_.]/g, "");
}

function resolveLegacyHtml(slug: string[]) {
  if (!slug.length || slug[0] === "index") {
    return path.join(LEGACY_ROOT, "index.html");
  }
  const page = sanitizeSegment(slug[0]);
  return path.join(LEGACY_PAGES, `${page}.html`);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const htmlPath = resolveLegacyHtml(slug || []);
  if (!existsSync(htmlPath)) {
    return new Response("Not Found", { status: 404 });
  }
  const html = await readFile(htmlPath, "utf8");
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-cache",
    },
  });
}
