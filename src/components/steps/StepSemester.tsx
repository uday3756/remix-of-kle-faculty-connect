import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function StepSemester() {
  const { semesterType, setSemesterType, semesterNo, setSemesterNo, setCurrentStep } = useAppState();

  const oddSemesters = [1, 3, 5, 7];
  const evenSemesters = [2, 4, 6, 8];
  const semesters = semesterType === "Odd" ? oddSemesters : evenSemesters;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Semester Selection</h2>
        <p className="text-muted-foreground text-sm mt-1">Choose semester type and number</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Semester Type</label>
          <div className="flex gap-3">
            {(["Odd", "Even"] as const).map(type => (
              <Button
                key={type}
                variant={semesterType === type ? "default" : "outline"}
                onClick={() => { setSemesterType(type); setSemesterNo(type === "Odd" ? 1 : 2); }}
                className="w-32"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Semester Number</label>
          <div className="flex gap-3 flex-wrap">
            {semesters.map(n => (
              <Button
                key={n}
                variant={semesterNo === n ? "default" : "outline"}
                onClick={() => setSemesterNo(n)}
                className={cn("w-16 h-16 text-lg font-bold", semesterNo === n && "shadow-lg")}
              >
                {n}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(2)}>← Back</Button>
        <Button onClick={() => setCurrentStep(4)}>Next →</Button>
      </div>
    </div>
  );
}
