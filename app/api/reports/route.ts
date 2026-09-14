import { eq } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { attachments, reports } from "@/db/schema";
import { db, errorResponse, parseYear, toReport } from "@/lib/server-flu";

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const year = parseYear(new URL(request.url).searchParams.get("year"));
  if (year === null) return Response.json({ error: "ปีไม่ถูกต้อง" }, { status: 400 });
  try {
    const database = db();
    const [rows, files] = await Promise.all([
      database.select().from(reports).where(eq(reports.year, year)),
      database.select({ hospitalId: attachments.hospitalId }).from(attachments).where(eq(attachments.year, year)),
    ]);
    const counts = new Map<string, number>();
    files.forEach((file) => counts.set(file.hospitalId, (counts.get(file.hospitalId) ?? 0) + 1));
    return Response.json({ reports: rows.map((row) => toReport(row, counts.get(row.hospitalId) ?? 0)) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
