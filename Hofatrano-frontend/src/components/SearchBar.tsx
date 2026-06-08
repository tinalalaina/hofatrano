import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const cities = [
  "Antananarivo",
  "Toamasina",
  "Antsirabe",
  "Fianarantsoa",
  "Mahajanga",
  "Toliara",
  "Antsiranana",
  "Nosy Be",
];

const SearchBar = () => {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (bedrooms) params.set("bedrooms", bedrooms);
    navigate(`/recherche?${params.toString()}`);
  };

  return (
    <div className="bg-card rounded-xl shadow-card-hover p-3 md:p-4">
      <div className="flex flex-col md:flex-row gap-3">
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="flex-1 h-12 border-border">
            <SelectValue placeholder="Ville" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Budget max (Ar)"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="flex-1 h-12"
          type="number"
        />

        <Select value={bedrooms} onValueChange={setBedrooms}>
          <SelectTrigger className="flex-1 h-12 border-border">
            <SelectValue placeholder="Chambres" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>{n}+ chambres</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleSearch} size="lg" className="h-12 px-8">
          <Search className="h-4 w-4 mr-2" /> Rechercher
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;
