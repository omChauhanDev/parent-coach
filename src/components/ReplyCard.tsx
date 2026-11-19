import type { CoachReply } from "@/lib/contract";
import { ESCALATION_HEADING } from "@/lib/safety/templates";
import { LANG_TAG, REPLY_LABELS, telHref } from "@/lib/ui-text";

/** Renders `CoachReply` fields only — never raw model text (SPEC §6.2 L5). */
export function ReplyCard({ reply }: { reply: CoachReply }) {
  const labels = REPLY_LABELS[reply.language];
  const isUrdu = reply.language === "ur";
  // Nastaliq's tall ascenders and deep descenders need a much taller line box than Latin text.
  const lh = isUrdu ? "leading-[2.2]" : "leading-relaxed";
  const lhTight = isUrdu ? "leading-[1.9]" : "leading-snug";
  const escalation = reply.escalation;

  return (
    <article
      lang={LANG_TAG[reply.language]}
      dir={isUrdu ? "rtl" : "ltr"}
      data-kind={reply.kind}
      data-risk={reply.risk}
      className={[
        "overflow-hidden rounded-2xl border bg-surface",
        escalation ? "border-alarm border-s-[6px]" : "border-line",
      ].join(" ")}
    >
      {escalation ? (
        <section role="alert" className="bg-alarm-soft px-4 pt-4 pb-3 sm:px-5">
          <h2 className="text-lg font-bold text-alarm">{ESCALATION_HEADING[reply.language]}</h2>
          <ul className="mt-3 grid gap-2">
            {escalation.contacts.map((contact) => (
              <li
                key={contact.number}
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-surface p-2 pe-3"
              >
                <a
                  href={telHref(contact.number)}
                  className="inline-flex min-h-11 items-center rounded-lg bg-alarm px-3 font-sans text-lg leading-none font-bold text-alarm-ink"
                  aria-label={`${labels.call} ${contact.label} ${contact.number}`}
                >
                  <bdi dir="ltr">{contact.number}</bdi>
                </a>
                <span className="order-last min-w-0 basis-full px-1 sm:order-none sm:flex-1 sm:basis-auto sm:px-0">
                  <span className={`block font-bold ${lhTight}`}>{contact.label}</span>
                  {contact.note ? (
                    <span className={`block text-sm text-muted ${lhTight}`}>{contact.note}</span>
                  ) : null}
                </span>
                <a
                  href={contact.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ms-auto text-sm text-muted underline underline-offset-2"
                >
                  {labels.source}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="px-4 py-4 sm:px-5">
        <p className={`text-[1.0625rem] ${lh}`}>{reply.summary}</p>
        <ol className="mt-3 grid gap-2.5">
          {reply.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span
                aria-hidden="true"
                className={[
                  "mt-1 grid size-6 shrink-0 place-items-center rounded-full font-sans text-sm leading-none font-bold",
                  escalation && i === 0 ? "bg-alarm text-alarm-ink" : "bg-brand-soft text-brand",
                ].join(" ")}
              >
                {i + 1}
              </span>
              <span className={lh}>{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 rounded-xl bg-brand-soft px-3 py-2.5">
          <p className="text-sm font-bold text-brand">
            {reply.followUp.kind === "question" ? labels.question : labels.checkin}
          </p>
          <p className={lh}>{reply.followUp.text}</p>
        </div>
      </div>
    </article>
  );
}
