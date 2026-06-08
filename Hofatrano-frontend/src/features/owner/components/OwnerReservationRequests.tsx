import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatOwnerCurrency } from "@/features/owner/services/ownerDashboard";
import { OwnerReservation } from "@/features/owner/types";

interface Props {
  reservations: OwnerReservation[];
  onStatusChange: (reservationId: number, status: "pending" | "confirmed" | "canceled" | "completed") => Promise<void>;
  isMutating?: boolean;
}

const statusLabel: Record<OwnerReservation["status"], string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  canceled: "Annulée",
  completed: "Terminée",
};

export const OwnerReservationRequests = ({ reservations, onStatusChange, isMutating = false }: Props) => (
  <div className="space-y-3">
    {reservations.length === 0 && <Card className="p-4 text-sm text-muted-foreground">Aucune réservation pour le moment.</Card>}
    {reservations.map((reservation) => (
      <Card key={reservation.id} className="p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_auto] lg:items-start">
          <div className="flex items-start gap-3 min-w-0">
            {reservation.houseImage ? (
              <img
                src={reservation.houseImage}
                alt={`Couverture ${reservation.houseTitle}`}
                className="w-20 h-20 rounded-md object-cover border"
                loading="lazy"
              />
            ) : (
              <div className="w-20 h-20 rounded-md border bg-muted text-xs text-muted-foreground flex items-center justify-center">Aucune photo</div>
            )}
            <div className="space-y-2 min-w-0">
              <p className="font-medium">{reservation.houseTitle}</p>
              <p className="text-sm">{reservation.start_date} → {reservation.end_date}</p>
              <p className="text-sm">Montant: {formatOwnerCurrency(reservation.total_price)}</p>
              <p className="text-sm">Paiement: {reservation.status === "pending" ? "En attente" : "Payé"}</p>
            </div>
          </div>

          <div className="rounded-md border p-3 bg-muted/30">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Client</p>
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={reservation.clientPhoto} alt={reservation.clientName} />
                <AvatarFallback>{reservation.clientName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium">{reservation.clientFirstName || "-"} {reservation.clientLastName || "-"}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <p>Pseudo: {reservation.clientName}</p>
              <p>Email: {reservation.clientEmail || "Non renseigné"}</p>
              <p>Téléphone: {reservation.clientPhone || "Non renseigné"}</p>
              <p>WhatsApp: {reservation.clientWhatsapp || "Non renseigné"}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-start lg:items-end">
            <Badge>{statusLabel[reservation.status]}</Badge>
            <div className="w-[180px]">
              <Select
                disabled={isMutating}
                value={reservation.status === "pending" ? "pending" : "paid"}
                onValueChange={(value) => void onStatusChange(reservation.id, value === "pending" ? "pending" : "confirmed")}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Statut paiement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Paiement en attente</SelectItem>
                  <SelectItem value="paid">Paiement payé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Select
                disabled={isMutating}
                value={reservation.status}
                onValueChange={(value) => void onStatusChange(reservation.id, value as "pending" | "confirmed" | "canceled" | "completed")}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Changer statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmée</SelectItem>
                  <SelectItem value="canceled">Annulée</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>
    ))}
  </div>
);
