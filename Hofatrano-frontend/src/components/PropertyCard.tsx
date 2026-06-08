import { Link } from "react-router-dom";
import { Heart, Bed, Bath, Maximize, Star, Eye, Zap } from "lucide-react";
import { House, formatPrice } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toggleFavorite } from "@/lib/api";

interface PropertyCardProps {
  house: House;
}

const PropertyCard = ({ house }: PropertyCardProps) => {
  const [liked, setLiked] = useState(false);

  return (
    <Link to={`/maison/${house.id}`} className="group block">
      <div className="bg-card rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={house.image}
            alt={house.title}
            loading="lazy"
            width={800}
            height={600}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <button
            onClick={async (e) => { e.preventDefault(); try { const r = await toggleFavorite(house.id); setLiked(r.favorited); } catch { setLiked(!liked); } }}
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : "text-foreground"}`} />
          </button>
          <div className="absolute top-3 left-3 flex gap-1.5">
            {house.featured && (
              <Badge className="bg-accent text-accent-foreground text-xs font-semibold border-0">
                <Star className="h-3 w-3 mr-1" /> En vedette
              </Badge>
            )}
            {house.urgent && (
              <Badge className="bg-destructive text-destructive-foreground text-xs font-semibold border-0">
                <Zap className="h-3 w-3 mr-1" /> Urgent
              </Badge>
            )}
          </div>
          <div className="absolute bottom-3 left-3">
            <span className="bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-md text-sm font-semibold text-foreground">
              {formatPrice(house.price)}<span className="text-muted-foreground font-normal">/mois</span>
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-body font-semibold text-foreground text-sm leading-snug line-clamp-1 mb-1">
            {house.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {house.quartier}, {house.city}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {house.bedrooms}</span>
            <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {house.bathrooms}</span>
            <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" /> {house.surface}m²</span>
            <span className="flex items-center gap-1 ml-auto"><Eye className="h-3.5 w-3.5" /> {house.views}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
