import { useState, useEffect, useMemo } from "react";
import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { RoleType, ROLE_CONFIG } from "@/types/faculty";
import { RefreshCw, AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  // Add Role dialog
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  // Add Faculty dialog
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [newFaculty, setNewFaculty] = useState({ staff_name: "", account_no: "", pan: "", ifsc: "", bank_name: "" });
  const [addingFaculty, setAddingFaculty] = useState(false);

  // Delete Role confirmation
  const [deleteRoleConfirm, setDeleteRoleConfirm] = useState<string | null>(null);
  const [deletingRole, setDeletingRole] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: roleData, error: roleErr } = await supabase
        .from("remuneration_records")
        .select("role")
        .neq("role", "")
        .neq("role", "Name of the Examiner");
      if (roleErr) throw roleErr;
      const roles = [...new Set((roleData || []).map(r => r.role))].sort();
      setDbRoles(roles);

      const { data: staffData, error: staffErr } = await supabase
        .from("remuneration_records")
        .select("staff_name, role, account_no, pan, ifsc, bank_name")
        .neq("staff_name", "")
        .neq("role", "");
      if (staffErr) throw staffErr;

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

  const handleAddRole = () => {
    const trimmed = newRoleName.trim();
    if (!trimmed) return;
    if (dbRoles.includes(trimmed)) {
      toast.error("Role already exists");
      return;
    }
    setDbRoles(prev => [...prev, trimmed].sort());
    setSelectedRole(trimmed as RoleType);
    setSelectedFaculty(null);
    setNewRoleName("");
    setShowAddRole(false);
    toast.success(`Role "${trimmed}" added`);
  };

  const handleAddFaculty = async () => {
    if (!newFaculty.staff_name.trim() || !selectedRole) return;
    setAddingFaculty(true);
    try {
      const { error: err } = await supabase.from("remuneration_records").insert({
        staff_name: newFaculty.staff_name.trim(),
        role: selectedRole,
        account_no: newFaculty.account_no || null,
        pan: newFaculty.pan || null,
        ifsc: newFaculty.ifsc || null,
        bank_name: newFaculty.bank_name || null,
        department: "",
        total_amount: 0,
      });
      if (err) throw err;

      // Add to local state
      const newEntry: DBFaculty = {
        staff_name: newFaculty.staff_name.trim(),
        role: selectedRole,
        account_no: newFaculty.account_no || null,
        pan: newFaculty.pan || null,
        ifsc: newFaculty.ifsc || null,
        bank_name: newFaculty.bank_name || null,
      };
      setDbFaculty(prev => [...prev, newEntry]);
      setNewFaculty({ staff_name: "", account_no: "", pan: "", ifsc: "", bank_name: "" });
      setShowAddFaculty(false);
      toast.success(`Faculty "${newEntry.staff_name}" added under ${selectedRole}`);
    } catch (e: any) {
      toast.error("Failed to add: " + (e.message || "Unknown error"));
    } finally {
      setAddingFaculty(false);
    }
  };

  const handleDeleteRole = async (role: string) => {
    setDeletingRole(true);
    try {
      const { error: err } = await supabase
        .from("remuneration_records")
        .delete()
        .eq("role", role);
      if (err) throw err;

      // Update local state
      setDbRoles(prev => prev.filter(r => r !== role));
      setDbFaculty(prev => prev.filter(f => f.role !== role));
      if (selectedRole === role) {
        setSelectedRole(null as any);
        setSelectedFaculty(null);
      }
      toast.success(`Role "${role}" and all associated faculty deleted`);
    } catch (e: any) {
      toast.error("Failed to delete role: " + (e.message || "Unknown error"));
    } finally {
      setDeletingRole(false);
      setDeleteRoleConfirm(null);
    }
  };

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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddRole(true)}>
              <Plus className="h-3 w-3 mr-1" /> Add Role
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              <span className="ml-1">Refresh</span>
            </Button>
          </div>
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
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Faculty Member ({filteredFaculty.length})</label>
            <Button variant="outline" size="sm" onClick={() => setShowAddFaculty(true)}>
              <Plus className="h-3 w-3 mr-1" /> Add Faculty
            </Button>
          </div>

          {filteredFaculty.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members found for "{selectedRole}". Add one using the button above.</p>
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

      {/* Add Role Dialog */}
      <Dialog open={showAddRole} onOpenChange={setShowAddRole}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>Enter a name for the new role</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Role Name</Label>
              <Input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g. Lab Assistant" onKeyDown={e => e.key === "Enter" && handleAddRole()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRole(false)}>Cancel</Button>
            <Button onClick={handleAddRole} disabled={!newRoleName.trim()}>Add Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Faculty Dialog */}
      <Dialog open={showAddFaculty} onOpenChange={setShowAddFaculty}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Faculty</DialogTitle>
            <DialogDescription>Add a new faculty member under "{selectedRole}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Staff Name *</Label>
              <Input value={newFaculty.staff_name} onChange={e => setNewFaculty(f => ({ ...f, staff_name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Account No</Label>
                <Input value={newFaculty.account_no} onChange={e => setNewFaculty(f => ({ ...f, account_no: e.target.value }))} placeholder="Bank account" />
              </div>
              <div>
                <Label>PAN</Label>
                <Input value={newFaculty.pan} onChange={e => setNewFaculty(f => ({ ...f, pan: e.target.value }))} placeholder="PAN number" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>IFSC</Label>
                <Input value={newFaculty.ifsc} onChange={e => setNewFaculty(f => ({ ...f, ifsc: e.target.value }))} placeholder="IFSC code" />
              </div>
              <div>
                <Label>Bank Name</Label>
                <Input value={newFaculty.bank_name} onChange={e => setNewFaculty(f => ({ ...f, bank_name: e.target.value }))} placeholder="Bank name" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFaculty(false)}>Cancel</Button>
            <Button onClick={handleAddFaculty} disabled={!newFaculty.staff_name.trim() || addingFaculty}>
              {addingFaculty ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Add Faculty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
