import { z } from "zod";

export const Language = z.enum(["en", "ur", "roman_ur"]);
export const Region = z.enum(["AE", "PK"]);
export const CrisisCategory = z.enum([
  "medical_emergency",
  "self_harm",
  "child_abuse",
  "domestic_violence",
]);

// ---- Request (client → server)
export const Turn = z.object({
  role: z.enum(["parent", "coach"]),
  text: z.string().trim().min(1).max(2000), // coach turns are flattened reply text
});
export const ChatRequest = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z.array(Turn).max(8).default([]),
  region: Region.default("AE"),
});

// ---- Model output (sent as output_config.format; `risk` first so the model classifies before writing)
export const ModelOutput = z.object({
  // safety_check: an earlier turn was a crisis and the parent has not yet said everyone is safe
  risk: z.enum(["routine", "refer", "crisis", "safety_check"]),
  crisisCategory: z.enum(["none", ...CrisisCategory.options]),
  summary: z.string().min(1).max(300),
  steps: z.array(z.string().min(1).max(220)).min(1).max(4),
  followUp: z.object({
    kind: z.enum(["question", "checkin"]),
    text: z.string().min(1).max(200),
  }),
});

// ---- Reply (server → client; the ONLY thing the UI renders)
export const Contact = z.object({
  label: z.string().min(1), // localised service name
  number: z.string().min(1), // as dialled; rendered as a tel: link
  note: z.string().optional(), // coverage / hours, localised
  sourceUrl: z.url(), // official page the number was verified on
});
export const CoachReply = z
  .object({
    kind: z.enum(["coach", "escalation", "fallback"]),
    language: Language,
    risk: z.enum(["routine", "refer", "crisis", "unknown"]),
    summary: z.string().min(1),
    steps: z.array(z.string().min(1)).min(1).max(4),
    followUp: z.object({ kind: z.enum(["question", "checkin"]), text: z.string().min(1) }),
    escalation: z
      .object({
        category: z.enum([...CrisisCategory.options, "general"]),
        region: Region,
        source: z.enum(["prescreen", "model"]),
        contacts: z.array(Contact).min(1).max(3),
      })
      .optional(),
  })
  .refine((r) => (r.kind === "escalation") === (r.escalation !== undefined), {
    message: "escalation is present iff kind is 'escalation'",
  });

export const ErrorBody = z.object({ error: z.literal("invalid_request"), message: z.string() });

export type Language = z.infer<typeof Language>;
export type Region = z.infer<typeof Region>;
export type CrisisCategory = z.infer<typeof CrisisCategory>;
export type Turn = z.infer<typeof Turn>;
export type ChatRequest = z.infer<typeof ChatRequest>;
export type ChatRequestInput = z.input<typeof ChatRequest>;
export type ModelOutput = z.infer<typeof ModelOutput>;
export type Contact = z.infer<typeof Contact>;
export type CoachReply = z.infer<typeof CoachReply>;
export type ErrorBody = z.infer<typeof ErrorBody>;
