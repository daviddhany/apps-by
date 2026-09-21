import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/server/db";
import { NeedInput } from "@/components/NeedInput";
import { AppHeader } from "@/components/AppHeader";
import { Icon } from "@/components/Icon";
import type { MiniAppSpecification } from "@needly/core";
import { computeForSpec } from "@needly/core";

const ICON_EMOJI: Record<string, string> = {
  sparkles: "✨",
  trophy: "🏆",
  receipt: "🧾",
  car: "🚗",
  "check-square": "✅",
};

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const memberships = await db.appMember.findMany({
    where: { userId: user.id },
    include: { appInstance: true },
    orderBy: { appInstance: { updatedAt: "desc" } },
    take: 5,
  });

  const cards = await Promise.all(memberships.map((m) => buildCard(m.appInstance.id, m.role)));

  return (
    <>
      <AppHeader title="Needly" subtitle="Home" initial={user.name} />
      <main className="flex flex-col space-y-space-lg px-margin pb-space-xl pt-20">
        <div className="flex flex-col space-y-space-xs pt-space-xs">
          <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-surface-container-high px-3 py-1 font-label-md text-label-md text-on-surface-variant shadow-sm">
            <span>Hi {user.name.split(" ")[0]}</span>
            <span className="animate-bounce">👋</span>
          </div>
          <h1 className="mt-1 font-display-mobile text-display-mobile tracking-tight text-on-surface">What do you need?</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Tell Needly what you&rsquo;re trying to do — we&rsquo;ll build the tool in seconds.</p>
        </div>

        <NeedInput autoFocus />

        <Link
          href="/join"
          className="flex w-full items-center justify-between gap-space-sm rounded-2xl bg-surface-container-high/60 p-space-sm backdrop-blur-md"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-lowest text-primary shadow-sm">
              <Icon name="qr_code_scanner" size={20} />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-label-md text-label-md font-semibold text-on-surface">Got a code? Join an app</span>
              <span className="truncate font-body-sm text-body-sm text-on-surface-variant">e.g. D7K-42P or tap to scan</span>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-surface-container-lowest px-3.5 py-1.5 font-label-md text-label-md font-semibold text-primary shadow-sm">Join</span>
        </Link>

        {cards.length > 0 ? (
          <section>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">Your Active Apps</h2>
                <span className="rounded-full bg-primary-fixed px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-primary-fixed">{cards.length} live</span>
              </div>
              <Link href="/apps" className="flex items-center gap-0.5 font-label-md text-label-md font-semibold text-primary hover:underline">
                <span>View all</span>
                <Icon name="chevron_right" size={16} />
              </Link>
            </div>
            <div className="mt-space-sm flex flex-col space-y-3.5">
              {cards.map((c) => (
                <AppCard key={c.id} card={c} />
              ))}
            </div>
          </section>
        ) : null}

        <div className="flex items-center gap-3 rounded-2xl bg-surface-container p-space-md">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm">
            <Icon name="offline_bolt" size={20} />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-label-md text-label-md font-bold text-on-surface">Every app is instantly shareable</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Friends can use it without downloading anything.</span>
          </div>
        </div>
      </main>
    </>
  );
}

interface Card {
  id: string;
  title: string;
  icon: string;
  role: string;
  metricLabel: string;
  metricValue: string;
  metricTone: "neutral" | "good" | "warn";
  screenCount: number;
}

async function buildCard(appInstanceId: string, role: string): Promise<Card> {
  const appInstance = await db.appInstance.findUniqueOrThrow({ where: { id: appInstanceId } });
  const spec = JSON.parse(appInstance.specJson) as MiniAppSpecification;
  const records = await db.appData.findMany({ where: { appInstanceId } });
  const parsed = records.map((r) => ({ id: r.id, entityType: r.entityType, data: JSON.parse(r.data) }));
  const computed = computeForSpec(spec, parsed);

  let metricLabel = "Screens";
  let metricValue = String(spec.screens.length);
  let metricTone: Card["metricTone"] = "neutral";

  if (computed["expense.balances"]) {
    const { balances } = computed["expense.balances"] as { balances: { net: number }[] };
    const unsettled = balances.filter((b) => b.net < -0.01).reduce((s, b) => s - b.net, 0);
    metricLabel = "Unsettled";
    metricValue = `$${unsettled.toFixed(0)}`;
    metricTone = unsettled > 0 ? "warn" : "good";
  } else if (computed["tournament.standings"]) {
    const matchCount = parsed.filter((r) => r.entityType === "tournament.match").length;
    metricLabel = "Matches";
    metricValue = String(matchCount);
  } else if (computed["savings.totalProgress"] !== undefined) {
    const goal = Number(spec.settings.goalAmount ?? 0);
    const total = Number(computed["savings.totalProgress"] ?? 0);
    metricLabel = "Progress";
    metricValue = goal > 0 ? `${Math.round((total / goal) * 100)}%` : `$${total.toFixed(0)}`;
    metricTone = "good";
  } else if (computed["checklist.progress"] !== undefined) {
    metricLabel = "Done";
    metricValue = `${Math.round(Number(computed["checklist.progress"]) * 100)}%`;
    metricTone = "good";
  }

  return { id: appInstanceId, title: appInstance.title, icon: appInstance.icon, role, metricLabel, metricValue, metricTone, screenCount: spec.screens.length };
}

function AppCard({ card }: { card: Card }) {
  const toneClass = card.metricTone === "good" ? "text-secondary" : card.metricTone === "warn" ? "text-tertiary" : "text-on-surface";

  return (
    <Link
      href={`/apps/${card.id}`}
      className="relative flex flex-col space-y-3 overflow-hidden rounded-[22px] bg-surface-container-lowest p-space-md shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-space-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface-variant text-xl text-primary">
            {ICON_EMOJI[card.icon] ?? "✨"}
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{card.title}</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">as {card.role}</span>
          </div>
        </div>
        <span className="rounded-full bg-surface-container-high px-2.5 py-1 font-label-sm text-label-sm font-semibold text-primary">Active</span>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-container-low/70 p-2.5">
        <div className="flex flex-col">
          <span className="font-label-sm text-label-sm text-on-surface-variant">{card.metricLabel}</span>
          <span className={`font-headline-sm text-headline-sm font-bold ${toneClass}`}>{card.metricValue}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Screens</span>
          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{card.screenCount}</span>
        </div>
      </div>
    </Link>
  );
}
