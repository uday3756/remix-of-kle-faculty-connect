import * as XLSX from "xlsx";
import { SessionData, ExamLogEntry, ROLE_CONFIG } from "@/types/faculty";
import { format } from "date-fns";

export function exportSessionExcel(session: SessionData) {
  const wb = XLSX.utils.book_new();
  const rows: (string | number)[][] = [];

  rows.push(["KLE TECHNOLOGICAL UNIVERSITY"]);
  rows.push(["LAB EXAMINATION REMUNERATION"]);
  rows.push([]);
  rows.push(["Faculty Name:", session.faculty.name]);
  rows.push(["Role:", session.role]);
  rows.push(["Account No:", session.faculty.accountNo]);
  rows.push(["PAN:", session.faculty.pan]);
  rows.push(["Aadhaar:", session.faculty.aadhaar]);
  rows.push(["Exam Date:", format(session.examDate, "dd/MM/yyyy")]);
  rows.push(["Semester:", `${session.semesterType} - ${session.semesterNo}`]);
  rows.push([]);
  rows.push(["Course Code", "Course Name", "Students/Batch", "Batches", "Rate", "Fixed", "Amount (₹)"]);

  const cfg = ROLE_CONFIG[session.role];
  for (const sub of session.subjects) {
    rows.push([sub.courseCode, sub.courseName, sub.studentsPerBatch, sub.batches, cfg.ratePerStudent, cfg.fixedCharge, sub.amount]);
  }

  rows.push([]);
  rows.push(["", "", "", "", "", "GRAND TOTAL:", session.grandTotal]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 14 }, { wch: 35 }, { wch: 15 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, "Remuneration");
  XLSX.writeFile(wb, `${session.faculty.name}_${format(session.examDate, "yyyy-MM-dd")}.xlsx`);
}

export function exportHistoryExcel(entries: ExamLogEntry[], sheetName: string, fileName: string) {
  const wb = XLSX.utils.book_new();
  const rows: (string | number)[][] = [];

  rows.push([`KLE INSTITUTE — LAB EXAMINATION REMUNERATION REPORT`]);
  rows.push([]);
  rows.push(["Faculty Name", "Role", "A/C No", "PAN", "Aadhaar", "Date", "Semester", "Course Code", "Course Name", "Students/Batch", "Batches", "Amount (₹)"]);

  let total = 0;
  for (const e of entries) {
    rows.push([e.facultyName, e.role, e.accountNo, e.pan, e.aadhaar, e.examDate, `${e.semesterType}-${e.semesterNo}`, e.courseCode, e.courseName, e.studentsPerBatch, e.batches, e.amount]);
    total += e.amount;
  }

  rows.push([]);
  rows.push(["", "", "", "", "", "", "", "", "", "", "TOTAL:", total]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 30 }, { wch: 14 }, { wch: 10 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}
