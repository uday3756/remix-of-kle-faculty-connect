import { describe, it, expect, vi } from "vitest";
import { exportConsolidatedReport } from "../lib/consolidated-report";
import * as XLSX from "xlsx";

vi.mock("xlsx", () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    aoa_to_sheet: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe("exportConsolidatedReport", () => {
  it("should group records by staff_name and sum total_amount", () => {
    const records = [
      { staff_name: "John Doe", total_amount: 100, account_no: "123", pan: "ABC" },
      { staff_name: "John Doe", total_amount: 200, account_no: "123", pan: "ABC" },
      { staff_name: "Jane Smith", total_amount: 500, account_no: "456", pan: "DEF" },
    ];

    exportConsolidatedReport(records, "test.xlsx", "JAN 2026");

    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(expect.arrayContaining([
      expect.arrayContaining([1, "Jane Smith", 500, "456", "DEF"]),
      expect.arrayContaining([2, "John Doe", 300, "123", "ABC"]),
      expect.arrayContaining(["", "TOTAL", 800, "", ""]),
    ]));
  });
});
