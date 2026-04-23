import { useState } from "react";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportSessionExcel } from "@/lib/excel-export";
import { ROLE_CONFIG } from "@/types/faculty";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, RotateCcw, Save, Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function StepSummary() {
  const state = useAppState();
  const session = state.getSessionData();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!session) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Please complete all previous steps first.</p>
        <Button className="mt-4" onClick={() => state.setCurrentStep(1)}>Go to Step 1</Button>
      </div>
    );
  }

  const cfg = ROLE_CONFIG[session.role];

  const handleSaveToDB = async () => {
    setSaving(true);
    try {
      const records = session.subjects.map((sub, idx) => ({
        sl_no: idx + 1,
        department: "ECE",
        semester: `${session.semesterType}-${session.semesterNo}`,
        exam_date: format(session.examDate, "dd/MM/yyyy"),
        course_code: sub.courseCode,
        course_name: sub.courseName,
        role: session.role,
        staff_name: session.faculty.name,
        students_per_batch: sub.studentsPerBatch,
        num_batches: sub.batches,
        total_students_or_batches: sub.studentsPerBatch * sub.batches,
        qp_remn_per_batch: cfg?.ratePerStudent || 0,
        remn_per_batch: cfg?.fixedCharge || 0,
        total_amount: sub.amount,
        account_no: session.faculty.accountNo || null,
        pan: session.faculty.pan || null,
        exam_session: `${format(session.examDate, "MMM yyyy").toUpperCase()}`,
      }));

      const { error } = await supabase.from("remuneration_records").insert(records);
      if (error) throw error;

      setSaved(true);
      toast.success(`${records.length} record(s) saved to database`);
    } catch (err: any) {
      toast.error("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    exportSessionExcel(session);
    toast.success("Excel file downloaded");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Summary & Download</h2>
        <p className="text-muted-foreground text-sm mt-1">Review, save to database, and export</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Faculty Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-y-2 text-sm">
          <div><span className="text-muted-foreground">Name:</span> {session.faculty.name}</div>
          <div><span className="text-muted-foreground">Role:</span> {cfg?.icon} {session.role}</div>
          <div><span className="text-muted-foreground">Account No:</span> {session.faculty.accountNo || "—"}</div>
          <div><span className="text-muted-foreground">PAN:</span> {session.faculty.pan || "—"}</div>
          <div><span className="text-muted-foreground">Exam Date:</span> {format(session.examDate, "dd/MM/yyyy")}</div>
          <div><span className="text-muted-foreground">Semester:</span> {session.semesterType} - {session.semesterNo}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Subject Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Batches</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {session.subjects.map(sub => (
                <TableRow key={sub.id}>
                  <TableCell className="font-mono">{sub.courseCode}</TableCell>
                  <TableCell>{sub.courseName}</TableCell>
                  <TableCell className="text-right">{sub.studentsPerBatch}</TableCell>
                  <TableCell className="text-right">{sub.batches}</TableCell>
                  <TableCell className="text-right font-semibold">₹{sub.amount.toLocaleString("en-IN")}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-primary/5 font-bold">
                <TableCell colSpan={4} className="text-right">Grand Total</TableCell>
                <TableCell className="text-right text-primary text-lg">₹{session.grandTotal.toLocaleString("en-IN")}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-between flex-wrap">
        <Button variant="outline" onClick={() => state.setCurrentStep(4)}>← Back</Button>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" onClick={state.resetSession}>
            <RotateCcw className="h-4 w-4 mr-1" /> New Session
          </Button>
          <Button variant="secondary" onClick={handleSaveToDB} disabled={saving || saved}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4 mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            {saved ? "Saved to DB" : "Save to Database"}
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" /> Download Excel
          </Button>
        </div>
      </div>
    </div>
  );
}
