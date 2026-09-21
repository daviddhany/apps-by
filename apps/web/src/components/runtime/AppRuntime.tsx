"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MiniAppSpecification } from "@needly/core";
import type { RuntimeMember, RuntimeRecord } from "./types";
import { COMPONENT_REGISTRY } from "./registry";
import { apiFetch } from "@/lib/apiClient";
import { useAppRealtime } from "@/hooks/useAppRealtime";
import { BottomSheet } from "@/components/BottomSheet";
import { AppHeader } from "@/components/AppHeader";
import { Icon } from "@/components/Icon";

interface AppData {
  appInstanceId: string;
  spec: MiniAppSpecification;
  status: string;
  visibility: string;
  role: string;
  data: RuntimeRecord[];
  computed: Record<string, unknown>;
  members: RuntimeMember[];
  joinCodes: { code: string; role: string }[];
  pendingRequestCount: number;
}

// Every entity name is namespaced "<toolDnaNamespace>.<entity>" (buildSpec.ts).
// An action belongs to the active screen if it shares that namespace — not
// necessarily the exact same entity, since e.g. Voting Board's "vote" action
// (voting.vote) operates on a different entity than its screen (voting.poll).
function namespaceOf(entity: string | undefined): string | undefined {
  return entity?.split(".")[0];
}

const ICONS: Record<string, string> = {
  sparkles: "✨",
  trophy: "🏆",
  receipt: "🧾",
  car: "🚗",
  "check-square": "✅",
};

