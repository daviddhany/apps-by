import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { AppHeader } from "@/components/AppHeader";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function AccountSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppHeader title="Account settings" showBack initial={user.name} />
      <main className="flex flex-col gap-space-lg px-margin pb-space-xl pt-20">
        <div className="card p-5">
          <p className="font-label-md text-label-md font-semibold text-on-surface-variant">Name</p>
          <p className="mt-0.5 font-body-lg text-body-lg text-on-surface">{user.name}</p>
          {user.email ? (
            <>
              <p className="mt-3 font-label-md text-label-md font-semibold text-on-surface-variant">Email</p>
              <p className="mt-0.5 font-body-lg text-body-lg text-on-surface">{user.email}</p>
            </>
          ) : null}
        </div>

        {user.passwordHash ? (
          <ChangePasswordForm />
        ) : (
          <div className="card p-5 font-body-sm text-body-sm text-on-surface-variant">
            This is a guest account and doesn&rsquo;t have a password to change.
          </div>
        )}
      </main>
    </>
  );
}
