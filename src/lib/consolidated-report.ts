import ExcelJS from "exceljs";

export interface ConsolidatedRecord {
  staff_name: string;
  total_amount: number;
  account_no: string | null;
  pan: string | null;
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

export async function exportConsolidatedReport(records: any[], fileName: string, sessionLabel = "JAN 2026") {
  const workbook = new ExcelJS.Workbook();
  const logoData = await getLogoBase64();
  const sheet = workbook.addWorksheet("Consolidated Report");

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
    if (!entry.account_no && r.account_no) entry.account_no = r.account_no;
    if (!entry.pan && r.pan) entry.pan = r.pan;
  }

  const consolidatedList = Array.from(grouped.values()).sort((a, b) => a.staff_name.localeCompare(b.staff_name));

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
  sheet.mergeCells("A2:E2");
  const h1 = sheet.getCell("A2");
  h1.value = HEADER_LINE_1;
  h1.alignment = { horizontal: "center" };
  h1.font = { name: "Arial", size: 10 };

  sheet.mergeCells("A3:E3");
  const h2 = sheet.getCell("A3");
  h2.value = HEADER_LINE_2_TPL.replace("{SESSION}", sessionLabel);
  h2.alignment = { horizontal: "center" };
  h2.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFC41E3A" } }; // Red

  // 3. Table Headers
  const headerRow = sheet.getRow(5);
  headerRow.values = ["Sl.No", "Name", "Amount", "A/C Number", "PAN NO"];
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC41E3A" } }; // Red
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true }; // White
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  });

  // 4. Data Rows
  let grandTotal = 0;
  consolidatedList.forEach((r, i) => {
    const row = sheet.getRow(6 + i);
    row.values = [i + 1, r.staff_name, r.total_amount, r.account_no, r.pan];
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    grandTotal += r.total_amount;
  });

  // 5. Footer Row
  const footerRow = sheet.getRow(6 + consolidatedList.length);
  footerRow.getCell(2).value = "TOTAL";
  footerRow.getCell(3).value = grandTotal;
  footerRow.getCell(3).font = { bold: true };
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
    { width: 8 },  // Sl.No
    { width: 35 }, // Name
    { width: 15 }, // Amount
    { width: 20 }, // A/C Number
    { width: 18 }, // PAN NO
  ];

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
