import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerUser } from "@/lib/session";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"client" | "owner" | "admin">("client");
  const [errorMessage, setErrorMessage] = useState("");
  const allowAdminSignup = import.meta.env.VITE_ALLOW_ADMIN_SIGNUP === "true";

  const submit = async () => {
    try {
      setErrorMessage("");
      await registerUser({ username, email, password, role });
      const redirectPath = searchParams.get("redirect");
      if (role === "owner") {
        navigate("/proprietaire/dashboard");
        return;
      }
      if (role === "admin") {
        navigate("/admin/dashboard");
        return;
      }
      if (redirectPath) {
        navigate(redirectPath);
        return;
      }
      navigate("/client/profil");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Inscription impossible";
      setErrorMessage(message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-10 flex-1 max-w-md">
        <h1 className="text-2xl font-display mb-6">Inscription</h1>
        <div className="space-y-4">
          <Input placeholder="Nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex gap-2 flex-wrap">
            <Button type="button" variant={role === "client" ? "default" : "outline"} onClick={() => setRole("client")}>Client</Button>
            <Button type="button" variant={role === "owner" ? "default" : "outline"} onClick={() => setRole("owner")}>Propriétaire</Button>
            {allowAdminSignup && (
              <Button type="button" variant={role === "admin" ? "default" : "outline"} onClick={() => setRole("admin")}>Admin</Button>
            )}
          </div>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <Button className="w-full" onClick={submit}>Créer un compte</Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Register;
