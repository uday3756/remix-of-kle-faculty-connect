

# KLE Faculty Workload Management System

## Overview
Build a complete Faculty Workload Management System as a React app for KLE Technological University, with Google Sheets integration, 5 roles, exam history, and Excel export.

## Pages & Components

### 1. Login Page
- Username/password login (kleadmin / password123)
- KLE logo prominently displayed
- Clean, branded design with KLE red (#8B1A1A) color scheme

### 2. Main Dashboard (post-login) — Sidebar + Content Layout
**Sidebar** with 6 steps:
1. Select Role & Faculty
2. Exam Date
3. Semester Selection
4. Subject Details
5. Summary & Download
6. Exam History (non-linear, accessible anytime)

Step indicators showing done/active/pending states.

### 3. Step 1: Role & Faculty Selection
- 5 role cards in responsive grid: Faculty 👩‍🏫, Instructor 👨‍💼, Technician 🔧, Attender 👤, External 🎓
- On role select → faculty dropdown filtered from Google Sheet data
- "Refresh faculty list" button with loading spinner
- "Last synced" timestamp display
- Offline mode warning banner if fetch fails (falls back to hardcoded data)
- Auto-fills Account No, PAN, Aadhaar from sheet data

### 4. Step 2: Exam Date
- Date picker for exam date

### 5. Step 3: Semester Selection
- Odd/Even semester toggle
- Semester number buttons (1–8)

### 6. Step 4: Subject Details
- Add/remove multiple subject blocks
- Each block: Course Code dropdown, Course Name (auto-filled), Students per Batch, Number of Batches
- Live amount calculation per subject showing the formula used (e.g., "20 × 30 × 2 + 75 = ₹1,275")
- Role-specific payment rates:
  - Faculty: Students × Batches × 20 + 75
  - Instructor: Students × Batches × 15 + 50
  - Technician: Students × Batches × 10 + 50
  - Attender: Students × Batches × 10 + 40
  - External: Students × Batches × 25 + 100

### 7. Step 5: Summary & Download
- Full session summary with all subject rows and grand total
- "Download Excel" button — generates .xlsx with KLE header, faculty details, subject rows, and total
- On download, POST session data to Google Apps Script URL (ExamLog)
- Success toast: "Session saved to records"
- Failure warning: "Could not save to log — download Excel as backup"

### 8. Step 6: Exam History
- Fetches ExamLog sheet data
- Filter bar: Year dropdown, Role filter, Faculty name search, Clear filters
- Summary cards: Total Exams, Total Amount Paid, Unique Faculty Count
- Paginated table (20 rows/page)
- "Download Year Report" and "Download Full History" Excel buttons

## Google Sheets Integration
- Constants with placeholder URLs (SHEET_CSV_URL, APPS_SCRIPT_URL)
- Setup guide as comments in a config file
- Lightweight inline CSV parser (no extra dependencies)
- Fetch Sheet 1 ("Faculty") on load for dropdowns
- POST to Apps Script on Excel download
- Apps Script doPost() function provided in comments

## Branding
- KLE logo copied to assets and used in header + favicon
- KLE red/maroon color scheme
- "KLE Technological University" branding throughout

## Tech Notes
- Uses xlsx library (already available via npm) for Excel generation
- React + TypeScript + Tailwind (Lovable stack)
- Google Sheets fetch via published CSV URL (no OAuth)
- Hardcoded faculty arrays as offline fallback

