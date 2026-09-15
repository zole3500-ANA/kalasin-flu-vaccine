/**
 * =========================================================================
 * ระบบรับไฟล์และข้อมูลวัคซีนไข้หวัดใหญ่บุคลากร จังหวัดกาฬสินธุ์ (Live Cloud Sync)
 * กลุ่มงานควบคุมโรคติดต่อ สำนักงานสาธารณสุขจังหวัดกาฬสินธุ์
 * =========================================================================
 * 
 * ฟังก์ชัน:
 * 1. doPost(e): รับไฟล์และบันทึกยอดฉีด/สำรวจ ลง Google Drive และ Google Sheets
 * 2. doGet(e): ส่งข้อมูลสรุปทั้งหมดจาก Google Sheets กลับไปยังหน้าเว็บ (Live Cloud Sync)
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ status: "error", message: "ไม่มีข้อมูลส่งมา" });
    }

    var payload = JSON.parse(e.postData.contents);
    var year = Number(payload.year) || 2569;
    var hospitalName = payload.hospitalName || payload.hospitalId || "ไม่ระบุหน่วยบริการ";
    var district = payload.district || "";

    // 1. โฟลเดอร์เป้าหมายของ สสจ.กาฬสินธุ์
    var folderId = "1nnCxIy97p33HCx3KGrxj8a90RZOBmwjw";
    var rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(folderId);
    } catch (e) {
      rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), "วัคซีนไข้หวัดใหญ่_กาฬสินธุ์_เอกสารแนบ");
    }

    // 2. โฟลเดอร์แยกตามหน่วยบริการ
    var hospFolder = getOrCreateFolder(rootFolder, hospitalName);

    var fileUrl = "";
    var fileId = "";
    var fileName = payload.fileName || "";

    // 3. บันทึกไฟล์ถ้ามีการแนบมา (สำหรับปี 2569)
    if (payload.base64 && payload.fileName) {
      var contentType = payload.mimeType || "application/octet-stream";
      var fileBytes = Utilities.base64Decode(payload.base64);
      
      var timePrefix = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd_HHmm");
      var safeName = timePrefix + "_" + payload.fileName;

      var blob = Utilities.newBlob(fileBytes, contentType, safeName);
      var newFile = hospFolder.createFile(blob);
      fileUrl = newFile.getUrl();
      fileId = newFile.getId();
    }

    var timestamp = Utilities.formatDate(new Date(), "Asia/Bangkok", "dd/MM/yyyy HH:mm:ss");

    // 4. บันทึกแยกระหว่างปี 2569 และ 2570
    if (year === 2570 || payload.surveyData) {
      var sheetName70 = "สรุปผลแบบสำรวจ_2570";
      var sheetFile70 = getOrCreateSpreadsheet(rootFolder, sheetName70, 2570);
      var sheet70 = sheetFile70.getActiveSheet();
      var sur = payload.surveyData || {};
      var sCounts = sur.counts || {};

      sheet70.appendRow([
        timestamp,
        hospitalName,
        district,
        sur.targetTotal || 0,
        sur.requestedDoses || 0,
        sur.coordinatorName || "",
        sur.coordinatorPhone || "",
        sur.coordinatorPosition || "",
        sur.notes || "",
        sCounts.doctors || 0,
        sCounts.pharmacists || 0,
        sCounts.nurses || 0,
        sCounts.lab || 0,
        sCounts.publicHealth || 0,
        sCounts.interns || 0,
        sCounts.medicalOtherRisk || 0,
        sCounts.medicalOther || 0,
        sCounts.investigation || 0,
        sCounts.livestock || 0,
        sCounts.fieldOtherRisk || 0,
        sCounts.fieldOther || 0
      ]);

      return responseJSON({
        status: "success",
        message: "บันทึกแบบสำรวจปี 2570 เรียบร้อยแล้ว",
        folderUrl: hospFolder.getUrl()
      });

    } else {
      var sheetName69 = "สรุปผลรายงานวัคซีน_2569";
      var sheetFile69 = getOrCreateSpreadsheet(rootFolder, sheetName69, 2569);
      var sheet69 = sheetFile69.getActiveSheet();
      var rep = payload.reportData || {};
      var counts = rep.counts || {};

      sheet69.appendRow([
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
    }

  } catch (err) {
    return responseJSON({
      status: "error",
      message: "เกิดข้อผิดพลาด: " + err.toString()
    });
  }
}

// =========================================================================
// GET: ส่งข้อมูลสดจาก Google Sheets กลับไปยังหน้าเว็บ (Live Cloud Sync)
// =========================================================================
function doGet(e) {
  try {
    var folderId = "1nnCxIy97p33HCx3KGrxj8a90RZOBmwjw";
    var rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(folderId);
    } catch (e) {
      rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), "วัคซีนไข้หวัดใหญ่_กาฬสินธุ์_เอกสารแนบ");
    }

    var result = {
      status: "success",
      updatedAt: Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd'T'HH:mm:ssXXX"),
      reports2569: {},
      surveys2570: {},
      files2569: {}
    };

    // 1. อ่านข้อมูลปี 2569
    var files69 = rootFolder.getFilesByName("สรุปผลรายงานวัคซีน_2569");
    if (files69.hasNext()) {
      var ss69 = SpreadsheetApp.open(files69.next());
      var sheet69 = ss69.getActiveSheet();
      var data69 = sheet69.getDataRange().getValues();
      for (var i = 1; i < data69.length; i++) {
        var row = data69[i];
        var timeStr = String(row[0] || "");
        var hospName = String(row[1] || "").trim();
        var dist = String(row[2] || "").trim();
        var alloc = Number(row[3]) || 0;
        var vax = Number(row[4]) || 0;
        var fName = String(row[5] || "");
        var fUrl = String(row[6] || "");

        if (!hospName) continue;
        var hospId = findHospitalIdByName(hospName);

        var counts = {
          doctors: Number(row[7]) || 0,
          pharmacists: Number(row[8]) || 0,
          nurses: Number(row[9]) || 0,
          lab: Number(row[10]) || 0,
          publicHealth: Number(row[11]) || 0,
          interns: Number(row[12]) || 0,
          medicalOtherRisk: Number(row[13]) || 0,
          medicalOther: Number(row[14]) || 0,
          investigation: Number(row[15]) || 0,
          livestock: Number(row[16]) || 0,
          fieldOtherRisk: Number(row[17]) || 0,
          fieldOther: Number(row[18]) || 0
        };

        // เก็บแถวล่าสุดของแต่ละโรงพยาบาล
        result.reports2569[hospId] = {
          hospitalId: hospId,
          year: 2569,
          allocated: alloc,
          vaccinated: vax,
          counts: counts,
          updatedAt: timeStr
        };

        // สะสมไฟล์แนบทั้งหมด
        if (fUrl && fUrl !== "-" && fUrl.indexOf("http") === 0) {
          if (!result.files2569[hospId]) {
            result.files2569[hospId] = [];
          }
          var exists = result.files2569[hospId].some(function(item) {
            return item.driveUrl === fUrl;
          });
          if (!exists) {
            result.files2569[hospId].push({
              name: fName && fName !== "ไม่มีไฟล์แนบ" ? fName : "เอกสารแนบ",
              driveUrl: fUrl,
              date: timeStr
            });
          }
        }
      }
    }

    // 2. อ่านข้อมูลแบบสำรวจปี 2570
    var files70 = rootFolder.getFilesByName("สรุปผลแบบสำรวจ_2570");
    if (files70.hasNext()) {
      var ss70 = SpreadsheetApp.open(files70.next());
      var sheet70 = ss70.getActiveSheet();
      var data70 = sheet70.getDataRange().getValues();
      for (var j = 1; j < data70.length; j++) {
        var row70 = data70[j];
        var hospName70 = String(row70[1] || "").trim();
        if (!hospName70) continue;
        var hospId70 = findHospitalIdByName(hospName70);

        result.surveys2570[hospId70] = {
          hospitalId: hospId70,
          year: 2570,
          targetTotal: Number(row70[3]) || 0,
          requestedDoses: Number(row70[4]) || 0,
          coordinatorName: String(row70[5] || ""),
          coordinatorPhone: String(row70[6] || ""),
          coordinatorPosition: String(row70[7] || ""),
          notes: String(row70[8] || ""),
          counts: {
            doctors: Number(row70[9]) || 0,
            pharmacists: Number(row70[10]) || 0,
            nurses: Number(row70[11]) || 0,
            lab: Number(row70[12]) || 0,
            publicHealth: Number(row70[13]) || 0,
            interns: Number(row70[14]) || 0,
            medicalOtherRisk: Number(row70[15]) || 0,
            medicalOther: Number(row70[16]) || 0,
            investigation: Number(row70[17]) || 0,
            livestock: Number(row70[18]) || 0,
            fieldOtherRisk: Number(row70[19]) || 0,
            fieldOther: Number(row70[20]) || 0
          },
          updatedAt: String(row70[0] || "")
        };
      }
    }

    return responseJSON(result);

  } catch (err) {
    return responseJSON({
      status: "error",
      message: "เกิดข้อผิดพลาดในการอ่านข้อมูล: " + err.toString()
    });
  }
}

// ช่วยจับคู่ชื่อโรงพยาบาลเป็น ID ระบบ
function findHospitalIdByName(name) {
  var mapping = {
    "โรงพยาบาลกาฬสินธุ์": "kalasin",
    "โรงพยาบาลนามน": "namon",
    "โรงพยาบาลกมลาไสย": "kamalasai",
    "โรงพยาบาลร่องคำ": "rongkham",
    "โรงพยาบาลสมเด็จพระยุพราชกุฉินารายณ์": "kuchinarai",
    "โรงพยาบาลเขาวง": "khaowong",
    "โรงพยาบาลยางตลาด": "yangtalat",
    "โรงพยาบาลห้วยเม็ก": "huaymek",
    "โรงพยาบาลสหัสขันธ์": "sahatsakhan",
    "โรงพยาบาลคำม่วง": "khammuang",
    "โรงพยาบาลท่าคันโท": "thakhantho",
    "โรงพยาบาลหนองกุงศรี": "nongkungsri",
    "โรงพยาบาลสมเด็จ": "somdet",
    "โรงพยาบาลห้วยผึ้ง": "huayphueng",
    "โรงพยาบาลนาคู": "nakhu",
    "โรงพยาบาลฆ้องชัย": "khongchai",
    "โรงพยาบาลดอนจาน": "donchan",
    "โรงพยาบาลสามชัย": "samchai",
    "ปศุสัตว์จังหวัดกาฬสินธุ์": "kalasin_livestock"
  };
  return mapping[name] || name;
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
function getOrCreateSpreadsheet(folder, sheetName, year) {
  var files = folder.getFilesByName(sheetName);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }

  var ss = SpreadsheetApp.create(sheetName);
  var file = DriveApp.getFileById(ss.getId());
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  var sheet = ss.getActiveSheet();
  var headers;

  if (year === 2570) {
    headers = [
      "วันเวลาที่บันทึก",
      "หน่วยบริการ",
      "อำเภอ",
      "เป้าหมายรวม (ราย)",
      "ยอดขอรับจัดสรร (โดส)",
      "ชื่อผู้ประสานงาน",
      "เบอร์โทรศัพท์",
      "ตำแหน่ง",
      "หมายเหตุ",
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
  } else {
    headers = [
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
  }

  sheet.appendRow(headers);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground(year === 2570 ? "#0369a1" : "#0f766e");
  headerRange.setFontColor("#ffffff");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);

  return ss;
}

// ส่งคืน JSON Output พร้อม CORS
function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
