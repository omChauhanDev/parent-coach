import { LANG_TAG } from "@/lib/ui-text";
import type { Language } from "@/lib/contract";

const EXAMPLES: { language: Language; text: string }[] = [
  { language: "en", text: "My 3-year-old won't stay in her own bed at night." },
  { language: "ur", text: "میرا بیٹا ہوم ورک کرتے وقت بہت روتا ہے، کیا کروں؟" },
  { language: "roman_ur", text: "Meri beti school jane se pehle roz roti hai." },
];

/** First screen: what the coach does, and three everyday examples that fill the composer. */
export function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <section aria-labelledby="empty-title" className="mx-auto max-w-prose pt-6 sm:pt-12">
      <h2 id="empty-title" className="text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
        What&apos;s going on with your child?
      </h2>
      <p className="mt-3 leading-relaxed text-muted">
        Write in English, <span lang="ur">اردو</span> or Roman Urdu, the way you would tell a
        friend, and include your child&apos;s age. You&apos;ll get a short plan and a check-in. The
        coach doesn&apos;t diagnose or give medicine doses, and if anyone is in danger it shows who
        to call.
      </p>
      <p className="mt-6 text-sm font-bold">Try one of these</p>
      <ul className="mt-2 grid gap-2">
        {EXAMPLES.map((example) => (
          <li key={example.text}>
            <button
              type="button"
              onClick={() => onPick(example.text)}
              lang={LANG_TAG[example.language]}
              dir={example.language === "ur" ? "rtl" : "ltr"}
              className={[
                "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-start transition-colors hover:border-brand hover:bg-brand-soft",
                example.language === "ur" ? "leading-[2.1]" : "leading-snug",
              ].join(" ")}
            >
              {example.text}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
