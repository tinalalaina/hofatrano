import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatOwnerCurrency, paymentStatusLabel, paymentTypeLabel } from "@/features/owner/services/ownerDashboard";
import { OwnerPayment } from "@/features/owner/types";

export const OwnerPayments = ({ payments }: { payments: OwnerPayment[] }) => (
  <div className="space-y-3">
    <Card className="p-4">
      <p className="font-semibold">Paiement publication & mise en avant</p>
      <p className="text-sm text-muted-foreground">Suivez le statut de paiement de chaque maison.</p>
    </Card>

    {payments.map((payment) => (
      <Card key={payment.id} className="p-4">
        <div className="flex flex-col md:flex-row md:justify-between gap-3">
          <div className="flex items-start gap-3">
            {payment.houseImage ? (
              <img
                src={payment.houseImage}
                alt={`Couverture ${payment.houseTitle}`}
                className="w-20 h-20 rounded-md object-cover border"
                loading="lazy"
              />
            ) : (
              <div className="w-20 h-20 rounded-md border bg-muted text-xs text-muted-foreground flex items-center justify-center">Aucune photo</div>
            )}
            <div>
              <p className="font-medium">{payment.houseTitle}</p>
              <p className="text-sm text-muted-foreground">{paymentTypeLabel(payment.type)}</p>
              <p className="text-sm">Montant: {formatOwnerCurrency(payment.amount)}</p>
              <p className="text-sm text-muted-foreground">Date: {new Date(payment.paidAt).toLocaleDateString("fr-FR")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={payment.status === "paid" ? "default" : "secondary"}>{paymentStatusLabel(payment.status)}</Badge>
            <Button variant="outline" size="sm">Payer maintenant</Button>
          </div>
        </div>
      </Card>
    ))}
  </div>
);
