"use client";

import { useState } from "react";
import { CoachReply, ErrorBody, type Region, type Turn } from "@/lib/contract";
import { flattenReply, recentHistory } from "@/lib/client/history";

type Entry =
  | { id: number; role: "parent"; text: string }
  | { id: number; role: "coach"; reply: CoachReply }
  | { id: number; role: "error"; text: string };

let nextId = 0;

export function Chat() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [history, setHistory] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [region, setRegion] = useState<Region>("AE");
  const [pending, setPending] = useState(false);

  async function send() {
    const message = draft.trim();
    if (!message || message.length > 1000 || pending) return;
    setPending(true);
    setEntries((e) => [...e, { id: nextId++, role: "parent", text: message }]);
    setDraft("");
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, history: recentHistory(history), region }),
      });
      const json: unknown = await res.json();
      const reply = CoachReply.safeParse(json);
      if (res.ok && reply.success) {
        setEntries((e) => [...e, { id: nextId++, role: "coach", reply: reply.data }]);
        setHistory((h) =>
          recentHistory([
            ...h,
            { role: "parent", text: message },
            { role: "coach", text: flattenReply(reply.data) },
          ]),
        );
      } else {
        const err = ErrorBody.safeParse(json);
        setEntries((e) => [
          ...e,
          {
            id: nextId++,
            role: "error",
            text: err.success ? err.data.message : "Couldn't reach the coach — try again.",
          },
        ]);
      }
    } catch {
      setEntries((e) => [
        ...e,
        { id: nextId++, role: "error", text: "Couldn't reach the coach — try again." },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm">
        Region
        <select value={region} onChange={(e) => setRegion(e.target.value as Region)}>
          <option value="AE">UAE</option>
          <option value="PK">Pakistan</option>
        </select>
      </label>
      <ol className="flex flex-col gap-3">
        {entries.map((entry) => (
          <li key={entry.id} dir="auto">
            {entry.role === "coach" ? (
              <div
                className="rounded border p-3"
                lang={entry.reply.language === "ur" ? "ur" : "en"}
              >
                <p className="text-xs opacity-60">
                  {entry.reply.kind} · {entry.reply.risk} · {entry.reply.language}
                </p>
                <p>{entry.reply.summary}</p>
                <ol className="list-decimal ps-5">
                  {entry.reply.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
                <p className="italic">{entry.reply.followUp.text}</p>
              </div>
            ) : (
              <p className={entry.role === "error" ? "text-red-700" : "font-medium"}>
                {entry.text}
              </p>
            )}
          </li>
        ))}
      </ol>
      <textarea
        dir="auto"
        className="rounded border p-2"
        rows={3}
        maxLength={1000}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        aria-label="Your message"
      />
      <button
        type="button"
        className="rounded border px-4 py-2"
        disabled={pending || !draft.trim()}
        onClick={send}
      >
        {pending ? "Thinking…" : "Send"}
      </button>
    </div>
  );
}
