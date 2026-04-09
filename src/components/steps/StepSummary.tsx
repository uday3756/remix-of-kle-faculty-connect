import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportSessionExcel } from "@/lib/excel-export";
import { writeExamLog } from "@/lib/sheets-api";
import { ROLE_CONFIG } from "@/types/faculty";
import { toast } from "sonner";
import { Download, RotateCcw } from "lucide-react";
import { format } from "date-fns";

export default function StepSummary() {
  const state = useAppState();
  const session = state.getSessionData();

  if (!session) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Please complete all previous steps first.</p>
        <Button className="mt-4" onClick={() => state.setCurrentStep(1)}>Go to Step 1</Button>
      </div>
    );
  }

  const cfg = ROLE_CONFIG[session.role];

  const handleDownload = async () => {
    exportSessionExcel(session);

    // Write to ExamLog
    const rows = session.subjects.map(sub => [
      new Date().toISOString(),
      session.faculty.name,
      session.role,
      session.faculty.accountNo,
      session.faculty.pan,
      session.faculty.aadhaar,
      format(session.examDate, "dd/MM/yyyy"),
      session.semesterType,
      String(session.semesterNo),
      sub.courseCode,
      sub.courseName,
      String(sub.studentsPerBatch),
      String(sub.batches),
      String(sub.amount),
      String(session.grandTotal),
    ]);

    const ok = await writeExamLog(rows);
    if (ok) {
      toast.success("Session saved to records");
    } else {
      toast.warning("Could not save to log — download Excel as backup");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Summary & Download</h2>
        <p className="text-muted-foreground text-sm mt-1">Review and export the remuneration details</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Faculty Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-y-2 text-sm">
          <div><span className="text-muted-foreground">Name:</span> {session.faculty.name}</div>
          <div><span className="text-muted-foreground">Role:</span> {cfg.icon} {session.role}</div>
          <div><span className="text-muted-foreground">Account No:</span> {session.faculty.accountNo}</div>
          <div><span className="text-muted-foreground">PAN:</span> {session.faculty.pan}</div>
          <div><span className="text-muted-foreground">Aadhaar:</span> {session.faculty.aadhaar}</div>
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

      <div className="flex gap-3 justify-between">
        <Button variant="outline" onClick={() => state.setCurrentStep(4)}>← Back</Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={state.resetSession}>
            <RotateCcw className="h-4 w-4 mr-1" /> New Session
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" /> Download Excel
          </Button>
        </div>
      </div>
    </div>
  );
}
