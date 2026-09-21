"use client";

import { Icon } from "./Icon";

export function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    // z-[60], strictly above BottomNav's z-50 — same z-index would tie-break
    // on DOM order (BottomNav renders after page content in layout.tsx), so
    // the nav bar could otherwise paint over and intercept clicks on a
    // sheet's bottom-most content, e.g. its Cancel/Submit row.
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-on-surface/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-in w-full max-w-md rounded-lg bg-surface-container-lowest p-space-lg pb-space-xl shadow-xl"
        style={{ animationDuration: "0.2s" }}
      >
        <div className="mx-auto mb-space-md h-1 w-10 rounded-full bg-on-surface/10" />
        <div className="mb-space-md flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">{title}</h3>
          <button onClick={onClose} className="tap flex h-7 w-7 items-center justify-center rounded-full bg-surface-container text-on-surface">
            <Icon name="close" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
