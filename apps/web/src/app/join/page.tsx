"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(() => searchParams.get("code")?.toUpperCase() ?? "");
  const [guestName, setGuestName] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<{ appInstanceId?: string; pending?: boolean }>("/api/join", {
        method: "POST",
        body: JSON.stringify({ code, guestName: needsName ? guestName : undefined }),
      });
      if (result.pending) {
        setPending(true);
        return;
      }
      router.push(`/apps/${result.appInstanceId}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't join";
      if (message === "needs_name") {
        setNeedsName(true);
        setError("Enter your name to join as a guest.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (pending) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-space-md px-6 text-center">
        <span className="text-4xl">⏳</span>
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">Request sent</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          This app is private. Its owner needs to approve your request before you can open it — you&rsquo;ll be notified once they do.
        </p>
        <button onClick={() => router.push("/")} className="tap mt-2 rounded-full bg-surface-container px-5 py-2.5 font-label-md text-label-md font-semibold text-on-surface">
          Back to home
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col justify-center gap-space-lg px-6">
      <div className="text-center">
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">Join an app</h1>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">Enter the code someone shared with you.</p>
      </div>

      <form onSubmit={submit} className="card flex flex-col gap-3 p-5">
        <input
          required
          placeholder="D7K-42P"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="tap rounded-DEFAULT bg-surface-container-low px-4 py-3 text-center font-mono text-xl font-bold tracking-widest text-primary outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
          maxLength={8}
        />
        {needsName ? (
          <input
            required
            placeholder="Your name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="tap rounded-DEFAULT bg-surface-container-low px-4 py-3 font-body-md text-body-md outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
          />
        ) : null}
        {error ? <p className="font-body-sm text-body-sm text-tertiary">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="tap mt-1 rounded-full bg-primary py-3 font-label-lg text-label-lg text-on-primary shadow-md transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Joining…" : "Join"}
        </button>
      </form>
    </main>
  );
}
