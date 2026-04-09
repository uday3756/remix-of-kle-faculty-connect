import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchExamLog } from "@/lib/sheets-api";
import { exportHistoryExcel } from "@/lib/excel-export";
import { ExamLogEntry, RoleType } from "@/types/faculty";
import { Download, Loader2, Search, X } from "lucide-react";

const ROLES: RoleType[] = ["Faculty", "Instructor", "Technician", "Attender", "External"];
const PAGE_SIZE = 20;

export default function StepHistory() {
  const [entries, setEntries] = useState<ExamLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetchExamLog()
      .then(setEntries)
      .catch(() => setError("Could not load exam history. Ensure ExamLog sheet URL is configured."))
      .finally(() => setLoading(false));
  }, []);

  const years = useMemo(() => {
    const yrs = new Set<string>();
    entries.forEach(e => {
      const parts = e.examDate.split("/");
      if (parts[2]) yrs.add(parts[2]);
    });
    return Array.from(yrs).sort().reverse();
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (yearFilter && !e.examDate.includes(yearFilter)) return false;
      if (roleFilter && e.role !== roleFilter) return false;
      if (nameSearch && !e.facultyName.toLowerCase().includes(nameSearch.toLowerCase())) return false;
      return true;
    });
  }, [entries, yearFilter, roleFilter, nameSearch]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);
  const uniqueFaculty = new Set(filtered.map(e => e.facultyName)).size;

  const clearFilters = () => { setYearFilter(""); setRoleFilter(""); setNameSearch(""); setPage(1); };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Exam History</h2>
        <p className="text-muted-foreground text-sm mt-1">View and download past examination records</p>
      </div>

      {error && <Card className="bg-destructive/10 border-destructive/30"><CardContent className="p-4 text-sm text-destructive">{error}</CardContent></Card>}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-primary">{filtered.length}</div><div className="text-xs text-muted-foreground">Total Exams</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-primary">₹{totalAmount.toLocaleString("en-IN")}</div><div className="text-xs text-muted-foreground">Total Amount</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-primary">{uniqueFaculty}</div><div className="text-xs text-muted-foreground">Unique Faculty</div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div className="w-36">
            <label className="text-xs font-medium mb-1 block">Year</label>
            <Select value={yearFilter} onValueChange={v => { setYearFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="All years" /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-36">
            <label className="text-xs font-medium mb-1 block">Role</label>
            <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="All roles" /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium mb-1 block">Search Faculty</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input value={nameSearch} onChange={e => { setNameSearch(e.target.value); setPage(1); }} placeholder="Faculty name..." className="pl-10" />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={clearFilters}><X className="h-3 w-3 mr-1" /> Clear</Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Faculty</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Batches</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
              ) : paged.map((e, i) => (
                <TableRow key={i}>
                  <TableCell>{e.examDate}</TableCell>
                  <TableCell>{e.facultyName}</TableCell>
                  <TableCell>{e.role}</TableCell>
                  <TableCell>{e.semesterType}-{e.semesterNo}</TableCell>
                  <TableCell className="font-mono text-xs">{e.courseCode}</TableCell>
                  <TableCell>{e.courseName}</TableCell>
                  <TableCell className="text-right">{e.studentsPerBatch}</TableCell>
                  <TableCell className="text-right">{e.batches}</TableCell>
                  <TableCell className="text-right font-semibold">₹{e.amount.toLocaleString("en-IN")}</TableCell>
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

      {/* Downloads */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => exportHistoryExcel(filtered, `Year Report ${yearFilter || "All"}`, `KLE_Year_Report_${yearFilter || "All"}.xlsx`)}>
          <Download className="h-4 w-4 mr-1" /> Download Year Report
        </Button>
        <Button onClick={() => exportHistoryExcel(entries, "Full History", "KLE_Full_History.xlsx")}>
          <Download className="h-4 w-4 mr-1" /> Download Full History
        </Button>
      </div>
    </div>
  );
}
