import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/server/db";
import { UseTemplateButton } from "@/components/UseTemplateButton";
import { AppHeader } from "@/components/AppHeader";

export default async function DiscoverPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const templates = await db.template.findMany({
    where: { visibility: "public" },
    include: { toolDna: true },
    orderBy: { usageCount: "desc" },
    take: 50,
  });

  return (
    <>
      <AppHeader title="Discover" initial={user.name} />
      <main className="px-margin pb-space-xl pt-20">
        <h1 className="mb-1 font-headline-lg text-headline-lg font-bold text-on-surface">Discover</h1>
        <p className="mb-space-lg font-body-md text-body-md text-on-surface-variant">Tools other people have made — use one instantly, or remix it.</p>

        {templates.length === 0 ? (
          <div className="card px-6 py-12 text-center font-body-sm text-body-sm text-on-surface-variant">
            Nothing published yet. Create an app and publish it as a template to see it here.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {templates.map((t) => (
              <div key={t.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-label-lg text-label-lg font-bold text-on-surface">{t.title}</p>
                    <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{t.description}</p>
                  </div>
                  <span className="pill shrink-0 bg-primary-fixed px-2 py-1 font-label-sm text-label-sm font-semibold text-on-primary-fixed">{t.category}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {t.usageCount} uses · {t.remixCount} remixes
                  </p>
                  <UseTemplateButton templateId={t.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
