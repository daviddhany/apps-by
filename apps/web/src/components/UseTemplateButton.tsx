"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";

export function UseTemplateButton({ templateId }: { templateId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const result = await apiFetch<{ appInstanceId: string }>(`/api/templates/${templateId}/use`, { method: "POST" });
          router.push(`/apps/${result.appInstanceId}`);
        } finally {
          setLoading(false);
        }
      }}
      className="pill tap bg-primary px-3 py-1.5 text-sm font-medium text-on-primary disabled:opacity-50"
    >
      {loading ? "Creating…" : "Use this"}
    </button>
  );
}
