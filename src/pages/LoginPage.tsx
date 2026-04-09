import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/context/AppContext";
import { Lock, User } from "lucide-react";

export default function LoginPage() {
  const { login } = useAppState();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(username, password)) {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <img src="/kle_logo.png" alt="KLE Logo" className="h-20 w-auto" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-primary">KLE Technological University</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Faculty Workload Management System</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="pl-10" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full text-base font-semibold">Sign In</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
