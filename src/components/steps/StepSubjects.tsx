import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { COURSES } from "@/data/fallback-faculty";
import { calculateAmount, getFormulaDisplay, SubjectEntry } from "@/types/faculty";
import { Plus, Trash2 } from "lucide-react";

export default function StepSubjects() {
  const { selectedRole, semesterNo, subjects, setSubjects, setCurrentStep } = useAppState();

  const courses = COURSES[String(semesterNo)] || [];

  const addSubject = () => {
    setSubjects([...subjects, {
      id: crypto.randomUUID(),
      courseCode: "",
      courseName: "",
      studentsPerBatch: 0,
      batches: 1,
      amount: 0,
    }]);
  };

  const updateSubject = (id: string, updates: Partial<SubjectEntry>) => {
    setSubjects(subjects.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, ...updates };
      if (selectedRole && updated.studentsPerBatch > 0 && updated.batches > 0) {
        updated.amount = calculateAmount(selectedRole, updated.studentsPerBatch, updated.batches);
      } else {
        updated.amount = 0;
      }
      return updated;
    }));
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const handleCourseChange = (id: string, code: string) => {
    const course = courses.find(c => c.code === code);
    updateSubject(id, { courseCode: code, courseName: course?.name || "" });
  };

  const grandTotal = subjects.reduce((s, sub) => s + sub.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Subject Details</h2>
          <p className="text-muted-foreground text-sm mt-1">Add examination subjects and student count</p>
        </div>
        <Button onClick={addSubject} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Subject</Button>
      </div>

      {subjects.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>No subjects added yet. Click "Add Subject" to begin.</p>
          </CardContent>
        </Card>
      )}

      {subjects.map((sub, idx) => (
        <Card key={sub.id} className="relative">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-primary">Subject {idx + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => removeSubject(sub.id)} className="text-destructive h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Course Code</label>
                {courses.length > 0 ? (
                  <Select value={sub.courseCode} onValueChange={v => handleCourseChange(sub.id, v)}>
                    <SelectTrigger><SelectValue placeholder="Select course..." /></SelectTrigger>
                    <SelectContent>
                      {courses.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={sub.courseCode} onChange={e => updateSubject(sub.id, { courseCode: e.target.value })} placeholder="Course code" />
                )}
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Course Name</label>
                <Input value={sub.courseName} onChange={e => updateSubject(sub.id, { courseName: e.target.value })} placeholder="Course name" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Students per Batch</label>
                <Input type="number" min={0} value={sub.studentsPerBatch || ""} onChange={e => updateSubject(sub.id, { studentsPerBatch: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Number of Batches</label>
                <Input type="number" min={1} value={sub.batches || ""} onChange={e => updateSubject(sub.id, { batches: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            {sub.amount > 0 && selectedRole && (
              <div className="bg-muted/50 rounded-md px-3 py-2 text-sm">
                <span className="text-muted-foreground">Formula: </span>
                <span className="font-mono font-medium">{getFormulaDisplay(selectedRole, sub.studentsPerBatch, sub.batches)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {subjects.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex justify-between items-center">
            <span className="font-semibold text-lg">Grand Total</span>
            <span className="text-2xl font-bold text-primary">₹{grandTotal.toLocaleString("en-IN")}</span>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(3)}>← Back</Button>
        <Button onClick={() => setCurrentStep(5)} disabled={subjects.length === 0 || subjects.some(s => !s.courseCode || s.studentsPerBatch <= 0)}>
          Next →
        </Button>
      </div>
    </div>
  );
}
