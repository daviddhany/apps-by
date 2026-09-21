"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { LogoutButton } from "./LogoutButton";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "auto_awesome" },
  { href: "/apps", label: "My Apps", icon: "dashboard" },
  { href: "/discover", label: "Discover", icon: "explore" },
];

/** Desktop/tablet workspace rail — mirrors the Stitch web mockups' sidebar
 * (logo, primary CTA, nav, profile footer). Hidden below md; BottomNav
 * covers small screens instead. */
export function Sidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-white/5 bg-surface-container-lowest/60 px-4 py-5 md:flex">
      <Link href="/" className="mb-6 flex items-center gap-2 px-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Needly" className="h-8 w-8 object-contain" />
        <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">Needly</span>
      </Link>

      <Link
        href="/create"
        className="btn-aurora tap mb-4 flex items-center justify-center gap-2 rounded-full py-2.5 font-label-lg text-label-lg font-bold shadow-md transition-transform active:scale-[0.98]"
      >
        <Icon name="add" size={18} />
        New Creation
      </Link>

      <Link
        href="/join"
        className="mb-6 flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2.5 font-label-md text-label-md font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
      >
        <Icon name="qr_code_scanner" size={18} />
        Join with code
      </Link>

      <span className="mb-2 px-1 font-label-sm text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant/70">
        Workspace
      </span>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-label-md text-label-md font-medium transition-colors ${
              isActive(item.href) ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
            }`}
          >
            <Icon name={item.icon} size={20} filled={isActive(item.href)} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-white/5 pt-3">
        <Link
          href="/profile"
          className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-surface-container-low"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed font-label-md text-label-md font-bold text-on-primary-fixed">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <span className="truncate font-label-md text-label-md font-semibold text-on-surface">{name}</span>
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}
