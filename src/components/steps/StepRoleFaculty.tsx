import { useState, useEffect, useMemo } from "react";
import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RoleType, ROLE_CONFIG } from "@/types/faculty";
import { RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface DBFaculty {
  staff_name: string;
  role: string;
  account_no: string | null;
  pan: string | null;
  ifsc: string | null;
  bank_name: string | null;
}

export default function StepRoleFaculty() {
  const {
    selectedRole, setSelectedRole, selectedFaculty, setSelectedFaculty, setCurrentStep
  } = useAppState();

  const [dbRoles, setDbRoles] = useState<string[]>([]);
  const [dbFaculty, setDbFaculty] = useState<DBFaculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch distinct roles
      const { data: roleData, error: roleErr } = await supabase
        .from("remuneration_records")
        .select("role")
        .neq("role", "")
        .neq("role", "Name of the Examiner");
      if (roleErr) throw roleErr;
      const roles = [...new Set((roleData || []).map(r => r.role))].sort();
      setDbRoles(roles);

      // Fetch distinct staff
      const { data: staffData, error: staffErr } = await supabase
        .from("remuneration_records")
        .select("staff_name, role, account_no, pan, ifsc, bank_name")
        .neq("staff_name", "")
        .neq("role", "");
      if (staffErr) throw staffErr;

      // Deduplicate by staff_name + role
      const seen = new Set<string>();
      const unique: DBFaculty[] = [];
      for (const s of staffData || []) {
        const key = `${s.staff_name}|${s.role}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(s);
        }
      }
      setDbFaculty(unique);
    } catch {
      setError("Failed to load data from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredFaculty = useMemo(() => {
    if (!selectedRole) return [];
    return dbFaculty.filter(f => f.role === selectedRole).sort((a, b) => a.staff_name.localeCompare(b.staff_name));
  }, [dbFaculty, selectedRole]);

  const roleConfig = selectedRole && ROLE_CONFIG[selectedRole as RoleType];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Select Role & Faculty</h2>
        <p className="text-muted-foreground text-sm mt-1">Choose the role and select a faculty member from database</p>
      </div>

      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}

      {/* Role Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium">Role</label>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            <span className="ml-1">Refresh</span>
          </Button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {dbRoles.map(role => {
              const active = selectedRole === role;
              const cfg = ROLE_CONFIG[role as RoleType];
              const count = dbFaculty.filter(f => f.role === role).length;
              return (
                <Card
                  key={role}
                  onClick={() => { setSelectedRole(role as RoleType); setSelectedFaculty(null); }}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    active ? "ring-2 ring-primary bg-primary/5 shadow-md" : "hover:bg-muted/50"
                  )}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-1">{cfg?.icon || "👤"}</div>
                    <div className="font-semibold text-sm">{role}</div>
                    <div className="text-xs text-muted-foreground mt-1">{count} member{count !== 1 ? "s" : ""}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Faculty select */}
      {selectedRole && (
        <div className="space-y-3">
          <label className="text-sm font-medium block">Faculty Member ({filteredFaculty.length})</label>

          {filteredFaculty.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members found for "{selectedRole}".</p>
          ) : (
            <Select
              value={selectedFaculty?.name || ""}
              onValueChange={v => {
                const f = filteredFaculty.find(x => x.staff_name === v);
                if (f) {
                  setSelectedFaculty({
                    slNo: 0,
                    name: f.staff_name,
                    accountNo: f.account_no || "",
                    pan: f.pan || "",
                    aadhaar: "",
                    role: f.role as RoleType,
                  });
                }
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select faculty..." /></SelectTrigger>
              <SelectContent>
                {filteredFaculty.map((f, i) => (
                  <SelectItem key={`${f.staff_name}-${i}`} value={f.staff_name}>{f.staff_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedFaculty && (
            <Card className="bg-muted/30">
              <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><span className="text-muted-foreground block text-xs">Account No</span>{selectedFaculty.accountNo || "—"}</div>
                <div><span className="text-muted-foreground block text-xs">PAN</span>{selectedFaculty.pan || "—"}</div>
                <div><span className="text-muted-foreground block text-xs">IFSC</span>{filteredFaculty.find(f => f.staff_name === selectedFaculty.name)?.ifsc || "—"}</div>
                <div><span className="text-muted-foreground block text-xs">Bank</span>{filteredFaculty.find(f => f.staff_name === selectedFaculty.name)?.bank_name || "—"}</div>
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
