import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { formatPrice } from "@/data/mockData";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Bed, Bath, Maximize, Star, Eye, Phone, MessageCircle,
  MapPin, Check, X, ArrowLeft, Heart, Calendar, Zap,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createReservation, createVisit, fetchHouseById, toggleFavorite } from "@/lib/api";
import { getToken } from "@/lib/auth";

const PropertyDetail = () => {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [visitDate, setVisitDate] = useState("");
  const [reservationStart, setReservationStart] = useState("");
  const [reservationEnd, setReservationEnd] = useState("");
  const { data: house } = useQuery({ queryKey: ["house", id], queryFn: () => fetchHouseById(id), enabled: !!id });

  const isFromOwnerHouses = searchParams.get("from") === "owner-houses";
  const backLink = isFromOwnerHouses ? "/proprietaire/dashboard?tab=maisons" : "/recherche";

  if (!house) {
    return <div className="min-h-screen flex flex-col"><Header /><div className="flex-1 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-display text-foreground mb-4">Maison introuvable</h1><Button asChild><Link to={backLink}>Retour</Link></Button></div></div><Footer /></div>;
  }

  const amenityIcon = (val: boolean) => val ? <Check className="h-4 w-4 text-secondary" /> : <X className="h-4 w-4 text-destructive" />;
  const propertyPath = `/maison/${id}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const phoneNumbers = [house.ownerPhone1, house.ownerPhone2, house.ownerPhone3]
    .map((phone) => (phone || "").trim())
    .filter(Boolean);
  const fallbackPhones = house.ownerPhone
    .split("/")
    .map((phone) => phone.trim())
    .filter(Boolean);
  const visiblePhones = (phoneNumbers.length > 0 ? phoneNumbers : fallbackPhones).slice(0, 3);
  const phoneButtonColors = [
    "bg-primary text-primary-foreground",
    "bg-accent text-accent-foreground",
    "bg-destructive text-destructive-foreground",
  ];
  const hasExtraImages = house.images.length > 4;

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setIsGalleryOpen(true);
  };

  const goToPreviousImage = () => setGalleryIndex((prev) => (prev === 0 ? house.images.length - 1 : prev - 1));
  const goToNextImage = () => setGalleryIndex((prev) => (prev === house.images.length - 1 ? 0 : prev + 1));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-6 flex-1">
        <Link to={backLink} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4" /> Retour</Link>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          <div className="aspect-[4/3] rounded-lg overflow-hidden"><img src={house.images[selectedImage]} alt={house.title} className="w-full h-full object-cover" /></div>
          {house.images.length > 1 && (
            <div className="grid grid-cols-2 gap-3">
              {house.images.slice(0, 4).map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImage ? "border-primary" : "border-transparent"}`}>
                  <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
              {hasExtraImages && (
                <button
                  onClick={() => openGallery(selectedImage)}
                  className="col-span-2 h-11 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
                >
                  Voir plus ({house.images.length - 4} photos)
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-2xl md:text-3xl font-display text-foreground">{house.title}</h1>
                <button
                  onClick={async () => {
                    setLiked(!liked);
                    await toggleFavorite(house.id);
                    await queryClient.invalidateQueries({ queryKey: ["client", "favorites"] });
                  }}
                  className="flex-shrink-0 mt-1"
                ><Heart className={`h-6 w-6 ${liked ? "fill-primary text-primary" : "text-muted-foreground"}`} /></button>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3"><MapPin className="h-4 w-4" /> {house.quartier}, {house.city}</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {house.featured && <Badge className="bg-accent text-accent-foreground border-0"><Star className="h-3 w-3 mr-1" /> En vedette</Badge>}
                {house.urgent && <Badge className="bg-destructive text-destructive-foreground border-0"><Zap className="h-3 w-3 mr-1" /> Urgent</Badge>}
                {house.available && <Badge variant="outline" className="text-secondary border-secondary">Disponible</Badge>}
              </div>
              <div className="flex items-center gap-6 text-sm text-foreground">
                <span className="flex items-center gap-1.5"><Bed className="h-4 w-4 text-muted-foreground" /> {house.bedrooms} chambres</span>
                <span className="flex items-center gap-1.5"><Bath className="h-4 w-4 text-muted-foreground" /> {house.bathrooms} SdB</span>
                <span className="flex items-center gap-1.5"><Maximize className="h-4 w-4 text-muted-foreground" /> {house.surface}m²</span>
                <span className="flex items-center gap-1.5"><Eye className="h-4 w-4 text-muted-foreground" /> {house.views} vues</span>
              </div>
            </div>
            <div><h2 className="text-lg font-display text-foreground mb-3">Description</h2><p className="text-sm text-muted-foreground leading-relaxed">{house.description}</p></div>
            <div>
              <h2 className="text-lg font-display text-foreground mb-3">Caractéristiques</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{[
                { label: "Meublée", val: house.furnished },
                { label: "Parking", val: house.parking },
                { label: "Eau", val: house.water },
                { label: "Électricité", val: house.electricity },
              ].map((a) => <div key={a.label} className="flex items-center gap-2 text-sm">{amenityIcon(a.val)} {a.label}</div>)}</div>
            </div>
            {house.equipments.length > 0 && <div><h2 className="text-lg font-display text-foreground mb-3">Équipements</h2><div className="flex flex-wrap gap-2">{house.equipments.map((e) => <Badge key={e} variant="secondary">{e}</Badge>)}</div></div>}
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-lg shadow-card p-6 sticky top-20 space-y-5">
              <div className="text-center"><div className="text-3xl font-display text-primary">{formatPrice(house.price)}<span className="text-base text-muted-foreground">/mois</span></div></div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-muted-foreground">Caution</span>
                  <span className="font-medium">{formatPrice(house.caution_amount || 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-muted-foreground">Paiement réservation /jour</span>
                  <span className="font-medium">{formatPrice(house.daily_reservation_price || 0)}</span>
                </div>
              </div>
              <div className="space-y-3">
                {visiblePhones.length > 0 ? (
                  visiblePhones.map((phone, index) => (
                    <a
                      key={`${phone}-${index}`}
                      href={`tel:${phone}`}
                      className={`flex items-center justify-center gap-2 w-full h-11 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity ${phoneButtonColors[index] || phoneButtonColors[0]}`}
                    >
                      <Phone className="h-4 w-4" />
                      {phone}
                    </a>
                  ))
                ) : (
                  <a href="tel:0340000000" className="flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"><Phone className="h-4 w-4" /> 0340000000</a>
                )}
                <a href={`https://wa.me/${house.ownerWhatsapp || "261340000000"}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:opacity-90 transition-opacity"><MessageCircle className="h-4 w-4" /> WhatsApp ({house.ownerWhatsapp || "261340000000"})</a>
                <div className="space-y-2 pt-2 border-t">
                  <Input type="datetime-local" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
                  <Button
                    variant="outline"
                    className="w-full h-11"
                    onClick={async () => {
                      if (!getToken()) {
                        navigate(`/inscription?redirect=${encodeURIComponent(propertyPath)}`);
                        return;
                      }
                      if (visitDate) {
                        const confirmVisit = window.confirm(
                          `Confirmer la demande de visite ?\nCaution visite à payer: ${formatPrice(house.caution_amount || 0)}\n\nCliquez sur OK pour confirmer, ou Annuler pour arrêter.`,
                        );
                        if (!confirmVisit) {
                          window.alert("La demande de visite n'est pas effectuée.");
                          return;
                        }
                        await createVisit(Number(house.id), visitDate);
                        await queryClient.invalidateQueries({ queryKey: ["client", "visits"] });
                        window.alert(
                          `Demande de visite confirmée.\nCaution visite: ${formatPrice(house.caution_amount || 0)}`,
                        );
                        navigate("/client/profil?tab=visites");
                      }
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" /> Demander une visite
                  </Button>
                  <Input type="date" value={reservationStart} onChange={(e) => setReservationStart(e.target.value)} />
                  <Input type="date" value={reservationEnd} onChange={(e) => setReservationEnd(e.target.value)} />
                  <Button
                    className="w-full h-11"
                    onClick={async () => {
                      if (!getToken()) {
                        navigate(`/inscription?redirect=${encodeURIComponent(propertyPath)}`);
                        return;
                      }
                      if (!reservationStart || !reservationEnd) return;
                      const confirmReservation = window.confirm(
                        `Confirmer la réservation ?\nPrix réservation journalière: ${formatPrice(house.daily_reservation_price || 0)}\n\nCliquez sur OK pour confirmer, ou Annuler pour arrêter.`,
                      );
                      if (!confirmReservation) {
                        window.alert("La demande de réservation n'est pas effectuée.");
                        return;
                      }
                      await createReservation(Number(house.id), reservationStart, reservationEnd);
                      await queryClient.invalidateQueries({ queryKey: ["client", "reservations"] });
                      window.alert(
                        `Demande de réservation confirmée.\nPrix réservation journalière: ${formatPrice(house.daily_reservation_price || 0)}`,
                      );
                      navigate("/client/profil?tab=reservations");
                    }}
                  >
                    Réserver
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 p-4 flex items-center justify-center">
          <button
            onClick={() => setIsGalleryOpen(false)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/90 text-black flex items-center justify-center text-lg font-bold"
            aria-label="Fermer la galerie"
          >
            ×
          </button>
          <button
            onClick={goToPreviousImage}
            className="absolute left-4 md:left-8 h-10 w-10 rounded-full bg-white/90 text-black flex items-center justify-center text-xl"
            aria-label="Image précédente"
          >
            ‹
          </button>
          <div className="w-full max-w-5xl">
            <img src={house.images[galleryIndex]} alt={`${house.title} ${galleryIndex + 1}`} className="w-full max-h-[80vh] object-contain rounded-lg" />
            <div className="mt-4 text-center text-white text-sm">{galleryIndex + 1} / {house.images.length}</div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {house.images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  onClick={() => setGalleryIndex(idx)}
                  className={`h-14 w-20 rounded-md overflow-hidden border-2 ${idx === galleryIndex ? "border-white" : "border-transparent"}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={goToNextImage}
            className="absolute right-4 md:right-8 h-10 w-10 rounded-full bg-white/90 text-black flex items-center justify-center text-xl"
            aria-label="Image suivante"
          >
            ›
          </button>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default PropertyDetail;
