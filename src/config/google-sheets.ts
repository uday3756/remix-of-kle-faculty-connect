/**
 * ============================================================
 *  GOOGLE SHEETS INTEGRATION — SETUP CHECKLIST
 * ============================================================
 *
 *  STEP A: Publish your Google Sheet as CSV
 *    1. Open your Google Sheet
 *    2. File → Share → Publish to web
 *    3. Select Sheet 1 ("Faculty") → CSV → Publish → Copy URL
 *    4. Paste below as FACULTY_SHEET_CSV_URL
 *    5. Repeat for Sheet 2 ("ExamLog") → CSV → Copy URL
 *    6. Paste below as EXAM_LOG_CSV_URL
 *
 *  STEP B: Deploy Apps Script Web App
 *    1. In your Google Sheet: Extensions → Apps Script
 *    2. Paste the doPost() function below
 *    3. Deploy → New Deployment → Web App
 *    4. Execute as: Me, Who has access: Anyone
 *    5. Copy the Web App URL → Paste below as APPS_SCRIPT_URL
 *
 *  STEP C: Paste both URLs into the constants below
 *
 * ============================================================
 *  APPS SCRIPT doPost() FUNCTION — Copy this into Apps Script:
 * ============================================================
 *
 *  function doPost(e) {
 *    var data = JSON.parse(e.postData.contents);
 *    var sheet = SpreadsheetApp.openById("YOUR_SHEET_ID").getSheetByName("ExamLog");
 *    data.rows.forEach(function(row) { sheet.appendRow(row); });
 *    return ContentService.createTextOutput("OK");
 *  }
 *
 * ============================================================
 */

// Replace with your published CSV URLs
export const FACULTY_SHEET_CSV_URL = "YOUR_GOOGLE_SHEET_PUBLISHED_CSV_URL_HERE";
export const EXAM_LOG_CSV_URL = "YOUR_EXAM_LOG_SHEET_PUBLISHED_CSV_URL_HERE";

// Replace with your Apps Script Web App URL
export const APPS_SCRIPT_URL = "YOUR_APPS_SCRIPT_WEBAPP_URL_HERE";
