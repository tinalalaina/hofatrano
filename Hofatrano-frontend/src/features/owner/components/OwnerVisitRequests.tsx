import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatOwnerCurrency } from "@/features/owner/services/ownerDashboard";
import { OwnerVisit } from "@/features/owner/types";

interface Props {
  visits: OwnerVisit[];
  onAction: (visitId: number, action: "accept" | "refuse" | "done" | "cancel") => Promise<void>;
  onDepositStatusChange: (visitId: number, depositStatus: "unpaid" | "paid" | "refunded" | "deducted" | "kept") => Promise<void>;
  onStatusChange: (visitId: number, status: "pending" | "accepted" | "refused" | "canceled" | "done" | "no_show") => Promise<void>;
  onOpenDetails: (houseId: number) => void;
  isMutating?: boolean;
}

const statusLabel: Record<OwnerVisit["status"], string> = {
  pending: "En attente",
  accepted: "Confirmée",
  refused: "Refusée",
  canceled: "Annulée",
  done: "Terminée",
  no_show: "Absent",
  converted: "Convertie en réservation",
};

const depositLabel: Record<OwnerVisit["deposit_status"], string> = {
  unpaid: "Non payée",
  paid: "Payée",
  refunded: "Remboursée",
  deducted: "Déduite",
  kept: "Conservée",
};

export const OwnerVisitRequests = ({ visits, onAction, onDepositStatusChange, onStatusChange, onOpenDetails, isMutating = false }: Props) => (
  <div className="space-y-3">
    {visits.length === 0 && <Card className="p-4 text-sm text-muted-foreground">Aucune demande de visite pour le moment.</Card>}
    {visits.map((visit) => (
      <Card key={visit.id} className="p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)_auto] lg:items-start">
          <div className="flex items-start gap-3 min-w-0">
            {visit.houseImage ? (
              <img
                src={visit.houseImage}
                alt={`Couverture ${visit.houseTitle}`}
                className="w-20 h-20 rounded-md object-cover border cursor-pointer"
                loading="lazy"
                onClick={() => onOpenDetails(visit.house)}
              />
            ) : (
              <div className="w-20 h-20 rounded-md border bg-muted text-xs text-muted-foreground flex items-center justify-center">Aucune photo</div>
            )}
            <div className="space-y-2 min-w-0">
              <button className="font-medium text-left hover:underline" onClick={() => onOpenDetails(visit.house)}>
                {visit.houseTitle}
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <p className="text-sm rounded-md border px-2 py-1 bg-muted/20">
                  Prix location: <span className="font-medium">{formatOwnerCurrency(visit.housePrice)}</span>
                </p>
                <p className="text-sm rounded-md border px-2 py-1 bg-muted/20">
                  Caution de la maison: <span className="font-medium">{formatOwnerCurrency(visit.houseCautionAmount)}</span>
                </p>
              </div>
              <p className="text-sm">Date souhaitée: {new Date(visit.requested_date).toLocaleString("fr-FR")}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{statusLabel[visit.status]}</Badge>
                <div className="min-w-[170px]">
                  <Select
                    value={visit.status}
                    onValueChange={(value) => void onStatusChange(visit.id, value as "pending" | "accepted" | "refused" | "canceled" | "done" | "no_show")}
                    disabled={isMutating || visit.status === "converted"}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Statut visite" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="accepted">Confirmée</SelectItem>
                      <SelectItem value="refused">Refusée</SelectItem>
                      <SelectItem value="canceled">Annulée</SelectItem>
                      <SelectItem value="done">Terminée</SelectItem>
                      <SelectItem value="no_show">Absent</SelectItem>
                      <SelectItem value="converted">Convertie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Badge variant="secondary">
                  Caution visite: {formatOwnerCurrency(visit.deposit_amount || 0)} ({depositLabel[visit.deposit_status]})
                </Badge>
                <div className="min-w-[170px]">
                  <Select
                    value={visit.deposit_status}
                    onValueChange={(value) => void onDepositStatusChange(visit.id, value as "unpaid" | "paid" | "refunded" | "deducted" | "kept")}
                    disabled={isMutating}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Statut paiement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Non payée</SelectItem>
                      <SelectItem value="paid">Payée</SelectItem>
                      <SelectItem value="refunded">Remboursée</SelectItem>
                      <SelectItem value="deducted">Déduite</SelectItem>
                      <SelectItem value="kept">Conservée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border p-3 bg-muted/30">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Client</p>
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={visit.clientPhoto} alt={visit.clientName} />
                <AvatarFallback>{visit.clientName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium">{visit.clientFirstName || "-"} {visit.clientLastName || "-"}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <p>Pseudo: {visit.clientName}</p>
              <p>Email: {visit.clientEmail || "Non renseigné"}</p>
              <p>Téléphone: {visit.clientPhone || "Non renseigné"}</p>
              <p>WhatsApp: {visit.clientWhatsapp || "Non renseigné"}</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap lg:justify-end">
            {visit.status === "pending" && (
              <>
                <div className="min-w-[170px]">
                  <Select
                    disabled={isMutating}
                    onValueChange={(value) => void onAction(visit.id, value as "accept" | "refuse" | "cancel")}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Changer statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accept">Confirmer</SelectItem>
                      <SelectItem value="refuse">Refuser</SelectItem>
                      <SelectItem value="cancel">Annuler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isMutating}
                  onClick={() => {
                    if (window.confirm("Confirmer l'acceptation de cette demande de visite ?")) void onAction(visit.id, "accept");
                  }}
                >
                  Accepter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isMutating}
                  onClick={() => {
                    if (window.confirm("Refuser cette demande de visite ?")) void onAction(visit.id, "refuse");
                  }}
                >
                  Refuser
                </Button>
                <Button
                  size="sm"
                  className="bg-orange-500 text-white hover:bg-orange-600"
                  disabled={isMutating}
                  onClick={() => {
                    if (window.confirm("Annuler cette demande de visite ?")) void onAction(visit.id, "cancel");
                  }}
                >
                  Annuler
                </Button>
              </>
            )}
            {visit.status === "accepted" && (
              <>
                <Button
                  size="sm"
                  className="bg-orange-500 text-white hover:bg-orange-600"
                  disabled={isMutating}
                  onClick={() => {
                    if (window.confirm("Annuler cette visite ?")) void onAction(visit.id, "cancel");
                  }}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  disabled={isMutating}
                  onClick={() => {
                    if (window.confirm("Confirmer que la visite est terminée ?")) void onAction(visit.id, "done");
                  }}
                >
                  Marquer terminée
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    ))}
  </div>
);
