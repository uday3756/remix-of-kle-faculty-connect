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
    // Row 4: column headers
    rows.push([
      "SL. No.",
      "Semester",
      "Date",
      "Course Code",
      "Subject",
      "Role",
      "Name",
      "Code",
      "Hours",
      "Rate",
      "Amount",
      "Account Number",
    ]);

    const courseGroups = new Map<string, TemplateRecord[]>();
    for (const r of deptRecords) {
      const groupKey = `${r.semester}|${r.exam_date}|${r.course_code}|${r.course_name}`;
      if (!courseGroups.has(groupKey)) courseGroups.set(groupKey, []);
      courseGroups.get(groupKey)!.push(r);
    }

    const merges: XLSX.Range[] = [
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 11 } },
    ];

    let total = 0;
    let currentRow = 4; // Data starts at row 5 (0-indexed 4)
    let slNo = 1;

    for (const [_, groupRecords] of courseGroups) {
      const groupSize = groupRecords.length;
      
      // Add merges for the group if it spans multiple rows
      if (groupSize > 1) {
        // Merge columns A to E (indices 0 to 4)
        for (let c = 0; c <= 4; c++) {
          merges.push({ s: { r: currentRow, c }, e: { r: currentRow + groupSize - 1, c } });
        }
      }

      groupRecords.forEach((r, i) => {
        rows.push([
          i === 0 ? slNo++ : "",
          i === 0 ? (r.semester ?? "") : "",
          i === 0 ? (r.exam_date ?? "") : "",
          i === 0 ? (r.course_code ?? "") : "",
          i === 0 ? (r.course_name ?? "") : "",
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
      currentRow += groupSize;
    }

    rows.push([]);
    rows.push(["", "", "", "", "", "", "", "", "", "TOTAL", total, ""]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [
      { wch: 7 },   // SL
      { wch: 10 },  // Semester
      { wch: 15 },  // Date
      { wch: 14 },  // Course Code
      { wch: 30 },  // Subject
      { wch: 22 },  // Role
      { wch: 26 },  // Name
      { wch: 10 },  // Code
      { wch: 10 },  // Hours
      { wch: 10 },  // Rate
      { wch: 16 },  // Amount
      { wch: 18 },  // Account Number
    ];
    ws["!merges"] = merges;

    // Sanitize sheet name
    const safeName = dept.replace(/[\\/?*[\]:]/g, "_").slice(0, 31) || "Sheet";
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  }

  XLSX.writeFile(wb, fileName);
}
