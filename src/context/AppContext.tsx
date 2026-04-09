import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { FacultyMember, RoleType, SubjectEntry, SessionData } from "@/types/faculty";
import { FALLBACK_FACULTY } from "@/data/fallback-faculty";
import { fetchFacultyFromSheet } from "@/lib/sheets-api";

interface AppState {
  isLoggedIn: boolean;
  login: (u: string, p: string) => boolean;
  logout: () => void;
  currentStep: number;
  setCurrentStep: (s: number) => void;
  selectedRole: RoleType | null;
  setSelectedRole: (r: RoleType | null) => void;
  selectedFaculty: FacultyMember | null;
  setSelectedFaculty: (f: FacultyMember | null) => void;
  examDate: Date | undefined;
  setExamDate: (d: Date | undefined) => void;
  semesterType: "Odd" | "Even";
  setSemesterType: (t: "Odd" | "Even") => void;
  semesterNo: number;
  setSemesterNo: (n: number) => void;
  subjects: SubjectEntry[];
  setSubjects: (s: SubjectEntry[]) => void;
  grandTotal: number;
  facultyList: FacultyMember[];
  isOnline: boolean;
  lastSynced: Date | null;
  isLoading: boolean;
  refreshFaculty: () => Promise<void>;
  resetSession: () => void;
  getSessionData: () => SessionData | null;
}

const AppContext = createContext<AppState | null>(null);

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);
  const [examDate, setExamDate] = useState<Date | undefined>();
  const [semesterType, setSemesterType] = useState<"Odd" | "Even">("Odd");
  const [semesterNo, setSemesterNo] = useState(1);
  const [subjects, setSubjects] = useState<SubjectEntry[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyMember[]>(FALLBACK_FACULTY);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const grandTotal = subjects.reduce((sum, s) => sum + s.amount, 0);

  const refreshFaculty = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchFacultyFromSheet();
      setFacultyList(data);
      setIsOnline(true);
      setLastSynced(new Date());
    } catch {
      setFacultyList(FALLBACK_FACULTY);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFaculty();
  }, [refreshFaculty]);

  const login = (u: string, p: string) => {
    if (u === "kleadmin" && p === "password123") {
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    resetSession();
  };

  const resetSession = () => {
    setCurrentStep(1);
    setSelectedRole(null);
    setSelectedFaculty(null);
    setExamDate(undefined);
    setSemesterType("Odd");
    setSemesterNo(1);
    setSubjects([]);
  };

  const getSessionData = (): SessionData | null => {
    if (!selectedFaculty || !selectedRole || !examDate) return null;
    return { faculty: selectedFaculty, role: selectedRole, examDate, semesterType, semesterNo, subjects, grandTotal };
  };

  return (
    <AppContext.Provider value={{
      isLoggedIn, login, logout,
      currentStep, setCurrentStep,
      selectedRole, setSelectedRole,
      selectedFaculty, setSelectedFaculty,
      examDate, setExamDate,
      semesterType, setSemesterType,
      semesterNo, setSemesterNo,
      subjects, setSubjects,
      grandTotal, facultyList, isOnline, lastSynced, isLoading,
      refreshFaculty, resetSession, getSessionData,
    }}>
      {children}
    </AppContext.Provider>
  );
}
