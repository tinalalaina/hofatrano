import heroImage from "@/assets/hero-madagascar.jpg";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowRight, Home, Shield, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchHouses } from "@/lib/api";

const Index = () => {
  const { data: houses = [] } = useQuery({
    queryKey: ["houses"],
    queryFn: () => fetchHouses(),
  });

  const featured = houses.filter((h) => h.featured);
  const newest = [...houses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const urgent = houses.filter((h) => h.urgent);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <section className="relative h-[70vh] min-h-[500px] flex items-center">
        <img src={heroImage} alt="Madagascar paysage" width={1920} height={1080} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/50 to-transparent" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-primary-foreground leading-tight mb-4 animate-fade-in-up">
              Trouvez votre <span className="text-accent">trano</span> idéal à Madagascar teste ceci cicd avec infra
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-8 font-body animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              Location de maisons dans toute l'île. Simple, rapide et sécurisé.
            </p>
          </div>
          <div className="max-w-3xl animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <SearchBar />
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="py-16 container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-display text-foreground">Maisons en vedette</h2>
            <Button variant="ghost" asChild>
              <Link to="/recherche?featured=true">Voir tout <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((h) => <PropertyCard key={h.id} house={h} />)}
          </div>
        </section>
      )}

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-display text-foreground">Nouvelles annonces</h2>
            <Button variant="ghost" asChild>
              <Link to="/recherche">Voir tout <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newest.map((h) => <PropertyCard key={h.id} house={h} />)}
          </div>
        </div>
      </section>

      {urgent.length > 0 && (
        <section className="py-16 container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display text-foreground mb-8">🔥 Annonces urgentes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {urgent.map((h) => <PropertyCard key={h.id} house={h} />)}
          </div>
        </section>
      )}

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-display text-foreground mb-12">Comment ça marche ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Home, title: "Trouvez", desc: "Parcourez des centaines de maisons dans toute Madagascar" },
              { icon: Phone, title: "Contactez", desc: "Appelez ou envoyez un WhatsApp au propriétaire directement" },
              { icon: Shield, title: "Réservez", desc: "Visitez, payez la caution et réservez en toute sécurité" },
            ].map((step) => (
              <div key={step.title} className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"><step.icon className="h-7 w-7 text-primary" /></div>
                <h3 className="font-display text-xl text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
