import { getDb } from "@/db";
import { categories, emptyCounts, isValidHospital, sumCounts } from "@/lib/flu";
import type { Counts } from "@/lib/flu";

export function db() { return getDb(); }

export function parseYear(value: unknown): number | null {
  const year = Number(value);
  return Number.isInteger(year) && year >= 2560 && year <= 2600 ? year : null;
}

export function parseHospital(value: unknown): string | null {
  return typeof value === "string" && isValidHospital(value) ? value : null;
}

export function parseCounts(value: unknown): Counts | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const result = emptyCounts();
  for (const category of categories) {
    const n = record[category.key];
    if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 10_000_000) return null;
    result[category.key] = n;
  }
  return result;
}

export function readCounts(raw: string): Counts {
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return { ...emptyCounts(), ...parsed };
  } catch { return emptyCounts(); }
}

export function toReport(row: { hospitalId: string; year: number; allocated: number; countsJson: string; updatedAt: string; updatedBy: string }, attachmentCount: number) {
  const counts = readCounts(row.countsJson);
  return {
    hospitalId: row.hospitalId, year: row.year, allocated: row.allocated,
    counts, vaccinated: sumCounts(counts), updatedAt: row.updatedAt,
    updatedBy: row.updatedBy, attachmentCount,
  };
}

export function errorResponse(error: unknown) {
  console.error(error);
  return Response.json({ error: "ไม่สามารถเข้าถึงข้อมูลได้ กรุณาลองอีกครั้ง" }, { status: 500 });
}
