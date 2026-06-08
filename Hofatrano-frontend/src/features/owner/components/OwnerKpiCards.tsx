import { Card } from "@/components/ui/card";
import { formatOwnerCurrency } from "@/features/owner/services/ownerDashboard";
import { OwnerStats } from "@/features/owner/types";

export const OwnerKpiCards = ({ stats }: { stats: OwnerStats }) => {
  const cards = [
    { label: "Maisons publiées", value: stats.houses_total },
    { label: "En attente de validation", value: stats.houses_pending_validation },
    { label: "Demandes de visite", value: stats.visits_pending },
    { label: "Réservations", value: stats.reservations_total },
    { label: "Revenus générés", value: formatOwnerCurrency(stats.revenue_total) },
    { label: "Annonces mises en avant", value: stats.featured_ads },
  ];

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-5 rounded-2xl">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="text-2xl font-semibold">{card.value}</p>
        </Card>
      ))}
    </div>
  );
};
