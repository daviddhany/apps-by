import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/server/db";
import { LogoutButton } from "@/components/LogoutButton";
import { AppHeader } from "@/components/AppHeader";
import { Icon } from "@/components/Icon";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [friendCount, incomingCount] = await Promise.all([
    db.friendship.count({ where: { status: "accepted", OR: [{ requesterId: user.id }, { addresseeId: user.id }] } }),
    db.friendship.count({ where: { status: "pending", addresseeId: user.id } }),
  ]);

  return (
    <>
      <AppHeader title="Profile" initial={user.name} />
      <main className="flex flex-col gap-space-lg px-margin pb-space-xl pt-20">
        <div className="card flex flex-col items-center gap-2 p-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed font-headline-md text-headline-md font-bold text-on-primary-fixed">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <p className="font-headline-sm text-headline-sm font-bold text-on-surface">{user.name}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{user.email}</p>
        </div>

        <Link href="/friends" className="card tap flex items-center justify-between px-4 py-3.5">
          <span className="flex items-center gap-3">
            <Icon name="group" size={20} className="text-primary" />
            <span>
              <span className="block font-label-lg text-label-lg font-bold text-on-surface">Friends</span>
              <span className="block font-body-sm text-body-sm text-on-surface-variant">{friendCount} friend{friendCount === 1 ? "" : "s"}</span>
            </span>
          </span>
          <span className="flex items-center gap-2">
            {incomingCount > 0 ? (
              <span className="rounded-full bg-tertiary px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-tertiary">{incomingCount}</span>
            ) : null}
            <Icon name="chevron_right" size={20} className="text-on-surface-variant/50" />
          </span>
        </Link>

        <Link href="/profile/settings" className="card tap flex items-center justify-between px-4 py-3.5">
          <span className="flex items-center gap-3">
            <Icon name="settings" size={20} className="text-primary" />
            <span className="font-label-lg text-label-lg font-bold text-on-surface">Account settings</span>
          </span>
          <Icon name="chevron_right" size={20} className="text-on-surface-variant/50" />
        </Link>

        <div className="card p-5 font-body-sm text-body-sm text-on-surface-variant">
          <p className="font-label-lg text-label-lg font-bold text-on-surface">Plan: Free</p>
          <p className="mt-1">Unlimited creation for the MVP — plan limits and Pro features are architected but not enforced yet.</p>
        </div>

        <LogoutButton />
      </main>
    </>
  );
}
