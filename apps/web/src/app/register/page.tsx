"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/apiClient";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col justify-center gap-space-lg px-6">
      <div className="text-center">
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">Create your account</h1>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">Takes about 20 seconds.</p>
      </div>

      <form onSubmit={submit} className="card flex flex-col gap-3 p-5">
        <input
          required
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="tap rounded-DEFAULT bg-surface-container-low px-4 py-3 font-body-md text-body-md outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
        />
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
          minLength={8}
          placeholder="Password (min 8 characters)"
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
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Sign in
        </Link>
      </p>
    </main>
  );
}
