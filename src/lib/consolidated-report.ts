import * as XLSX from "xlsx";

export interface ConsolidatedRecord {
  staff_name: string;
  total_amount: number;
  account_no: string | null;
  pan: string | null;
}

const HEADER_LINE_1 = "B. V. Bhoomaraddi College Campus, Vidyanagar, Hubballi - 580031. Karnataka (India)";
const HEADER_LINE_2_TPL = "Remuneration paid towards Practical End Semester Assessement Examinations {SESSION} (BE REGULAR) (Consolidated Report)";

export function exportConsolidatedReport(records: any[], fileName: string, sessionLabel = "JAN 2026") {
  const wb = XLSX.utils.book_new();

  // Group records by staff_name
  const grouped = new Map<string, ConsolidatedRecord>();
  for (const r of records) {
    const name = (r.staff_name || "").trim();
    if (!name) continue;
    if (!grouped.has(name)) {
      grouped.set(name, {
        staff_name: name,
        total_amount: 0,
        account_no: r.account_no || "",
        pan: r.pan || "",
      });
    }
    const entry = grouped.get(name)!;
    entry.total_amount += Number(r.total_amount || 0);
    // Prefer non-empty account/pan if multiple records exist
    if (!entry.account_no && r.account_no) entry.account_no = r.account_no;
    if (!entry.pan && r.pan) entry.pan = r.pan;
  }

  const consolidatedList = Array.from(grouped.values()).sort((a, b) => a.staff_name.localeCompare(b.staff_name));

  const rows: (string | number | null)[][] = [];

  // Row 1: Logo area (blank for now)
  rows.push([]);
  // Row 2: Campus address
  rows.push([HEADER_LINE_1]);
  // Row 3: Title
  rows.push([HEADER_LINE_2_TPL.replace("{SESSION}", sessionLabel)]);
  // Row 4: Column Headers
  rows.push([
    "Sl.No",
    "Name",
    "Amount",
    "A/C Number",
    "PAN NO"
  ]);

  let grandTotal = 0;
  consolidatedList.forEach((r, i) => {
    rows.push([
      i + 1,
      r.staff_name,
      r.total_amount,
      r.account_no,
      r.pan
    ]);
    grandTotal += r.total_amount;
  });

  // Footer Row: TOTAL
  rows.push(["", "TOTAL", grandTotal, "", ""]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 8 },   // Sl.No
    { wch: 35 },  // Name
    { wch: 15 },  // Amount
    { wch: 20 },  // A/C Number
    { wch: 18 },  // PAN NO
  ];

  // Merges for headers
  ws["!merges"] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Header Line 1
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }, // Header Line 2
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Consolidated Report");
  XLSX.writeFile(wb, fileName);
}
