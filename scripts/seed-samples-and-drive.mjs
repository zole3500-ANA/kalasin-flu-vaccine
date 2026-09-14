import fs from "node:fs";
import path from "node:path";

const DRIVE_BASE = "G:\\My Drive\\วัคซีนไข้หวัดใหญ่_กาฬสินธุ์_เอกสารแนบ";


console.log("Creating Google Drive folders at:", DRIVE_BASE);

// 1. Create directory structure in Google Drive
const sampleFolders = [
  path.join(DRIVE_BASE, "ปี_2569_รายงานผลการฉีด", "โรงพยาบาลกาฬสินธุ์"),
  path.join(DRIVE_BASE, "ปี_2569_รายงานผลการฉีด", "โรงพยาบาลกมลาไสย"),
  path.join(DRIVE_BASE, "ปี_2569_รายงานผลการฉีด", "โรงพยาบาลยางตลาด"),
  path.join(DRIVE_BASE, "ปี_2570_สำรวจความต้องการ", "โรงพยาบาลสมเด็จพระยุพราชกุฉินารายณ์"),
  path.join(DRIVE_BASE, "ปี_2570_สำรวจความต้องการ", "โรงพยาบาลสมเด็จ"),
  path.join(DRIVE_BASE, "ปี_2570_สำรวจความต้องการ", "โรงพยาบาลสหัสขันธ์"),
];

for (const folder of sampleFolders) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log("Created folder:", folder);
  }
}

// 2. Generate minimal valid PNG image bytes (1x1 transparent/teal PNG)
// PNG signature + IHDR + IDAT + IEND
const samplePngBytes = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
  0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
  0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4,
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, // IEND chunk
  0xae, 0x42, 0x60, 0x82,
]);

// Generate minimal valid PDF document bytes
const samplePdfBytes = Buffer.from(
  `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 55 >> stream
BT
/F1 12 Tf
100 700 Td
(เอกสารรับรองวัคซีน กาฬสินธุ์) Tj
ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
320
%%EOF`
);

// Generate sample CSV roster bytes with Thai UTF-8 BOM
const sampleCsvText = "\ufeffลำดับ,ชื่อ-สกุล,ตำแหน่ง,กลุ่มงาน,วันที่ได้รับวัคซีน,สถานะ\r\n1,นพ.สุรชัย แก้วเกิด,นายแพทย์ชำนาญการ,อายุรกรรม,2026-06-15,ฉีดเรียบร้อย\r\n2,พว.วันทนีย์ ศรีสุข,พยาบาลวิชาชีพ,อุบัติเหตุฉุกเฉิน,2026-06-15,ฉีดเรียบร้อย\r\n3,ภก.กิตติพงษ์ วิเศษ,เภสัชกร,เภสัชกรรม,2026-06-16,ฉีดเรียบร้อย\r\n";
const sampleCsvBytes = Buffer.from(sampleCsvText, "utf8");

// Write files to Google Drive
const filesToWrite = [
  {
    dir: path.join(DRIVE_BASE, "ปี_2569_รายงานผลการฉีด", "โรงพยาบาลกาฬสินธุ์"),
    file: "2026-09-14_ภาพกิจกรรมการฉีดวัคซีน_รพ_กาฬสินธุ์.png",
    bytes: samplePngBytes,
  },
  {
    dir: path.join(DRIVE_BASE, "ปี_2569_รายงานผลการฉีด", "โรงพยาบาลกาฬสินธุ์"),
    file: "2026-09-14_รายชื่อบุคลากรผู้รับวัคซีน_รพ_กาฬสินธุ์.pdf",
    bytes: samplePdfBytes,
  },
  {
    dir: path.join(DRIVE_BASE, "ปี_2569_รายงานผลการฉีด", "โรงพยาบาลกมลาไสย"),
    file: "2026-09-14_ภาพกิจกรรมการฉีดวัคซีน_รพ_กมลาไสย.png",
    bytes: samplePngBytes,
  },
  {
    dir: path.join(DRIVE_BASE, "ปี_2569_รายงานผลการฉีด", "โรงพยาบาลยางตลาด"),
    file: "2026-09-14_รายชื่อผู้ได้รับวัคซีน_รพ_ยางตลาด.csv",
    bytes: sampleCsvBytes,
  },
  {
    dir: path.join(DRIVE_BASE, "ปี_2570_สำรวจความต้องการ", "โรงพยาบาลสมเด็จพระยุพราชกุฉินารายณ์"),
    file: "2026-09-14_หนังสือนำส่งสำรวจความต้องการปี2570_รพ_กุฉินารายณ์.pdf",
    bytes: samplePdfBytes,
  },
  {
    dir: path.join(DRIVE_BASE, "ปี_2570_สำรวจความต้องการ", "โรงพยาบาลสมเด็จ"),
    file: "2026-09-14_แบบสำรวจความต้องการวัคซีน_รพ_สมเด็จ.pdf",
    bytes: samplePdfBytes,
  },
  {
    dir: path.join(DRIVE_BASE, "ปี_2570_สำรวจความต้องการ", "โรงพยาบาลสหัสขันธ์"),
    file: "2026-09-14_แบบสำรวจความต้องการวัคซีน_รพ_สหัสขันธ์.pdf",
    bytes: samplePdfBytes,
  },
];

for (const item of filesToWrite) {
  const target = path.join(item.dir, item.file);
  fs.writeFileSync(target, item.bytes);
  console.log("Saved to Google Drive:", target);
}

console.log("All sample files successfully written to Google Drive!");
