"use client";

import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  initial?: string;
}

/** Fixed, frosted top bar shared by every top-level screen — mirrors the
 * Stitch mockups' header treatment (brand mark or back button, title/subtitle
 * lockup, profile avatar on the right). */
export function AppHeader({ title, subtitle, showBack, initial = "N" }: Props) {
  const router = useRouter();

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-surface/85 pt-safe shadow-[0_1px_12px_rgba(17,28,45,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between gap-space-sm px-space-md">
        <div className="flex min-w-0 items-center gap-space-sm">
          {showBack ? (
            <button
              aria-label="Go back"
              onClick={() => router.back()}
              className="tap -ml-1.5 flex h-11 w-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container-high active:scale-95"
            >
              <Icon name="arrow_back_ios_new" size={20} />
            </button>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/logo.png" alt="Needly" className="h-8 w-8 shrink-0 object-contain" />
          )}
          <div className="flex min-w-0 flex-col leading-none">
            <span className="truncate font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">{title}</span>
            {subtitle ? (
              <span className="truncate font-label-sm text-label-sm font-medium tracking-wide text-on-surface-variant">{subtitle}</span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-space-xs">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed font-label-md text-label-md font-bold text-on-primary-fixed">
            {initial.slice(0, 1).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}
