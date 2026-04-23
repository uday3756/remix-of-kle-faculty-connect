import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, X, Loader2, Download, RefreshCw, Users, IndianRupee, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { exportTemplateExcel } from "@/lib/template-export";

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
  students_per_batch: number | null;
  num_batches: number | null;
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
  course_name: null, role: "", staff_name: "", students_per_batch: null, num_batches: null,
  total_students_or_batches: null,
  qp_remn_per_batch: null, remn_per_batch: null, total_amount: 0, account_no: null,
  pan: null, ifsc: null, bank_name: null, exam_session: "JAN 2026",
};

const PAGE_SIZE = 20;

const ROLE_COLORS: Record<string, string> = {
  "BOE/School Chairman": "bg-amber-100 text-amber-800 border-amber-200",
  "HOD": "bg-purple-100 text-purple-800 border-purple-200",
  "Name of the Examiner": "bg-blue-100 text-blue-800 border-blue-200",
  "Instructur": "bg-green-100 text-green-800 border-green-200",
  "Technician": "bg-orange-100 text-orange-800 border-orange-200",
  "Attender": "bg-gray-100 text-gray-800 border-gray-200",
  "External": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Typist ": "bg-pink-100 text-pink-800 border-pink-200",
  "Clerk": "bg-teal-100 text-teal-800 border-teal-200",
  "Peon": "bg-slate-100 text-slate-800 border-slate-200",
  "QP Typist": "bg-rose-100 text-rose-800 border-rose-200",
};

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

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
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
    toast.success("Records refreshed");
  };

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
  const uniqueStaff = new Set(filtered.map(r => r.staff_name)).size;
  const uniqueDepts = new Set(filtered.map(r => r.department)).size;

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
      if (error) toast.error("Update failed: " + error.message); else { toast.success("Record updated successfully"); fetchRecords(); }
    } else {
      const { error } = await supabase.from("remuneration_records").insert(formData);
      if (error) toast.error("Insert failed: " + error.message); else { toast.success("Record added successfully"); fetchRecords(); }
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("remuneration_records").delete().eq("id", id);
    if (error) toast.error("Delete failed: " + error.message); else { toast.success("Record deleted"); fetchRecords(); }
    setDeleteConfirm(null);
  };

  const clearFilters = () => { setSearchTerm(""); setDeptFilter(""); setRoleFilter(""); setPage(1); };
  const hasFilters = searchTerm || deptFilter || roleFilter;

  const handleExport = () => {
    const exportData = filtered.map(r => ({
      sl_no: r.sl_no,
      department: r.department,
      semester: r.semester,
      exam_date: r.exam_date,
      course_code: r.course_code,
      course_name: r.course_name,
      role: r.role,
      staff_name: r.staff_name,
      students_per_batch: r.students_per_batch,
      num_batches: r.num_batches,
      total_students_or_batches: r.total_students_or_batches,
      qp_remn_per_batch: r.qp_remn_per_batch,
      remn_per_batch: r.remn_per_batch,
      total_amount: r.total_amount,
      account_no: r.account_no,
    }));
    const session = filtered[0]?.exam_session || "JAN 2026";
    exportTemplateExcel(exportData, `Remuneration_list_${session.replace(/\s+/g, "_")}.xlsx`, session);
    toast.success("Excel file downloaded");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading records from database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Remuneration Records</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all remuneration records • <span className="font-medium text-foreground">{records.length}</span> total entries in database
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={openAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Record
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Users className="h-5 w-5 text-primary" /></div>
              <div>
                <div className="text-2xl font-bold">{filtered.length}</div>
                <div className="text-xs text-muted-foreground">Records</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-600">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg"><Building2 className="h-5 w-5 text-amber-700" /></div>
              <div>
                <div className="text-2xl font-bold">{uniqueDepts}</div>
                <div className="text-xs text-muted-foreground">Departments</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-44">
              <label className="text-xs font-medium mb-1 block text-muted-foreground">Department</label>
              <Select value={deptFilter} onValueChange={v => { setDeptFilter(v); setPage(1); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All departments" /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <label className="text-xs font-medium mb-1 block text-muted-foreground">Role</label>
              <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All roles" /></SelectTrigger>
                <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs font-medium mb-1 block text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} placeholder="Staff name, course code, account..." className="pl-10 h-9" />
              </div>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5 mr-1" /> Clear all
              </Button>
            )}
          </div>
          {hasFilters && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {deptFilter && <Badge variant="secondary" className="gap-1">{deptFilter} <X className="h-3 w-3 cursor-pointer" onClick={() => setDeptFilter("")} /></Badge>}
              {roleFilter && <Badge variant="secondary" className="gap-1">{roleFilter} <X className="h-3 w-3 cursor-pointer" onClick={() => setRoleFilter("")} /></Badge>}
              {searchTerm && <Badge variant="secondary" className="gap-1">"{searchTerm}" <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm("")} /></Badge>}
              <span className="text-xs text-muted-foreground self-center ml-1">Showing {filtered.length} of {records.length}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10 font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Staff Name</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Course</TableHead>
                  <TableHead className="font-semibold text-center">Sem</TableHead>
                  <TableHead className="font-semibold text-right">Students</TableHead>
                  <TableHead className="font-semibold text-right">Batches</TableHead>
                  <TableHead className="font-semibold text-right">Amount (₹)</TableHead>
                  <TableHead className="font-semibold">Account No.</TableHead>
                  <TableHead className="w-24 font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <div className="text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="font-medium">No records found</p>
                        <p className="text-xs mt-1">Try adjusting your filters or search term</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paged.map((r, idx) => (
                  <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs text-muted-foreground">{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">{r.department}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{r.staff_name}</TableCell>
                    <TableCell>
                      {r.role ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[r.role] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                          {r.role}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-xs max-w-[180px]">
                      {r.course_code ? (
                        <div>
                          <span className="font-mono text-primary font-medium">{r.course_code}</span>
                          {r.course_name && <div className="text-muted-foreground truncate">{r.course_name}</div>}
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center text-xs">{r.semester || "—"}</TableCell>
                    <TableCell className="text-right text-xs">{r.students_per_batch ?? r.total_students_or_batches ?? "—"}</TableCell>
                    <TableCell className="text-right text-xs">{r.num_batches || "—"}</TableCell>
                    <TableCell className="text-right font-semibold text-sm">
                      ₹{(r.total_amount || 0).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{r.account_no || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600" onClick={() => openEdit(r)} title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 hover:text-red-600" onClick={() => setDeleteConfirm(r.id)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination + Export */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" /> Export to Excel
        </Button>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) pageNum = i + 1;
                else if (page <= 4) pageNum = i + 1;
                else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
                else pageNum = page - 3 + i;
                return (
                  <Button key={pageNum} variant={page === pageNum ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setPage(pageNum)}>
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground ml-2">{filtered.length} records</span>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingRecord ? "Edit Record" : "Add New Record"}</DialogTitle>
            <DialogDescription>
              {editingRecord ? "Modify the details below and click Update." : "Fill in the details and click Add to create a new record."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Basic Info */}
            <div>
              <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" /> Basic Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Staff Name" required>
                  <Input value={formData.staff_name} onChange={e => setFormData(f => ({ ...f, staff_name: e.target.value }))} placeholder="Enter staff name" />
                </FormField>
                <FormField label="Department">
                  <Input value={formData.department} onChange={e => setFormData(f => ({ ...f, department: e.target.value }))} placeholder="e.g., ECE" />
                </FormField>
                <FormField label="Role">
                  <Input value={formData.role} onChange={e => setFormData(f => ({ ...f, role: e.target.value }))} placeholder="e.g., Examiner" />
                </FormField>
                <FormField label="Sl. No">
                  <Input type="number" value={formData.sl_no ?? ""} onChange={e => setFormData(f => ({ ...f, sl_no: e.target.value ? Number(e.target.value) : null }))} />
                </FormField>
              </div>
            </div>

            {/* Academic Info */}
            <div>
              <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Academic Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Semester">
                  <Input value={formData.semester ?? ""} onChange={e => setFormData(f => ({ ...f, semester: e.target.value || null }))} placeholder="e.g., I, II" />
                </FormField>
                <FormField label="Exam Date">
                  <Input value={formData.exam_date ?? ""} onChange={e => setFormData(f => ({ ...f, exam_date: e.target.value || null }))} placeholder="e.g., 14-01-2026" />
                </FormField>
                <FormField label="Course Code">
                  <Input value={formData.course_code ?? ""} onChange={e => setFormData(f => ({ ...f, course_code: e.target.value || null }))} placeholder="e.g., 25ECSF107" className="font-mono" />
                </FormField>
                <FormField label="Course Name">
                  <Input value={formData.course_name ?? ""} onChange={e => setFormData(f => ({ ...f, course_name: e.target.value || null }))} placeholder="e.g., C Programming" />
                </FormField>
                <FormField label="Exam Session">
                  <Input value={formData.exam_session ?? ""} onChange={e => setFormData(f => ({ ...f, exam_session: e.target.value || null }))} placeholder="e.g., JAN 2026" />
                </FormField>
              </div>
            </div>

            {/* Financial Info */}
            <div>
              <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" /> Financial Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Students per Batch">
                  <Input type="number" value={formData.students_per_batch ?? ""} onChange={e => setFormData(f => ({ ...f, students_per_batch: e.target.value ? Number(e.target.value) : null }))} />
                </FormField>
                <FormField label="No. of Batches">
                  <Input type="number" value={formData.num_batches ?? ""} onChange={e => setFormData(f => ({ ...f, num_batches: e.target.value ? Number(e.target.value) : null }))} />
                </FormField>
                <FormField label="QP Remn. Per Batch">
                  <Input type="number" value={formData.qp_remn_per_batch ?? ""} onChange={e => setFormData(f => ({ ...f, qp_remn_per_batch: e.target.value ? Number(e.target.value) : null }))} />
                </FormField>
                <FormField label="Remn. Per Batch">
                  <Input type="number" value={formData.remn_per_batch ?? ""} onChange={e => setFormData(f => ({ ...f, remn_per_batch: e.target.value ? Number(e.target.value) : null }))} />
                </FormField>
                <FormField label="Total Amount (₹)" required>
                  <Input type="number" value={formData.total_amount} onChange={e => setFormData(f => ({ ...f, total_amount: Number(e.target.value) || 0 }))} />
                </FormField>
              </div>
            </div>

            {/* Bank Info */}
            <div>
              <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                🏦 Bank & Identity
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Account No.">
                  <Input value={formData.account_no ?? ""} onChange={e => setFormData(f => ({ ...f, account_no: e.target.value || null }))} placeholder="Bank account number" className="font-mono" />
                </FormField>
                <FormField label="PAN">
                  <Input value={formData.pan ?? ""} onChange={e => setFormData(f => ({ ...f, pan: e.target.value || null }))} placeholder="e.g., AAGPI8764B" className="font-mono uppercase" />
                </FormField>
                <FormField label="IFSC">
                  <Input value={formData.ifsc ?? ""} onChange={e => setFormData(f => ({ ...f, ifsc: e.target.value || null }))} placeholder="e.g., KARB0000195" className="font-mono" />
                </FormField>
                <FormField label="Bank Name">
                  <Input value={formData.bank_name ?? ""} onChange={e => setFormData(f => ({ ...f, bank_name: e.target.value || null }))} placeholder="e.g., Karnatak Bank" />
                </FormField>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingRecord ? "Update Record" : "Add Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
