import type { Region } from "@/lib/contract";
import { FOOTER_CONTACTS } from "@/lib/safety/contacts";
import { telHref } from "@/lib/ui-text";

const REGION_NAME: Record<Region, string> = { AE: "UAE", PK: "Pakistan" };

/** Always visible (SPEC §6.2 L5): the selected region's emergency numbers. */
export function EmergencyFooter({ region }: { region: Region }) {
  return (
    <footer
      aria-label="Emergency numbers"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
    >
      <span className="font-bold">Danger right now in {REGION_NAME[region]}?</span>
      {FOOTER_CONTACTS[region].map((c) => (
        <a
          key={c.number}
          href={telHref(c.number)}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-alarm/40 px-2.5 text-alarm"
        >
          <span>{c.label.en}</span>
          <bdi dir="ltr" className="font-bold">
            {c.number}
          </bdi>
        </a>
      ))}
    </footer>
  );
}
