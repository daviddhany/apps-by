import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { getCurrentUser } from "@/server/auth";

export const metadata: Metadata = {
  title: "Needly — What do you need?",
  description: "Describe what you need. Get an instant, collaborative mini-app.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Needly",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#111318",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen bg-surface font-sans text-on-surface antialiased">
        <div className="mx-auto min-h-screen max-w-md pb-28">{children}</div>
        {user ? <BottomNav /> : null}
      </body>
    </html>
  );
}
