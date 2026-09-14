-- Seed Reports 2569
INSERT OR REPLACE INTO reports (hospital_id, year, allocated, counts_json, updated_at, updated_by) VALUES
('kalasin', 2569, 650, '{"doctors":45,"pharmacists":22,"nurses":310,"lab":35,"publicHealth":40,"interns":30,"medicalOtherRisk":80,"medicalOther":58,"investigation":0,"livestock":0,"fieldOtherRisk":0,"fieldOther":0}', datetime('now'), 'admin@kalasin.go.th'),
('kamalasai', 2569, 220, '{"doctors":14,"pharmacists":8,"nurses":115,"lab":12,"publicHealth":20,"interns":10,"medicalOtherRisk":26,"medicalOther":10,"investigation":0,"livestock":0,"fieldOtherRisk":0,"fieldOther":0}', datetime('now'), 'admin@kalasin.go.th'),
('yangtalat', 2569, 280, '{"doctors":18,"pharmacists":10,"nurses":145,"lab":15,"publicHealth":25,"interns":12,"medicalOtherRisk":30,"medicalOther":15,"investigation":0,"livestock":0,"fieldOtherRisk":0,"fieldOther":0}', datetime('now'), 'admin@kalasin.go.th');

-- Seed Surveys 2570
INSERT OR REPLACE INTO surveys (hospital_id, year, target_total, requested_doses, counts_json, coordinator_name, coordinator_phone, coordinator_position, notes, updated_at, updated_by) VALUES
('kuchinarai', 2570, 360, 350, '{"doctors":25,"pharmacists":15,"nurses":180,"lab":20,"publicHealth":30,"interns":20,"medicalOtherRisk":40,"medicalOther":20,"investigation":0,"livestock":0,"fieldOtherRisk":0,"fieldOther":0}', 'พว.นภาพร บุญมา', '043-851210', 'หัวหน้ากลุ่มงานการพยาบาล', 'ขอรับจัดสรรเพิ่มขึ้นเพื่อรองรับบุคลากรบรรจุใหม่และหอผู้ป่วยวิกฤตเปิดใหม่', datetime('now'), 'admin@kalasin.go.th'),
('somdet', 2570, 210, 200, '{"doctors":15,"pharmacists":9,"nurses":110,"lab":12,"publicHealth":18,"interns":10,"medicalOtherRisk":16,"medicalOther":10,"investigation":0,"livestock":0,"fieldOtherRisk":0,"fieldOther":0}', 'นวก.สาธารณสุข ชาญชัย สุริยะ', '043-861110', 'นักวิชาการสาธารณสุขชำนาญการ', 'ขอรับจัดสรรครอบคลุมบุคลากรด่านหน้าและทีมสอบสวนโรค SRRT อำเภอสมเด็จ', datetime('now'), 'admin@kalasin.go.th'),
('sahatsakhan', 2570, 180, 175, '{"doctors":12,"pharmacists":7,"nurses":95,"lab":10,"publicHealth":16,"interns":10,"medicalOtherRisk":15,"medicalOther":10,"investigation":0,"livestock":0,"fieldOtherRisk":0,"fieldOther":0}', 'พว.กัญญา จันทร์เพ็ญ', '043-871030', 'พยาบาลวิชาชีพชำนาญการ', 'จัดสรรให้บุคลากรทางการแพทย์และเจ้าหน้าที่กลุ่มเสี่ยงครบถ้วน', datetime('now'), 'admin@kalasin.go.th');

-- Seed Attachments metadata (mapping to files stored in Google Drive & R2)
INSERT OR REPLACE INTO attachments (id, hospital_id, year, object_key, name, type, size, created_at, uploaded_by) VALUES
('att-kla-01', 'kalasin', 2569, 'flu/2569/kalasin/att-kla-01', 'ภาพกิจกรรมการฉีดวัคซีน_รพ_กาฬสินธุ์.png', 'image/png', 67, datetime('now'), 'admin@kalasin.go.th'),
('att-kla-02', 'kalasin', 2569, 'flu/2569/kalasin/att-kla-02', 'รายชื่อบุคลากรผู้รับวัคซีน_รพ_กาฬสินธุ์.pdf', 'application/pdf', 528, datetime('now'), 'admin@kalasin.go.th'),
('att-kms-01', 'kamalasai', 2569, 'flu/2569/kamalasai/att-kms-01', 'ภาพกิจกรรมการฉีดวัคซีน_รพ_กมลาไสย.png', 'image/png', 67, datetime('now'), 'admin@kalasin.go.th'),
('att-ytl-01', 'yangtalat', 2569, 'flu/2569/yangtalat/att-ytl-01', 'รายชื่อผู้ได้รับวัคซีน_รพ_ยางตลาด.csv', 'text/csv', 689, datetime('now'), 'admin@kalasin.go.th'),
('att-kcn-01', 'kuchinarai', 2570, 'flu/2570/kuchinarai/att-kcn-01', 'หนังสือนำส่งสำรวจความต้องการปี2570_รพ_กุฉินารายณ์.pdf', 'application/pdf', 528, datetime('now'), 'admin@kalasin.go.th'),
('att-smd-01', 'somdet', 2570, 'flu/2570/somdet/att-smd-01', 'แบบสำรวจความต้องการวัคซีน_รพ_สมเด็จ.pdf', 'application/pdf', 528, datetime('now'), 'admin@kalasin.go.th'),
('att-shk-01', 'sahatsakhan', 2570, 'flu/2570/sahatsakhan/att-shk-01', 'แบบสำรวจความต้องการวัคซีน_รพ_สหัสขันธ์.pdf', 'application/pdf', 528, datetime('now'), 'admin@kalasin.go.th');
