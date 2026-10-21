import { destroySession } from "@/lib/auth";
import { json } from "@/lib/http";
import { sameOrigin } from "@/lib/security";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "bad_origin" }, 403);
  await destroySession();
  return json({ ok: true });
}
