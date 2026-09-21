import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { NeedInput } from "@/components/NeedInput";
import { AppHeader } from "@/components/AppHeader";

export default async function CreatePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppHeader title="Create" showBack initial={user.name} />
      <main className="flex flex-col space-y-space-lg px-margin pb-space-xl pt-20">
        <div className="text-center">
          <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">Make something</h1>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">Describe the situation — I&rsquo;ll build the tool.</p>
        </div>
        <NeedInput autoFocus />
      </main>
    </>
  );
}
