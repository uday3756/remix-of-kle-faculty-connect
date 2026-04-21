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

const HEADER_LINE_1 = "B. V. Bhoomaraddi College Campus, Vidyanagar, Hubballi - 580031. Karnataka (India)";
const HEADER_LINE_2_TPL = "Remuneration paid towards Practical End Semester Assessement Examinations {SESSION} (BE REGULAR) (Consolidated Report)";

export function exportTemplateExcel(records: TemplateRecord[], fileName: string, sessionLabel = "JAN 2026") {
  const wb = XLSX.utils.book_new();

  // Group records by department -> one sheet per dept
  const byDept = new Map<string, TemplateRecord[]>();
  for (const r of records) {
    const dept = (r.department || "General").trim();
    if (!byDept.has(dept)) byDept.set(dept, []);
    byDept.get(dept)!.push(r);
  }

  if (byDept.size === 0) {
    byDept.set("Sheet1", []);
  }

  for (const [dept, deptRecords] of byDept) {
    const rows: (string | number | null)[][] = [];

    // Row 1: blank (logo area in original template)
    rows.push([]);
    // Row 2: campus address line (merged across 12 cols)
    rows.push([HEADER_LINE_1]);
    // Row 3: title with session (merged across 12 cols)
    rows.push([HEADER_LINE_2_TPL.replace("{SESSION}", sessionLabel)]);
    // Row 4: column headers — column F (index 5) is the role label column
    rows.push([
      "SL. No.",
      "Sem.",
      "Exam Date",
      "Course Code",
      "Course",
      "",
      "Name of the Staff",
      "Total No of Batches OR Students",
      "QP Remn. Per Batch",
      "Remn. Per Batch",
      "Total Amount in Rs./-",
      "A/C NO.",
    ]);

    let total = 0;
    deptRecords.forEach((r, i) => {
      rows.push([
        r.sl_no ?? i + 1,
        r.semester ?? "",
        r.exam_date ?? "",
        r.course_code ?? "",
        r.course_name ?? "",
        r.role ?? "",            // role label sits in column F (matches template)
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
      { wch: 24 },  // Exam Date
      { wch: 14 },  // Course Code
      { wch: 30 },  // Course
      { wch: 22 },  // Role (col F)
      { wch: 26 },  // Staff
      { wch: 18 },  // Total batches
      { wch: 14 },  // QP Remn
      { wch: 14 },  // Remn
      { wch: 16 },  // Amount
      { wch: 18 },  // A/C
    ];
    // Merge title rows (row index 1 and 2) across all 12 cols
    ws["!merges"] = [
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 11 } },
    ];

    // Sanitize sheet name (max 31 chars, no special chars)
    const safeName = dept.replace(/[\\/?*[\]:]/g, "_").slice(0, 31) || "Sheet";
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  }

  XLSX.writeFile(wb, fileName);
}
