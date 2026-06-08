import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchMe, SessionUser } from "@/lib/session";
import { getToken } from "@/lib/auth";

interface Props {
  children: ReactNode;
  roles?: SessionUser["role"][];
}

const ProtectedRoute = ({ children, roles }: Props) => {
  const token = getToken();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      const me = await fetchMe();
      if (!mounted) return;
      setUser(me);
      setIsLoading(false);
    };

    loadSession();

    return () => {
      mounted = false;
    };
  }, [token]);

  if (!token) return <Navigate to="/connexion" replace />;
  if (isLoading) return <div className="container mx-auto px-4 py-10">Vérification de la session...</div>;
  if (!user) return <Navigate to="/connexion" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === "owner" ? "/proprietaire/dashboard" : user.role === "admin" ? "/admin/dashboard" : "/client/profil"} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
