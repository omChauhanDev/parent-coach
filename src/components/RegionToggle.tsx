"use client";

import type { Region } from "@/lib/contract";

const OPTIONS: { value: Region; label: string }[] = [
  { value: "AE", label: "UAE" },
  { value: "PK", label: "Pakistan" },
];

export function RegionToggle({
  region,
  onChange,
}: {
  region: Region;
  onChange: (region: Region) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Helplines for"
      className="inline-flex rounded-full border border-line bg-surface p-0.5"
    >
      {OPTIONS.map((option) => {
        const checked = option.value === region;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(option.value)}
            className={[
              "min-h-9 rounded-full px-3 text-sm font-bold",
              checked ? "bg-brand text-brand-ink" : "text-muted",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
