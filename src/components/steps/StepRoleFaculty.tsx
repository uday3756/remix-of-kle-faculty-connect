import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RoleType, ROLE_CONFIG } from "@/types/faculty";
import { RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const ROLES: RoleType[] = ["Faculty", "Instructor", "Technician", "Attender", "External"];

export default function StepRoleFaculty() {
  const {
    selectedRole, setSelectedRole, selectedFaculty, setSelectedFaculty,
    facultyList, isOnline, lastSynced, isLoading, refreshFaculty, setCurrentStep
  } = useAppState();

  const filteredFaculty = selectedRole ? facultyList.filter(f => f.role === selectedRole) : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Select Role & Faculty</h2>
        <p className="text-muted-foreground text-sm mt-1">Choose the role and select a faculty member</p>
      </div>

      {!isOnline && (
        <Alert className="border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Running in offline mode — Google Sheets unavailable. Using fallback data.
          </AlertDescription>
        </Alert>
      )}

      {/* Role Cards */}
      <div>
        <label className="text-sm font-medium mb-3 block">Role</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {ROLES.map(role => {
            const cfg = ROLE_CONFIG[role];
            const active = selectedRole === role;
            return (
              <Card
                key={role}
                onClick={() => { setSelectedRole(role); setSelectedFaculty(null); }}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  active ? "ring-2 ring-primary bg-primary/5 shadow-md" : "hover:bg-muted/50"
                )}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-1">{cfg.icon}</div>
                  <div className="font-semibold text-sm">{cfg.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">₹{cfg.ratePerStudent}/s + ₹{cfg.fixedCharge}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Faculty select */}
      {selectedRole && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Faculty Member</label>
            <div className="flex items-center gap-2">
              {lastSynced && <span className="text-xs text-muted-foreground">Synced {format(lastSynced, "h:mm a")}</span>}
              <Button variant="outline" size="sm" onClick={refreshFaculty} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                <span className="ml-1">Refresh</span>
              </Button>
            </div>
          </div>

          {filteredFaculty.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {selectedRole} members found.</p>
          ) : (
            <Select value={selectedFaculty?.name || ""} onValueChange={v => {
              const f = filteredFaculty.find(x => x.name === v);
              if (f) setSelectedFaculty(f);
            }}>
              <SelectTrigger><SelectValue placeholder="Select faculty..." /></SelectTrigger>
              <SelectContent>
                {filteredFaculty.map(f => (
                  <SelectItem key={f.slNo} value={f.name}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedFaculty && (
            <Card className="bg-muted/30">
              <CardContent className="p-4 grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-muted-foreground block text-xs">Account No</span>{selectedFaculty.accountNo}</div>
                <div><span className="text-muted-foreground block text-xs">PAN</span>{selectedFaculty.pan}</div>
                <div><span className="text-muted-foreground block text-xs">Aadhaar</span>{selectedFaculty.aadhaar}</div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {selectedFaculty && (
        <div className="flex justify-end">
          <Button onClick={() => setCurrentStep(2)}>Next →</Button>
        </div>
      )}
    </div>
  );
}
