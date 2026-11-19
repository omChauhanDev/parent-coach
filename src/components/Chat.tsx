"use client";

import { useEffect, useRef, useState } from "react";
import { CoachReply, ErrorBody, type Region, type Turn } from "@/lib/contract";
import { buildRequestBody, flattenReply, recentHistory } from "@/lib/client/history";
import { MESSAGE_LIMIT } from "@/lib/limits";
import { detectLanguage } from "@/lib/language";
import { LANG_TAG } from "@/lib/ui-text";
import { Composer } from "@/components/Composer";
import { EmergencyFooter } from "@/components/EmergencyFooter";
import { EmptyState } from "@/components/EmptyState";
import { RegionToggle } from "@/components/RegionToggle";
import { ReplyCard } from "@/components/ReplyCard";

type EntryInput =
  | { role: "parent"; text: string }
  | { role: "coach"; reply: CoachReply }
  | { role: "notice"; text: string };
type Entry = EntryInput & { id: number };

const UNREACHABLE = "Couldn't reach the coach. Check your connection and send again.";

export function Chat() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [history, setHistory] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [region, setRegion] = useState<Region>("AE");
  const [pending, setPending] = useState(false);
  const nextId = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const lastReplyRef = useRef<HTMLLIElement>(null);
  // Clear bumps the generation and aborts the request in flight, so a late reply can never put a
  // cleared turn back into the history the model sees (AC-16).
  const generation = useRef(0);
  const inflight = useRef<AbortController | null>(null);

  // A new reply scrolls to its top (an escalation banner must be seen first); otherwise to the end.
  useEffect(() => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    const last = entries.at(-1);
    if (last?.role === "coach" && !pending) {
      lastReplyRef.current?.scrollIntoView({ behavior, block: "start" });
    } else {
      endRef.current?.scrollIntoView({ behavior, block: "end" });
    }
  }, [entries, pending]);

  function push(entry: EntryInput) {
    const id = nextId.current++;
    setEntries((list) => [...list, { ...entry, id }]);
  }

  async function send() {
    const message = draft.trim();
    if (!message || message.length > MESSAGE_LIMIT || pending) return;
    const gen = generation.current;
    const controller = new AbortController();
    inflight.current = controller;
    setPending(true);
    setDraft("");
    push({ role: "parent", text: message });
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: buildRequestBody(message, history, region),
        signal: controller.signal,
      });
      const json: unknown = await res.json().catch(() => null);
      if (gen !== generation.current) return;
      const reply = CoachReply.safeParse(json);
      if (res.ok && reply.success) {
        push({ role: "coach", reply: reply.data });
        setHistory((h) =>
          recentHistory([
            ...h,
            { role: "parent", text: message },
            { role: "coach", text: flattenReply(reply.data) },
          ]),
        );
        return;
      }
      const error = ErrorBody.safeParse(json);
      push({ role: "notice", text: error.success ? error.data.message : UNREACHABLE });
      setDraft((current) => current || message); // never overwrite what the parent typed meanwhile
    } catch {
      if (gen !== generation.current) return;
      push({ role: "notice", text: UNREACHABLE });
      setDraft((current) => current || message);
    } finally {
      if (gen === generation.current) {
        inflight.current = null;
        setPending(false);
      }
    }
  }

  function clear() {
    generation.current += 1;
    inflight.current?.abort();
    inflight.current = null;
    setPending(false);
    setEntries([]);
    setHistory([]);
    setDraft("");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Parent Coach</h1>
          <p className="hidden text-sm text-muted sm:block">
            Practical next steps, in English, <span lang="ur">اردو</span> or Roman Urdu
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RegionToggle region={region} onChange={setRegion} />
          <button
            type="button"
            onClick={clear}
            disabled={entries.length === 0 && !draft}
            className="min-h-9 rounded-full px-3 text-sm font-bold text-muted underline-offset-2 hover:underline disabled:opacity-40"
          >
            Clear conversation
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 sm:px-6" aria-live="polite" aria-busy={pending}>
        {entries.length === 0 ? (
          <EmptyState
            onPick={(text) => {
              setDraft(text);
              document.getElementById("message")?.focus();
            }}
          />
        ) : (
          <ol className="grid gap-4">
            {entries.map((entry, i) => (
              <li
                key={entry.id}
                ref={i === entries.length - 1 ? lastReplyRef : undefined}
                className="scroll-mt-40 sm:scroll-mt-24"
              >
                {entry.role === "coach" ? (
                  <ReplyCard reply={entry.reply} />
                ) : entry.role === "parent" ? (
                  <p
                    dir="auto"
                    lang={LANG_TAG[detectLanguage(entry.text)]}
                    className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 whitespace-pre-wrap text-brand-ink"
                  >
                    {entry.text}
                  </p>
                ) : (
                  <p
                    role="status"
                    className="rounded-xl border border-line bg-surface px-4 py-3 text-sm"
                  >
                    {entry.text}
                  </p>
                )}
              </li>
            ))}
            {pending ? (
              <li className="text-sm text-muted" aria-label="The coach is writing a reply">
                <span className="inline-block animate-pulse">The coach is writing…</span>
              </li>
            ) : null}
          </ol>
        )}
        <div ref={endRef} />
      </main>

      <div className="sticky bottom-0 grid gap-3 border-t border-line bg-paper/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6">
        <Composer value={draft} pending={pending} onChange={setDraft} onSend={send} />
        <EmergencyFooter region={region} />
      </div>
    </div>
  );
}
