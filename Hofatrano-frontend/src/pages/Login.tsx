import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginUser } from "@/lib/session";

const Login = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    try {
      const user = await loginUser(identifier, password);
      navigate(user.role === "owner" ? "/proprietaire/dashboard" : user.role === "admin" ? "/admin/dashboard" : "/client/profil");
    } catch {
      setError("Identifiants invalides");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-10 flex-1 max-w-md">
        <h1 className="text-2xl font-display mb-6">Connexion</h1>
        <div className="space-y-4">
          <Input placeholder="Nom d'utilisateur ou email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          <Input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button className="w-full" onClick={submit}>Se connecter</Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
