import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Serves files saved by src/server/storage.ts's LocalFsStorageProvider,
// whose save() already returns URLs shaped "/uploads/<appInstanceId>/<file>"
// matching this route. Swap for a real object-storage CDN URL in production
// (see storage.ts's StorageProvider interface).

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  // Every segment must be a plain filename/dirname — reject any path
  // traversal or absolute-path attempt before touching the filesystem.
  if (segments.length === 0 || segments.some((s) => s !== path.basename(s) || s === "..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(segments[segments.length - 1]).toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const baseDir = path.resolve(process.env.UPLOADS_DIR ?? "./.uploads");
  const filePath = path.join(baseDir, ...segments);
  if (!filePath.startsWith(baseDir)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: { "Content-Type": mime, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
