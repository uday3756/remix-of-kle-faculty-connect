import ExcelJS from "exceljs";

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

async function getLogoBase64() {
  try {
    const response = await fetch("/kle_logo.png");
    const blob = await response.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Failed to fetch logo", e);
    return null;
  }
}

export async function exportTemplateExcel(records: TemplateRecord[], fileName: string, sessionLabel = "JAN 2026") {
  const workbook = new ExcelJS.Workbook();
  const logoData = await getLogoBase64();

  // Group records by department
  const byDept = new Map<string, TemplateRecord[]>();
  for (const r of records) {
    const dept = (r.department || "General").trim();
    if (!byDept.has(dept)) byDept.set(dept, []);
    byDept.get(dept)!.push(r);
  }

  if (byDept.size === 0) byDept.set("Sheet1", []);

  for (const [dept, deptRecords] of byDept) {
    const sheet = workbook.addWorksheet(dept.slice(0, 31));

    // 1. Add Logo
    if (logoData) {
      const imageId = workbook.addImage({
        base64: logoData,
        extension: "png",
      });
      sheet.addImage(imageId, {
        tl: { col: 0, row: 0 },
        ext: { width: 120, height: 60 },
      });
    }

    // 2. Add Header lines
    sheet.mergeCells("A2:L2");
    const h1 = sheet.getCell("A2");
    h1.value = HEADER_LINE_1;
    h1.alignment = { horizontal: "center" };
    h1.font = { name: "Arial", size: 10 };

    sheet.mergeCells("A3:L3");
    const h2 = sheet.getCell("A3");
    h2.value = HEADER_LINE_2_TPL.replace("{SESSION}", sessionLabel);
    h2.alignment = { horizontal: "center" };
    h2.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFC41E3A" } }; // Red

    // 3. Table Headers
    const headers = [
      "SL. No.", "Semester", "Date", "Course Code", "Subject", "Role", "Name", "Code", "Hours", "Rate", "Amount", "Account Number"
    ];
    const headerRow = sheet.getRow(5);
    headerRow.values = headers;
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC41E3A" } }; // Red background
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true }; // White text
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });

    // 4. Data Grouping and Merging
    const courseGroups = new Map<string, TemplateRecord[]>();
    for (const r of deptRecords) {
      const groupKey = `${r.semester}|${r.exam_date}|${r.course_code}|${r.course_name}`;
      if (!courseGroups.has(groupKey)) courseGroups.set(groupKey, []);
      courseGroups.get(groupKey)!.push(r);
    }

    let currentRow = 6;
    let slNo = 1;
    let totalAmount = 0;

    for (const [_, groupRecords] of courseGroups) {
      const groupSize = groupRecords.length;
      
      if (groupSize > 1) {
        // Merge columns A to E (0 to 4)
        for (let c = 1; c <= 5; c++) {
          sheet.mergeCells(currentRow, c, currentRow + groupSize - 1, c);
        }
      }

      groupRecords.forEach((r, i) => {
        const row = sheet.getRow(currentRow + i);
        row.values = [
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
        ];

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          // Columns A to E are 1 to 5
          const isLeftCol = colNumber <= 5;
          const isFirstInGroup = i === 0;
          const isLastInGroup = i === groupSize - 1;

          cell.border = {
            // Remove top border if in a merged group and not the first row
            top: (isLeftCol && !isFirstInGroup) ? undefined : { style: "thin" },
            // Remove bottom border if in a merged group and not the last row
            bottom: (isLeftCol && !isLastInGroup) ? undefined : { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          };
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
        totalAmount += Number(r.total_amount || 0);
      });
      currentRow += groupSize;
    }

    // 5. Total Row
    const footerRow = sheet.getRow(currentRow + 1);
    footerRow.getCell(10).value = "TOTAL";
    footerRow.getCell(11).value = totalAmount;
    footerRow.getCell(11).font = { bold: true };
    footerRow.eachCell((cell) => {
      if (cell.value) {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      }
    });

    // 6. Column widths
    sheet.columns = [
      { width: 8 },  // SL
      { width: 10 }, // Sem
      { width: 15 }, // Date
      { width: 14 }, // Code
      { width: 30 }, // Subject
      { width: 22 }, // Role
      { width: 26 }, // Name
      { width: 10 }, // Code
      { width: 10 }, // Hours
      { width: 10 }, // Rate
      { width: 16 }, // Amount
      { width: 20 }, // A/C
    ];
  }

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
