import type { APIRequestContext } from "@playwright/test";

const MOCK = "http://localhost:4010";

export async function resetModelCount(request: APIRequestContext): Promise<void> {
  await request.post(`${MOCK}/__reset`);
}

export async function modelCount(request: APIRequestContext): Promise<number> {
  const res = await request.get(`${MOCK}/__count`);
  const body = (await res.json()) as { count: number };
  return body.count;
}

/** History turns the app sent with its most recent model request (-1 if none / unparsable). */
export async function lastHistoryTurns(request: APIRequestContext): Promise<number> {
  const res = await request.get(`${MOCK}/__last`);
  const body = (await res.json()) as { historyTurns: number };
  return body.historyTurns;
}
