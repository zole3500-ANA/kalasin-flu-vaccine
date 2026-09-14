import { and, eq } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { surveys } from "@/db/schema";
import { db, errorResponse, parseCounts, parseHospital, parseYear, toSurvey } from "@/lib/server-flu";
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
  const counts = parseCounts(payload.counts);
  const targetTotal = typeof payload.targetTotal === "number" && Number.isInteger(payload.targetTotal) && payload.targetTotal >= 0 && payload.targetTotal <= 10_000_000
    ? payload.targetTotal
    : 0;
  const calculatedDoses = counts ? sumCounts(counts) : 0;
  const requestedDoses = typeof payload.requestedDoses === "number" && Number.isInteger(payload.requestedDoses) && payload.requestedDoses >= 0 && payload.requestedDoses <= 10_000_000
    ? payload.requestedDoses
    : calculatedDoses;
  const coordinatorName = typeof payload.coordinatorName === "string" ? payload.coordinatorName.trim().slice(0, 100) : "";
  const coordinatorPhone = typeof payload.coordinatorPhone === "string" ? payload.coordinatorPhone.trim().slice(0, 50) : "";
  const coordinatorPosition = typeof payload.coordinatorPosition === "string" ? payload.coordinatorPosition.trim().slice(0, 100) : "";
  const notes = typeof payload.notes === "string" ? payload.notes.trim().slice(0, 1000) : "";

  if (year === null || !counts) {
    return Response.json({ error: "กรุณาตรวจสอบปีและข้อมูลจำนวนความต้องการวัคซีน" }, { status: 400 });
  }

  try {
    const database = db();
    const updatedAt = new Date().toISOString();
    await database.insert(surveys).values({
      hospitalId,
      year,
      targetTotal,
      requestedDoses,
      countsJson: JSON.stringify(counts),
      coordinatorName,
      coordinatorPhone,
      coordinatorPosition,
      notes,
      updatedAt,
      updatedBy: user.email,
    }).onConflictDoUpdate({
      target: [surveys.hospitalId, surveys.year],
      set: {
        targetTotal,
        requestedDoses,
        countsJson: JSON.stringify(counts),
        coordinatorName,
        coordinatorPhone,
        coordinatorPosition,
        notes,
        updatedAt,
        updatedBy: user.email,
      },
    });

    const [row] = await database.select().from(surveys).where(and(eq(surveys.hospitalId, hospitalId), eq(surveys.year, year))).limit(1);
    return Response.json({ survey: toSurvey(row, 0) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}