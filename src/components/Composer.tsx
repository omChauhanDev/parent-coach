"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { MESSAGE_LIMIT } from "@/lib/limits";

interface ComposerProps {
  value: string;
  pending: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
}

export function Composer({ value, pending, onChange, onSend }: ComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const length = value.trim().length;
  const tooLong = value.length > MESSAGE_LIMIT;
  const canSend = length > 0 && !tooLong && !pending;

  // Grow with the text up to a cap, so long messages stay visible on phones.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight + 2, 200)}px`;
    el.style.overflowY = el.scrollHeight > 200 ? "auto" : "hidden";
  }, [value]);

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canSend) onSend();
    }
  }

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSend();
      }}
    >
      <div className="min-w-0 flex-1">
        <label htmlFor="message" className="sr-only">
          Describe what&apos;s happening
        </label>
        <textarea
          id="message"
          ref={ref}
          dir="auto"
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="What's happening?"
          aria-describedby="message-hint"
          aria-invalid={tooLong}
          className="block max-h-[200px] w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-base leading-normal placeholder:text-muted"
        />
        <p
          id="message-hint"
          aria-live="polite"
          className={`mt-1 px-1 text-xs ${tooLong ? "font-bold text-alarm" : "text-muted"}`}
        >
          {tooLong
            ? `Too long: ${value.length} of ${MESSAGE_LIMIT} characters. Shorten it to send.`
            : value.length > MESSAGE_LIMIT * 0.8
              ? `${value.length} of ${MESSAGE_LIMIT} characters`
              : "Enter sends. Shift + Enter adds a new line."}
        </p>
      </div>
      <button
        type="submit"
        disabled={!canSend}
        className="mb-6 min-h-12 rounded-2xl bg-brand px-5 font-bold text-brand-ink disabled:opacity-40"
      >
        {pending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
