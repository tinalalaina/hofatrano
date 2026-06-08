import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  onNavigate: (value: string) => void;
}

export const OwnerQuickActions = ({ onNavigate }: Props) => {
  const actions = [
    ["Ajouter une maison", "ajouter"],
    ["Voir mes maisons", "maisons"],
    ["Voir demandes de visite", "visites"],
    ["Voir demandes de réservation", "reservations"],
  ] as const;

  return (
    <Card className="p-5 rounded-2xl">
      <p className="font-semibold mb-3">Raccourcis</p>
      <div className="flex flex-wrap gap-2">
        {actions.map(([label, value]) => (
          <Button key={value} variant="outline" onClick={() => onNavigate(value)}>
            {label}
          </Button>
        ))}
      </div>
    </Card>
  );
};
