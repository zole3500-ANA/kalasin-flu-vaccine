"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowDownToLine, ArrowUpRight, Check, ClipboardList, FileSpreadsheet, FileText, Hospital, LoaderCircle, Paperclip, Search, ShieldPlus, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { categories, emptyCounts, hospitals, sumCounts } from "@/lib/flu";
import type { Attachment, Counts, Report } from "@/lib/flu";

const formatter = new Intl.NumberFormat("th-TH");
const maxFileSize = 10 * 1024 * 1024;
const acceptedTypes = ".jpg,.jpeg,.png,.webp,.pdf,.xls,.xlsx,.csv";
const number = (value: number) => formatter.format(value);
const date = (value: string) => new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

export default function Home() {
  const [year, setYear] = useState(2569);
  const [query, setQuery] = useState("");
  const [reports, setReports] = useState<Record<string, Report>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [allocated, setAllocated] = useState(0);
  const [counts, setCounts] = useState<Counts>(emptyCounts);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/reports?year=" + year, { cache: "no-store" });
      if (response.status === 401) { setAuthRequired(true); setReports({}); return; }
      if (!response.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้ กรุณาลองอีกครั้ง");
      const payload = await response.json() as { reports: Report[] };
      setAuthRequired(false);
      setReports(Object.fromEntries(payload.reports.map((report) => [report.hospitalId, report])));
    } catch (error) { setLoadError(error instanceof Error ? error.message : "เกิดข้อผิดพลาด"); }
    finally { setLoading(false); }
  }, [year]);

  useEffect(() => { void loadReports(); }, [loadReports]);

  const loadAttachments = useCallback(async (hospitalId: string) => {
    setAttachmentsLoading(true);
    try {
      const response = await fetch("/api/files?hospitalId=" + hospitalId + "&year=" + year, { cache: "no-store" });
      if (!response.ok) throw new Error();
      const payload = await response.json() as { files: Attachment[] };
      setAttachments(payload.files);
    } catch { setAttachments([]); }
    finally { setAttachmentsLoading(false); }
  }, [year]);

  const selectedHospital = hospitals.find((hospital) => hospital.id === selectedId);
  const vaccinated = sumCounts(counts);
  const overAllocated = vaccinated > allocated;
  const filtered = useMemo(() => hospitals.filter((hospital) => (hospital.name + " " + hospital.district).toLowerCase().includes(query.trim().toLowerCase())), [query]);
  const recorded = Object.keys(reports).length;
  const allocatedTotal = Object.values(reports).reduce((sum, report) => sum + report.allocated, 0);
  const vaccinatedTotal = Object.values(reports).reduce((sum, report) => sum + report.vaccinated, 0);
  const percent = allocatedTotal ? Math.round(vaccinatedTotal / allocatedTotal * 100) : 0;

  useEffect(() => {
    type ModelContext = { registerTool: (tool: {
      name: string; title: string; description: string; inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => object;
    }, options: { signal: AbortSignal }) => void | Promise<void> };
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "search_hospitals",
      title: "ค้นหาโรงพยาบาล",
      description: "ค้นหาโรงพยาบาลในจังหวัดกาฬสินธุ์และแสดงผลในตารางรายงาน",
      inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const query = (input as { query?: unknown })?.query;
        if (typeof query !== "string" || query.length > 100) throw new Error("คำค้นหาไม่ถูกต้อง");
        const term = query.trim();
        setQuery(term);
        return { query: term, hospitals: hospitals.filter((hospital) => (hospital.name + " " + hospital.district).includes(term)).map((hospital) => ({ id: hospital.id, name: hospital.name })) };
      },
    }, { signal: lifecycle.signal })).catch(() => {});
    return () => lifecycle.abort();
  }, []);

  function openForm(hospitalId: string) {
    const report = reports[hospitalId];
    setSelectedId(hospitalId);
    setAllocated(report?.allocated ?? 0);
    setCounts(report?.counts ? { ...emptyCounts(), ...report.counts } : emptyCounts());
    setPendingFiles([]);
    setAttachments([]);
    setFormError("");
    setNotice("");
    void loadAttachments(hospitalId);
  }

  function updateCount(key: keyof Counts, value: string) {
    const parsed = value === "" ? 0 : Number(value);
    if (Number.isInteger(parsed) && parsed >= 0) setCounts((previous) => ({ ...previous, [key]: parsed }));
  }

  function chooseFiles(list: FileList | null) {
    if (!list) return;
    const chosen = Array.from(list);
    if (chosen.some((file) => !/\.(jpe?g|png|webp|pdf|xlsx?|csv)$/i.test(file.name) || file.size > maxFileSize)) {
      setFormError("รองรับ JPG, PNG, WebP, PDF, Excel หรือ CSV ขนาดไม่เกิน 10 MB ต่อไฟล์");
      return;
    }
    setFormError("");
    setPendingFiles((previous) => [...previous, ...chosen]);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function saveReport() {
    if (!selectedId) return;
    if (overAllocated) { setFormError("ยอดฉีดรวมมากกว่าจำนวนวัคซีนที่จัดสรร"); return; }
    setSaving(true);
    setFormError("");
    try {
      const response = await fetch("/api/reports/" + selectedId, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, allocated, counts }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "บันทึกข้อมูลไม่สำเร็จ");
      for (const file of pendingFiles) {
        const data = new FormData();
        data.append("hospitalId", selectedId);
        data.append("year", String(year));
        data.append("file", file);
        const upload = await fetch("/api/files", { method: "POST", body: data });
        const outcome = await upload.json() as { error?: string };
        if (!upload.ok) throw new Error("บันทึกยอดแล้ว แต่แนบไฟล์ " + file.name + " ไม่สำเร็จ: " + (outcome.error || "กรุณาลองอีกครั้ง"));
      }
      await Promise.all([loadReports(), loadAttachments(selectedId)]);
      setPendingFiles([]);
      setNotice("บันทึกข้อมูล" + (selectedHospital?.name ?? "") + "เรียบร้อยแล้ว");
      setSelectedId(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "บันทึกข้อมูลไม่สำเร็จ");
      await loadReports();
    } finally { setSaving(false); }
  }

  function exportCsv() {
    const header = ["โรงพยาบาล", "อำเภอ", "ปี พ.ศ.", "วัคซีนจัดสรร", "ฉีดแล้ว", ...categories.map((item) => item.label), "จำนวนไฟล์แนบ", "แก้ไขล่าสุด"];
    const rows = hospitals.map((hospital) => {
      const report = reports[hospital.id];
      return [hospital.name, hospital.district, year, report?.allocated ?? "", report?.vaccinated ?? "",
        ...categories.map((item) => report?.counts[item.key] ?? ""), report?.attachmentCount ?? 0, report?.updatedAt ?? ""];
    });
    const csv = [header, ...rows].map((row) => row.map((cell) => '"' + String(cell).replaceAll('"', '""') + '"').join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "kalasin-flu-staff-" + year + ".csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return <div className="app-shell">
    <aside className="side-panel">
      <div className="brand"><div className="brand-mark"><ShieldPlus size={27} strokeWidth={2.1} /></div><div><strong>กาฬสินธุ์</strong><span>ระบบข้อมูลวัคซีนบุคลากร</span></div></div>
      <div className="side-section-label">เมนูหลัก</div>
      <a className="side-link active" href="#overview"><Activity size={19} /> ภาพรวมการดำเนินงาน</a>
      <a className="side-link" href="#hospitals"><Hospital size={19} /> ข้อมูล 18 โรงพยาบาล</a>
      <div className="side-bottom"><div className="side-bottom-icon"><ClipboardList size={22} /></div><p>รายงานการฉีดวัคซีนไข้หวัดใหญ่<br />ในบุคลากรทางการแพทย์และสาธารณสุข</p><span>จังหวัดกาฬสินธุ์</span></div>
    </aside>
    <div className="main-area">
      <header className="topbar"><div className="mobile-brand"><ShieldPlus size={24} /><span>วัคซีนบุคลากร กาฬสินธุ์</span></div><div className="breadcrumb">งานควบคุมโรค <span>/</span> วัคซีนไข้หวัดใหญ่ <span>/</span> <strong>บุคลากร</strong></div><div className="topbar-right"><span className="status-dot" /> จังหวัดกาฬสินธุ์ · 18 โรงพยาบาล</div></header>
      <main className="content" id="overview">
        <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> ระบบรายงานวัคซีนไข้หวัดใหญ่</div><h1>ผลการฉีดวัคซีนในบุคลากร</h1><p>ติดตามการจัดสรร การให้บริการ และเอกสารรายชื่อผู้ได้รับวัคซีนของโรงพยาบาลในจังหวัดกาฬสินธุ์</p></div><label className="year-control"><span>ปีงบประมาณ</span><NativeSelect value={year} onChange={(event) => { setYear(Number(event.target.value)); setSelectedId(null); }}><NativeSelectOption value={2568}>2568</NativeSelectOption><NativeSelectOption value={2569}>2569</NativeSelectOption><NativeSelectOption value={2570}>2570</NativeSelectOption></NativeSelect></label></div>
        {notice && <div className="notice success" role="status"><Check size={17} />{notice}<button aria-label="ปิดข้อความ" onClick={() => setNotice("")}><X size={16} /></button></div>}
        {authRequired && <div className="notice warning" role="alert">กรุณาเข้าสู่ระบบเพื่อดูและบันทึกข้อมูล <a href="/signin-with-chatgpt?return_to=%2F" target="_top">เข้าสู่ระบบ</a></div>}
        {loadError && <div className="notice warning" role="alert">{loadError}<Button size="sm" variant="outline" onClick={() => void loadReports()}>ลองอีกครั้ง</Button></div>}
        <div className="stat-grid">
          <div className="stat-card"><div className="stat-top"><span>โรงพยาบาลที่รายงานแล้ว</span><span className="stat-icon blue"><Hospital size={20} /></span></div><div className="stat-value">{loading ? "—" : number(recorded)} <small>/ 18 แห่ง</small></div><div className="stat-foot">จำนวนหน่วยงานที่บันทึกข้อมูลในปี {year}</div></div>
          <div className="stat-card"><div className="stat-top"><span>วัคซีนที่ได้รับจัดสรร</span><span className="stat-icon teal"><ClipboardList size={20} /></span></div><div className="stat-value">{loading ? "—" : number(allocatedTotal)} <small>โดส</small></div><div className="stat-foot">รวมจากหน่วยงานที่ส่งรายงาน</div></div>
          <div className="stat-card highlight"><div className="stat-top"><span>บุคลากรได้รับวัคซีน</span><span className="stat-icon white"><ShieldPlus size={20} /></span></div><div className="stat-value">{loading ? "—" : number(vaccinatedTotal)} <small>ราย</small></div><div className="stat-foot">คิดเป็น {percent}% ของจำนวนที่จัดสรร</div><div className="stat-progress"><span style={{ width: Math.min(percent, 100) + "%" }} /></div></div>
        </div>
        <section className="table-section" id="hospitals">
          <div className="section-header"><div><div className="section-kicker">รายงานรายหน่วยงาน</div><h2>โรงพยาบาลในจังหวัดกาฬสินธุ์ <span>18 แห่ง</span></h2></div><div className="table-actions"><div className="search-box"><Search size={17} /><Input aria-label="ค้นหาโรงพยาบาล" placeholder="ค้นหาโรงพยาบาลหรืออำเภอ" value={query} onChange={(event) => setQuery(event.target.value)} /></div><Button variant="outline" onClick={exportCsv} className="export-button"><ArrowDownToLine size={16} /> ส่งออก CSV</Button></div></div>
          <div className="table-wrap"><Table className="hospital-table"><TableHeader><TableRow><TableHead className="number-col">ลำดับ</TableHead><TableHead>หน่วยบริการ</TableHead><TableHead>สถานะ</TableHead><TableHead className="numeric">จัดสรร</TableHead><TableHead className="numeric">ฉีดแล้ว</TableHead><TableHead className="numeric">ความครอบคลุม</TableHead><TableHead className="numeric">เอกสาร</TableHead><TableHead className="action-col">จัดการ</TableHead></TableRow></TableHeader><TableBody>
            {filtered.map((hospital) => { const report = reports[hospital.id]; const coverage = report?.allocated ? Math.round(report.vaccinated / report.allocated * 100) : 0; return <TableRow key={hospital.id}><TableCell className="number-col">{String(hospitals.indexOf(hospital) + 1).padStart(2, "0")}</TableCell><TableCell><div className="hospital-name">{hospital.name}</div><div className="hospital-district">อำเภอ{hospital.district}</div></TableCell><TableCell><span className={"status-pill " + (report ? "done" : "pending")}><span />{report ? "รายงานแล้ว" : "รอรายงาน"}</span></TableCell><TableCell className="numeric">{report ? number(report.allocated) : "—"}</TableCell><TableCell className="numeric emphasized">{report ? number(report.vaccinated) : "—"}</TableCell><TableCell className="numeric">{report ? coverage + "%" : "—"}</TableCell><TableCell className="numeric">{report?.attachmentCount ? <span className="file-count"><Paperclip size={14} />{report.attachmentCount}</span> : "—"}</TableCell><TableCell className="action-col"><Button variant="ghost" size="sm" onClick={() => openForm(hospital.id)}>{report ? "แก้ไข" : "บันทึก"}<ArrowUpRight size={15} /></Button></TableCell></TableRow>; })}
            {!filtered.length && <TableRow><TableCell colSpan={8} className="no-results">ไม่พบโรงพยาบาลที่ตรงกับคำค้นหา</TableCell></TableRow>}
          </TableBody></Table></div>
          <div className="table-footer">แสดง {filtered.length} จาก 18 โรงพยาบาล <span>อัปเดตตามข้อมูลที่หน่วยงานบันทึกจริง</span></div>
        </section>
      </main>
    </div>
    <Sheet open={!!selectedId} onOpenChange={(open) => { if (!open && !saving) setSelectedId(null); }}>
      <SheetContent className="report-sheet" side="right"><SheetHeader className="report-sheet-header"><div className="sheet-overline">แบบบันทึกวัคซีนไข้หวัดใหญ่ · ปี {year}</div><SheetTitle>{selectedHospital?.name ?? "บันทึกข้อมูล"}</SheetTitle><SheetDescription>กรอกจำนวนผู้ได้รับวัคซีนแยกตามกลุ่มบุคลากร และแนบรายชื่อผู้ได้รับวัคซีน</SheetDescription></SheetHeader>
        <div className="report-sheet-body">
          <div className="form-summary"><label htmlFor="allocated">จำนวนวัคซีนที่ได้รับจัดสรร <span>โดส</span></label><Input id="allocated" type="number" min="0" step="1" value={allocated} onChange={(event) => setAllocated(Math.max(0, Number(event.target.value) || 0))} /><div className="computed-row"><span>จำนวนผู้ได้รับวัคซีนรวม</span><strong>{number(vaccinated)} ราย</strong></div>{overAllocated && <p className="field-warning">ยอดฉีดรวมมากกว่าจำนวนวัคซีนที่จัดสรร</p>}</div>
          {["บุคลากรทางการแพทย์", "กลุ่มงานเสี่ยง"].map((group) => <section className="category-group" key={group}><div className="group-heading"><span>{group}</span><small>{number(categories.filter((item) => item.group === group).reduce((total, item) => total + counts[item.key], 0))} ราย</small></div><div className="category-grid">{categories.filter((item) => item.group === group).map((item) => <label className="category-field" key={item.key}><span>{item.label}</span><div><Input type="number" min="0" step="1" value={counts[item.key]} onChange={(event) => updateCount(item.key, event.target.value)} /><em>ราย</em></div></label>)}</div></section>)}
          <section className="file-section"><div className="group-heading"><span>เอกสารรายชื่อผู้ได้รับวัคซีน</span><small>{attachments.length + pendingFiles.length} ไฟล์</small></div><input ref={fileInput} type="file" accept={acceptedTypes} multiple hidden onChange={(event) => chooseFiles(event.target.files)} /><button className="upload-zone" type="button" onClick={() => fileInput.current?.click()}><UploadCloud size={24} /><strong>เลือกไฟล์เพื่อแนบ</strong><span>รูปภาพ, PDF, Excel หรือ CSV · ไม่เกิน 10 MB/ไฟล์</span></button>{attachmentsLoading && <div className="file-loading"><LoaderCircle className="spin" size={17} /> กำลังโหลดเอกสาร...</div>}{attachments.map((file) => <div className="attachment-row" key={file.id}><div className="attachment-icon">{/\.xlsx?$|\.csv$/i.test(file.name) ? <FileSpreadsheet size={18} /> : <FileText size={18} />}</div><div><a href={"/api/files/" + file.id} target="_blank" rel="noopener noreferrer">{file.name}</a><span>{(file.size / 1024).toFixed(0)} KB · {date(file.createdAt)}</span></div><a className="download-file" href={"/api/files/" + file.id} aria-label={"ดาวน์โหลด " + file.name}><ArrowDownToLine size={17} /></a></div>)}{pendingFiles.map((file, index) => <div className="attachment-row staged" key={file.name + "-" + index}><div className="attachment-icon"><FileText size={18} /></div><div><strong>{file.name}</strong><span>รอแนบเมื่อบันทึก · {(file.size / 1024).toFixed(0)} KB</span></div><button aria-label={"นำ " + file.name + " ออก"} onClick={() => setPendingFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}><X size={17} /></button></div>)}</section>
          {formError && <div className="form-error" role="alert">{formError}</div>}
        </div>
        <div className="report-sheet-footer"><Button variant="outline" onClick={() => setSelectedId(null)} disabled={saving}>ยกเลิก</Button><Button onClick={() => void saveReport()} disabled={saving || overAllocated}>{saving ? <><LoaderCircle className="spin" size={17} /> กำลังบันทึก...</> : <><Check size={17} /> บันทึกข้อมูล</>}</Button></div>
      </SheetContent>
    </Sheet>
  </div>;
}
