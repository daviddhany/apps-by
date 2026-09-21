"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { Icon } from "@/components/Icon";

export interface FriendEntry {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  createdAt: string;
}

export function FriendsClient({
  initialFriends,
  initialIncoming,
  initialOutgoing,
}: {
  initialFriends: FriendEntry[];
  initialIncoming: FriendEntry[];
  initialOutgoing: FriendEntry[];
}) {
  const [friends, setFriends] = useState(initialFriends);
  const [incoming, setIncoming] = useState(initialIncoming);
  const [outgoing, setOutgoing] = useState(initialOutgoing);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    const r = await apiFetch<{ friends: FriendEntry[]; incoming: FriendEntry[]; outgoing: FriendEntry[] }>("/api/friends");
    setFriends(r.friends);
    setIncoming(r.incoming);
    setOutgoing(r.outgoing);
  }

  async function sendRequest(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch("/api/friends", { method: "POST", body: JSON.stringify({ email }) });
      setSuccess(`Request sent to ${email}`);
      setEmail("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send request");
    } finally {
      setSending(false);
    }
  }

  async function respond(id: string, action: "accept" | "decline") {
    setBusyId(id);
    try {
      await apiFetch(`/api/friends/${id}`, { method: "POST", body: JSON.stringify({ action }) });
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      await apiFetch(`/api/friends/${id}`, { method: "DELETE" });
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-space-lg">
      <form onSubmit={sendRequest} className="card flex flex-col gap-2 p-4">
        <label className="font-label-md text-label-md font-semibold text-on-surface">Add a friend</label>
        <div className="flex gap-2">
          <input
            type="email"
            required
            placeholder="Their email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="tap flex-1 rounded-DEFAULT bg-surface-container-low px-3.5 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
          />
          <button
            type="submit"
            disabled={sending}
            className="tap rounded-full bg-primary px-5 font-label-md text-label-md font-semibold text-on-primary disabled:opacity-50"
          >
            {sending ? "…" : "Add"}
          </button>
        </div>
        {error ? <p className="font-body-sm text-body-sm text-error">{error}</p> : null}
        {success ? <p className="font-body-sm text-body-sm text-secondary">{success}</p> : null}
      </form>

      {incoming.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-label-sm text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant">
            Requests ({incoming.length})
          </h2>
          {incoming.map((f) => (
            <div key={f.id} className="card flex items-center justify-between gap-2 px-4 py-3">
              <span className="flex min-w-0 items-center gap-3">
                <Avatar name={f.name} />
                <span className="truncate font-label-lg text-label-lg font-bold text-on-surface">{f.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <button
                  disabled={busyId === f.id}
                  onClick={() => respond(f.id, "decline")}
                  className="tap flex h-9 w-9 items-center justify-center rounded-full bg-error-container text-on-error-container disabled:opacity-50"
                  aria-label={`Decline ${f.name}`}
                >
                  <Icon name="close" size={18} />
                </button>
                <button
                  disabled={busyId === f.id}
                  onClick={() => respond(f.id, "accept")}
                  className="tap flex h-9 w-9 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container disabled:opacity-50"
                  aria-label={`Accept ${f.name}`}
                >
                  <Icon name="check" size={18} />
                </button>
              </span>
            </div>
          ))}
        </section>
      ) : null}

      {outgoing.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-label-sm text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant">Sent</h2>
          {outgoing.map((f) => (
            <div key={f.id} className="card flex items-center justify-between gap-2 px-4 py-3">
              <span className="flex min-w-0 items-center gap-3">
                <Avatar name={f.name} />
                <span className="truncate font-body-sm text-body-sm text-on-surface">{f.name}</span>
              </span>
              <button
                disabled={busyId === f.id}
                onClick={() => remove(f.id)}
                className="tap font-label-sm text-label-sm font-medium text-on-surface-variant underline disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          ))}
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="font-label-sm text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant">
          Friends ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span className="text-3xl">👋</span>
            <p className="font-label-lg text-label-lg font-bold text-on-surface">No friends yet</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Add someone by email above to make it easy to share apps with them.</p>
          </div>
        ) : (
          friends.map((f) => (
            <div key={f.id} className="card flex items-center justify-between gap-2 px-4 py-3">
              <span className="flex min-w-0 items-center gap-3">
                <Avatar name={f.name} />
                <span className="truncate font-label-lg text-label-lg font-bold text-on-surface">{f.name}</span>
              </span>
              <button
                disabled={busyId === f.id}
                onClick={() => remove(f.id)}
                aria-label={`Remove ${f.name}`}
                className="tap flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50"
              >
                <Icon name="person_remove" size={18} />
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed font-label-md text-label-md font-bold text-on-primary-fixed">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
