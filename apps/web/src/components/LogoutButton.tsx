"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      className="tap rounded-xl border border-white/10 py-3 text-center font-medium text-ink/70"
    >
      Sign out
    </button>
  );
}
