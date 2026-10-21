import { NextResponse } from "next/server";
import { sameOrigin } from "./security";
import { currentUser } from "./auth";

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

/** Guards a mutating route: same-origin + logged in. Returns the user or an error response. */
export async function guard(req: Request) {
  if (!sameOrigin(req)) return { error: json({ error: "bad_origin" }, 403) };
  const user = await currentUser();
  if (!user) return { error: json({ error: "unauthorized" }, 401) };
  return { user };
}
