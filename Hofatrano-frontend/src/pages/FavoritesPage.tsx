import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { fetchFavorites } from "@/lib/api";
import { formatPrice } from "@/data/mockData";
import { Link } from "react-router-dom";

const FavoritesPage = () => {
  const { data: favorites = [] } = useQuery({ queryKey: ["client", "favorites"], queryFn: fetchFavorites });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-10 flex-1">
        <h1 className="text-2xl font-display mb-6">Mes favoris</h1>
        <div className="space-y-3">
          {favorites.map((fav: any) => (
            <Link key={fav.id} to={`/maison/${fav.house.id}`} className="border rounded-lg p-4 block hover:bg-muted/40">
              <div className="flex items-center gap-4">
                <div className="w-24 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                  {fav.house.image ? (
                    <img src={fav.house.image} alt={fav.house.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : null}
                </div>
                <div>
                  <p className="font-medium">{fav.house.title}</p>
                  <p className="text-sm text-muted-foreground">{fav.house.city} • {formatPrice(fav.house.price)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FavoritesPage;
