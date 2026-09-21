import { NextRequest, NextResponse } from "next/server";
import { loadAppForMember } from "@/server/loadApp";
import { storage } from "@/server/storage";

/** Photo upload for any "image" field (receipts, voting options, game
 * entries, ...) — any member of the app can upload. Returns the URL to
 * store as that field's value. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await loadAppForMember(id, undefined, req);

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await storage.save(id, file.name, file.type, bytes);
    return NextResponse.json({ url });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 400;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status });
  }
}
