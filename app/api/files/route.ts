import { and, desc, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { attachments } from "@/db/schema";
import { db, errorResponse, parseHospital, parseYear } from "@/lib/server-flu";

const maxSize = 10 * 1024 * 1024;
const allowedTypes: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  pdf: "application/pdf", xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
};

function extension(name: string) { return name.split(".").pop()?.toLowerCase() ?? ""; }
function validSignature(bytes: Uint8Array, ext: string) {
  if (ext === "pdf") return String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  if (ext === "png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (ext === "jpg" || ext === "jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (ext === "webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (ext === "xlsx") return bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (ext === "xls") return bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
  return true;
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const url = new URL(request.url);
  const hospitalId = parseHospital(url.searchParams.get("hospitalId"));
  const year = parseYear(url.searchParams.get("year"));
  if (!hospitalId || year === null) return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  try {
    const files = await db().select({
      id: attachments.id, name: attachments.name, type: attachments.type,
      size: attachments.size, createdAt: attachments.createdAt,
    }).from(attachments).where(and(eq(attachments.hospitalId, hospitalId), eq(attachments.year, year))).orderBy(desc(attachments.createdAt));
    return Response.json({ files }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxSize + 100_000) return Response.json({ error: "ไฟล์มีขนาดเกิน 10 MB" }, { status: 413 });
  let form: FormData;
  try { form = await request.formData(); }
  catch { return Response.json({ error: "อ่านไฟล์ไม่สำเร็จ" }, { status: 400 }); }
  const hospitalId = parseHospital(form.get("hospitalId"));
  const year = parseYear(form.get("year"));
  const file = form.get("file");
  if (!hospitalId || year === null || !(file instanceof File)) return Response.json({ error: "ข้อมูลไฟล์ไม่ถูกต้อง" }, { status: 400 });
  const name = file.name.replace(/[/\\\u0000-\u001f\u007f]/g, "_").slice(0, 180);
  const ext = extension(name);
  if (!allowedTypes[ext]) return Response.json({ error: "รองรับเฉพาะรูปภาพ PDF Excel หรือ CSV" }, { status: 400 });
  if (file.size === 0 || file.size > maxSize) return Response.json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 10 MB" }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validSignature(bytes, ext)) return Response.json({ error: "ชนิดไฟล์ไม่ตรงกับนามสกุล" }, { status: 400 });
  if (!env.BUCKET) return Response.json({ error: "ที่เก็บไฟล์ยังไม่พร้อมใช้งาน" }, { status: 503 });
  const id = crypto.randomUUID();
  const objectKey = "flu/" + year + "/" + hospitalId + "/" + id;
  try {
    await env.BUCKET.put(objectKey, bytes, { httpMetadata: { contentType: allowedTypes[ext] } });
    try {
      await db().insert(attachments).values({
        id, hospitalId, year, objectKey, name, type: allowedTypes[ext],
        size: file.size, createdAt: new Date().toISOString(), uploadedBy: user.email,
      });
    } catch (error) {
      await env.BUCKET.delete(objectKey);
      throw error;
    }
    return Response.json({ file: { id, name, size: file.size } }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