export function AppRuntime({ appInstanceId, currentUserId }: { appInstanceId: string; currentUserId: string }) {
  const router = useRouter();
  const [app, setApp] = useState<AppData | null>(null);
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showCommand, setShowCommand] = useState(false);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mutateError, setMutateError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await apiFetch<AppData>(`/api/apps/${appInstanceId}`);
      setApp(result);
      setActiveScreenId((prev) => prev ?? result.spec.screens[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this app");
    }
  }, [appInstanceId]);

  useEffect(() => {
    load();
  }, [load]);

  useAppRealtime(appInstanceId, () => {
    setLive(true);
    load();
    setTimeout(() => setLive(false), 2000);
  });

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="font-headline-sm text-headline-sm text-on-surface">Can&rsquo;t open this app</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{error}</p>
        <button onClick={() => router.push("/apps")} className="pill mt-3 bg-primary px-4 py-2 font-label-md text-label-md text-on-primary">
          Back to My Apps
        </button>
      </div>
    );
  }

  if (!app) return <LoadingSkeleton />;

  const activeScreen = app.spec.screens.find((s) => s.id === activeScreenId) ?? app.spec.screens[0];
  const ActiveComponent = activeScreen ? COMPONENT_REGISTRY[activeScreen.component] : null;
  const records = app.data.filter((r) => r.entityType === activeScreen?.entity);

  async function onMutate(mutation: { action: string; entity?: string; payload: Record<string, unknown> }) {
    setBusy(true);
    setMutateError(null);
    // Optimistic-ish: we don't fabricate the server row locally (ids matter
    // for follow-up actions), but we refetch immediately after the mutation
    // resolves rather than waiting for the next SSE tick, so the actor's own
    // change always feels instant.
    try {
      await apiFetch(`/api/apps/${appInstanceId}/mutate`, { method: "POST", body: JSON.stringify(mutation) });
      await load();
    } catch (err) {
      // Every onMutate caller (buttons/switches across the screen components)
      // fires this without awaiting/catching it themselves, so a failure here
      // must never throw past this point — surface it in the UI instead of
      // becoming an unhandled promise rejection.
      setMutateError(err instanceof Error ? err.message : "That didn't work");
    } finally {
      setBusy(false);
    }
  }

  async function setArchived(archived: boolean) {
    setShowMenu(false);
    try {
      await apiFetch(`/api/apps/${appInstanceId}`, { method: "PATCH", body: JSON.stringify({ status: archived ? "archived" : "active" }) });
      await load();
    } catch (err) {
      setMutateError(err instanceof Error ? err.message : "Couldn't update this app");
    }
  }

  async function deleteApp() {
    setShowMenu(false);
    if (!window.confirm(`Permanently delete "${app?.spec.title}"? This deletes all its data for everyone and can't be undone.`)) return;
    try {
      await apiFetch(`/api/apps/${appInstanceId}`, { method: "DELETE" });
      router.push("/apps");
      router.refresh();
    } catch (err) {
      setMutateError(err instanceof Error ? err.message : "Couldn't delete this app");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="App Runner" showBack initial={app.members.find((m) => m.id === currentUserId)?.name ?? "N"} />

      <main className="flex-1 px-margin pb-32 pt-20">
        {/* Live sync presence strip */}
        <div className="mb-3 flex items-center justify-between rounded-full bg-surface-container-low px-space-md py-space-xs shadow-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {live ? <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" /> : null}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
            </span>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{app.members.length} member{app.members.length === 1 ? "" : "s"} in this app</p>
          </div>
          <span className="font-label-sm text-label-sm font-bold tracking-wider text-primary">LIVE SYNC</span>
        </div>

        {mutateError ? (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl bg-error-container px-4 py-2.5">
            <p className="font-body-sm text-body-sm text-on-error-container">{mutateError}</p>
            <button onClick={() => setMutateError(null)} className="tap shrink-0 text-on-error-container/70">
              <Icon name="close" size={16} />
            </button>
          </div>
        ) : null}

        {/* Identity card */}
        <div className="mb-4 rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary-container text-2xl text-on-secondary-container shadow-sm">
                {ICONS[app.spec.icon] ?? "✨"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="truncate font-headline-md text-headline-md text-on-surface">{app.spec.title}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm ${
                      app.status === "archived" ? "bg-surface-container-high text-on-surface-variant" : "bg-primary-fixed text-on-primary-fixed"
                    }`}
                  >
                    {app.status === "archived" ? "Archived" : "Active"}
                  </span>
                </div>
                <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{app.spec.screens.length} screens • you&rsquo;re {app.role}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {app.joinCodes[0] ? (
                <button
                  onClick={() => setShowShare(true)}
                  className="tap relative flex h-9 items-center gap-1.5 rounded-full bg-surface-container px-3 font-label-md text-label-md text-on-surface shadow-sm transition-all hover:bg-surface-container-high active:scale-95"
                >
                  <Icon name="qr_code_2" size={18} className="text-primary" />
                  <span>{app.joinCodes[0].code}</span>
                  {app.pendingRequestCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-tertiary px-1 font-label-sm text-label-sm font-bold text-on-tertiary">
                      {app.pendingRequestCount}
                    </span>
                  ) : null}
                </button>
              ) : (
                <button
                  onClick={() => setShowShare(true)}
                  className="tap flex h-9 items-center gap-1.5 rounded-full bg-surface-container px-3 font-label-md text-label-md text-on-surface shadow-sm active:scale-95"
                >
                  <Icon name="qr_code_2" size={18} className="text-primary" />
                  <span>Share</span>
                </button>
              )}
              {app.role === "owner" || app.role === "admin" ? (
                <button
                  onClick={() => setShowMenu(true)}
                  aria-label="More options"
                  className="tap flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface shadow-sm transition-all hover:bg-surface-container-high active:scale-95"
                >
                  <Icon name="more_vert" size={18} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-3">
            <div className="flex items-center -space-x-2 overflow-hidden">
              {app.members.slice(0, 5).map((m) => (
                <span
                  key={m.id}
                  title={m.name}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container-lowest bg-primary font-label-sm text-label-sm font-bold text-on-primary shadow-sm"
                >
                  {m.name.slice(0, 1).toUpperCase()}
                </span>
              ))}
              {app.members.length > 5 ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-variant font-label-sm text-label-sm font-bold text-on-surface-variant shadow-sm">
                  +{app.members.length - 5}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Screen tab pills */}
        <div className="no-scrollbar mb-4 flex items-center gap-2 overflow-x-auto pb-1">
          {app.spec.screens.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveScreenId(s.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 font-label-md text-label-md transition-colors ${
                s.id === activeScreen?.id
                  ? "bg-primary-container text-on-primary shadow-sm"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {ActiveComponent && activeScreen ? (
          <ActiveComponent
            spec={app.spec}
            screen={activeScreen}
            records={records}
            allRecords={app.data}
            fields={app.spec.fields[activeScreen.entity ?? ""] ?? []}
            actions={app.spec.actions.filter((a) => !a.entity || namespaceOf(a.entity) === namespaceOf(activeScreen.entity))}
            computed={app.computed}
            role={app.role}
            members={app.members}
            currentUserId={currentUserId}
            busy={busy}
            onMutate={onMutate}
          />
        ) : null}
      </main>

      {/* Floating AI "Modify App" pill — sits above the per-screen "+" add
          button (fixed bottom-24 right-5 z-30) so the two never overlap. */}
      <div className="fixed bottom-44 right-4 z-40">
        <button
          onClick={() => setShowCommand(true)}
          className="group flex items-center gap-2 rounded-full bg-inverse-surface px-4 py-3 text-inverse-on-surface shadow-xl transition-all hover:shadow-2xl active:scale-95"
        >
          <Icon name="auto_awesome" size={20} className="animate-pulse text-secondary-fixed" />
          <span className="font-label-md text-label-md font-bold tracking-tight">Modify</span>
        </button>
      </div>

      {showMenu ? (
        <BottomSheet title={app.spec.title} onClose={() => setShowMenu(false)}>
          <div className="flex flex-col gap-2">
            {app.status === "archived" ? (
              <button
                onClick={() => setArchived(false)}
                className="tap flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-left"
              >
                <Icon name="unarchive" size={20} className="text-primary" />
                <span className="font-label-lg text-label-lg text-on-surface">Restore app</span>
              </button>
            ) : (
              <button
                onClick={() => setArchived(true)}
                className="tap flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-left"
              >
                <Icon name="archive" size={20} className="text-on-surface-variant" />
                <div>
                  <span className="block font-label-lg text-label-lg text-on-surface">Archive app</span>
                  <span className="block font-body-sm text-body-sm text-on-surface-variant">Hides it without losing any data. Reversible.</span>
                </div>
              </button>
            )}
            {app.role === "owner" ? (
              <button onClick={deleteApp} className="tap flex items-center gap-3 rounded-2xl bg-error-container px-4 py-3 text-left">
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

      {showShare ? (
        <BottomSheet title="Share this app" onClose={() => setShowShare(false)}>
          <ShareSheet
            appInstanceId={appInstanceId}
            title={app.spec.title}
            joinCodes={app.joinCodes}
            visibility={app.visibility}
            canManage={app.role === "owner" || app.role === "admin"}
            onRefresh={load}
          />
        </BottomSheet>
      ) : null}

      {showCommand ? (
        <BottomSheet title="Tell the app what to do" onClose={() => setShowCommand(false)}>
          <CommandSheet
            appInstanceId={appInstanceId}
            screens={app.spec.screens.map((s) => s.title)}
            onDone={() => {
              setShowCommand(false);
              load();
            }}
          />
        </BottomSheet>
      ) : null}
    </div>
  );
}

function ShareSheet({
  appInstanceId,
  title,
  joinCodes,
  visibility,
  canManage,
  onRefresh,
}: {
  appInstanceId: string;
  title: string;
  joinCodes: { code: string; role: string }[];
  visibility: string;
  canManage: boolean;
  onRefresh: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settingVisibility, setSettingVisibility] = useState(false);
  const code = joinCodes[0]?.code;
  const link = typeof window !== "undefined" && code ? `${window.location.origin}/join?code=${code}` : "";
  const qrSrc = link ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(link)}` : "";

  async function setVisibility(next: "public" | "private") {
    setSettingVisibility(true);
    try {
      await apiFetch(`/api/apps/${appInstanceId}`, { method: "PATCH", body: JSON.stringify({ visibility: next }) });
      onRefresh();
    } finally {
      setSettingVisibility(false);
    }
  }

  const visibilityToggle = canManage ? (
    <div className="flex items-center justify-between rounded-DEFAULT bg-surface-container-low p-space-sm">
      <div className="flex items-center gap-2">
        <Icon name={visibility === "private" ? "lock" : "public"} size={18} className="text-on-surface-variant" />
        <div>
          <p className="font-label-md text-label-md font-semibold text-on-surface">{visibility === "private" ? "Private" : "Public"}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {visibility === "private" ? "New joiners need your approval" : "Anyone with the code joins instantly"}
          </p>
        </div>
      </div>
      <button
        disabled={settingVisibility}
        onClick={() => setVisibility(visibility === "private" ? "public" : "private")}
        className={`tap rounded-full px-3 py-1.5 font-label-sm text-label-sm font-semibold transition-colors disabled:opacity-50 ${
          visibility === "private" ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface"
        }`}
      >
        Make {visibility === "private" ? "public" : "private"}
      </button>
    </div>
  ) : null;

  if (!code) {
    return (
      <div className="flex flex-col gap-space-md">
        {visibilityToggle}
        <button
          disabled={creating}
          onClick={async () => {
            setCreating(true);
            await apiFetch(`/api/apps/${appInstanceId}/join-code`, { method: "POST" });
            setCreating(false);
            onRefresh();
          }}
          className="tap rounded-full bg-primary py-3 font-label-lg text-label-lg text-on-primary"
        >
          {creating ? "Creating…" : "Create a join code"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-space-md">
      {visibilityToggle}
      {canManage && visibility === "private" ? <JoinRequestsPanel appInstanceId={appInstanceId} onRefresh={onRefresh} /> : null}
      <p className="font-body-sm text-body-sm text-on-surface-variant">Give friends instant access to {title} — no account required to join.</p>

      <div className="relative my-1 flex flex-col items-center justify-center rounded-DEFAULT bg-surface-container-low p-space-md shadow-inner">
        <span className="mb-1.5 font-label-sm text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant">Join code</span>
        <div className="flex items-center justify-center gap-2 rounded-full bg-surface-container-lowest px-5 py-2.5 font-mono text-2xl font-bold tracking-widest text-primary shadow-sm">
          {code}
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="tap mt-3 flex items-center gap-1.5 rounded-full bg-surface-container-high px-4 py-1.5 font-label-md text-label-md text-on-surface transition-transform active:scale-95"
        >
          <Icon name={copied ? "check" : "content_copy"} size={16} />
          <span>{copied ? "Copied!" : "Copy invite link"}</span>
        </button>
      </div>

      {qrSrc ? (
        <div className="flex flex-col items-center gap-2 rounded-DEFAULT bg-surface-container-low p-space-md">
          <img src={qrSrc} alt="QR code to join this app" className="h-36 w-36 rounded-DEFAULT bg-surface-container-lowest p-2 shadow-md" />
          <p className="font-body-sm text-body-sm text-on-surface">Scan to join {title}</p>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Instant entry • no password needed</span>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Join ${title} on Apps By: ${link}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-DEFAULT bg-surface-container-low px-3 py-2.5 font-label-md text-label-md font-semibold text-on-surface transition-all hover:bg-surface-container-high active:scale-95"
        >
          <Icon name="chat" size={18} className="text-[#25D366]" />
          <span>WhatsApp</span>
        </a>
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`Join ${title} on Apps By`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-DEFAULT bg-surface-container-low px-3 py-2.5 font-label-md text-label-md font-semibold text-on-surface transition-all hover:bg-surface-container-high active:scale-95"
        >
          <Icon name="send" size={18} className="text-[#0088CC]" />
          <span>Telegram</span>
        </a>
      </div>

      <div className="flex items-start gap-2.5 rounded-DEFAULT bg-surface-container p-space-sm">
        <Icon name="lock_open_right" size={20} className="mt-0.5 shrink-0 text-secondary" />
        <p className="font-body-sm text-body-sm leading-tight text-on-surface-variant">
          <strong className="font-semibold text-on-surface">Zero friction:</strong> anyone with this code can join as a participant.
        </p>
      </div>
    </div>
  );
}

function CommandSheet({ appInstanceId, screens, onDone }: { appInstanceId: string; screens: string[]; onDone: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const examples = ["Add Ahmed", "Ahmed paid 20 for dinner", `Add a page where we vote`, "Only admins can edit scores"];

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setFeedback(null);
        try {
          const result = await apiFetch<{ type: string; question?: string; summary?: string; error?: string }>(`/api/apps/${appInstanceId}/command`, {
            method: "POST",
            body: JSON.stringify({ text }),
          });
          if (result.type === "clarify") {
            setFeedback(result.question ?? "Not sure what you mean.");
          } else {
            onDone();
          }
        } catch (err) {
          setFeedback(err instanceof Error ? err.message : "Failed");
        } finally {
          setBusy(false);
        }
      }}
      className="flex flex-col gap-space-sm"
    >
      <p className="font-body-sm text-body-sm text-on-surface-variant">Instruct natural-language changes directly to this app — screens: {screens.join(", ")}.</p>
      <div className="flex flex-wrap gap-1.5">
        {examples.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setText(ex)}
            className="rounded-full bg-surface-container px-3 py-1.5 font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-container-high"
          >
            &ldquo;{ex}&rdquo;
          </button>
        ))}
      </div>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe the change you want…"
        rows={3}
        className="tap w-full resize-none rounded-DEFAULT bg-surface-container-low px-space-md py-space-sm font-body-md text-body-md text-on-surface outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
      />
      {feedback ? <p className="font-body-sm text-body-sm text-tertiary">{feedback}</p> : null}
      <button type="submit" disabled={busy || !text.trim()} className="tap rounded-full bg-primary py-3 font-label-lg text-label-lg text-on-primary shadow-md disabled:opacity-50">
        {busy ? "Working…" : "Do it"}
      </button>
    </form>
  );
}

