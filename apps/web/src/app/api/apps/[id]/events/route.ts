import { NextRequest } from "next/server";
import { loadAppForMember } from "@/server/loadApp";
import { subscribe } from "@/server/realtime";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await loadAppForMember(id, undefined, req);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return new Response(JSON.stringify({ error: "Not authorized" }), { status });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`event: ready\ndata: {}\n\n`));

      const unsubscribe = subscribe(id, (event) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      });

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 25000);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
