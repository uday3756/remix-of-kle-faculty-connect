import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { exportTemplateExcel, TemplateRecord } from "@/lib/template-export";
import { exportConsolidatedReport } from "@/lib/consolidated-report";
import { Download, Loader2, X, CalendarIcon, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface HistoryRecord {
  id: string;
  staff_name: string;
  role: string;
  department: string;
  exam_date: string | null;
  semester: string | null;
  course_code: string | null;
  course_name: string | null;
  total_students_or_batches: number | null;
  total_amount: number;
  account_no: string | null;
  pan: string | null;
  exam_session: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function StepHistory() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all records (paginated in batches of 1000)
      let allData: HistoryRecord[] = [];
      let from = 0;
      const batchSize = 1000;
      while (true) {
        const { data, error: err } = await supabase
          .from("remuneration_records")
          .select("id, staff_name, role, department, exam_date, semester, course_code, course_name, total_students_or_batches, total_amount, account_no, pan, exam_session, created_at")
          .order("created_at", { ascending: false })
          .range(from, from + batchSize - 1);
        if (err) throw err;
        allData = [...allData, ...(data || [])];
        if (!data || data.length < batchSize) break;
        from += batchSize;
      }
      setRecords(allData);
    } catch {
      setError("Failed to load history from database");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const roles = useMemo(() => [...new Set(records.map(r => r.role).filter(Boolean))].sort(), [records]);
  const departments = useMemo(() => [...new Set(records.map(r => r.department).filter(Boolean))].sort(), [records]);
  const sessions = useMemo(() => [...new Set(records.map(r => r.exam_session).filter(Boolean))].sort(), [records]);
  const semesters = useMemo(() => [...new Set(records.map(r => r.semester).filter(Boolean))].sort(), [records]);

  const parseExamDate = (dateStr: string | null): Date | null => {
    if (!dateStr) return null;
    
    // Support both DD/MM/YYYY and DD-MM-YYYY (or YYYY-MM-DD)
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return new Date(+parts[0], +parts[1] - 1, +parts[2]);
      } else {
        // DD-MM-YYYY or DD/MM/YYYY
        return new Date(+parts[2], +parts[1] - 1, +parts[0]);
      }
    }
    
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (roleFilter && r.role !== roleFilter) return false;
      if (deptFilter && r.department !== deptFilter) return false;
      if (sessionFilter && r.exam_session !== sessionFilter) return false;
      if (semesterFilter && r.semester !== semesterFilter) return false;
      if (nameSearch && !r.staff_name.toLowerCase().includes(nameSearch.toLowerCase())) return false;
      if (dateFrom || dateTo) {
        const d = parseExamDate(r.exam_date);
        if (!d) return false;
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
      }
      return true;
    });
  }, [records, roleFilter, deptFilter, sessionFilter, semesterFilter, nameSearch, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalAmount = filtered.reduce((s, r) => s + (r.total_amount || 0), 0);
  const uniqueStaff = new Set(filtered.map(r => r.staff_name)).size;

  const clearFilters = () => {
    setRoleFilter(""); setNameSearch(""); setDeptFilter(""); setSessionFilter("");
    setSemesterFilter("");
    setDateFrom(undefined); setDateTo(undefined); setPage(1);
  };

  const exportFiltered = (label: string) => {
    const tplRecords: TemplateRecord[] = filtered.map((r, i) => ({
      sl_no: i + 1,
      department: r.department,
      semester: r.semester,
      exam_date: r.exam_date,
      course_code: r.course_code,
      course_name: r.course_name,
      role: r.role,
      staff_name: r.staff_name,
      total_students_or_batches: r.total_students_or_batches,
      qp_remn_per_batch: null,
      remn_per_batch: null,
      total_amount: r.total_amount || 0,
      account_no: r.account_no,
    }));
    const sessionLabel = sessionFilter || "ALL SESSIONS";
    exportTemplateExcel(tplRecords, `KLE_History_${label.replace(/\s+/g, "_")}.xlsx`, sessionLabel);
  };

  const hasActiveFilters = roleFilter || deptFilter || sessionFilter || semesterFilter || nameSearch || dateFrom || dateTo;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Exam History</h2>
        <p className="text-muted-foreground text-sm mt-1">View, filter, and download examination records from database</p>
      </div>

      {error && <Card className="bg-destructive/10 border-destructive/30"><CardContent className="p-4 text-sm text-destructive">{error}</CardContent></Card>}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-primary">{filtered.length}</div><div className="text-xs text-muted-foreground">Total Records</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-primary">{uniqueStaff}</div><div className="text-xs text-muted-foreground">Unique Staff</div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-36">
              <label className="text-xs font-medium mb-1 block">Role</label>
              <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="All roles" /></SelectTrigger>
                <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <label className="text-xs font-medium mb-1 block">Department</label>
              <Select value={deptFilter} onValueChange={v => { setDeptFilter(v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="All depts" /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <label className="text-xs font-medium mb-1 block">Exam Session</label>
              <Select value={sessionFilter} onValueChange={v => { setSessionFilter(v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="All sessions" /></SelectTrigger>
                <SelectContent>{sessions.map(s => <SelectItem key={s!} value={s!}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <label className="text-xs font-medium mb-1 block">Semester</label>
              <Select value={semesterFilter} onValueChange={v => { setSemesterFilter(v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>{semesters.map(s => <SelectItem key={s!} value={s!}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium mb-1 block">Staff Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={nameSearch}
                  onChange={e => { setNameSearch(e.target.value); setPage(1); }}
                  placeholder="Search name..."
                  className="w-full h-10 px-3 py-2 bg-background border rounded-md text-sm"
                />
                {nameSearch && (
                  <button onClick={() => setNameSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Date range */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs font-medium mb-1 block">Date From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-36 justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={d => { setDateFrom(d); setPage(1); }} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Date To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-36 justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={d => { setDateTo(d); setPage(1); }} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}><X className="h-3 w-3 mr-1" /> Clear All</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Dept</TableHead>
                <TableHead>Exam Date</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
              ) : paged.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.staff_name}</TableCell>
                  <TableCell>{r.role}</TableCell>
                  <TableCell>{r.department}</TableCell>
                  <TableCell>{r.exam_date || "—"}</TableCell>
                  <TableCell>{r.semester || "—"}</TableCell>
                  <TableCell className="text-xs">{r.course_code} {r.course_name ? `— ${r.course_name}` : ""}</TableCell>
                  <TableCell className="text-right">{r.total_students_or_batches || "—"}</TableCell>
                  <TableCell className="text-right font-semibold">₹{(r.total_amount || 0).toLocaleString("en-IN")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground self-center">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Download */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => exportConsolidatedReport(filtered, `KLE_Consolidated_${sessionFilter || "All"}.xlsx`, sessionFilter || "JAN 2026")}>
          <FileSpreadsheet className="h-4 w-4 mr-1" /> Consolidated Report
        </Button>
        <Button onClick={() => exportFiltered(hasActiveFilters ? (sessionFilter ? `Session_${sessionFilter}` : "Filtered") : "All_History")}>
          <Download className="h-4 w-4 mr-1" /> Download ({filtered.length})
        </Button>
      </div>
    </div>
  );
}
