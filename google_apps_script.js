/**
 * =========================================================================
 * ระบบรับไฟล์และข้อมูลวัคซีนไข้หวัดใหญ่บุคลากร จังหวัดกาฬสินธุ์
 * กลุ่มงานควบคุมโรคติดต่อ สำนักงานสาธารณสุขจังหวัดกาฬสินธุ์
 * =========================================================================
 * 
 * ฟังก์ชัน:
 * 1. รับไฟล์หลักฐานรายชื่อ (PDF, Excel, รูปภาพ, CSV) จากหน้าเว็บ
 * 2. สร้างโฟลเดอร์ใน Google Drive อัตโนมัติ:
 *    - วัคซีนไข้หวัดใหญ่_กาฬสินธุ์_เอกสารแนบ/
 *      - ปี_2569_รายงานผลการฉีด/
 *        - โรงพยาบาลกาฬสินธุ์/ (แยกตามชื่อหน่วยบริการ)
 * 3. บันทึกประวัติและยอดตัวเลขลงใน Google Sheets "สรุปผลรายงานวัคซีน_2569" อัตโนมัติ
 */

function doPost(e) {
  try {
    // ตรวจสอบข้อมูลนำเข้า
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ status: "error", message: "ไม่มีข้อมูลส่งมา" });
    }

    var payload = JSON.parse(e.postData.contents);
    var year = payload.year || 2569;
    var hospitalName = payload.hospitalName || payload.hospitalId || "ไม่ระบุหน่วยบริการ";
    var district = payload.district || "";

    // 1. โฟลเดอร์หลักใน Google Drive
    var rootFolderName = "วัคซีนไข้หวัดใหญ่_กาฬสินธุ์_เอกสารแนบ";
    var rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), rootFolderName);

    // 2. โฟลเดอร์แยกตามปีงบประมาณ
    var yearFolderName = "ปี_" + year + "_รายงานผลการฉีด";
    var yearFolder = getOrCreateFolder(rootFolder, yearFolderName);

    // 3. โฟลเดอร์แยกรายโรงพยาบาล
    var hospFolder = getOrCreateFolder(yearFolder, hospitalName);

    var fileUrl = "";
    var fileId = "";
    var fileName = payload.fileName || "";

    // 4. บันทึกไฟล์ถ้ามีการแนบมา
    if (payload.base64 && payload.fileName) {
      var contentType = payload.mimeType || "application/octet-stream";
      var fileBytes = Utilities.base64Decode(payload.base64);
      
      // ตั้งชื่อไฟล์: วันที่_ชื่อไฟล์เดิม
      var timePrefix = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd_HHmm");
      var safeName = timePrefix + "_" + payload.fileName;

      var blob = Utilities.newBlob(fileBytes, contentType, safeName);
      var newFile = hospFolder.createFile(blob);
      fileUrl = newFile.getUrl();
      fileId = newFile.getId();
    }

    // 5. บันทึกสรุปลง Google Sheet อัตโนมัติ
    var sheetName = "สรุปผลรายงานวัคซีน_" + year;
    var sheetFile = getOrCreateSpreadsheet(rootFolder, sheetName);
    var sheet = sheetFile.getActiveSheet();

    var rep = payload.reportData || {};
    var counts = rep.counts || {};
    var timestamp = Utilities.formatDate(new Date(), "Asia/Bangkok", "dd/MM/yyyy HH:mm:ss");

    sheet.appendRow([
      timestamp,
      hospitalName,
      district,
      rep.allocated || 0,
      rep.vaccinated || 0,
      fileName ? fileName : "ไม่มีไฟล์แนบ",
      fileUrl ? fileUrl : "-",
      counts.doctors || 0,
      counts.pharmacists || 0,
      counts.nurses || 0,
      counts.lab || 0,
      counts.publicHealth || 0,
      counts.interns || 0,
      counts.medicalOtherRisk || 0,
      counts.medicalOther || 0,
      counts.investigation || 0,
      counts.livestock || 0,
      counts.fieldOtherRisk || 0,
      counts.fieldOther || 0
    ]);

    return responseJSON({
      status: "success",
      message: "บันทึกข้อมูลและไฟล์ลง Google Drive เรียบร้อยแล้ว",
      fileUrl: fileUrl,
      fileId: fileId,
      folderUrl: hospFolder.getUrl()
    });

  } catch (err) {
    return responseJSON({
      status: "error",
      message: "เกิดข้อผิดพลาด: " + err.toString()
    });
  }
}

// ช่วยดึงหรือสร้างโฟลเดอร์
function getOrCreateFolder(parentFolder, folderName) {
  var folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(folderName);
}

// ช่วยดึงหรือสร้าง Google Spreadsheet
function getOrCreateSpreadsheet(folder, sheetName) {
  var files = folder.getFilesByName(sheetName);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }

  // สร้างไฟล์ใหม่
  var ss = SpreadsheetApp.create(sheetName);
  var file = DriveApp.getFileById(ss.getId());
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  // ใส่หัวตาราง
  var sheet = ss.getActiveSheet();
  var headers = [
    "วันเวลาที่บันทึก",
    "หน่วยบริการ",
    "อำเภอ",
    "ยอดจัดสรร (โดส)",
    "ยอดฉีดจริง (ราย)",
    "ชื่อเอกสารแนบ",
    "ลิงก์ไฟล์ Google Drive",
    "แพทย์",
    "เภสัชกร",
    "พยาบาล",
    "จนท.ห้องปฏิบัติการ",
    "นักวิชาการ/จพ.สาธารณสุข",
    "นักศึกษาฝึกงาน",
    "จนท.กลุ่มเสี่ยงอื่น (รพ.)",
    "อื่น ๆ (นอกกลุ่มเสี่ยง รพ.)",
    "ทีมสอบสวนโรค",
    "ทีมทำลายสัตว์ปีก/ปศุสัตว์",
    "จนท.กลุ่มเสี่ยงอื่น (สสอ.)",
    "อื่น ๆ (นอกกลุ่มเสี่ยง สสอ.)"
  ];
  sheet.appendRow(headers);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#0f766e");
  headerRange.setFontColor("#ffffff");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);

  return ss;
}

// ส่งคืน JSON Output
function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// สำหรับทดสอบการเปิดดู URL ในเบราว์เซอร์
function doGet() {
  return ContentService.createTextOutput("Google Apps Script Webhook สำหรับระบบวัคซีนไข้หวัดใหญ่ จ.กาฬสินธุ์ พร้อมใช้งาน")
    .setMimeType(ContentService.MimeType.TEXT);
}
