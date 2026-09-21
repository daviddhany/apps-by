import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/server/db";
import { AppHeader } from "@/components/AppHeader";
import { Icon } from "@/components/Icon";

export default async function MyAppsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const memberships = await db.appMember.findMany({
    where: { userId: user.id },
    include: { appInstance: true },
    orderBy: { appInstance: { updatedAt: "desc" } },
  });

  return (
    <>
      <AppHeader title="My Apps" initial={user.name} />
      <main className="px-margin pb-space-xl pt-20">
        <div className="mb-space-lg flex items-center justify-between">
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">My Apps</h1>
          <Link href="/join" className="pill flex items-center gap-1 bg-primary-fixed px-3 py-1.5 font-label-md text-label-md text-on-primary-fixed">
            <Icon name="qr_code_scanner" size={16} />
            Join with code
          </Link>
        </div>

        {memberships.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span className="text-3xl">🗂️</span>
            <p className="font-label-lg text-label-lg font-bold text-on-surface">No apps yet</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Describe what you need on the Home tab to create your first one.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {memberships.map((m) => (
              <Link key={m.id} href={`/apps/${m.appInstance.id}`} className="card tap flex items-center justify-between px-4 py-3">
                <span>
                  <span className="block font-label-lg text-label-lg font-bold text-on-surface">{m.appInstance.title}</span>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">
                    {m.role} · {m.appInstance.status}
                  </span>
                </span>
                <Icon name="chevron_right" size={20} className="text-on-surface-variant/50" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
