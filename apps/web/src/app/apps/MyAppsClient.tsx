"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import { Icon } from "@/components/Icon";
import { BottomSheet } from "@/components/BottomSheet";

export interface AppSummary {
  id: string;
  title: string;
  icon: string;
  role: string;
  status: string;
  updatedAt: string;
}

type Filter = "all" | "active" | "archived" | "created" | "joined";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "created", label: "Created by me" },
  { key: "joined", label: "Joined" },
  { key: "archived", label: "Archived" },
];

const ICON_EMOJI: Record<string, string> = {
  sparkles: "✨",
  trophy: "🏆",
  receipt: "🧾",
  car: "🚗",
  "check-square": "✅",
};

export function MyAppsClient({ initialApps }: { initialApps: AppSummary[] }) {
  const router = useRouter();
  const [apps, setApps] = useState(initialApps);
  const [filter, setFilter] = useState<Filter>("all");
  const [menuApp, setMenuApp] = useState<AppSummary | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    switch (filter) {
      case "active":
        return apps.filter((a) => a.status === "active");
      case "archived":
        return apps.filter((a) => a.status === "archived");
      case "created":
        return apps.filter((a) => a.role === "owner");
      case "joined":
        return apps.filter((a) => a.role !== "owner");
      default:
        return apps;
    }
  }, [apps, filter]);

  const archivedCount = useMemo(() => apps.filter((a) => a.status === "archived").length, [apps]);

  async function refresh() {
    const result = await apiFetch<{ apps: AppSummary[] }>("/api/apps");
    setApps(result.apps);
  }

  async function setArchived(app: AppSummary, archived: boolean) {
    setMenuApp(null);
    setBusyId(app.id);
    setError(null);
    try {
      await apiFetch(`/api/apps/${app.id}`, { method: "PATCH", body: JSON.stringify({ status: archived ? "archived" : "active" }) });
      await refresh();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update this app");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteApp(app: AppSummary) {
    setMenuApp(null);
    if (!window.confirm(`Permanently delete "${app.title}"? This deletes all its data for everyone and can't be undone.`)) return;
    setBusyId(app.id);
    setError(null);
    try {
      await apiFetch(`/api/apps/${app.id}`, { method: "DELETE" });
      await refresh();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete this app");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="mb-space-md flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`tap flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-label-md text-label-md font-medium transition-colors ${
              filter === f.key ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {f.label}
            {f.key === "archived" && archivedCount > 0 ? (
              <span className={`rounded-full px-1.5 font-label-sm text-label-sm font-bold ${filter === f.key ? "bg-white/20" : "bg-surface-container-high"}`}>
                {archivedCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl bg-error-container px-4 py-2.5">
          <p className="font-body-sm text-body-sm text-on-error-container">{error}</p>
          <button onClick={() => setError(null)} className="tap shrink-0 text-on-error-container/70">
            <Icon name="close" size={16} />
          </button>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
          <span className="text-3xl">🗂️</span>
          <p className="font-label-lg text-label-lg font-bold text-on-surface">{filter === "archived" ? "No archived apps" : "No apps yet"}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {filter === "archived" ? "Apps you archive show up here." : "Describe what you need on the Home tab to create your first one."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((app) => (
            <div key={app.id} className={`card flex items-center justify-between gap-3 px-4 py-3 ${busyId === app.id ? "opacity-50" : ""}`}>
              <Link href={`/apps/${app.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface-variant text-xl text-primary">
                  {ICON_EMOJI[app.icon] ?? "✨"}
                </div>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-label-lg text-label-lg font-bold text-on-surface">{app.title}</span>
                    {app.status === "archived" ? (
                      <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                        Archived
                      </span>
                    ) : null}
                  </span>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">{app.role === "owner" ? "Created by me" : `Joined · ${app.role}`}</span>
                </span>
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/apps/${app.id}`}
                  className="tap hidden items-center rounded-full bg-primary px-3.5 py-1.5 font-label-md text-label-md font-semibold text-on-primary sm:flex"
                >
                  Open
                </Link>
                <button
                  disabled={busyId === app.id}
                  onClick={() => setMenuApp(app)}
                  aria-label="More options"
                  className="tap flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                >
                  <Icon name="more_vert" size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {menuApp ? (
        <BottomSheet title={menuApp.title} onClose={() => setMenuApp(null)}>
          <div className="flex flex-col gap-2">
            <Link
              href={`/apps/${menuApp.id}`}
              className="tap flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-left sm:hidden"
            >
              <Icon name="open_in_new" size={20} className="text-on-surface-variant" />
              <span className="font-label-lg text-label-lg text-on-surface">Open app</span>
            </Link>
            {menuApp.status === "archived" ? (
              <button onClick={() => setArchived(menuApp, false)} className="tap flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-left">
                <Icon name="unarchive" size={20} className="text-primary" />
                <span className="font-label-lg text-label-lg text-on-surface">Restore app</span>
              </button>
            ) : (
              <button onClick={() => setArchived(menuApp, true)} className="tap flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-left">
                <Icon name="archive" size={20} className="text-on-surface-variant" />
                <div>
                  <span className="block font-label-lg text-label-lg text-on-surface">Archive app</span>
                  <span className="block font-body-sm text-body-sm text-on-surface-variant">Hides it without losing any data. Reversible.</span>
                </div>
              </button>
            )}
            {menuApp.role === "owner" ? (
              <button onClick={() => deleteApp(menuApp)} className="tap flex items-center gap-3 rounded-2xl bg-error-container px-4 py-3 text-left">
                <Icon name="delete_forever" size={20} className="text-on-error-container" />
                <div>
                  <span className="block font-label-lg text-label-lg text-on-error-container">Delete permanently</span>
                  <span className="block font-body-sm text-body-sm text-on-error-container/80">Deletes all data for every member. Can&rsquo;t be undone.</span>
                </div>
              </button>
            ) : null}
          </div>
        </BottomSheet>
      ) : null}
    </>
  );
}
