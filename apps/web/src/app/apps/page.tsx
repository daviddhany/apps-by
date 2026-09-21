import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/server/db";
import { AppHeader } from "@/components/AppHeader";
import { Icon } from "@/components/Icon";
import { MyAppsClient } from "./MyAppsClient";

export default async function MyAppsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const memberships = await db.appMember.findMany({
    where: { userId: user.id },
    include: { appInstance: true },
    orderBy: { appInstance: { updatedAt: "desc" } },
  });

  const apps = memberships.map((m) => ({
    id: m.appInstance.id,
    title: m.appInstance.title,
    icon: m.appInstance.icon,
    role: m.role,
    status: m.appInstance.status,
    updatedAt: m.appInstance.updatedAt.toISOString(),
  }));

  return (
    <>
      <AppHeader title="My Apps" initial={user.name} />
      <main className="px-margin pb-space-xl pt-20 md:px-margin-desktop">
        <div className="mb-space-lg flex items-center justify-between">
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">My Apps</h1>
          <Link href="/join" className="pill flex items-center gap-1 bg-primary-fixed px-3 py-1.5 font-label-md text-label-md text-on-primary-fixed">
            <Icon name="qr_code_scanner" size={16} />
            Join with code
          </Link>
        </div>

        <MyAppsClient initialApps={apps} />
      </main>
    </>
  );
}
