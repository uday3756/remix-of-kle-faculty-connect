import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, X, Loader2, Download } from "lucide-react";
import { exportHistoryExcel } from "@/lib/excel-export";

interface RemunerationRecord {
  id: string;
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
  pan: string | null;
  ifsc: string | null;
  bank_name: string | null;
  exam_session: string | null;
}

const EMPTY_RECORD: Omit<RemunerationRecord, "id"> = {
  sl_no: null, department: "", semester: null, exam_date: null, course_code: null,
  course_name: null, role: "", staff_name: "", total_students_or_batches: null,
  qp_remn_per_batch: null, remn_per_batch: null, total_amount: 0, account_no: null,
  pan: null, ifsc: null, bank_name: null, exam_session: "JAN 2026",
};

const PAGE_SIZE = 20;

export default function StepRecords() {
  const [records, setRecords] = useState<RemunerationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RemunerationRecord | null>(null);
  const [formData, setFormData] = useState<Omit<RemunerationRecord, "id">>(EMPTY_RECORD);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("remuneration_records")
      .select("*")
      .order("department")
      .order("sl_no");
    if (error) {
      toast.error("Failed to load records");
    } else {
      setRecords((data as RemunerationRecord[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const departments = useMemo(() => [...new Set(records.map(r => r.department))].filter(Boolean).sort(), [records]);
  const roles = useMemo(() => [...new Set(records.map(r => r.role))].filter(Boolean).sort(), [records]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (deptFilter && r.department !== deptFilter) return false;
      if (roleFilter && r.role !== roleFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return r.staff_name.toLowerCase().includes(term) ||
          (r.course_code || "").toLowerCase().includes(term) ||
          (r.course_name || "").toLowerCase().includes(term) ||
          (r.account_no || "").includes(term);
      }
      return true;
    });
  }, [records, deptFilter, roleFilter, searchTerm]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalAmount = filtered.reduce((s, r) => s + (r.total_amount || 0), 0);

  const openAdd = () => { setEditingRecord(null); setFormData({ ...EMPTY_RECORD }); setDialogOpen(true); };
  const openEdit = (r: RemunerationRecord) => {
    setEditingRecord(r);
    const { id, ...rest } = r;
    setFormData(rest);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.staff_name.trim()) { toast.error("Staff name is required"); return; }
    setSaving(true);
    if (editingRecord) {
      const { error } = await supabase.from("remuneration_records").update(formData).eq("id", editingRecord.id);
      if (error) toast.error("Update failed"); else { toast.success("Record updated"); fetchRecords(); }
    } else {
      const { error } = await supabase.from("remuneration_records").insert(formData);
      if (error) toast.error("Insert failed"); else { toast.success("Record added"); fetchRecords(); }
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("remuneration_records").delete().eq("id", id);
    if (error) toast.error("Delete failed"); else { toast.success("Record deleted"); fetchRecords(); }
    setDeleteConfirm(null);
  };

  const clearFilters = () => { setSearchTerm(""); setDeptFilter(""); setRoleFilter(""); setPage(1); };

  const handleExport = () => {
    const exportData = filtered.map(r => ({
      timestamp: "", facultyName: r.staff_name, role: r.role as any,
      accountNo: r.account_no || "", pan: r.pan || "", aadhaar: "",
      examDate: r.exam_date || "", semesterType: "Odd" as const, semesterNo: 0,
      courseCode: r.course_code || "", courseName: r.course_name || "",
      studentsPerBatch: r.total_students_or_batches || 0, batches: 0,
      amount: r.total_amount, grandTotal: r.total_amount,
    }));
    exportHistoryExcel(exportData, "Remuneration Records", "KLE_Remuneration_Records.xlsx");
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Remuneration Records</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage all remuneration records stored in Supabase</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Record</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-primary">{filtered.length}</div><div className="text-xs text-muted-foreground">Records</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-primary">₹{totalAmount.toLocaleString("en-IN")}</div><div className="text-xs text-muted-foreground">Total Amount</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-primary">{new Set(filtered.map(r => r.staff_name)).size}</div><div className="text-xs text-muted-foreground">Unique Staff</div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div className="w-40">
            <label className="text-xs font-medium mb-1 block">Department</label>
            <Select value={deptFilter} onValueChange={v => { setDeptFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="All depts" /></SelectTrigger>
              <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <label className="text-xs font-medium mb-1 block">Role</label>
            <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="All roles" /></SelectTrigger>
              <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium mb-1 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} placeholder="Staff name, course code..." className="pl-10" />
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
                <TableHead className="w-10">#</TableHead>
                <TableHead>Dept</TableHead>
                <TableHead>Staff Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Sem</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
              ) : paged.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{r.sl_no}</TableCell>
                  <TableCell className="text-xs">{r.department}</TableCell>
                  <TableCell className="font-medium text-sm">{r.staff_name}</TableCell>
                  <TableCell className="text-xs">{r.role}</TableCell>
                  <TableCell className="text-xs"><span className="font-mono">{r.course_code}</span> {r.course_name}</TableCell>
                  <TableCell className="text-xs">{r.semester}</TableCell>
                  <TableCell className="text-right text-xs">{r.total_students_or_batches}</TableCell>
                  <TableCell className="text-right font-semibold">₹{(r.total_amount || 0).toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-xs font-mono">{r.account_no}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm(r.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
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

      {/* Export */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-1" /> Export to Excel</Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRecord ? "Edit Record" : "Add New Record"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Staff Name *</Label><Input value={formData.staff_name} onChange={e => setFormData(f => ({ ...f, staff_name: e.target.value }))} /></div>
            <div><Label>Department</Label><Input value={formData.department} onChange={e => setFormData(f => ({ ...f, department: e.target.value }))} /></div>
            <div><Label>Role</Label><Input value={formData.role} onChange={e => setFormData(f => ({ ...f, role: e.target.value }))} /></div>
            <div><Label>Sl. No</Label><Input type="number" value={formData.sl_no ?? ""} onChange={e => setFormData(f => ({ ...f, sl_no: e.target.value ? Number(e.target.value) : null }))} /></div>
            <div><Label>Semester</Label><Input value={formData.semester ?? ""} onChange={e => setFormData(f => ({ ...f, semester: e.target.value || null }))} /></div>
            <div><Label>Exam Date</Label><Input value={formData.exam_date ?? ""} onChange={e => setFormData(f => ({ ...f, exam_date: e.target.value || null }))} /></div>
            <div><Label>Course Code</Label><Input value={formData.course_code ?? ""} onChange={e => setFormData(f => ({ ...f, course_code: e.target.value || null }))} /></div>
            <div><Label>Course Name</Label><Input value={formData.course_name ?? ""} onChange={e => setFormData(f => ({ ...f, course_name: e.target.value || null }))} /></div>
            <div><Label>Total Students/Batches</Label><Input type="number" value={formData.total_students_or_batches ?? ""} onChange={e => setFormData(f => ({ ...f, total_students_or_batches: e.target.value ? Number(e.target.value) : null }))} /></div>
            <div><Label>QP Remn. Per Batch</Label><Input type="number" value={formData.qp_remn_per_batch ?? ""} onChange={e => setFormData(f => ({ ...f, qp_remn_per_batch: e.target.value ? Number(e.target.value) : null }))} /></div>
            <div><Label>Remn. Per Batch</Label><Input type="number" value={formData.remn_per_batch ?? ""} onChange={e => setFormData(f => ({ ...f, remn_per_batch: e.target.value ? Number(e.target.value) : null }))} /></div>
            <div><Label>Total Amount (₹) *</Label><Input type="number" value={formData.total_amount} onChange={e => setFormData(f => ({ ...f, total_amount: Number(e.target.value) || 0 }))} /></div>
            <div><Label>Account No.</Label><Input value={formData.account_no ?? ""} onChange={e => setFormData(f => ({ ...f, account_no: e.target.value || null }))} /></div>
            <div><Label>PAN</Label><Input value={formData.pan ?? ""} onChange={e => setFormData(f => ({ ...f, pan: e.target.value || null }))} /></div>
            <div><Label>IFSC</Label><Input value={formData.ifsc ?? ""} onChange={e => setFormData(f => ({ ...f, ifsc: e.target.value || null }))} /></div>
            <div><Label>Bank Name</Label><Input value={formData.bank_name ?? ""} onChange={e => setFormData(f => ({ ...f, bank_name: e.target.value || null }))} /></div>
            <div><Label>Exam Session</Label><Input value={formData.exam_session ?? ""} onChange={e => setFormData(f => ({ ...f, exam_session: e.target.value || null }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{editingRecord ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this record? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
