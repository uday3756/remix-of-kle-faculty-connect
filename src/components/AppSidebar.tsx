import { useAppState } from "@/context/AppContext";
import { CheckCircle2, Circle, History, Database, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  { num: 1, label: "Select Role & Faculty" },
  { num: 2, label: "Exam Date" },
  { num: 3, label: "Semester" },
  { num: 4, label: "Subjects" },
  { num: 5, label: "Summary & Download" },
];

export default function AppSidebar() {
  const { currentStep, setCurrentStep, logout, selectedRole, selectedFaculty, examDate, semesterNo, subjects } = useAppState();

  const isStepDone = (step: number) => {
    switch (step) {
      case 1: return !!selectedRole && !!selectedFaculty;
      case 2: return !!examDate;
      case 3: return semesterNo > 0;
      case 4: return subjects.length > 0 && subjects.every(s => s.courseCode && s.studentsPerBatch > 0 && s.batches > 0);
      case 5: return false;
      default: return false;
    }
  };

  return (
    <div className="w-64 min-h-screen flex flex-col bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]">
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-[hsl(var(--sidebar-border))]">
        <img src="/kle_logo.png" alt="KLE" className="h-10 w-auto" />
        <div className="text-sm leading-tight">
          <div className="font-bold">KLE Tech</div>
          <div className="text-xs opacity-75">Workload Manager</div>
        </div>
      </div>

      {/* Steps */}
      <nav className="flex-1 p-3 space-y-1">
        {STEPS.map(step => {
          const done = isStepDone(step.num);
          const active = currentStep === step.num;
          return (
            <button
              key={step.num}
              onClick={() => setCurrentStep(step.num)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                active && "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))] font-semibold",
                !active && "hover:bg-[hsl(var(--sidebar-accent))] opacity-80 hover:opacity-100"
              )}
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
              ) : (
                <Circle className={cn("h-5 w-5 shrink-0", active ? "text-[hsl(var(--sidebar-primary))]" : "opacity-50")} />
              )}
              <span>{step.label}</span>
            </button>
          );
        })}

        <div className="border-t border-[hsl(var(--sidebar-border))] my-3" />

        <button
          onClick={() => setCurrentStep(6)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
            currentStep === 6 && "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))] font-semibold",
            currentStep !== 6 && "hover:bg-[hsl(var(--sidebar-accent))] opacity-80 hover:opacity-100"
          )}
        >
          <History className="h-5 w-5 shrink-0" />
          <span>Exam History</span>
        </button>

        <button
          onClick={() => setCurrentStep(7)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
            currentStep === 7 && "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))] font-semibold",
            currentStep !== 7 && "hover:bg-[hsl(var(--sidebar-accent))] opacity-80 hover:opacity-100"
          )}
        >
          <Database className="h-5 w-5 shrink-0" />
          <span>Records (DB)</span>
        </button>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[hsl(var(--sidebar-border))]">
        <Button variant="ghost" onClick={logout} className="w-full justify-start text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]">
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </div>
    </div>
  );
}
