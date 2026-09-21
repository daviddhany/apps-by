import { NextRequest, NextResponse } from "next/server";

// The mobile app (Expo web preview, and any future packaged web build) calls
// this API from a different origin (e.g. http://localhost:8081) than the
// Next.js app itself, so browser-enforced CORS blocks it by default with no
// server-side signal beyond a generic "Failed to fetch" in the client. Native
// builds (iOS/Android via Expo Go) aren't subject to CORS at all — this is
// purely for the web-rendered mobile preview and any other cross-origin
// client. Mobile auth uses a bearer token, not cookies, so reflecting the
// origin without `Access-Control-Allow-Credentials` is safe.
export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const origin = req.headers.get("origin") ?? "*";

  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  const res = NextResponse.next();
  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    res.headers.set(key, value);
  }
  return res;
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

export const config = {
  matcher: "/api/:path*",
};
