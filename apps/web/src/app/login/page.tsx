"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/apiClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col justify-center gap-space-lg px-6">
      <div className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Apps By" className="mb-3 h-16 w-16 object-contain" />
        <h1 className="font-display-mobile text-display-mobile font-extrabold tracking-tight text-on-surface">Apps By</h1>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">What do you need?</p>
      </div>

      <form onSubmit={submit} className="card flex flex-col gap-3 p-5">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="tap rounded-DEFAULT bg-surface-container-low px-4 py-3 font-body-md text-body-md outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="tap rounded-DEFAULT bg-surface-container-low px-4 py-3 font-body-md text-body-md outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
        />
        {error ? <p className="font-body-sm text-body-sm text-error">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="tap mt-1 rounded-full bg-primary py-3 font-label-lg text-label-lg text-on-primary shadow-md transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
        New here?{" "}
        <Link href="/register" className="font-semibold text-primary">
          Create an account
        </Link>
      </p>
    </main>
  );
}
