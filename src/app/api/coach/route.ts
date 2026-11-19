import { ChatRequest, type ErrorBody } from "@/lib/contract";
import { getCoachModel } from "@/lib/coach/anthropic-client";
import { handleChat } from "@/lib/coach/pipeline";
import { logRequest } from "@/lib/log";
import { LAST_RESORT_REPLY } from "@/lib/safety/templates";

const MAX_BODY_BYTES = 16 * 1024;

function badRequest(message: string, started: number): Response {
  logRequest({ failure: "invalid_request", ms: Date.now() - started });
  const body: ErrorBody = { error: "invalid_request", message };
  return Response.json(body, { status: 400 });
}

export async function POST(request: Request): Promise<Response> {
  const started = Date.now();
  try {
    const declared = Number(request.headers.get("content-length") ?? "0");
    if (declared > MAX_BODY_BYTES) return badRequest("Request body is too large.", started);

    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
      return badRequest("Request body is too large.", started);
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return badRequest("Request body must be JSON.", started);
    }

    const parsed = ChatRequest.safeParse(json);
    if (!parsed.success) {
      return badRequest("Send a message of 1 to 1000 characters.", started);
    }

    const { reply } = await handleChat(parsed.data, { model: getCoachModel(), log: logRequest });
    return Response.json(reply);
  } catch {
    logRequest({ failure: "unexpected", ms: Date.now() - started });
    return Response.json(LAST_RESORT_REPLY);
  }
}
