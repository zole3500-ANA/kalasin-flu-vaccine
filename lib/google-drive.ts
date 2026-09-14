import fs from "node:fs";
import path from "node:path";
import { hospitals } from "@/lib/flu";



export const GOOGLE_DRIVE_BASE_DIR =
  process.env.GOOGLE_DRIVE_DIR || "G:\\My Drive\\วัคซีนไข้หวัดใหญ่_กาฬสินธุ์_เอกสารแนบ";

export type GoogleDriveSaveResult = {
  success: boolean;
  drivePath?: string;
  error?: string;
};

/**
 * Checks whether Google Drive folder is accessible on this machine.
 */
export function isGoogleDriveAvailable(): boolean {
  try {
    return fs.existsSync(GOOGLE_DRIVE_BASE_DIR) || fs.existsSync("G:\\My Drive");
  } catch {
    return false;
  }
}

/**
 * Saves an uploaded file directly into Google Drive folder organized by Year and Hospital Name.
 * Path: G:\My Drive\วัคซีนไข้หวัดใหญ่_กาฬสินธุ์_เอกสารแนบ\ปี_{year}_{type}\{hospitalName}\{timestamp}_{fileName}
 */
export async function saveToGoogleDrive({
  hospitalId,
  year,
  fileName,
  bytes,
}: {
  hospitalId: string;
  year: number;
  fileName: string;
  bytes: Uint8Array;
}): Promise<GoogleDriveSaveResult> {
  try {
    if (!isGoogleDriveAvailable()) {
      return {
        success: false,
        error: "ไม่สามารถเข้าถึง G:\\My Drive (Google Drive for Desktop ยังไม่ได้เชื่อมต่อ)",
      };
    }

    const hospital = hospitals.find((h) => h.id === hospitalId);
    const hospitalName = hospital ? hospital.name : hospitalId;
    const yearSubFolder = year === 2569 ? "ปี_2569_รายงานผลการฉีด" : "ปี_2570_สำรวจความต้องการ";

    const targetDirectory = path.join(GOOGLE_DRIVE_BASE_DIR, yearSubFolder, hospitalName);

    if (!fs.existsSync(targetDirectory)) {
      fs.mkdirSync(targetDirectory, { recursive: true });
    }

    const safeName = fileName.replace(/[/\\?%*:|"<>]/g, "_");
    const datePrefix = new Date().toISOString().slice(0, 10);
    const targetFilePath = path.join(targetDirectory, `${datePrefix}_${safeName}`);

    fs.writeFileSync(targetFilePath, Buffer.from(bytes));

    return {
      success: true,
      drivePath: targetFilePath,
    };
  } catch (err) {
    console.error("Error saving file to Google Drive:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
