import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { AppHeader } from "@/components/AppHeader";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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

        <div className="card p-5 font-body-sm text-body-sm text-on-surface-variant">
          <p className="font-label-lg text-label-lg font-bold text-on-surface">Plan: Free</p>
          <p className="mt-1">Unlimited creation for the MVP — plan limits and Pro features are architected but not enforced yet.</p>
        </div>

        <LogoutButton />
      </main>
    </>
  );
}
