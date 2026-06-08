import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cities, quartiers } from "@/data/mockData";
import { PhotoUploader } from "@/features/owner/components/PhotoUploader";
import { HouseFormValues, UploadPhoto } from "@/features/owner/types";
import { LocateFixed } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

interface Props {
  initialValues: HouseFormValues;
  initialPhotos?: UploadPhoto[];
  isSubmitting?: boolean;
  onSubmit: (values: HouseFormValues, photos: UploadPhoto[]) => Promise<void>;
  submitLabel: string;
}

export const OwnerHouseForm = ({ initialValues, initialPhotos = [], onSubmit, submitLabel, isSubmitting }: Props) => {
  const [values, setValues] = useState<HouseFormValues>(initialValues);
  const [photos, setPhotos] = useState<UploadPhoto[]>(initialPhotos);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const cityQuartiers = useMemo(() => quartiers[values.city] || [], [values.city]);

  const toggle = (key: keyof HouseFormValues) => setValues((prev) => ({ ...prev, [key]: !prev[key as keyof HouseFormValues] }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(values, photos);
    setValues(initialValues);
    setPhotos([]);
  };

  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("La géolocalisation n’est pas disponible sur ce navigateur.");
      return;
    }

    setIsLocating(true);
    setLocationStatus("Recherche de votre position en cours…");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValues((currentValues) => ({
          ...currentValues,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setLocationStatus("Position trouvée. Vérifiez que le point correspond bien à la maison.");
        setIsLocating(false);
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Autorisez l’accès à votre position pour remplir automatiquement la latitude et la longitude."
            : "Impossible de récupérer votre position. Réessayez ou saisissez les coordonnées manuellement.";

        setLocationStatus(message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    );
  };

  return (
    <Card className="p-5">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input required value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Prix (MGA)</Label>
            <Input required type="number" min="0" value={values.price} onChange={(e) => setValues({ ...values, price: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Caution (MGA)</Label>
            <Input required type="number" min="0" value={values.cautionAmount} onChange={(e) => setValues({ ...values, cautionAmount: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Réservation journalière (MGA)</Label>
            <Input required type="number" min="0" value={values.dailyReservationPrice} onChange={(e) => setValues({ ...values, dailyReservationPrice: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea required value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Ville</Label>
            <Input
              required
              list="owner-city-suggestions"
              value={values.city}
              onChange={(e) => setValues({ ...values, city: e.target.value })}
              placeholder="Ex: Antananarivo"
            />
            <datalist id="owner-city-suggestions">
              {cities.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label>Quartier</Label>
            <Input
              required
              list="owner-quartier-suggestions"
              value={values.quartier}
              onChange={(e) => setValues({ ...values, quartier: e.target.value })}
              placeholder="Ex: Ivandry"
            />
            <datalist id="owner-quartier-suggestions">
              {cityQuartiers.map((quartier) => (
                <option key={quartier} value={quartier} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input required value={values.address} onChange={(e) => setValues({ ...values, address: e.target.value })} />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <Label>Position de la maison</Label>
              <p className="text-sm text-muted-foreground">
                Si vous êtes sur place, utilisez votre position actuelle pour remplir la latitude et la longitude.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleUseCurrentLocation} disabled={isLocating}>
              <LocateFixed className="h-4 w-4" />
              {isLocating ? "Recherche…" : "Utiliser ma position"}
            </Button>
          </div>
          {locationStatus ? <p className="text-sm text-muted-foreground">{locationStatus}</p> : null}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input
                type="number"
                step="any"
                value={values.latitude}
                onChange={(e) => setValues({ ...values, latitude: e.target.value })}
                placeholder="Ex: -18.8792"
              />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input
                type="number"
                step="any"
                value={values.longitude}
                onChange={(e) => setValues({ ...values, longitude: e.target.value })}
                placeholder="Ex: 47.5079"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="space-y-2">
            <Label>Chambres</Label>
            <Input required type="number" min="0" value={values.bedrooms} onChange={(e) => setValues({ ...values, bedrooms: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Salles de bain</Label>
            <Input required type="number" min="0" value={values.bathrooms} onChange={(e) => setValues({ ...values, bathrooms: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Téléphone 1</Label>
            <Input required value={values.ownerPhone1} onChange={(e) => setValues({ ...values, ownerPhone1: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Téléphone 2</Label>
            <Input value={values.ownerPhone2} onChange={(e) => setValues({ ...values, ownerPhone2: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Téléphone 3</Label>
            <Input value={values.ownerPhone3} onChange={(e) => setValues({ ...values, ownerPhone3: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Numéro WhatsApp</Label>
          <Input value={values.ownerWhatsapp} onChange={(e) => setValues({ ...values, ownerWhatsapp: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label>Équipements (séparés par des virgules)</Label>
          <Input value={values.equipments} onChange={(e) => setValues({ ...values, equipments: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border rounded-lg p-4">
          {[
            ["Meublée", "furnished"],
            ["Parking", "parking"],
            ["Eau", "water"],
            ["Électricité", "electricity"],
            ["Disponible immédiatement", "available"],
            ["Mise en avant", "featured"],
          ].map(([label, key]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <Checkbox checked={Boolean(values[key as keyof HouseFormValues])} onCheckedChange={() => toggle(key as keyof HouseFormValues)} />
              {label}
            </label>
          ))}
        </div>

        <PhotoUploader photos={photos} onChange={setPhotos} error={photoError} onError={setPhotoError} />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>{submitLabel}</Button>
        </div>
      </form>
    </Card>
  );
};
