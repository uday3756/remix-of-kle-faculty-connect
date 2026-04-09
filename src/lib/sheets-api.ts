import { FACULTY_SHEET_CSV_URL, EXAM_LOG_CSV_URL, APPS_SCRIPT_URL } from "@/config/google-sheets";
import { parseCSV } from "@/lib/csv-parser";
import { FacultyMember, RoleType, ExamLogEntry } from "@/types/faculty";

function isPlaceholder(url: string) {
  return url.includes("YOUR_");
}

export async function fetchFacultyFromSheet(): Promise<FacultyMember[]> {
  if (isPlaceholder(FACULTY_SHEET_CSV_URL)) throw new Error("Sheet URL not configured");
  const res = await fetch(FACULTY_SHEET_CSV_URL);
  if (!res.ok) throw new Error("Failed to fetch faculty sheet");
  const text = await res.text();
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  // skip header row
  return rows.slice(1).map((cols, i) => ({
    slNo: parseInt(cols[0]) || i + 1,
    name: cols[1] || "",
    accountNo: cols[2] || "",
    pan: cols[3] || "",
    aadhaar: cols[4] || "",
    role: (cols[5] || "Faculty") as RoleType,
  })).filter(f => f.name);
}

export async function fetchExamLog(): Promise<ExamLogEntry[]> {
  if (isPlaceholder(EXAM_LOG_CSV_URL)) throw new Error("ExamLog URL not configured");
  const res = await fetch(EXAM_LOG_CSV_URL);
  if (!res.ok) throw new Error("Failed to fetch exam log");
  const text = await res.text();
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  return rows.slice(1).map(cols => ({
    timestamp: cols[0] || "",
    facultyName: cols[1] || "",
    role: (cols[2] || "Faculty") as RoleType,
    accountNo: cols[3] || "",
    pan: cols[4] || "",
    aadhaar: cols[5] || "",
    examDate: cols[6] || "",
    semesterType: (cols[7] || "Odd") as "Odd" | "Even",
    semesterNo: parseInt(cols[8]) || 1,
    courseCode: cols[9] || "",
    courseName: cols[10] || "",
    studentsPerBatch: parseInt(cols[11]) || 0,
    batches: parseInt(cols[12]) || 0,
    amount: parseFloat(cols[13]) || 0,
    grandTotal: parseFloat(cols[14]) || 0,
  })).filter(e => e.facultyName);
}

export async function writeExamLog(rows: string[][]): Promise<boolean> {
  if (isPlaceholder(APPS_SCRIPT_URL)) {
    console.warn("Apps Script URL not configured — skipping log write");
    return false;
  }
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ rows }),
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}
