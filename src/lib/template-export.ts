import * as XLSX from "xlsx";

export interface TemplateRecord {
  sl_no: number | null;
  department: string;
  semester: string | null;
  exam_date: string | null;
  course_code: string | null;
  course_name: string | null;
  role: string;
  staff_name: string;
  total_students_or_batches: number | null;
  qp_remn_per_batch: number | null;
  remn_per_batch: number | null;
  total_amount: number;
  account_no: string | null;
}

const HEADER_TITLE = "B. V. Bhoomaraddi College of Engineering & Technology, Hubli - 580 031";
const SUBTITLE = "Department of {DEPT}";

export function exportTemplateExcel(records: TemplateRecord[], fileName: string, sessionLabel = "JAN 2026") {
  const wb = XLSX.utils.book_new();

  // Group records by department -> one sheet per dept
  const byDept = new Map<string, TemplateRecord[]>();
  for (const r of records) {
    const dept = r.department || "General";
    if (!byDept.has(dept)) byDept.set(dept, []);
    byDept.get(dept)!.push(r);
  }

  if (byDept.size === 0) {
    byDept.set("Sheet1", []);
  }

  for (const [dept, deptRecords] of byDept) {
    const rows: (string | number | null)[][] = [];

    // Header rows
    rows.push([HEADER_TITLE]);
    rows.push([SUBTITLE.replace("{DEPT}", dept)]);
    rows.push([`Lab Examination Remuneration - ${sessionLabel}`]);
    rows.push([]);

    // Column headers (matches uploaded template)
    rows.push([
      "SL. No.",
      "Sem.",
      "Exam Date",
      "Course Code",
      "Course",
      "",
      "Name of the Staff",
      "Total No of Batches/Students",
      "QP Remn. Per Batch",
      "Remn. Per Batch",
      "Total Amount in Rs.",
      "A/C NO.",
    ]);
    // Sub-row: role label sits in column F (index 5) in template
    // We'll place role inline per data row instead (col F)

    let total = 0;
    deptRecords.forEach((r, i) => {
      rows.push([
        r.sl_no ?? i + 1,
        r.semester ?? "",
        r.exam_date ?? "",
        r.course_code ?? "",
        r.course_name ?? "",
        r.role ?? "",
        r.staff_name ?? "",
        r.total_students_or_batches ?? "",
        r.qp_remn_per_batch ?? "",
        r.remn_per_batch ?? "",
        r.total_amount ?? 0,
        r.account_no ?? "",
      ]);
      total += Number(r.total_amount || 0);
    });

    rows.push([]);
    rows.push(["", "", "", "", "", "", "", "", "", "TOTAL", total, ""]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [
      { wch: 7 },   // SL
      { wch: 6 },   // Sem
      { wch: 22 },  // Exam Date
      { wch: 14 },  // Course Code
      { wch: 28 },  // Course
      { wch: 22 },  // Role
      { wch: 26 },  // Staff
      { wch: 14 },  // Total batches
      { wch: 12 },  // QP Remn
      { wch: 12 },  // Remn
      { wch: 14 },  // Amount
      { wch: 18 },  // A/C
    ];
    // Merge title rows across all 12 columns
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 11 } },
    ];

    // Sanitize sheet name (max 31 chars, no special chars)
    const safeName = dept.replace(/[\\/?*[\]:]/g, "_").slice(0, 31) || "Sheet";
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  }

  XLSX.writeFile(wb, fileName);
}
