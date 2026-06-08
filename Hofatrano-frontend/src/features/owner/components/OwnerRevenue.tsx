import { Card } from "@/components/ui/card";
import { formatOwnerCurrency } from "@/features/owner/services/ownerDashboard";
import { OwnerEarning } from "@/features/owner/types";

export const OwnerRevenue = ({ earnings }: { earnings: OwnerEarning[] }) => {
  const total = earnings.reduce((sum, item) => sum + item.netAmount, 0);
  const totalGross = earnings.reduce((sum, item) => sum + item.grossAmount, 0);
  const commissions = earnings.reduce((sum, item) => sum + item.commissionAmount, 0);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-3">
        <Card className="p-4"><p className="text-sm text-muted-foreground">Total gagné</p><p className="text-2xl font-semibold">{formatOwnerCurrency(total)}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">Réservations payées</p><p className="text-2xl font-semibold">{earnings.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">Commissions prélevées</p><p className="text-2xl font-semibold">{formatOwnerCurrency(commissions)}</p></Card>
      </div>

      <Card className="p-4 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Maison</th>
              <th className="py-2">Montant brut</th>
              <th className="py-2">Commission</th>
              <th className="py-2">Net</th>
              <th className="py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {earnings.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-2">{item.houseTitle}</td>
                <td className="py-2">{formatOwnerCurrency(item.grossAmount)}</td>
                <td className="py-2">{formatOwnerCurrency(item.commissionAmount)}</td>
                <td className="py-2 font-medium">{formatOwnerCurrency(item.netAmount)}</td>
                <td className="py-2">{new Date(item.paidAt).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
            {!earnings.length && (
              <tr>
                <td className="py-3 text-muted-foreground" colSpan={5}>Aucun revenu disponible.</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="py-2 font-semibold">Total brut</td>
              <td className="py-2 font-semibold">{formatOwnerCurrency(totalGross)}</td>
              <td className="py-2" colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  );
};
