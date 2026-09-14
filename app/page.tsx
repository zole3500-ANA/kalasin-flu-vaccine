"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  CalendarCheck2,
  Check,
  ClipboardList,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FolderCheck,
  Hospital,
  Info,
  LoaderCircle,
  Paperclip,

  Phone,
  PhoneCall,
  Printer,
  Search,
  ShieldPlus,
  UploadCloud,
  UserCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { categories2569, categories2570, emptyCounts, hospitals, sumCounts, sumCounts2570 } from "@/lib/flu";
import type { Attachment, Counts, Report, Survey } from "@/lib/flu";

const formatter = new Intl.NumberFormat("th-TH");
const maxFileSize = 10 * 1024 * 1024;
const acceptedTypes = ".jpg,.jpeg,.png,.webp,.pdf,.xls,.xlsx,.csv";
const number = (value: number) => formatter.format(value);
const date = (value: string) =>
  new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

type SystemMode = "report_2569" | "survey_2570";

export default function Home() {
  const [mode, setMode] = useState<SystemMode>("report_2569");
  const [query, setQuery] = useState("");
  const [reports, setReports] = useState<Record<string, Report>>({});
  const [surveys, setSurveys] = useState<Record<string, Survey>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "done">("all");
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Selected hospital for modal sheet
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Read URL search params for deep linking
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get("mode");
      if (urlMode === "survey_2570" || urlMode === "report_2569") {
        setMode(urlMode);
      }
      if (params.get("print") === "1" || params.get("print") === "true") {
        setShowPrintModal(true);
      }
      const hosp = params.get("hospital");
      if (hosp) {
        setSelectedId(hosp);
      }
    }
  }, []);

  // Form states for 2569 Report
  const [allocated, setAllocated] = useState(0);
  const [reportCounts, setReportCounts] = useState<Counts>(emptyCounts);

  // Form states for 2570 Survey
  const [targetTotal, setTargetTotal] = useState(0);
  const [surveyCounts, setSurveyCounts] = useState<Counts>(emptyCounts);
  const [coordinatorName, setCoordinatorName] = useState("");
  const [coordinatorPhone, setCoordinatorPhone] = useState("");
  const [coordinatorPosition, setCoordinatorPosition] = useState("");
  const [notes, setNotes] = useState("");

  // Attachments state
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);

  // Action states
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // Load 2569 Reports
  const loadReports = useCallback(async () => {
    try {
      const response = await fetch("/api/reports?year=2569", { cache: "no-store" });
      if (response.status === 401) {
        setAuthRequired(true);
        setReports({});
        return;
      }
      if (!response.ok) throw new Error("ไม่สามารถโหลดข้อมูลรายงานปี 2569 ได้");
      const payload = (await response.json()) as { reports: Report[] };
      setAuthRequired(false);
      setReports(Object.fromEntries(payload.reports.map((report) => [report.hospitalId, report])));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดรายงาน");
    }
  }, []);

  // Load 2570 Surveys
  const loadSurveys = useCallback(async () => {
    try {
      const response = await fetch("/api/surveys?year=2570", { cache: "no-store" });
      if (response.status === 401) {
        setAuthRequired(true);
        setSurveys({});
        return;
      }
      if (!response.ok) throw new Error("ไม่สามารถโหลดข้อมูลแบบสำรวจปี 2570 ได้");
      const payload = (await response.json()) as { surveys: Survey[] };
      setAuthRequired(false);
      setSurveys(Object.fromEntries(payload.surveys.map((survey) => [survey.hospitalId, survey])));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดแบบสำรวจ");
    }
  }, []);

  // Combined refresh
  const refreshAllData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    await Promise.all([loadReports(), loadSurveys()]);
    setLoading(false);
  }, [loadReports, loadSurveys]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [repRes, surRes] = await Promise.all([
          fetch("/api/reports?year=2569", { cache: "no-store" }),
          fetch("/api/surveys?year=2570", { cache: "no-store" }),
        ]);

        if (repRes.status === 401 || surRes.status === 401) {
          if (!ignore) {
            setAuthRequired(true);
            setReports({});
            setSurveys({});
            setLoading(false);
          }
          return;
        }

        if (repRes.ok) {
          const repPayload = (await repRes.json()) as { reports: Report[] };
          if (!ignore) {
            setReports(Object.fromEntries(repPayload.reports.map((r) => [r.hospitalId, r])));
          }
        }
        if (surRes.ok) {
          const surPayload = (await surRes.json()) as { surveys: Survey[] };
          if (!ignore) {
            setSurveys(Object.fromEntries(surPayload.surveys.map((s) => [s.hospitalId, s])));
          }
        }
        if (!ignore) setAuthRequired(false);
      } catch (err) {
        if (!ignore) {
          setLoadError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void init();
    return () => {
      ignore = true;
    };
  }, []);

  const loadAttachments = useCallback(
    async (hospitalId: string, year: number) => {
      setAttachmentsLoading(true);
      try {
        const response = await fetch(`/api/files?hospitalId=${hospitalId}&year=${year}`, { cache: "no-store" });
        if (!response.ok) throw new Error();
        const payload = (await response.json()) as { files: Attachment[] };
        setAttachments(payload.files);
      } catch {
        setAttachments([]);
      } finally {
        setAttachmentsLoading(false);
      }
    },
    []
  );

  const selectedHospital = hospitals.find((h) => h.id === selectedId);

  // 2569 Calculations
  const vaccinated2569 = sumCounts(reportCounts);
  const overAllocated2569 = vaccinated2569 > allocated;
  const recordedCount2569 = Object.keys(reports).length;
  const allocatedTotal2569 = Object.values(reports).reduce((sum, r) => sum + r.allocated, 0);
  const vaccinatedTotal2569 = Object.values(reports).reduce((sum, r) => sum + r.vaccinated, 0);
  const remainingTotal2569 = Math.max(0, allocatedTotal2569 - vaccinatedTotal2569);
  const percent2569 = allocatedTotal2569 ? Math.round((vaccinatedTotal2569 / allocatedTotal2569) * 100) : 0;

  // 2570 Calculations
  const requestedSurveyDoses = sumCounts2570(surveyCounts);
  const submittedCount2570 = Object.keys(surveys).length;
  const requestedTotal2570 = Object.values(surveys).reduce((sum, s) => sum + s.requestedDoses, 0);
  const targetTotal2570 = Object.values(surveys).reduce((sum, s) => sum + s.targetTotal, 0);

  // Comparison metrics
  const diffDoses = requestedTotal2570 - vaccinatedTotal2569;
  const diffPercent = vaccinatedTotal2569 > 0 ? Math.round((diffDoses / vaccinatedTotal2569) * 100) : 0;

  // Filtered hospitals
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hospitals.filter((hospital) => {
      const matchText = (hospital.name + " " + hospital.district).toLowerCase().includes(q);
      if (!matchText) return false;

      if (statusFilter === "all") return true;
      const isDone = mode === "report_2569" ? !!reports[hospital.id] : !!surveys[hospital.id];
      if (statusFilter === "done") return isDone;
      if (statusFilter === "pending") return !isDone;
      return true;
    });
  }, [query, statusFilter, mode, reports, surveys]);

  // Model context tool registration
  useEffect(() => {
    type ModelContext = {
      registerTool: (
        tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: object;
          annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
          execute: (input: unknown) => object;
        },
        options: { signal: AbortSignal }
      ) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: "search_hospitals",
          title: "ค้นหาโรงพยาบาล",
          description: "ค้นหาโรงพยาบาลในจังหวัดกาฬสินธุ์สำหรับรายงานผลการฉีดปี 2569 และสำรวจความต้องการปี 2570",
          inputSchema: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const query = (input as { query?: unknown })?.query;
            if (typeof query !== "string" || query.length > 100) throw new Error("คำค้นหาไม่ถูกต้อง");
            const term = query.trim();
            setQuery(term);
            return {
              query: term,
              hospitals: hospitals
                .filter((hospital) => (hospital.name + " " + hospital.district).includes(term))
                .map((hospital) => ({ id: hospital.id, name: hospital.name })),
            };
          },
        },
        { signal: lifecycle.signal }
      )
    ).catch(() => {});
    return () => lifecycle.abort();
  }, []);

  function openForm(hospitalId: string) {
    setSelectedId(hospitalId);
    setPendingFiles([]);
    setAttachments([]);
    setFormError("");
    setNotice("");

    if (mode === "report_2569") {
      const report = reports[hospitalId];
      setAllocated(report?.allocated ?? 0);
      setReportCounts(report?.counts ? { ...emptyCounts(), ...report.counts } : emptyCounts());
      void loadAttachments(hospitalId, 2569);
    } else {
      const survey = surveys[hospitalId];
      setTargetTotal(survey?.targetTotal ?? 0);
      setSurveyCounts(survey?.counts ? { ...emptyCounts(), ...survey.counts, medicalOther: 0 } : emptyCounts());
      setCoordinatorName(survey?.coordinatorName ?? "");
      setCoordinatorPhone(survey?.coordinatorPhone ?? "");
      setCoordinatorPosition(survey?.coordinatorPosition ?? "");
      setNotes(survey?.notes ?? "");
    }
  }

  function updateReportCount(key: keyof Counts, value: string) {
    const parsed = value === "" ? 0 : Number(value);
    if (Number.isInteger(parsed) && parsed >= 0) {
      setReportCounts((prev) => ({ ...prev, [key]: parsed }));
    }
  }

  function updateSurveyCount(key: keyof Counts, value: string) {
    const parsed = value === "" ? 0 : Number(value);
    if (Number.isInteger(parsed) && parsed >= 0) {
      setSurveyCounts((prev) => ({ ...prev, [key]: parsed }));
    }
  }

  function chooseFiles(list: FileList | null) {
    if (!list) return;
    const chosen = Array.from(list);
    if (chosen.some((file) => !/\.(jpe?g|png|webp|pdf|xlsx?|csv)$/i.test(file.name) || file.size > maxFileSize)) {
      setFormError("รองรับ JPG, PNG, WebP, PDF, Excel หรือ CSV ขนาดไม่เกิน 10 MB ต่อไฟล์");
      return;
    }
    setFormError("");
    setPendingFiles((prev) => [...prev, ...chosen]);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function saveReport() {
    if (!selectedId) return;
    if (overAllocated2569) {
      setFormError("ยอดฉีดรวมมากกว่าจำนวนวัคซีนที่จัดสรร");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const response = await fetch(`/api/reports/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: 2569, allocated, counts: reportCounts }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "บันทึกข้อมูลไม่สำเร็จ");

      let driveUploadedCount = 0;
      for (const file of pendingFiles) {
        const data = new FormData();
        data.append("hospitalId", selectedId);
        data.append("year", "2569");
        data.append("file", file);
        const upload = await fetch("/api/files", { method: "POST", body: data });
        const outcome = (await upload.json()) as { error?: string; file?: { driveSaved?: boolean } };
        if (!upload.ok) {
          throw new Error(`บันทึกยอดแล้ว แต่แนบไฟล์ ${file.name} ไม่สำเร็จ: ${outcome.error || "กรุณาลองอีกครั้ง"}`);
        }
        if (outcome.file?.driveSaved) driveUploadedCount++;
      }

      await Promise.all([loadReports(), loadAttachments(selectedId, 2569)]);
      setPendingFiles([]);
      const driveMsg = driveUploadedCount > 0 ? ` (ซิงค์สำเนาไฟล์ลง Google Drive ${driveUploadedCount} ไฟล์เรียบร้อย)` : "";
      setNotice(`บันทึกผลการฉีดปี 2569 ${selectedHospital?.name ?? ""} เรียบร้อยแล้ว${driveMsg}`);
      setSelectedId(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "บันทึกข้อมูลไม่สำเร็จ");
      await loadReports();
    } finally {
      setSaving(false);
    }
  }

  async function saveSurvey() {
    if (!selectedId) return;
    setSaving(true);
    setFormError("");
    try {
      const response = await fetch(`/api/surveys/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: 2570,
          targetTotal,
          requestedDoses: requestedSurveyDoses,
          counts: { ...surveyCounts, medicalOther: 0 },
          coordinatorName,
          coordinatorPhone,
          coordinatorPosition,
          notes,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "บันทึกแบบสำรวจไม่สำเร็จ");

      await loadSurveys();
      setPendingFiles([]);
      setNotice(`บันทึกแบบสำรวจความต้องการปี 2570 ${selectedHospital?.name ?? ""} เรียบร้อยแล้ว`);
      setSelectedId(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "บันทึกแบบสำรวจไม่สำเร็จ");
      await loadSurveys();
    } finally {
      setSaving(false);
    }
  }

  function exportReportCsv() {
    const header = [
      "โรงพยาบาล",
      "อำเภอ",
      "ปี พ.ศ.",
      "วัคซีนจัดสรร (โดส)",
      "ฉีดแล้ว (ราย)",
      "ความครอบคลุม (%)",
      ...categories2569.map((item) => item.label),
      "จำนวนไฟล์แนบ",
      "แก้ไขล่าสุด",
    ];
    const rows = hospitals.map((hospital) => {
      const report = reports[hospital.id];
      const cov = report?.allocated ? Math.round((report.vaccinated / report.allocated) * 100) : 0;
      return [
        hospital.name,
        hospital.district,
        2569,
        report?.allocated ?? "",
        report?.vaccinated ?? "",
        report ? `${cov}%` : "",
        ...categories2569.map((item) => report?.counts[item.key] ?? ""),
        report?.attachmentCount ?? 0,
        report?.updatedAt ?? "",
      ];
    });
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => '"' + String(cell).replaceAll('"', '""') + '"').join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "kalasin-flu-staff-report-2569.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportSurveyCsv() {
    const header = [
      "โรงพยาบาล",
      "อำเภอ",
      "ปี พ.ศ.",
      "สถานะการส่งแบบสำรวจ",
      "บุคลากรเป้าหมายรวม (ราย)",
      "ยอดขอรับจัดสรรรวม (โดส)",
      ...categories2570.map((item) => item.label),
      "ผู้ประสานงาน",
      "ตำแหน่ง",
      "เบอร์โทรศัพท์",
      "หมายเหตุ",
      "ส่งล่าสุด",
    ];
    const rows = hospitals.map((hospital) => {
      const survey = surveys[hospital.id];
      return [
        hospital.name,
        hospital.district,
        2570,
        survey ? "ส่งแบบสำรวจแล้ว" : "ยังไม่ส่ง",
        survey?.targetTotal ?? "",
        survey?.requestedDoses ?? "",
        ...categories2570.map((item) => survey?.counts[item.key] ?? ""),
        survey?.coordinatorName ?? "",
        survey?.coordinatorPosition ?? "",
        survey?.coordinatorPhone ?? "",
        survey?.notes ?? "",
        survey?.updatedAt ?? "",
      ];
    });
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => '"' + String(cell).replaceAll('"', '""') + '"').join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "kalasin-flu-staff-demand-survey-2570.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`app-shell ${mode === "survey_2570" ? "theme-blue" : "theme-teal"}`}>
      {/* Sidebar */}
      <aside className="side-panel">
        <div className="brand">
          <div className="brand-mark">
            <ShieldPlus size={27} strokeWidth={2.1} />
          </div>
          <div>
            <strong>กาฬสินธุ์</strong>
            <span>ระบบข้อมูลวัคซีนบุคลากร</span>
          </div>
        </div>

        <div className="side-section-label">โมดูลระบบ</div>
        <button
          type="button"
          className={`side-link ${mode === "report_2569" ? "active" : ""}`}
          onClick={() => {
            setMode("report_2569");
            setSelectedId(null);
          }}
          style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
        >
          <Activity size={19} />
          <span>1. รายงานผลฉีด ปี 2569</span>
        </button>

        <button
          type="button"
          className={`side-link ${mode === "survey_2570" ? "active" : ""}`}
          onClick={() => {
            setMode("survey_2570");
            setSelectedId(null);
          }}
          style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
        >
          <ClipboardList size={19} />
          <span>2. สำรวจความต้องการ 2570</span>
        </button>

        {/* Guidance Announcement Card for Hospitals */}
        <div className="side-guide-card">
          <div className="side-guide-header">
            <Info size={16} />
            <span>คำชี้แจงสำหรับหน่วยบริการ</span>
          </div>

          <div className="side-guide-body">
            <div className="side-guide-step">
              <div className="side-guide-step-title">
                <span className="step-badge">1</span>
                <strong>รายงานผลการฉีด ปี 2569</strong>
              </div>
              <p>
                ขอให้ทุกหน่วยบริการรายงานผลฉีดจริงแยก 12 กลุ่มบุคลากร <strong>พร้อมแนบไฟล์รายชื่อผู้รับวัคซีน</strong> (PDF/Excel/รูปถ่าย) เพื่อใช้ประกอบการตัดยอดวัคซีน
              </p>
            </div>

            <div className="side-guide-step">
              <div className="side-guide-step-title">
                <span className="step-badge">2</span>
                <strong>สำรวจความต้องการ ปี 2570</strong>
              </div>
              <p>
                สำรวจยอดความต้องการขอรับจัดสรรล่วงหน้า กรอกจำนวนบุคลากรเป้าหมายและชื่อ-เบอร์โทรผู้ประสานงาน <strong>(ไม่ต้องแนบรายชื่อบุคลากร)</strong>
              </p>
            </div>
          </div>

          <div className="side-guide-foot">
            <div className="side-guide-contact-label">สอบถาม / แจ้งแก้ไขข้อมูล:</div>
            <div className="side-guide-contact-name">ชนะชัย มาตย์คำมี</div>
            <div style={{ color: "#8da9ad", fontSize: "11px", marginTop: "1px" }}>กลุ่มงานควบคุมโรคติดต่อ สสจ.กาฬสินธุ์</div>
            <a href="tel:0917474080" className="side-guide-tel">
              <Phone size={12} /> 091-747-4080
            </a>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div className="mobile-brand">
            <ShieldPlus size={24} />
            <span>วัคซีนบุคลากร กาฬสินธุ์</span>
          </div>
          <div className="breadcrumb">
            งานควบคุมโรค <span>/</span> วัคซีนไข้หวัดใหญ่ <span>/</span>{" "}
            <strong>{mode === "report_2569" ? "รายงานผลการฉีดปี 2569" : "สำรวจความต้องการปี 2570"}</strong>
          </div>
          <div className="topbar-right">
            <div className="gdrive-status-badge">
              <span className="gdrive-dot" />
              <span>Google Drive: เชื่อมต่อแล้ว (G:\My Drive)</span>
            </div>
            <span className="status-dot" style={{ marginLeft: "6px" }} /> กาฬสินธุ์ · 18 แห่ง
          </div>
        </header>

        {/* Content */}
        <main className="content" id="overview">
          {/* Header & Mode Switcher */}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> ระบบข้อมูลวัคซีนไข้หวัดใหญ่บุคลากร จังหวัดกาฬสินธุ์
              </div>
              <h1>{mode === "report_2569" ? "รายงานผลการฉีดวัคซีน ปี 2569" : "สำรวจความต้องการวัคซีน ปี 2570"}</h1>
              <p>
                {mode === "report_2569"
                  ? "ติดตามการจัดสรร การให้บริการ และเอกสารรายชื่อผู้ได้รับวัคซีนของโรงพยาบาลในจังหวัดกาฬสินธุ์"
                  : "สำรวจและรวบรวมยอดความต้องการขอรับจัดสรรวัคซีนล่วงหน้าสำหรับปีงบประมาณ 2570 ของหน่วยบริการ 18 แห่ง"}
              </p>
            </div>

            {/* Segmented Mode Switcher */}
            <div className="mode-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "report_2569"}
                className={`mode-tab-btn ${mode === "report_2569" ? "active" : ""}`}
                onClick={() => {
                  setMode("report_2569");
                  setSelectedId(null);
                }}
              >
                <Activity size={16} />
                <span>ผลการฉีด ปี 2569</span>
                <span className="mode-tab-badge">
                  {recordedCount2569}/{hospitals.length}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={mode === "survey_2570"}
                className={`mode-tab-btn ${mode === "survey_2570" ? "active" : ""}`}
                onClick={() => {
                  setMode("survey_2570");
                  setSelectedId(null);
                }}
              >
                <ClipboardList size={16} />
                <span>สำรวจความต้องการ ปี 2570</span>
                <span className="mode-tab-badge">
                  {submittedCount2570}/{hospitals.length}
                </span>
              </button>
            </div>
          </div>

          {/* Notices */}
          {notice && (
            <div className="notice success" role="status">
              <Check size={17} />
              {notice}
              <button aria-label="ปิดข้อความ" onClick={() => setNotice("")}>
                <X size={16} />
              </button>
            </div>
          )}

          {authRequired && (
            <div className="notice warning" role="alert">
              กรุณาเข้าสู่ระบบเพื่อดูและบันทึกข้อมูล{" "}
              <a href="/signin-with-chatgpt?return_to=%2F" target="_top">
                เข้าสู่ระบบ
              </a>
            </div>
          )}

          {loadError && (
            <div className="notice warning" role="alert">
              {loadError}
              <Button size="sm" variant="outline" onClick={() => void refreshAllData()}>
                ลองอีกครั้ง
              </Button>
            </div>
          )}


          {/* MODE 1: REPORT 2569 STATS */}
          {mode === "report_2569" && (
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-top">
                  <span>โรงพยาบาลที่รายงานแล้ว</span>
                  <span className="stat-icon blue">
                    <Hospital size={20} />
                  </span>
                </div>
                <div className="stat-value">
                  {loading ? "—" : number(recordedCount2569)} <small>/ 18 แห่ง</small>
                </div>
                <div className="stat-foot">จำนวนหน่วยงานที่ส่งผลการฉีดปี 2569</div>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>วัคซีนที่ได้รับจัดสรร</span>
                  <span className="stat-icon teal">
                    <ClipboardList size={20} />
                  </span>
                </div>
                <div className="stat-value">
                  {loading ? "—" : number(allocatedTotal2569)} <small>โดส</small>
                </div>
                <div className="stat-foot">ยอดจัดสรรรวมจากหน่วยงานที่ส่งรายงาน</div>
              </div>

              <div className="stat-card highlight">
                <div className="stat-top">
                  <span>บุคลากรได้รับวัคซีนแล้ว</span>
                  <span className="stat-icon white">
                    <ShieldPlus size={20} />
                  </span>
                </div>
                <div className="stat-value">
                  {loading ? "—" : number(vaccinatedTotal2569)} <small>ราย</small>
                </div>
                <div className="stat-foot">
                  ครอบคลุม {percent2569}% ของยอดจัดสรร (คงเหลือ {number(remainingTotal2569)} โดส)
                </div>
                <div className="stat-progress">
                  <span style={{ width: Math.min(percent2569, 100) + "%" }} />
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: SURVEY 2570 STATS */}
          {mode === "survey_2570" && (
            <>
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span>หน่วยงานที่ส่งแบบสำรวจ</span>
                    <span className="stat-icon blue">
                      <FileCheck2 size={20} />
                    </span>
                  </div>
                  <div className="stat-value">
                    {loading ? "—" : number(submittedCount2570)} <small>/ 18 แห่ง</small>
                  </div>
                  <div className="stat-foot">ความคืบหน้าการส่งแบบสำรวจปี 2570</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>บุคลากรเป้าหมายรวม</span>
                    <span className="stat-icon teal">
                      <UserCheck size={20} />
                    </span>
                  </div>
                  <div className="stat-value">
                    {loading ? "—" : number(targetTotal2570)} <small>ราย</small>
                  </div>
                  <div className="stat-foot">ยอดบุคลากรในหน่วยงานที่ส่งสำรวจ</div>
                </div>

                <div className="stat-card highlight">
                  <div className="stat-top">
                    <span>ยอดความต้องการวัคซีนรวม</span>
                    <span className="stat-icon white">
                      <CalendarCheck2 size={20} />
                    </span>
                  </div>
                  <div className="stat-value">
                    {loading ? "—" : number(requestedTotal2570)} <small>โดส</small>
                  </div>
                  <div className="stat-foot">
                    ขอรับจัดสรรปี 2570 (เทียบปี 2569 ฉีดจริง {number(vaccinatedTotal2569)} ราย)
                  </div>
                  <div className="stat-progress">
                    <span
                      style={{
                        width:
                          targetTotal2570 > 0
                            ? Math.min(Math.round((requestedTotal2570 / targetTotal2570) * 100), 100) + "%"
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Comparison Card: 2569 Actual vs 2570 Demand */}
              <div className="comparison-card">
                <div className="comparison-header">
                  <h3>
                    <BarChart3 size={18} color="#0c716f" />
                    เปรียบเทียบผลการฉีดปี 2569 กับ ยอดความต้องการปี 2570
                  </h3>
                  <span style={{ fontSize: "12px", color: "#6b8b8f" }}>ข้อมูลภาพรวมระดับจังหวัดกาฬสินธุ์</span>
                </div>
                <div className="comparison-grid">
                  <div className="comparison-item">
                    <div className="comparison-item-label">ยอดจัดสรรปี 2569</div>
                    <div className="comparison-item-value">{number(allocatedTotal2569)} โดส</div>
                    <div className="comparison-item-sub">วัคซีนที่ได้รับจัดสรร</div>
                  </div>
                  <div className="comparison-item">
                    <div className="comparison-item-label">ยอดฉีดจริงปี 2569</div>
                    <div className="comparison-item-value" style={{ color: "#0b8577" }}>
                      {number(vaccinatedTotal2569)} ราย
                    </div>
                    <div className="comparison-item-sub">ความครอบคลุม {percent2569}%</div>
                  </div>
                  <div className="comparison-item">
                    <div className="comparison-item-label">เสนอความต้องการปี 2570</div>
                    <div className="comparison-item-value" style={{ color: "#0277bd" }}>
                      {number(requestedTotal2570)} โดส
                    </div>
                    <div className="comparison-item-sub">จาก {submittedCount2570} หน่วยบริการ</div>
                  </div>
                  <div className="comparison-item">
                    <div className="comparison-item-label">แนวโน้มความต้องการ (เทียบยอดฉีด 69)</div>
                    <div
                      className="comparison-item-value"
                      style={{ color: diffDoses >= 0 ? "#137333" : "#c5221f", fontSize: "20px" }}
                    >
                      {diffDoses >= 0 ? `+${number(diffDoses)}` : number(diffDoses)} โดส
                    </div>
                    <div className="comparison-item-sub">
                      {diffPercent >= 0 ? `+${diffPercent}%` : `${diffPercent}%`} จากยอดฉีดจริงปี 2569
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TABLE SECTION */}
          <section className="table-section" id="hospitals">
            <div className="section-header">
              <div>
                <div className="section-kicker">
                  {mode === "report_2569" ? "รายงานรายหน่วยบริการ (ปีงบประมาณ 2569)" : "แบบสำรวจรายหน่วยบริการ (ปีงบประมาณ 2570)"}
                </div>
                <h2>
                  โรงพยาบาลในจังหวัดกาฬสินธุ์ <span>{hospitals.length} แห่ง</span>
                </h2>
              </div>
              <div className="table-actions">
                <div className="search-box">
                  <Search size={17} />
                  <Input
                    aria-label="ค้นหาโรงพยาบาล"
                    placeholder="ค้นหาโรงพยาบาลหรืออำเภอ"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowPrintModal(true)}
                  className="print-button"
                  title="พิมพ์รายงานสรุป A4 หรือบันทึกเป็น PDF"
                >
                  <Printer size={16} /> พิมพ์สรุปภาพรวม A4
                </Button>
                <Button
                  variant="outline"
                  onClick={mode === "report_2569" ? exportReportCsv : exportSurveyCsv}
                  className="export-button"
                >
                  <ArrowDownToLine size={16} /> {mode === "report_2569" ? "ส่งออก CSV ผลฉีด 69" : "ส่งออก CSV สำรวจ 70"}
                </Button>
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="status-filter-group" role="group" aria-label="คัดกรองตามสถานะ">
              <button
                type="button"
                className={`status-filter-btn ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                ทั้งหมด ({hospitals.length})
              </button>
              <button
                type="button"
                className={`status-filter-btn pending ${statusFilter === "pending" ? "active" : ""}`}
                onClick={() => setStatusFilter("pending")}
              >
                ⚠️ {mode === "report_2569" ? "รอรายงาน" : "ยังไม่ส่ง"} (
                {mode === "report_2569" ? hospitals.length - recordedCount2569 : hospitals.length - submittedCount2570})
              </button>
              <button
                type="button"
                className={`status-filter-btn done ${statusFilter === "done" ? "active" : ""}`}
                onClick={() => setStatusFilter("done")}
              >
                ✅ {mode === "report_2569" ? "รายงานแล้ว" : "ส่งแล้ว"} (
                {mode === "report_2569" ? recordedCount2569 : submittedCount2570})
              </button>
            </div>

            <div className="table-wrap desktop-table-view">
              {mode === "report_2569" ? (
                /* 2569 REPORT TABLE */
                <Table className="hospital-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="number-col">ลำดับ</TableHead>
                      <TableHead>หน่วยบริการ</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="numeric">จัดสรร (โดส)</TableHead>
                      <TableHead className="numeric">ฉีดแล้ว (ราย)</TableHead>
                      <TableHead className="numeric">ความครอบคลุม</TableHead>
                      <TableHead className="numeric">เอกสารแนบ</TableHead>
                      <TableHead className="action-col">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((hospital) => {
                      const report = reports[hospital.id];
                      const coverage = report?.allocated ? Math.round((report.vaccinated / report.allocated) * 100) : 0;
                      return (
                        <TableRow key={hospital.id}>
                          <TableCell className="number-col">
                            {String(hospitals.indexOf(hospital) + 1).padStart(2, "0")}
                          </TableCell>
                          <TableCell>
                            <div className="hospital-name">{hospital.name}</div>
                            <div className="hospital-district">อำเภอ{hospital.district}</div>
                          </TableCell>
                          <TableCell>
                            <span className={"status-pill " + (report ? "done" : "pending")}>
                              <span />
                              {report ? "รายงานแล้ว" : "รอรายงาน"}
                            </span>
                          </TableCell>
                          <TableCell className="numeric">{report ? number(report.allocated) : "—"}</TableCell>
                          <TableCell className="numeric emphasized">
                            {report ? number(report.vaccinated) : "—"}
                          </TableCell>
                          <TableCell className="numeric">{report ? `${coverage}%` : "—"}</TableCell>
                          <TableCell className="numeric">
                            {report?.attachmentCount ? (
                              <span className="file-count">
                                <Paperclip size={14} />
                                {report.attachmentCount}
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="action-col">
                            <Button variant="ghost" size="sm" onClick={() => openForm(hospital.id)}>
                              {report ? "แก้ไข" : "บันทึก"}
                              <ArrowUpRight size={15} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!filtered.length && (
                      <TableRow>
                        <TableCell colSpan={8} className="no-results">
                          ไม่พบโรงพยาบาลที่ตรงกับคำค้นหา
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              ) : (
                /* 2570 SURVEY TABLE */
                <Table className="hospital-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="number-col">ลำดับ</TableHead>
                      <TableHead>หน่วยบริการ</TableHead>
                      <TableHead>สถานะแบบสำรวจ</TableHead>
                      <TableHead className="numeric">เป้าหมายรวม (ราย)</TableHead>
                      <TableHead className="numeric">ขอรับจัดสรร (โดส)</TableHead>
                      <TableHead>ผู้ประสานงาน</TableHead>
                      <TableHead className="action-col">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((hospital) => {
                      const survey = surveys[hospital.id];
                      return (
                        <TableRow key={hospital.id}>
                          <TableCell className="number-col">
                            {String(hospitals.indexOf(hospital) + 1).padStart(2, "0")}
                          </TableCell>
                          <TableCell>
                            <div className="hospital-name">{hospital.name}</div>
                            <div className="hospital-district">อำเภอ{hospital.district}</div>
                          </TableCell>
                          <TableCell>
                            <span className={"status-pill " + (survey ? "submitted" : "pending")}>
                              <span />
                              {survey ? "ส่งแบบสำรวจแล้ว" : "ยังไม่ส่ง"}
                            </span>
                          </TableCell>
                          <TableCell className="numeric">{survey ? number(survey.targetTotal) : "—"}</TableCell>
                          <TableCell className="numeric emphasized">
                            {survey ? number(survey.requestedDoses) : "—"}
                          </TableCell>
                          <TableCell>
                            {survey?.coordinatorName ? (
                              <div className="coordinator-chip">
                                <span>{survey.coordinatorName}</span>
                                {survey.coordinatorPhone && <small>({survey.coordinatorPhone})</small>}
                              </div>
                            ) : (
                              <span style={{ color: "#a5b8ba" }}>—</span>
                            )}
                          </TableCell>
                          <TableCell className="action-col">
                            <Button variant="ghost" size="sm" onClick={() => openForm(hospital.id)}>
                              {survey ? "แก้ไข" : "กรอกสำรวจ"}
                              <ArrowUpRight size={15} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!filtered.length && (
                      <TableRow>
                        <TableCell colSpan={7} className="no-results">
                          ไม่พบโรงพยาบาลที่ตรงกับคำค้นหา
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* MOBILE HOSPITAL LIST: Touch-friendly cards for mobile view */}
            <div className="mobile-hospital-list">
              {filtered.map((hospital) => {
                const report = reports[hospital.id];
                const survey = surveys[hospital.id];
                const coverage = report?.allocated ? Math.round((report.vaccinated / report.allocated) * 100) : 0;
                const indexStr = String(hospitals.indexOf(hospital) + 1).padStart(2, "0");

                if (mode === "report_2569") {
                  return (
                    <div key={hospital.id} className="mobile-hospital-card">
                      <div className="mhc-header">
                        <div className="mhc-title-wrap">
                          <div className="mhc-index">{indexStr}</div>
                          <div>
                            <div className="mhc-name">{hospital.name}</div>
                            <div className="mhc-district">อำเภอ{hospital.district}</div>
                          </div>
                        </div>
                        <span className={"status-pill " + (report ? "done" : "pending")}>
                          <span />
                          {report ? "รายงานแล้ว" : "รอรายงาน"}
                        </span>
                      </div>

                      <div className="mhc-metrics">
                        <div className="mhc-metric-item">
                          <div className="mhc-metric-label">จัดสรร</div>
                          <div className="mhc-metric-val">{report ? number(report.allocated) : "—"}</div>
                        </div>
                        <div className="mhc-metric-item">
                          <div className="mhc-metric-label">ฉีดแล้ว</div>
                          <div className="mhc-metric-val emphasized">{report ? number(report.vaccinated) : "—"}</div>
                        </div>
                        <div className="mhc-metric-item">
                          <div className="mhc-metric-label">ครอบคลุม</div>
                          <div className="mhc-metric-val">{report ? `${coverage}%` : "—"}</div>
                        </div>
                        <div className="mhc-metric-item">
                          <div className="mhc-metric-label">เอกสาร</div>
                          <div className="mhc-metric-val">
                            {report?.attachmentCount ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                <Paperclip size={13} />
                                {report.attachmentCount}
                              </span>
                            ) : (
                              "—"
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant={report ? "outline" : "default"}
                        className="mhc-action-btn"
                        onClick={() => openForm(hospital.id)}
                      >
                        {report ? "ดูและแก้ไขผลฉีด" : "บันทึกผลการฉีด 2569"}
                        <ArrowUpRight size={16} />
                      </Button>
                    </div>
                  );
                }

                // Survey 2570 Mobile Card
                return (
                  <div key={hospital.id} className="mobile-hospital-card">
                    <div className="mhc-header">
                      <div className="mhc-title-wrap">
                        <div className="mhc-index">{indexStr}</div>
                        <div>
                          <div className="mhc-name">{hospital.name}</div>
                          <div className="mhc-district">อำเภอ{hospital.district}</div>
                        </div>
                      </div>
                      <span className={"status-pill " + (survey ? "submitted" : "pending")}>
                        <span />
                        {survey ? "ส่งสำรวจแล้ว" : "ยังไม่ส่ง"}
                      </span>
                    </div>

                    <div className="mhc-metrics">
                      <div className="mhc-metric-item">
                        <div className="mhc-metric-label">เป้าหมาย</div>
                        <div className="mhc-metric-val">{survey ? number(survey.targetTotal) : "—"}</div>
                      </div>
                      <div className="mhc-metric-item">
                        <div className="mhc-metric-label">ขอรับจัดสรร</div>
                        <div className="mhc-metric-val emphasized">{survey ? number(survey.requestedDoses) : "—"}</div>
                      </div>
                      <div className="mhc-metric-item">
                        <div className="mhc-metric-label">ผู้ประสานงาน</div>
                        <div className="mhc-metric-val" title={survey?.coordinatorName || "—"}>
                          {survey?.coordinatorName || "—"}
                        </div>
                      </div>
                      <div className="mhc-metric-item">
                        <div className="mhc-metric-label">เบอร์โทรติดต่อ</div>
                        <div className="mhc-metric-val" title={survey?.coordinatorPhone || "—"}>
                          {survey?.coordinatorPhone || "—"}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant={survey ? "outline" : "default"}
                      className="mhc-action-btn"
                      onClick={() => openForm(hospital.id)}
                    >
                      {survey ? "ดูและแก้ไขแบบสำรวจ" : "กรอกแบบสำรวจ 2570"}
                      <ArrowUpRight size={16} />
                    </Button>
                  </div>
                );
              })}
              {!filtered.length && (
                <div style={{ textAlign: "center", padding: "30px 16px", background: "white", borderRadius: "12px", color: "#779698" }}>
                  ไม่พบโรงพยาบาลที่ตรงกับคำค้นหา
                </div>
              )}
            </div>

            <div className="table-footer">
              แสดง {filtered.length} จาก 18 โรงพยาบาล
              <span>
                {mode === "report_2569"
                  ? "อัปเดตตามข้อมูลผลการฉีดที่บันทึกจริง ปี 2569"
                  : "อัปเดตตามแบบสำรวจความต้องการวัคซีน ปี 2570"}
              </span>
            </div>

            {/* Helpdesk Contact Banner */}
            <div className="helpdesk-contact-card">
              <div className="helpdesk-left">
                <div className="helpdesk-icon">
                  <PhoneCall size={22} />
                </div>
                <div>
                  <div className="helpdesk-title">ติดปัญหาการใช้งานหรือต้องการแก้ไขข้อมูล ติดต่อผู้ดูแลระบบ สสจ.กาฬสินธุ์</div>
                  <div className="helpdesk-details">
                    <strong>ชนะชัย มาตย์คำมี</strong> · กลุ่มงานควบคุมโรคติดต่อ สำนักงานสาธารณสุขจังหวัดกาฬสินธุ์
                  </div>
                </div>
              </div>
              <a href="tel:0917474080" className="helpdesk-call-btn">
                <Phone size={15} /> โทร. 091-747-4080
              </a>
            </div>
          </section>
        </main>
      </div>

      {/* SLIDE-OVER SHEET: Form for 2569 Report or 2570 Survey */}
      <Sheet
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open && !saving) setSelectedId(null);
        }}
      >
        <SheetContent className={`report-sheet ${mode === "survey_2570" ? "theme-blue" : "theme-teal"}`} side="right">
          <SheetHeader className="report-sheet-header">
            <div className="sheet-overline">
              {mode === "report_2569"
                ? "แบบบันทึกผลการฉีดวัคซีนไข้หวัดใหญ่ · ปีงบประมาณ 2569"
                : "แบบสำรวจความต้องการวัคซีนไข้หวัดใหญ่ · ปีงบประมาณ 2570"}
            </div>
            <SheetTitle>{selectedHospital?.name ?? "บันทึกข้อมูล"}</SheetTitle>
            <SheetDescription>
              {mode === "report_2569"
                ? "กรอกยอดจัดสรร จำนวนผู้ได้รับวัคซีนแยกตามกลุ่มบุคลากร และแนบเอกสารรายชื่อ/รูปภาพ"
                : "กรอกข้อมูลเป้าหมาย ยอดขอรับจัดสรร และข้อมูลผู้ประสานงาน (ไม่ต้องแนบรายชื่อบุคลากร)"}
            </SheetDescription>
          </SheetHeader>

          <div className="report-sheet-body">
            <div className="helpdesk-sheet-note">
              <Phone size={14} style={{ flexShrink: 0 }} />
              <span>
                ติดปัญหาการกรอกข้อมูล ติดต่อ: <strong>ชนะชัย มาตย์คำมี</strong> (สสจ.กาฬสินธุ์) โทร.{" "}
                <a href="tel:0917474080">091-747-4080</a>
              </span>
            </div>

            {/* FORM 1: 2569 REPORT */}
            {mode === "report_2569" && (
              <>
                <div className="form-summary">
                  <label htmlFor="allocated">
                    จำนวนวัคซีนที่ได้รับจัดสรร <span>โดส</span>
                  </label>
                  <Input
                    id="allocated"
                    type="number"
                    min="0"
                    step="1"
                    value={allocated}
                    onChange={(event) => setAllocated(Math.max(0, Number(event.target.value) || 0))}
                  />
                  <div className="computed-row">
                    <span>จำนวนผู้ได้รับวัคซีนรวม</span>
                    <strong>{number(vaccinated2569)} ราย</strong>
                  </div>
                  {overAllocated2569 && (
                    <p className="field-warning">ยอดฉีดรวมมากกว่าจำนวนวัคซีนที่จัดสรร</p>
                  )}
                </div>

                {["บุคลากรทางการแพทย์ในโรงพยาบาล", "กลุ่มงานเสี่ยงในสำนักงานสาธารณสุขอำเภอ"].map((group) => (
                  <section className="category-group" key={group}>
                    <div className="group-heading">
                      <span>{group}</span>
                      <small>
                        {number(
                          categories2569
                            .filter((item) => item.group === group)
                            .reduce((total, item) => total + reportCounts[item.key], 0)
                        )}{" "}
                        ราย
                      </small>
                    </div>
                    <div className="category-grid">
                      {categories2569
                        .filter((item) => item.group === group)
                        .map((item) => (
                          <label className="category-field" key={item.key}>
                            <span>{item.label}</span>
                            <div>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={reportCounts[item.key]}
                                onChange={(event) => updateReportCount(item.key, event.target.value)}
                              />
                              <em>ราย</em>
                            </div>
                          </label>
                        ))}
                    </div>
                  </section>
                ))}
              </>
            )}

            {/* FORM 2: 2570 SURVEY */}
            {mode === "survey_2570" && (
              <>
                {/* Coordinator Details */}
                <section style={{ marginBottom: "22px" }}>
                  <div className="group-heading">
                    <span>ข้อมูลผู้รับผิดชอบ / ผู้ประสานงาน</span>
                    <small>ปี 2570</small>
                  </div>
                  <div className="coordinator-grid">
                    <div className="form-field-group">
                      <label htmlFor="coord-name">ชื่อ-นามสกุล ผู้ประสานงาน</label>
                      <Input
                        id="coord-name"
                        placeholder="เช่น พว.สมใจ มุ่งมั่น"
                        value={coordinatorName}
                        onChange={(e) => setCoordinatorName(e.target.value)}
                      />
                    </div>
                    <div className="form-field-group">
                      <label htmlFor="coord-phone">เบอร์โทรศัพท์ติดต่อ</label>
                      <Input
                        id="coord-phone"
                        placeholder="เช่น 043-811xxx / 081-xxxxxxx"
                        value={coordinatorPhone}
                        onChange={(e) => setCoordinatorPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-field-group">
                    <label htmlFor="coord-pos">ตำแหน่ง / กลุ่มงาน</label>
                    <Input
                      id="coord-pos"
                      placeholder="เช่น หัวหน้ากลุ่มงานควบคุมโรคติดต่อ / พยาบาลวิชาชีพชำนาญการ"
                      value={coordinatorPosition}
                      onChange={(e) => setCoordinatorPosition(e.target.value)}
                    />
                  </div>
                </section>

                {/* Target & Requested Summary */}
                <div className="form-summary">
                  <label htmlFor="target-total">
                    จำนวนบุคลากรเป้าหมายทั้งหมดในหน่วยงาน <span>ราย</span>
                  </label>
                  <Input
                    id="target-total"
                    type="number"
                    min="0"
                    step="1"
                    value={targetTotal}
                    onChange={(event) => setTargetTotal(Math.max(0, Number(event.target.value) || 0))}
                  />
                  <div className="computed-row">
                    <span>ยอดขอรับการจัดสรรวัคซีนรวม (คำนวณจากรายการด้านล่าง)</span>
                    <strong>{number(requestedSurveyDoses)} โดส</strong>
                  </div>
                </div>

                {/* Categories breakdown */}
                {["บุคลากรทางการแพทย์ในโรงพยาบาล", "กลุ่มงานเสี่ยงในสำนักงานสาธารณสุขอำเภอ"].map((group) => (
                  <section className="category-group" key={group}>
                    <div className="group-heading">
                      <span>{group} (ขอรับการจัดสรร)</span>
                      <small>
                        {number(
                          categories2570
                            .filter((item) => item.group === group)
                            .reduce((total, item) => total + (surveyCounts[item.key] || 0), 0)
                        )}{" "}
                        โดส
                      </small>
                    </div>
                    <div className="category-grid">
                      {categories2570
                        .filter((item) => item.group === group)
                        .map((item) => (
                          <label className="category-field" key={item.key}>
                            <span>{item.label}</span>
                            <div>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={surveyCounts[item.key]}
                                onChange={(event) => updateSurveyCount(item.key, event.target.value)}
                              />
                              <em>โดส</em>
                            </div>
                          </label>
                        ))}
                    </div>
                  </section>
                ))}

                {/* Notes */}
                <section style={{ marginTop: "22px" }}>
                  <div className="form-field-group">
                    <label htmlFor="survey-notes">หมายเหตุ / วัตถุประสงค์ความต้องการพิเศษ</label>
                    <textarea
                      id="survey-notes"
                      placeholder="ระบุเหตุผลความจำเป็นเพิ่มเติม หรือข้อชี้แจงสำหรับขอรับการจัดสรรวัคซีนปี 2570"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </section>
              </>
            )}

            {/* ATTACHMENTS SECTION (WITH GOOGLE DRIVE SYNC) - ONLY FOR 2569 REPORT */}
            {mode === "report_2569" && (
              <section className="file-section">
                <div className="group-heading">
                  <span>เอกสารรายชื่อ / รูปภาพหลักฐานการฉีดวัคซีน</span>
                  <small>{attachments.length + pendingFiles.length} ไฟล์</small>
                </div>

                {/* Google Drive automatic sync notice */}
                <div className="gdrive-notice-box">
                  <FolderCheck size={18} color="#1b5e20" style={{ flexShrink: 0, marginTop: "1px" }} />
                  <div>
                    <strong>บันทึกสำเนาลง Google Drive อัตโนมัติ</strong>
                    <div style={{ color: "#326e64", marginTop: "1px", fontSize: "12px" }}>
                      ไฟล์ที่อัปโหลดจะถูกจัดเก็บลงในโฟลเดอร์ Google Drive ของโรงพยาบาลโดยอัตโนมัติ
                    </div>
                  </div>
                </div>

                <input
                  ref={fileInput}
                  type="file"
                  accept={acceptedTypes}
                  multiple
                  hidden
                  onChange={(event) => chooseFiles(event.target.files)}
                />
                <button className="upload-zone" type="button" onClick={() => fileInput.current?.click()} style={{ marginTop: "14px" }}>
                  <UploadCloud size={24} />
                  <strong>เลือกรูปภาพหรือไฟล์เพื่อแนบ</strong>
                  <span>JPG, PNG, WebP, PDF, Excel หรือ CSV · ไม่เกิน 10 MB/ไฟล์</span>
                </button>

                {attachmentsLoading && (
                  <div className="file-loading">
                    <LoaderCircle className="spin" size={17} /> กำลังโหลดเอกสาร...
                  </div>
                )}

                {attachments.map((file) => (
                  <div className="attachment-row" key={file.id}>
                    <div className="attachment-icon">
                      {/\.xlsx?$|\.csv$/i.test(file.name) ? <FileSpreadsheet size={18} /> : <FileText size={18} />}
                    </div>
                    <div>
                      <a href={`/api/files/${file.id}`} target="_blank" rel="noopener noreferrer">
                        {file.name}
                      </a>
                      <span>
                        {(file.size / 1024).toFixed(0)} KB · {date(file.createdAt)}
                      </span>
                      <span className="gdrive-file-chip">
                        <FolderCheck size={12} /> Google Drive ซิงค์เรียบร้อย
                      </span>
                    </div>
                    <a className="download-file" href={`/api/files/${file.id}`} aria-label={`ดาวน์โหลด ${file.name}`}>
                      <ArrowDownToLine size={17} />
                    </a>
                  </div>
                ))}

                {pendingFiles.map((file, index) => (
                  <div className="attachment-row staged" key={`${file.name}-${index}`}>
                    <div className="attachment-icon">
                      <FileText size={18} />
                    </div>
                    <div>
                      <strong>{file.name}</strong>
                      <span>รอแนบและซิงค์ลง Google Drive เมื่อบันทึก · {(file.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <button
                      aria-label={`นำ ${file.name} ออก`}
                      onClick={() => setPendingFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                    >
                      <X size={17} />
                    </button>
                  </div>
                ))}
              </section>
            )}

            {formError && (
              <div className="form-error" role="alert">
                {formError}
              </div>
            )}
          </div>

          <div className="report-sheet-footer">
            <Button variant="outline" onClick={() => setSelectedId(null)} disabled={saving}>
              ยกเลิก
            </Button>
            {mode === "report_2569" ? (
              <Button onClick={() => void saveReport()} disabled={saving || overAllocated2569}>
                {saving ? (
                  <>
                    <LoaderCircle className="spin" size={17} /> กำลังบันทึกและซิงค์...
                  </>
                ) : (
                  <>
                    <Check size={17} /> บันทึกผลการฉีด 2569
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => void saveSurvey()}
                disabled={saving}
                style={{ background: "#0284c7", color: "white" }}
              >
                {saving ? (
                  <>
                    <LoaderCircle className="spin" size={17} /> กำลังบันทึกแบบสำรวจ...
                  </>
                ) : (
                  <>
                    <Check size={17} /> บันทึกแบบสำรวจ 2570
                  </>
                )}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* PRINT PREVIEW MODAL / A4 REPORT */}
      <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
        <DialogContent className="print-dialog-content">
          <DialogHeader className="no-print">
            <DialogTitle>
              <Printer size={18} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
              พิมพ์รายงานสรุปผลภาพรวมจังหวัด (ขนาดกระดาษ A4)
            </DialogTitle>
            <DialogDescription>
              ระบบจัดรูปแบบรายงานทางการสำหรับพิมพ์หรือบันทึกเป็น PDF เพื่อนำเสนอผู้บริหาร
            </DialogDescription>
          </DialogHeader>

          {/* PRINTABLE REPORT DOCUMENT */}
          <div id="printable-report" className="print-preview-container">
            <div className="print-header">
              <h2>สำนักงานสาธารณสุขจังหวัดกาฬสินธุ์</h2>
              <h2>
                {mode === "report_2569"
                  ? "แบบรายงานสรุปผลการบริหารจัดการวัคซีนไข้หวัดใหญ่สำหรับบุคลากรทางการแพทย์และสาธารณสุข"
                  : "แบบสำรวจความต้องการรับการจัดสรรวัคซีนไข้หวัดใหญ่สำหรับบุคลากรทางการแพทย์และสาธารณสุข"}
              </h2>
              <p>
                <strong>ประจำปีงบประมาณ พ.ศ. {mode === "report_2569" ? "2569" : "2570"}</strong>
              </p>
              <p style={{ fontSize: "12px", color: "#64748b" }}>
                ข้อมูล ณ วันที่{" "}
                {new Intl.DateTimeFormat("th-TH", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date())}
              </p>
            </div>

            <div className="print-meta-grid">
              {mode === "report_2569" ? (
                <>
                  <div className="print-meta-item">
                    รายงานแล้ว: <strong>{recordedCount2569} / 18 แห่ง</strong>
                  </div>
                  <div className="print-meta-item">
                    ยอดจัดสรรรวม: <strong>{number(allocatedTotal2569)} โดส</strong>
                  </div>
                  <div className="print-meta-item">
                    ฉีดจริงรวม: <strong>{number(vaccinatedTotal2569)} ราย ({percent2569}%)</strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="print-meta-item">
                    ส่งแบบสำรวจแล้ว: <strong>{submittedCount2570} / 18 แห่ง</strong>
                  </div>
                  <div className="print-meta-item">
                    เป้าหมายบุคลากรรวม: <strong>{number(targetTotal2570)} ราย</strong>
                  </div>
                  <div className="print-meta-item">
                    ยอดขอรับจัดสรรรวม: <strong>{number(requestedTotal2570)} โดส</strong>
                  </div>
                </>
              )}
            </div>

            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: "40px", textAlign: "center" }}>ลำดับ</th>
                  <th>หน่วยบริการ</th>
                  <th>อำเภอ</th>
                  <th style={{ textAlign: "center" }}>สถานะ</th>
                  {mode === "report_2569" ? (
                    <>
                      <th className="numeric">จัดสรร (โดส)</th>
                      <th className="numeric">ฉีดแล้ว (ราย)</th>
                      <th className="numeric">ครอบคลุม</th>
                      <th className="numeric">คงเหลือ (โดส)</th>
                    </>
                  ) : (
                    <>
                      <th className="numeric">เป้าหมาย (ราย)</th>
                      <th className="numeric">ขอรับจัดสรร (โดส)</th>
                      <th>ผู้ประสานงาน</th>
                      <th>เบอร์โทรศัพท์</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {hospitals.map((hospital, idx) => {
                  const report = reports[hospital.id];
                  const survey = surveys[hospital.id];
                  const cov = report?.allocated ? Math.round((report.vaccinated / report.allocated) * 100) : 0;
                  const rem = report ? Math.max(0, report.allocated - report.vaccinated) : 0;

                  return (
                    <tr key={hospital.id}>
                      <td style={{ textAlign: "center" }}>{idx + 1}</td>
                      <td>
                        <strong>{hospital.name}</strong>
                      </td>
                      <td>{hospital.district}</td>
                      <td style={{ textAlign: "center" }}>
                        {mode === "report_2569"
                          ? report
                            ? "รายงานแล้ว"
                            : "รอรายงาน"
                          : survey
                          ? "ส่งสำรวจแล้ว"
                          : "ยังไม่ส่ง"}
                      </td>
                      {mode === "report_2569" ? (
                        <>
                          <td className="numeric">{report ? number(report.allocated) : "—"}</td>
                          <td className="numeric">{report ? number(report.vaccinated) : "—"}</td>
                          <td className="numeric">{report ? `${cov}%` : "—"}</td>
                          <td className="numeric">{report ? number(rem) : "—"}</td>
                        </>
                      ) : (
                        <>
                          <td className="numeric">{survey ? number(survey.targetTotal) : "—"}</td>
                          <td className="numeric">{survey ? number(survey.requestedDoses) : "—"}</td>
                          <td>{survey?.coordinatorName || "—"}</td>
                          <td>{survey?.coordinatorPhone || "—"}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
                <tr className="total-row">
                  <td colSpan={3} style={{ textAlign: "center" }}>
                    รวมทั้งสิ้น (18 อำเภอ)
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {mode === "report_2569"
                      ? `${recordedCount2569}/18 แห่ง`
                      : `${submittedCount2570}/18 แห่ง`}
                  </td>
                  {mode === "report_2569" ? (
                    <>
                      <td className="numeric">{number(allocatedTotal2569)}</td>
                      <td className="numeric">{number(vaccinatedTotal2569)}</td>
                      <td className="numeric">{percent2569}%</td>
                      <td className="numeric">{number(remainingTotal2569)}</td>
                    </>
                  ) : (
                    <>
                      <td className="numeric">{number(targetTotal2570)}</td>
                      <td className="numeric">{number(requestedTotal2570)}</td>
                      <td colSpan={2} style={{ textAlign: "center", color: "#64748b" }}>
                        เสนอขอรับจัดสรรล่วงหน้าปี 2570
                      </td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>

            {/* SIGNATURE SECTION */}
            <div className="print-signatures">
              <div className="print-sig-box">
                <div>ลงชื่อ ....................................................</div>
                <div className="print-sig-line">
                  <strong>(นายชนะชัย มาตย์คำมี)</strong>
                  <br />
                  ผู้จัดทำรายงาน / ผู้ดูแลระบบข้อมูล
                  <br />
                  กลุ่มงานควบคุมโรคติดต่อ สสจ.กาฬสินธุ์
                </div>
              </div>

              <div className="print-sig-box">
                <div>ลงชื่อ ....................................................</div>
                <div className="print-sig-line">
                  (.......................................................)
                  <br />
                  หัวหน้ากลุ่มงานควบคุมโรคติดต่อ
                  <br />
                  สำนักงานสาธารณสุขจังหวัดกาฬสินธุ์
                </div>
              </div>

              <div className="print-sig-box">
                <div>ลงชื่อ ....................................................</div>
                <div className="print-sig-line">
                  (.......................................................)
                  <br />
                  นายแพทย์สาธารณสุขจังหวัดกาฬสินธุ์
                  <br />
                  ผู้อนุมัติรายงาน
                </div>
              </div>
            </div>
          </div>

          <div
            className="no-print"
            style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}
          >
            <Button variant="outline" onClick={() => setShowPrintModal(false)}>
              ปิด
            </Button>
            <Button
              onClick={() => {
                if (typeof window !== "undefined") window.print();
              }}
              style={{ background: "#086b65", color: "white" }}
            >
              <Printer size={16} /> สั่งพิมพ์เอกสาร / บันทึกเป็น PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Sticky Bottom Bar for quick navigation between 2569 & 2570 */}
      <nav className="mobile-bottom-nav" aria-label="นำทางด่วนบนมือถือ">
        <button
          type="button"
          className={`mobile-nav-item ${mode === "report_2569" ? "active" : ""}`}
          onClick={() => {
            setMode("report_2569");
            setSelectedId(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <Activity size={20} />
          <span>ผลฉีด 2569 ({recordedCount2569}/18)</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${mode === "survey_2570" ? "active" : ""}`}
          onClick={() => {
            setMode("survey_2570");
            setSelectedId(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <ClipboardList size={20} />
          <span>สำรวจ 2570 ({submittedCount2570}/18)</span>
        </button>
      </nav>
    </div>
  );
}
