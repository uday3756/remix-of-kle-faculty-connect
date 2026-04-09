import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function StepExamDate() {
  const { examDate, setExamDate, setCurrentStep } = useAppState();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Exam Date</h2>
        <p className="text-muted-foreground text-sm mt-1">Select the date of examination</p>
      </div>

      <div className="max-w-sm">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !examDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {examDate ? format(examDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={examDate} onSelect={setExamDate} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>← Back</Button>
        <Button onClick={() => setCurrentStep(3)} disabled={!examDate}>Next →</Button>
      </div>
    </div>
  );
}
