"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const SIDE_ITEMS = [
  { href: "/", label: "Home", icon: "auto_awesome" },
  { href: "/discover", label: "Discover", icon: "explore" },
];
const END_ITEMS = [
  { href: "/apps", label: "My Apps", icon: "dashboard" },
  { href: "/profile", label: "Profile", icon: "person" },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 pb-safe">
      <div className="mx-auto w-full max-w-md px-space-md pb-space-sm pt-1">
        <div className="glass-shell pointer-events-auto flex items-center justify-between rounded-full px-space-sm py-1.5">
          {SIDE_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}

          <div className="flex items-center justify-center px-1">
            <Link
              href="/create"
              aria-label="Create app"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-[0_4px_16px_rgba(29,78,216,0.35)] transition-transform active:scale-95"
            >
              <Icon name="add" size={24} />
            </Link>
          </div>

          {END_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>
        <div className="mx-auto mt-2 h-1 w-32 rounded-full bg-on-surface/20" />
      </div>
    </nav>
  );
}

function NavLink({ item, active }: { item: { href: string; label: string; icon: string }; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex h-12 min-w-[48px] flex-col items-center justify-center rounded-full transition-all ${
        active ? "font-bold text-primary" : "text-on-surface-variant hover:text-on-surface"
      }`}
    >
      <Icon name={item.icon} size={22} filled={active} />
      <span className="mt-0.5 font-label-sm text-label-sm leading-none">{item.label}</span>
    </Link>
  );
}
