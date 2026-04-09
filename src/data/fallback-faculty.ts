import { FacultyMember } from "@/types/faculty";

export const FALLBACK_FACULTY: FacultyMember[] = [
  { slNo: 1, name: "Dr. Rajesh Kumar", accountNo: "1234567890", pan: "ABCDE1234F", aadhaar: "1234-5678-9012", role: "Faculty" },
  { slNo: 2, name: "Prof. Sunita Devi", accountNo: "2345678901", pan: "BCDEF2345G", aadhaar: "2345-6789-0123", role: "Faculty" },
  { slNo: 3, name: "Dr. Anil Sharma", accountNo: "3456789012", pan: "CDEFG3456H", aadhaar: "3456-7890-1234", role: "Faculty" },
  { slNo: 4, name: "Mr. Venkatesh R.", accountNo: "4567890123", pan: "DEFGH4567I", aadhaar: "4567-8901-2345", role: "Instructor" },
  { slNo: 5, name: "Ms. Priya Patil", accountNo: "5678901234", pan: "EFGHI5678J", aadhaar: "5678-9012-3456", role: "Instructor" },
  { slNo: 6, name: "Mr. Ramesh B.", accountNo: "6789012345", pan: "FGHIJ6789K", aadhaar: "6789-0123-4567", role: "Technician" },
  { slNo: 7, name: "Mr. Suresh M.", accountNo: "7890123456", pan: "GHIJK7890L", aadhaar: "7890-1234-5678", role: "Technician" },
  { slNo: 8, name: "Mr. Ganesh K.", accountNo: "8901234567", pan: "HIJKL8901M", aadhaar: "8901-2345-6789", role: "Attender" },
  { slNo: 9, name: "Mr. Mahesh P.", accountNo: "9012345678", pan: "IJKLM9012N", aadhaar: "9012-3456-7890", role: "Attender" },
  { slNo: 10, name: "Dr. External Faculty A", accountNo: "0123456789", pan: "JKLMN0123O", aadhaar: "0123-4567-8901", role: "External" },
  { slNo: 11, name: "Dr. External Faculty B", accountNo: "1122334455", pan: "KLMNO1234P", aadhaar: "1122-3344-5566", role: "External" },
];

export const COURSES: Record<string, { code: string; name: string }[]> = {
  "1": [
    { code: "22PHL16", name: "Engineering Physics Lab" },
    { code: "22CHL17", name: "Engineering Chemistry Lab" },
    { code: "22ELL18", name: "Basic Electrical Engineering Lab" },
  ],
  "2": [
    { code: "22ELL26", name: "Elements of Electronics Engg Lab" },
    { code: "22CPL27", name: "Computer Programming Lab" },
    { code: "22MEL28", name: "Engineering Graphics Lab" },
  ],
  "3": [
    { code: "22CS31L", name: "Data Structures Lab" },
    { code: "22CS32L", name: "Analog & Digital Electronics Lab" },
    { code: "22CS33L", name: "Object Oriented Programming Lab" },
  ],
  "4": [
    { code: "22CS41L", name: "Design & Analysis of Algorithms Lab" },
    { code: "22CS42L", name: "Microcontroller Lab" },
    { code: "22CS43L", name: "Operating Systems Lab" },
  ],
  "5": [
    { code: "22CS51L", name: "Database Management System Lab" },
    { code: "22CS52L", name: "Computer Networks Lab" },
    { code: "22CS53L", name: "Software Engineering Lab" },
  ],
  "6": [
    { code: "22CS61L", name: "System Software & Compiler Design Lab" },
    { code: "22CS62L", name: "Web Technology Lab" },
    { code: "22CS63L", name: "Machine Learning Lab" },
  ],
  "7": [
    { code: "22CS71L", name: "Artificial Intelligence Lab" },
    { code: "22CS72L", name: "Cloud Computing Lab" },
  ],
  "8": [
    { code: "22CS81L", name: "Project Work" },
  ],
};
