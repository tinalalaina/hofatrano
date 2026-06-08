import { Button } from "@/components/ui/button";
import { House } from "@/data/mockData";
import { MapPin, Navigation } from "lucide-react";

interface PropertyLocationMapProps {
  house: House;
}

const toCoordinate = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
};

const getFullAddress = (house: House) => house.address?.trim() || `${house.quartier}, ${house.city}`;

const getOpenStreetMapEmbedUrl = (latitude: number, longitude: number) => {
  const offset = 0.01;
  const bbox = [longitude - offset, latitude - offset, longitude + offset, latitude + offset].join(",");
  const params = new URLSearchParams({
    bbox,
    layer: "mapnik",
    marker: `${latitude},${longitude}`,
  });

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
};

export const PropertyLocationMap = ({ house }: PropertyLocationMapProps) => {
  const latitude = toCoordinate(house.latitude);
  const longitude = toCoordinate(house.longitude);
  const hasCoordinates = latitude !== null && longitude !== null;
  const fullAddress = getFullAddress(house);
  const mapUrl = hasCoordinates ? getOpenStreetMapEmbedUrl(latitude, longitude) : null;

  const openDirections = () => {
    if (!hasCoordinates) return;

    const destination = `${latitude},${longitude}`;
    const fallbackUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&to=${encodeURIComponent(destination)}`;

    if (!navigator.geolocation) {
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origin = `${position.coords.latitude},${position.coords.longitude}`;
        const directionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(origin)}%3B${encodeURIComponent(destination)}`;
        window.open(directionsUrl, "_blank", "noopener,noreferrer");
      },
      () => window.open(fallbackUrl, "_blank", "noopener,noreferrer"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-display text-foreground">Emplacement de la maison</h2>
      </div>

      {hasCoordinates ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{fullAddress}</p>
          <div className="overflow-hidden rounded-xl border border-border shadow-sm">
            <iframe
              src={mapUrl ?? undefined}
              title={`Carte OpenStreetMap - ${fullAddress}`}
              className="h-[320px] w-full border-0 sm:h-[380px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <Button type="button" onClick={openDirections} className="gap-2">
            <Navigation className="h-4 w-4" />
            Itinéraire
          </Button>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          L'emplacement exact n'a pas été renseigné.
        </p>
      )}
    </section>
  );
};
