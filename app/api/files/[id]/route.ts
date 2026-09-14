import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { attachments } from "@/db/schema";
import { db, errorResponse } from "@/lib/server-flu";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const id = (await context.params).id;
  if (!/^[a-f0-9-]{36}$/i.test(id)) return new Response("ไม่พบไฟล์", { status: 404 });
  try {
    const [record] = await db().select().from(attachments).where(eq(attachments.id, id)).limit(1);
    if (!record) return new Response("ไม่พบไฟล์", { status: 404 });
    if (!env.BUCKET) return new Response("ที่เก็บไฟล์ยังไม่พร้อมใช้งาน", { status: 503 });
    const object = await env.BUCKET.get(record.objectKey);
    if (!object) return new Response("ไม่พบไฟล์", { status: 404 });
    return new Response(object.body, {
      headers: {
        "Content-Type": record.type,
        "Content-Length": String(record.size),
        "Content-Disposition": "attachment; filename*=UTF-8''" + encodeURIComponent(record.name),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) { return errorResponse(error); }
}
