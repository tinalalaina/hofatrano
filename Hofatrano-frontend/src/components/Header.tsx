import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { fetchMe, logoutUser } from "@/lib/session";
import { getToken } from "@/lib/auth";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const isLoggedIn = useMemo(() => !!getToken(), []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchMe().then((u) => setRole(u?.role || null));
    }
  }, [isLoggedIn]);

  const dashboardLink = role === "owner" ? "/proprietaire/dashboard" : role === "admin" ? "/admin/dashboard" : "/client/profil";

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2"><span className="text-2xl font-display text-primary">Trano</span><span className="text-sm font-body text-muted-foreground">.mg</span></Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">Accueil</Link>
          <Link to="/recherche" className="text-sm font-medium text-foreground hover:text-primary transition-colors">Rechercher</Link>
          <Link to="/recherche?featured=true" className="text-sm font-medium text-foreground hover:text-primary transition-colors">En vedette</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link to="/favoris"><Heart className="h-5 w-5" /></Link></Button>
          {isLoggedIn ? (
            <>
              <Button variant="outline" size="sm" asChild><Link to={dashboardLink}>Dashboard</Link></Button>
              <Button size="sm" onClick={async () => { await logoutUser(); navigate("/"); }}>Déconnexion</Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild><Link to="/connexion">Connexion</Link></Button>
              <Button size="sm" asChild><Link to="/inscription">S'inscrire</Link></Button>
            </>
          )}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</Button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-3">
          <Link to="/" className="block py-2 text-sm font-medium text-foreground" onClick={() => setMobileOpen(false)}>Accueil</Link>
          <Link to="/recherche" className="block py-2 text-sm font-medium text-foreground" onClick={() => setMobileOpen(false)}>Rechercher</Link>
          <div className="flex gap-2 pt-2">
            {isLoggedIn ? (
              <Button size="sm" className="flex-1" onClick={async () => { await logoutUser(); navigate("/"); }}>Déconnexion</Button>
            ) : (
              <>
                <Button variant="outline" size="sm" className="flex-1" asChild><Link to="/connexion">Connexion</Link></Button>
                <Button size="sm" className="flex-1" asChild><Link to="/inscription">S'inscrire ok</Link></Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
