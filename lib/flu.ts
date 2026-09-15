export const hospitals = [
  { id: "kalasin", name: "โรงพยาบาลกาฬสินธุ์", district: "เมืองกาฬสินธุ์", type: "โรงพยาบาลทั่วไป" },
  { id: "namon", name: "โรงพยาบาลนามน", district: "นามน", type: "โรงพยาบาลชุมชน" },
  { id: "kamalasai", name: "โรงพยาบาลกมลาไสย", district: "กมลาไสย", type: "โรงพยาบาลชุมชน" },
  { id: "rongkham", name: "โรงพยาบาลร่องคำ", district: "ร่องคำ", type: "โรงพยาบาลชุมชน" },
  { id: "kuchinarai", name: "โรงพยาบาลสมเด็จพระยุพราชกุฉินารายณ์", district: "กุฉินารายณ์", type: "โรงพยาบาลชุมชน" },
  { id: "khaowong", name: "โรงพยาบาลเขาวง", district: "เขาวง", type: "โรงพยาบาลชุมชน" },
  { id: "yangtalat", name: "โรงพยาบาลยางตลาด", district: "ยางตลาด", type: "โรงพยาบาลชุมชน" },
  { id: "huaymek", name: "โรงพยาบาลห้วยเม็ก", district: "ห้วยเม็ก", type: "โรงพยาบาลชุมชน" },
  { id: "sahatsakhan", name: "โรงพยาบาลสหัสขันธ์", district: "สหัสขันธ์", type: "โรงพยาบาลชุมชน" },
  { id: "khammuang", name: "โรงพยาบาลคำม่วง", district: "คำม่วง", type: "โรงพยาบาลชุมชน" },
  { id: "thakhantho", name: "โรงพยาบาลท่าคันโท", district: "ท่าคันโท", type: "โรงพยาบาลชุมชน" },
  { id: "nongkungsri", name: "โรงพยาบาลหนองกุงศรี", district: "หนองกุงศรี", type: "โรงพยาบาลชุมชน" },
  { id: "somdet", name: "โรงพยาบาลสมเด็จ", district: "สมเด็จ", type: "โรงพยาบาลชุมชน" },
  { id: "huayphueng", name: "โรงพยาบาลห้วยผึ้ง", district: "ห้วยผึ้ง", type: "โรงพยาบาลชุมชน" },
  { id: "nakhu", name: "โรงพยาบาลนาคู", district: "นาคู", type: "โรงพยาบาลชุมชน" },
  { id: "khongchai", name: "โรงพยาบาลฆ้องชัย", district: "ฆ้องชัย", type: "โรงพยาบาลชุมชน" },
  { id: "donchan", name: "โรงพยาบาลดอนจาน", district: "ดอนจาน", type: "โรงพยาบาลชุมชน" },
  { id: "samchai", name: "โรงพยาบาลสามชัย", district: "สามชัย", type: "โรงพยาบาลชุมชน" },
  { id: "kalasin_livestock", name: "ปศุสัตว์จังหวัดกาฬสินธุ์", district: "เมืองกาฬสินธุ์", type: "หน่วยงานภาคีเครือข่าย" },
] as const;

export const categories = [
  { key: "doctors", label: "แพทย์", group: "บุคลากรทางการแพทย์ในโรงพยาบาล" },
  { key: "pharmacists", label: "เภสัชกร", group: "บุคลากรทางการแพทย์ในโรงพยาบาล" },
  { key: "nurses", label: "พยาบาล", group: "บุคลากรทางการแพทย์ในโรงพยาบาล" },
  { key: "lab", label: "เจ้าหน้าที่ห้องปฏิบัติการ", group: "บุคลากรทางการแพทย์ในโรงพยาบาล" },
  { key: "publicHealth", label: "นักวิชาการ/เจ้าพนักงานสาธารณสุข", group: "บุคลากรทางการแพทย์ในโรงพยาบาล" },
  { key: "interns", label: "นักศึกษาฝึกงาน", group: "บุคลากรทางการแพทย์ในโรงพยาบาล" },
  { key: "medicalOtherRisk", label: "เจ้าหน้าที่กลุ่มเสี่ยงอื่น ๆ", group: "บุคลากรทางการแพทย์ในโรงพยาบาล" },
  { key: "medicalOther", label: "อื่น ๆ (นอกกลุ่มเสี่ยงบุคลากรทางการแพทย์ เช่น อสม. ฝ่ายปกครอง)", group: "บุคลากรทางการแพทย์ในโรงพยาบาล" },
  { key: "investigation", label: "ทีมสอบสวนโรค", group: "กลุ่มงานเสี่ยงในสำนักงานสาธารณสุขอำเภอ" },
  { key: "livestock", label: "ทีมทำลายสัตว์ปีก/ปศุสัตว์", group: "กลุ่มงานเสี่ยงในสำนักงานสาธารณสุขอำเภอ" },
  { key: "fieldOtherRisk", label: "เจ้าหน้าที่กลุ่มเสี่ยงอื่น ๆ", group: "กลุ่มงานเสี่ยงในสำนักงานสาธารณสุขอำเภอ" },
  { key: "fieldOther", label: "อื่น ๆ (นอกกลุ่มเสี่ยง)", group: "กลุ่มงานเสี่ยงในสำนักงานสาธารณสุขอำเภอ" },
] as const;

export type Category = (typeof categories)[number];
export type CategoryKey = Category["key"];
export const categories2569 = categories;
export const categories2570: readonly Category[] = categories.filter((c) => c.key !== "medicalOther");
export type Counts = Record<CategoryKey, number>;
export type Report = {
  hospitalId: string;
  year: number;
  allocated: number;
  counts: Counts;
  vaccinated: number;
  updatedAt: string;
  updatedBy: string;
  attachmentCount: number;
};
export type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
};

export type Survey = {
  hospitalId: string;
  year: number;
  targetTotal: number;
  requestedDoses: number;
  counts: Counts;
  coordinatorName: string;
  coordinatorPhone: string;
  coordinatorPosition: string;
  notes: string;
  updatedAt: string;
  updatedBy: string;
  attachmentCount: number;
};

export function emptyCounts(): Counts {
  return Object.fromEntries(categories.map((category) => [category.key, 0])) as Counts;
}

export function sumCounts(counts: Counts): number {
  return categories.reduce((sum, category) => sum + (counts[category.key] || 0), 0);
}

export function sumCounts2570(counts: Counts): number {
  return categories2570.reduce((sum, category) => sum + (counts[category.key] || 0), 0);
}

export function isValidHospital(value: string): boolean {
  return hospitals.some((hospital) => hospital.id === value);
}

