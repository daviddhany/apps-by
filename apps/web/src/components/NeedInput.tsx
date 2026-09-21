"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import { Icon } from "./Icon";

const SUGGESTIONS = [
  { emoji: "🏝️", label: "Split a trip", prompt: "We're 8 friends traveling together and want to split all our expenses." },
  { emoji: "⚽", label: "Run a tournament", prompt: "We are organizing a knockout FC tournament for 16 players." },
  { emoji: "💰", label: "Track a collection", prompt: "Track everyone's monthly contribution to a shared money pool." },
  { emoji: "🔥", label: "30-day challenge", prompt: "Start a 30-day daily workout challenge with the group." },
  { emoji: "🍕", label: "Group dinner vote", prompt: "Create an instant vote for where we should eat tonight." },
];

const STAGES = ["Understanding your need…", "Finding the best tool…", "Assembling your app…"];

type Outcome =
  | { kind: "chat_answer"; text: string }
  | { kind: "reminder"; text: string; at?: string }
  | { kind: "clarify"; question: string }
  | { kind: "mini_app"; appInstanceId: string; title: string };

interface SpecPreview {
  spec: { title: string; icon: string; screens: { title: string }[] };
  joinCodes: { code: string }[];
}

export function NeedInput({ autoFocus }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [seconds, setSeconds] = useState(0.4);
  const [preview, setPreview] = useState<SpecPreview | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  async function submit(value: string) {
    if (!value.trim() || loading) return;
    return run(value, () => apiFetch<Outcome>("/api/needs", { method: "POST", body: JSON.stringify({ text: value }) }));
  }

  function surpriseMe() {
    if (loading) return;
    return run("🎲 Surprise me — build something random", () => apiFetch<Outcome>("/api/needs/surprise", { method: "POST" }));
  }

  async function run(promptLabel: string, call: () => Promise<Outcome>) {
    setLoading(true);
    setError(null);
    setOutcome(null);
    setPreview(null);
    setText(promptLabel);
    setStage(0);
    setSeconds(0.4);

    const stageTimer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 480);
    const clock = setInterval(() => setSeconds((s) => Math.min(s + 0.1, 2.4)), 100);
    timerRef.current = clock;

    try {
      const result = await call();
      clearInterval(stageTimer);

      if (result.kind === "mini_app") {
        const details = await apiFetch<SpecPreview>(`/api/apps/${result.appInstanceId}`).catch(() => null);
        if (details) setPreview(details);
        setOutcome(result);
        setLoading(false);
        clearInterval(clock);
        return;
      }
      setOutcome(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      clearInterval(stageTimer);
      clearInterval(clock);
      setLoading(false);
    }
  }

  // Synthesis-in-progress panel — mirrors the Stitch "magic creation" screen.
  if (loading || (outcome?.kind === "mini_app" && preview)) {
    return (
      <div className="animate-in relative overflow-hidden rounded-lg bg-surface-container-lowest p-space-md shadow-elevated">
        <div className="mb-space-sm flex items-center justify-between">
          <div className="inline-flex items-center gap-space-xs rounded-full bg-surface-container-high/90 px-space-md py-1.5 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              {loading ? <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" /> : null}
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <span className="font-label-md text-label-md font-semibold text-on-surface-variant">
              {loading ? STAGES[stage] : "Ready to launch"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-surface-container-lowest px-3 py-1 text-primary shadow-sm">
            <Icon name="bolt" size={16} filled className="text-primary" />
            <span className="tabular-nums font-label-md text-label-md font-bold">{seconds.toFixed(1)}s</span>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-container-low p-space-md shadow-inner">
          <div className="mb-space-xs flex items-center gap-1.5">
            <Icon name="auto_awesome" size={16} filled className="text-primary" />
            <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-primary">Your prompt</span>
          </div>
          <p className="font-body-md text-body-md italic text-on-surface">&ldquo;{text}&rdquo;</p>
        </div>

        {preview ? (
          <div className="mt-space-md space-y-space-sm">
            <ModuleRow icon="apps" title={preview.spec.title} subtitle={`${preview.spec.screens.length} screens ready`} />
            {preview.joinCodes[0] ? (
              <ModuleRow
                icon="qr_code_2"
                title="Instant invite link"
                subtitle={
                  <>
                    Code: <span className="font-bold tracking-wider text-primary">{preview.joinCodes[0].code}</span>
                  </>
                }
              />
            ) : null}
          </div>
        ) : null}

        {outcome?.kind === "mini_app" && preview ? (
          <div className="mt-space-lg rounded-lg bg-surface-container-lowest p-space-lg shadow-xl">
            <div className="mb-space-xs flex items-center gap-space-xs text-secondary">
              <Icon name="verified" size={22} filled />
              <span className="font-label-lg text-label-lg font-bold">Synthesis complete</span>
            </div>
            <h3 className="font-display-mobile text-display-mobile font-extrabold tracking-tight text-on-surface">Your app is ready!</h3>
            <button
              onClick={() => router.push(`/apps/${outcome.appInstanceId}`)}
              className="tap mt-space-md flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-label-lg text-label-lg font-bold text-on-primary shadow-md transition-transform active:scale-95"
            >
              <span>Open {preview.spec.title}</span>
              <Icon name="arrow_forward" size={20} />
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative flex flex-col space-y-space-md rounded-[22px] bg-surface-container-lowest p-space-md shadow-xl">
        <div className="relative">
          <textarea
            autoFocus={autoFocus}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. We're 8 friends traveling to Dahab and want to split all our expenses..."
            rows={3}
            className="w-full resize-none rounded-2xl bg-surface-container-low p-space-md font-body-md text-body-md text-on-surface outline-none transition-all duration-200 placeholder:text-outline/70 focus:bg-surface-bright focus:shadow-[0_0_0_2px_rgba(29,78,216,0.2)]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(text);
              }
            }}
          />
          <div className="pointer-events-none absolute right-3 top-3 text-primary-container opacity-40">
            <Icon name="auto_awesome" size={20} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-space-xs pt-1">
          <div className="flex items-center gap-space-xs">
            <button
              type="button"
              className="tap flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-2 font-label-md text-label-md text-on-surface-variant transition-transform active:scale-95"
            >
              <Icon name="mic" size={18} className="text-primary" />
              <span className="hidden sm:inline">Voice</span>
            </button>
            <button
              type="button"
              aria-label="Attach receipt or note"
              className="tap flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-95"
            >
              <Icon name="attach_file" size={19} />
            </button>
          </div>
          <button
            onClick={() => submit(text)}
            disabled={!text.trim()}
            className="tap flex items-center gap-1.5 rounded-full bg-primary-container px-5 py-2.5 font-label-lg text-label-lg text-on-primary shadow-md transition-all hover:opacity-95 active:scale-95 disabled:opacity-40"
          >
            <Icon name="bolt" size={18} />
            <span>Make</span>
            <Icon name="arrow_forward" size={18} />
          </button>
        </div>
      </div>

      {!outcome && !error ? (
        <div className="mt-space-md flex flex-col space-y-space-xs">
          <div className="flex items-center justify-between pl-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Popular right now</span>
            <button
              type="button"
              onClick={surpriseMe}
              className="tap flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1 font-label-sm text-label-sm font-semibold text-on-secondary-container transition-all hover:opacity-90 active:scale-95"
            >
              <span aria-hidden>🎲</span>
              <span>Surprise me</span>
            </button>
          </div>
          <div className="no-scrollbar -mx-margin flex items-center gap-2 overflow-x-auto px-margin pb-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => { setText(s.prompt); submit(s.prompt); }}
                className="tap flex shrink-0 items-center gap-1.5 rounded-full bg-surface-container-low px-3.5 py-1.5 font-label-md text-label-md text-on-surface transition-all hover:bg-surface-container active:scale-95"
              >
                <span>{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <div className="animate-in mt-space-md rounded-2xl bg-error-container p-space-md font-body-sm text-body-sm text-on-error-container">{error}</div> : null}

      {outcome?.kind === "chat_answer" ? (
        <div className="animate-in mt-space-md rounded-2xl bg-primary-fixed p-space-md font-body-sm text-body-sm text-on-primary-fixed">{outcome.text}</div>
      ) : null}

      {outcome?.kind === "reminder" ? (
        <div className="animate-in mt-space-md rounded-2xl bg-secondary-container p-space-md font-body-sm text-body-sm text-on-secondary-container">
          Got it — I&rsquo;ll remember: <strong>{outcome.text}</strong>
          {outcome.at ? ` at ${outcome.at}` : ""}.
        </div>
      ) : null}

      {outcome?.kind === "clarify" ? (
        <div className="animate-in mt-space-md rounded-2xl bg-tertiary-fixed p-space-md font-body-sm text-body-sm text-on-tertiary-fixed-variant">{outcome.question}</div>
      ) : null}
    </div>
  );
}

function ModuleRow({ icon, title, subtitle }: { icon: string; title: string; subtitle: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-DEFAULT bg-surface-container-lowest p-space-md shadow-sm">
      <div className="flex items-center gap-space-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <Icon name={icon} size={20} />
        </div>
        <div>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">{title}</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 rounded-full bg-secondary-container px-2.5 py-1 font-label-sm text-label-sm font-bold text-on-secondary-container shadow-sm">
        <Icon name="check_circle" size={15} filled />
        <span>Ready</span>
      </div>
    </div>
  );
}
