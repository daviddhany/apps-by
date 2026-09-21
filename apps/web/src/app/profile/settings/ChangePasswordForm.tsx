"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/apiClient";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't change password");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "tap w-full rounded-DEFAULT bg-surface-container-low px-4 py-3 font-body-md text-body-md text-on-surface outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]";

  return (
    <form onSubmit={submit} className="card flex flex-col gap-3 p-5">
      <p className="font-label-lg text-label-lg font-bold text-on-surface">Change password</p>
      <input
        type="password"
        required
        placeholder="Current password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        className={inputClass}
      />
      <input
        type="password"
        required
        minLength={8}
        placeholder="New password (min 8 characters)"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className={inputClass}
      />
      <input
        type="password"
        required
        minLength={8}
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className={inputClass}
      />
      {error ? <p className="font-body-sm text-body-sm text-error">{error}</p> : null}
      {success ? <p className="font-body-sm text-body-sm text-secondary">Password updated.</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="tap mt-1 rounded-full bg-primary py-3 font-label-lg text-label-lg text-on-primary shadow-md transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
