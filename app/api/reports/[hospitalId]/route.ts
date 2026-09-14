import { and, eq } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { reports } from "@/db/schema";
import { db, errorResponse, parseCounts, parseHospital, parseYear, toReport } from "@/lib/server-flu";
import { sumCounts } from "@/lib/flu";

export async function PUT(request: Request, context: { params: Promise<{ hospitalId: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const hospitalId = parseHospital((await context.params).hospitalId);
  if (!hospitalId) return Response.json({ error: "ไม่พบโรงพยาบาล" }, { status: 404 });
  let payload: Record<string, unknown>;
  try { payload = await request.json() as Record<string, unknown>; }
  catch { return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 }); }
  const year = parseYear(payload.year);
  const allocated = payload.allocated;
  const counts = parseCounts(payload.counts);
  if (year === null || typeof allocated !== "number" || !Number.isInteger(allocated) || allocated < 0 || allocated > 10_000_000 || !counts)
    return Response.json({ error: "กรุณาตรวจสอบปี จำนวนจัดสรร และจำนวนผู้ได้รับวัคซีน" }, { status: 400 });
  if (sumCounts(counts) > allocated)
    return Response.json({ error: "ยอดฉีดรวมมากกว่าจำนวนวัคซีนที่จัดสรร" }, { status: 400 });
  try {
    const database = db();
    const updatedAt = new Date().toISOString();
    await database.insert(reports).values({
      hospitalId, year, allocated, countsJson: JSON.stringify(counts), updatedAt, updatedBy: user.email,
    }).onConflictDoUpdate({
      target: [reports.hospitalId, reports.year],
      set: { allocated, countsJson: JSON.stringify(counts), updatedAt, updatedBy: user.email },
    });
    const [row] = await database.select().from(reports).where(and(eq(reports.hospitalId, hospitalId), eq(reports.year, year))).limit(1);
    return Response.json({ report: toReport(row, 0) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
