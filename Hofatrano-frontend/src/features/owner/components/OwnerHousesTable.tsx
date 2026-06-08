import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatOwnerCurrency } from "@/features/owner/services/ownerDashboard";
import { houseStatusLabel, OwnerHouse } from "@/features/owner/types";

interface Props {
  houses: OwnerHouse[];
  onEdit: (houseId: string) => void;
  onDelete: (houseId: string) => void;
  onOpenInvoice: (houseId: string) => void;
  onStopPublication: (house: OwnerHouse) => void;
  onOpenDetails: (houseId: string) => void;
}

export const OwnerHousesTable = ({ houses, onEdit, onDelete, onOpenInvoice, onStopPublication, onOpenDetails }: Props) => (
  <div className="space-y-3">
    {houses.length === 0 && <Card className="p-4 text-sm text-muted-foreground">Vous n'avez pas encore publié de maison.</Card>}
    {houses.map((house) => (
      <Card key={house.id} className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start gap-3">
            {house.image ? (
              <img
                src={house.image}
                alt={`Couverture ${house.title}`}
                className="w-20 h-20 rounded-md object-cover border cursor-pointer"
                loading="lazy"
                onClick={() => onOpenDetails(house.id)}
              />
            ) : (
              <div className="w-20 h-20 rounded-md border bg-muted text-xs text-muted-foreground flex items-center justify-center">Aucune photo</div>
            )}
            <div>
              <button className="font-semibold text-left hover:underline" onClick={() => onOpenDetails(house.id)}>{house.title}</button>
              <p className="text-sm text-muted-foreground">{house.city} • {house.quartier} • {house.address}</p>
              <p className="text-sm">{formatOwnerCurrency(house.price)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Badge variant="outline">{houseStatusLabel[house.status]}</Badge>
            {(house.status === "pending_validation" || house.publication_stopped || !house.publication_paid) && (
              <Button size="sm" variant="secondary" onClick={() => onOpenInvoice(house.id)}>Facture publication</Button>
            )}
            {house.status !== "pending_validation" && !house.publication_stopped && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStopPublication(house)}
              >
                Arrêter publication
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onEdit(house.id)}>Modifier</Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(house.id)}>Supprimer</Button>
          </div>
        </div>
      </Card>
    ))}
  </div>
);