interface JoinRequestItem {
  id: string;
  name: string;
  role: string;
  createdAt: string;
}

function JoinRequestsPanel({ appInstanceId, onRefresh }: { appInstanceId: string; onRefresh: () => void }) {
  const [requests, setRequests] = useState<JoinRequestItem[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ requests: JoinRequestItem[] }>(`/api/apps/${appInstanceId}/join-requests`)
      .then((r) => setRequests(r.requests))
      .catch(() => setRequests([]));
  }, [appInstanceId]);

  async function respond(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      await apiFetch(`/api/apps/${appInstanceId}/join-requests/${id}`, { method: "POST", body: JSON.stringify({ action }) });
      setRequests((prev) => prev?.filter((r) => r.id !== id) ?? null);
      onRefresh();
    } finally {
      setBusyId(null);
    }
  }

  if (!requests || requests.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-DEFAULT bg-surface-container-low p-space-sm">
      <p className="font-label-sm text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant">
        {requests.length} waiting for approval
      </p>
      {requests.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-lowest px-3 py-2">
          <span className="font-body-sm text-body-sm font-medium text-on-surface">{r.name}</span>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              disabled={busyId === r.id}
              onClick={() => respond(r.id, "reject")}
              className="tap flex h-8 w-8 items-center justify-center rounded-full bg-error-container text-on-error-container disabled:opacity-50"
              aria-label={`Reject ${r.name}`}
            >
              <Icon name="close" size={16} />
            </button>
            <button
              disabled={busyId === r.id}
              onClick={() => respond(r.id, "approve")}
              className="tap flex h-8 w-8 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container disabled:opacity-50"
              aria-label={`Approve ${r.name}`}
            >
              <Icon name="check" size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 pt-20">
      <div className="skeleton h-11 w-11 rounded-2xl" />
      <div className="skeleton h-6 w-40" />
      <div className="skeleton mt-4 h-24 w-full" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-24 w-full" />
    </div>
  );
}
