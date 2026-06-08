import { useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchHouses } from "@/lib/api";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [quartier, setQuartier] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") || "");
  const [furnished, setFurnished] = useState(false);
  const [parking, setParking] = useState(false);
  const [water, setWater] = useState(false);
  const [electricity, setElectricity] = useState(false);
  const [available, setAvailable] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: results = [] } = useQuery({
    queryKey: ["houses", { city, quartier, minPrice, maxPrice, bedrooms, furnished, parking, water, electricity, available }],
    queryFn: () => fetchHouses({ city, quartier, minPrice, maxPrice, bedrooms, furnished, parking, water, electricity, available }),
  });

  const { data: allHouses = [] } = useQuery({
    queryKey: ["houses", "all"],
    queryFn: () => fetchHouses(),
  });

  const cities = useMemo(() => [...new Set(allHouses.map((h) => h.city))], [allHouses]);
  const availableQuartiers = useMemo(() => {
    if (!city) return [];
    return [...new Set(allHouses.filter((h) => h.city === city).map((h) => h.quartier))];
  }, [allHouses, city]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-display text-foreground">Rechercher une maison</h1>
          <Button variant="outline" size="sm" className="md:hidden" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4 mr-2" /> Filtres
          </Button>
        </div>

        <div className="flex gap-8">
          <aside className={`${showFilters ? "block" : "hidden"} md:block w-full md:w-64 flex-shrink-0`}>
            <div className="bg-card rounded-lg p-5 shadow-card space-y-5 sticky top-20">
              <h3 className="font-body font-semibold text-sm text-foreground">Filtres</h3>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Ville</Label>
                <Select value={city} onValueChange={(v) => { setCity(v); setQuartier(""); }}>
                  <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                  <SelectContent>{cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {availableQuartiers.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Quartier</Label>
                  <Select value={quartier} onValueChange={setQuartier}>
                    <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                    <SelectContent>{availableQuartiers.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Prix min</Label>
                  <Input type="number" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Prix max</Label>
                  <Input type="number" placeholder="∞" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Chambres min</Label>
                <Select value={bedrooms} onValueChange={setBedrooms}>
                  <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                  <SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}+</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { label: "Meublée", checked: furnished, set: setFurnished },
                  { label: "Parking", checked: parking, set: setParking },
                  { label: "Eau", checked: water, set: setWater },
                  { label: "Électricité", checked: electricity, set: setElectricity },
                  { label: "Disponible", checked: available, set: setAvailable },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-2">
                    <Checkbox id={f.label} checked={f.checked} onCheckedChange={(v) => f.set(!!v)} />
                    <Label htmlFor={f.label} className="text-sm text-foreground cursor-pointer">{f.label}</Label>
                  </div>
                ))}
              </div>

              <Button variant="ghost" size="sm" className="w-full" onClick={() => {
                setCity(""); setQuartier(""); setMinPrice(""); setMaxPrice(""); setBedrooms("");
                setFurnished(false); setParking(false); setWater(false); setElectricity(false); setAvailable(false);
              }}><X className="h-3 w-3 mr-1" /> Réinitialiser</Button>
            </div>
          </aside>

          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-4">{results.length} résultat{results.length !== 1 ? "s" : ""}</p>
            {results.length === 0 ? (
              <div className="text-center py-20"><p className="text-lg text-muted-foreground">Aucune maison trouvée avec ces critères.</p></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{results.map((h) => <PropertyCard key={h.id} house={h} />)}</div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;
