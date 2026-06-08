import { Link } from "react-router-dom";
import { Phone, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-display mb-4">Trano<span className="text-primary">.mg</span></h3>
            <p className="text-sm opacity-80 leading-relaxed">
              La plateforme de location de maisons à Madagascar. Trouvez votre futur chez-vous facilement.
            </p>
          </div>
          <div>
            <h4 className="font-body font-semibold mb-4 text-sm uppercase tracking-wider">Liens utiles</h4>
            <div className="space-y-2">
              <Link to="/recherche" className="block text-sm opacity-70 hover:opacity-100 transition-opacity">Rechercher</Link>
              <Link to="/connexion" className="block text-sm opacity-70 hover:opacity-100 transition-opacity">Connexion</Link>
              <Link to="/inscription" className="block text-sm opacity-70 hover:opacity-100 transition-opacity">Inscription</Link>
            </div>
          </div>
          <div>
            <h4 className="font-body font-semibold mb-4 text-sm uppercase tracking-wider">Propriétaires</h4>
            <div className="space-y-2">
              <Link to="/inscription" className="block text-sm opacity-70 hover:opacity-100 transition-opacity">Publier une maison</Link>
              <Link to="/connexion" className="block text-sm opacity-70 hover:opacity-100 transition-opacity">Tableau de bord</Link>
            </div>
          </div>
          <div>
            <h4 className="font-body font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
            <div className="space-y-3">
              <a href="tel:+261341234567" className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                <Phone className="h-4 w-4" /> +261 34 12 345 67
              </a>
              <a href="https://wa.me/261341234567" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm opacity-60">
          © 2026 Trano.mg — Tous droits réservés
        </div>
      </div>
    </footer>
  );
};

export default Footer;
