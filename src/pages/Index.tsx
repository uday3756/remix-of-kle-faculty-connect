import { AppProvider, useAppState } from "@/context/AppContext";
import LoginPage from "@/pages/LoginPage";
import AppSidebar from "@/components/AppSidebar";
import StepRoleFaculty from "@/components/steps/StepRoleFaculty";
import StepExamDate from "@/components/steps/StepExamDate";
import StepSemester from "@/components/steps/StepSemester";
import StepSubjects from "@/components/steps/StepSubjects";
import StepSummary from "@/components/steps/StepSummary";
import StepHistory from "@/components/steps/StepHistory";
import StepRecords from "@/components/steps/StepRecords";

function StepContent() {
  const { currentStep } = useAppState();
  switch (currentStep) {
    case 1: return <StepRoleFaculty />;
    case 2: return <StepExamDate />;
    case 3: return <StepSemester />;
    case 4: return <StepSubjects />;
    case 5: return <StepSummary />;
    case 6: return <StepHistory />;
    case 7: return <StepRecords />;
    default: return <StepRoleFaculty />;
  }
}

function Dashboard() {
  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <StepContent />
      </main>
    </div>
  );
}

function AppContent() {
  const { isLoggedIn } = useAppState();
  return isLoggedIn ? <Dashboard /> : <LoginPage />;
}

const Index = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default Index;
