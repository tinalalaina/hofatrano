import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelReservation, cancelVisit, deleteFavorite, deleteReservation, deleteVisit, fetchFavorites, fetchHouses, fetchReservations, fetchVisits } from "@/lib/api";
import { formatPrice } from "@/data/mockData";
import { Link, useSearchParams } from "react-router-dom";
import { ProfileCompletionCard } from "@/components/ProfileCompletionCard";

type FavoriteItem = Awaited<ReturnType<typeof fetchFavorites>>[number];
const reservationStatusLabel: Record<string, string> = {
  pending: "En attente de confirmation",
  confirmed: "Confirmée",
  canceled: "Annulée",
  completed: "Terminée",
};
const visitStatusLabel: Record<string, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  refused: "Refusée",
  canceled: "Annulée",
  done: "Terminée",
  no_show: "Absent",
  converted: "Convertie en réservation",
};

const ClientProfile = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { data: houses = [] } = useQuery({ queryKey: ["houses"], queryFn: () => fetchHouses() });
  const { data: visits = [] } = useQuery({ queryKey: ["client", "visits"], queryFn: fetchVisits });
  const { data: reservations = [] } = useQuery({ queryKey: ["client", "reservations"], queryFn: fetchReservations });
  const { data: favorites = [] } = useQuery({ queryKey: ["client", "favorites"], queryFn: fetchFavorites });
  const housesById = new Map(houses.map((house) => [String(house.id), house]));
  const activeTab = searchParams.get("tab");
  const defaultTab = activeTab === "reservations" || activeTab === "favoris" || activeTab === "visites" ? activeTab : "visites";

  const getHouseCover = (item: { house?: number; house_image?: string; house_image_url?: string; houseImage?: string }) => {
    if (item.houseImage) return item.houseImage;
    if (item.house_image_url) return item.house_image_url;
    if (item.house_image) return item.house_image;
    if (item.house === undefined) return "";
    return housesById.get(String(item.house))?.image || "";
  };

  const getHouseDetails = (houseId?: number) => {
    if (houseId === undefined) return null;
    return housesById.get(String(houseId)) || null;
  };

  const depositStatusLabel: Record<string, string> = {
    unpaid: "Non payée",
    paid: "Payée",
    refunded: "Remboursée",
    deducted: "Déduite",
    kept: "Conservée",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-10 flex-1 space-y-6">
        <h1 className="text-2xl font-display">Espace client</h1>
        <ProfileCompletionCard />
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            <TabsTrigger value="visites">Mes visites</TabsTrigger>
            <TabsTrigger value="reservations">Mes réservations</TabsTrigger>
            <TabsTrigger value="favoris">Mes favoris</TabsTrigger>
          </TabsList>

          <TabsContent value="visites" className="space-y-3">
            {visits.map((visit) => (
              <div key={visit.id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Link to={`/maison/${visit.house}`} className="w-24 h-16 rounded-md overflow-hidden bg-muted shrink-0 block">
                    {getHouseCover(visit) ? (
                      <img src={getHouseCover(visit)} alt={visit.houseTitle} className="w-full h-full object-cover" loading="lazy" />
                    ) : null}
                  </Link>
                  <div>
                  <p className="font-medium">{visit.houseTitle}</p>
                  <p className="text-sm text-muted-foreground">{new Date(visit.requested_date).toLocaleString("fr-FR")} • statut: {visitStatusLabel[visit.status] || visit.status}</p>
                  <p className="text-sm text-muted-foreground">Téléphone propriétaire: {getHouseDetails(visit.house)?.ownerPhone || "Non renseigné"}</p>
                  <p className="text-sm text-muted-foreground">Prix/mois: {formatPrice(getHouseDetails(visit.house)?.price || 0)} • Réservation journalière: {formatPrice(getHouseDetails(visit.house)?.daily_reservation_price || 0)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    className="bg-orange-500 text-white hover:bg-orange-600"
                    onClick={async () => {
                      if (!window.confirm("Voulez-vous vraiment annuler cette visite ?")) return;
                      await cancelVisit(visit.id);
                      await queryClient.invalidateQueries({ queryKey: ["client", "visits"] });
                    }}
                  >
                    Annuler la visite
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!window.confirm("Voulez-vous vraiment supprimer cette visite ?")) return;
                      await deleteVisit(visit.id);
                      await queryClient.invalidateQueries({ queryKey: ["client", "visits"] });
                    }}
                  >
                    Supprimer la visite
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="reservations" className="space-y-3">
            {reservations.map((r) => (
              <div key={r.id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Link to={`/maison/${r.house}`} className="w-24 h-16 rounded-md overflow-hidden bg-muted shrink-0 block">
                    {getHouseCover(r) ? (
                      <img src={getHouseCover(r)} alt={r.houseTitle} className="w-full h-full object-cover" loading="lazy" />
                    ) : null}
                  </Link>
                  <div>
                    <p className="font-medium">{r.houseTitle}</p>
                    <p className="text-sm text-muted-foreground">{r.start_date} → {r.end_date} • {reservationStatusLabel[r.status] || r.status}</p>
                    <p className="text-sm text-muted-foreground">Téléphone propriétaire: {getHouseDetails(r.house)?.ownerPhone || "Non renseigné"}</p>
                    <p className="text-sm text-muted-foreground">Prix/mois: {formatPrice(getHouseDetails(r.house)?.price || 0)} • Réservation journalière: {formatPrice(getHouseDetails(r.house)?.daily_reservation_price || 0)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    className="bg-orange-500 text-white hover:bg-orange-600"
                    onClick={async () => {
                      if (!window.confirm("Voulez-vous vraiment annuler cette réservation ?")) return;
                      await cancelReservation(r.id);
                      await queryClient.invalidateQueries({ queryKey: ["client", "reservations"] });
                    }}
                  >
                    Annuler la réservation
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!window.confirm("Voulez-vous vraiment supprimer cette réservation ?")) return;
                      await deleteReservation(r.id);
                      await queryClient.invalidateQueries({ queryKey: ["client", "reservations"] });
                    }}
                  >
                    Supprimer la réservation
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="favoris" className="space-y-3">
            {favorites.map((fav: FavoriteItem) => (
              <div key={fav.id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Link to={`/maison/${fav.house.id}`} className="w-24 h-16 rounded-md overflow-hidden bg-muted shrink-0 block">
                    {fav.house.image ? (
                      <img src={fav.house.image} alt={fav.house.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : null}
                  </Link>
                  <div>
                  <p className="font-medium">{fav.house.title}</p>
                  <p className="text-sm text-muted-foreground">{fav.house.city} • {formatPrice(fav.house.price)}</p>
                  <p className="text-sm text-muted-foreground">Téléphone propriétaire: {fav.house.ownerPhone || "Non renseigné"}</p>
                  <p className="text-sm text-muted-foreground">Réservation journalière: {formatPrice(fav.house.daily_reservation_price || 0)}</p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!window.confirm("Voulez-vous vraiment supprimer ce favori ?")) return;
                    await deleteFavorite(fav.id);
                    await queryClient.invalidateQueries({ queryKey: ["client", "favorites"] });
                  }}
                >
                  Supprimer le favori
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default ClientProfile;
