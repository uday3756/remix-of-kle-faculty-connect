export type RoleType = "Faculty" | "Instructor" | "Technician" | "Attender" | "External";

export interface FacultyMember {
  slNo: number;
  name: string;
  accountNo: string;
  pan: string;
  aadhaar: string;
  role: RoleType;
}

export interface SubjectEntry {
  id: string;
  courseCode: string;
  courseName: string;
  studentsPerBatch: number;
  batches: number;
  amount: number;
}

export interface ExamLogEntry {
  timestamp: string;
  facultyName: string;
  role: RoleType;
  accountNo: string;
  pan: string;
  aadhaar: string;
  examDate: string;
  semesterType: "Odd" | "Even";
  semesterNo: number;
  courseCode: string;
  courseName: string;
  studentsPerBatch: number;
  batches: number;
  amount: number;
  grandTotal: number;
}

export interface SessionData {
  faculty: FacultyMember;
  role: RoleType;
  examDate: Date;
  semesterType: "Odd" | "Even";
  semesterNo: number;
  subjects: SubjectEntry[];
  grandTotal: number;
}

export const ROLE_CONFIG: Record<RoleType, { icon: string; ratePerStudent: number; fixedCharge: number; label: string }> = {
  Faculty:    { icon: "👩‍🏫", ratePerStudent: 20, fixedCharge: 75,  label: "Faculty" },
  Instructor: { icon: "👨‍💼", ratePerStudent: 15, fixedCharge: 50,  label: "Instructor" },
  Technician: { icon: "🔧", ratePerStudent: 10, fixedCharge: 50,  label: "Technician" },
  Attender:   { icon: "👤", ratePerStudent: 10, fixedCharge: 40,  label: "Attender" },
  External:   { icon: "🎓", ratePerStudent: 25, fixedCharge: 100, label: "External" },
};

export function calculateAmount(role: RoleType, students: number, batches: number): number {
  const config = ROLE_CONFIG[role];
  return (students * batches * config.ratePerStudent) + config.fixedCharge;
}

export function getFormulaDisplay(role: RoleType, students: number, batches: number): string {
  const config = ROLE_CONFIG[role];
  const amount = calculateAmount(role, students, batches);
  return `${students} × ${batches} × ${config.ratePerStudent} + ${config.fixedCharge} = ₹${amount.toLocaleString("en-IN")}`;
}
