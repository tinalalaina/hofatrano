import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OwnerHouseForm } from "@/features/owner/components/OwnerHouseForm";
import { OwnerHousesTable } from "@/features/owner/components/OwnerHousesTable";
import { OwnerKpiCards } from "@/features/owner/components/OwnerKpiCards";
import { OwnerQuickActions } from "@/features/owner/components/OwnerQuickActions";
import { OwnerReservationRequests } from "@/features/owner/components/OwnerReservationRequests";
import { OwnerVisitRequests } from "@/features/owner/components/OwnerVisitRequests";
import { useOwnerDashboardData } from "@/features/owner/hooks/useOwnerDashboardData";
import { HouseFormValues, OwnerHouse } from "@/features/owner/types";
import { createOrGetPublicationInvoiceForHouse } from "@/lib/api";
import { ProfileCompletionCard } from "@/components/ProfileCompletionCard";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const defaultFormValues: HouseFormValues = {
  title: "",
  description: "",
  city: "Antananarivo",
  quartier: "",
  address: "",
  price: "",
  cautionAmount: "",
  dailyReservationPrice: "",
  bedrooms: "1",
  bathrooms: "1",
  furnished: false,
  parking: false,
  water: true,
  electricity: true,
  available: true,
  equipments: "",
  ownerPhone1: "",
  ownerPhone2: "",
  ownerPhone3: "",
  ownerWhatsapp: "",
  featured: false,
  status: "draft",
};

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "dashboard";
  const [tab, setTab] = useState(initialTab);
  const [stopTargetHouse, setStopTargetHouse] = useState<OwnerHouse | null>(null);
  const [stopPassword, setStopPassword] = useState("");
  const {
    data,
    isLoading,
    createHouse,
    updateHouse,
    deleteHouse,
    updateVisitStatus,
    updateVisitDepositStatus,
    updateVisitStatusChoice,
    updateReservationStatus,
    stopPublication,
    editingHouseId,
    setEditingHouseId,
    isMutating,
    isVisitMutating,
    isVisitDepositMutating,
    isVisitStatusMutating,
    isReservationMutating,
    isStopPublicationMutating,
  } = useOwnerDashboardData();

  const editingHouse = useMemo(() => data?.houses.find((house) => house.id === editingHouseId), [data?.houses, editingHouseId]);

  const editValues = useMemo<HouseFormValues>(() => {
    if (!editingHouse) return defaultFormValues;
    return {
      id: editingHouse.id,
      title: editingHouse.title,
      description: editingHouse.description,
      city: editingHouse.city,
      quartier: editingHouse.quartier,
      address: editingHouse.address,
      price: `${editingHouse.price}`,
      cautionAmount: `${editingHouse.caution_amount || 0}`,
      dailyReservationPrice: `${editingHouse.daily_reservation_price || 0}`,
      bedrooms: `${editingHouse.bedrooms}`,
      bathrooms: `${editingHouse.bathrooms}`,
      furnished: editingHouse.furnished,
      parking: editingHouse.parking,
      water: editingHouse.water,
      electricity: editingHouse.electricity,
      available: editingHouse.available,
      equipments: editingHouse.equipments.join(", "),
      ownerPhone1: editingHouse.ownerPhone1 || editingHouse.ownerPhone,
      ownerPhone2: editingHouse.ownerPhone2 || "",
      ownerPhone3: editingHouse.ownerPhone3 || "",
      ownerWhatsapp: editingHouse.ownerWhatsapp,
      featured: editingHouse.featured,
      status: editingHouse.status,
    };
  }, [editingHouse]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-10 flex-1">Chargement dashboard propriétaire...</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-display">Dashboard propriétaire</h1>
          <p className="text-muted-foreground">Gérez vos maisons, visites et réservations en un seul espace.</p>
        </div>
        <ProfileCompletionCard />

        {data?.stats && <OwnerKpiCards stats={data.stats} />}
        <OwnerQuickActions onNavigate={setTab} />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid md:grid-cols-5 h-auto gap-2">
            <TabsTrigger value="dashboard">Vue globale</TabsTrigger>
            <TabsTrigger value="maisons">Mes maisons</TabsTrigger>
            <TabsTrigger value="ajouter">Ajouter maison</TabsTrigger>
            <TabsTrigger value="visites">Demandes visite</TabsTrigger>
            <TabsTrigger value="reservations">Demandes réservation</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <p className="text-sm text-muted-foreground">Utilisez les onglets pour accéder à chaque module propriétaire.</p>
          </TabsContent>

          <TabsContent value="maisons">
            <OwnerHousesTable
              houses={data?.houses || []}
              onEdit={(houseId) => {
                setEditingHouseId(houseId);
                setTab("ajouter");
              }}
              onDelete={async (houseId) => {
                if (!window.confirm("Supprimer définitivement cette maison ? Cette action est irréversible.")) return;
                await deleteHouse(houseId);
              }}
              onOpenInvoice={async (houseId) => {
                try {
                  const invoice = await createOrGetPublicationInvoiceForHouse(houseId);
                  navigate(`/proprietaire/factures-publication/${invoice.id}`);
                } catch {
                  toast.error("Impossible d'ouvrir la facture de publication.");
                }
              }}
              onStopPublication={(house) => setStopTargetHouse(house)}
              onOpenDetails={(houseId) => navigate(`/maison/${houseId}?from=owner-houses`)}
            />
          </TabsContent>

          <TabsContent value="ajouter" className="space-y-3">
            <p className="text-sm text-muted-foreground">{editingHouse ? "Modifier votre maison" : "Créer une nouvelle annonce"}</p>
            <OwnerHouseForm
              key={editingHouse?.id || "create"}
              initialValues={editingHouse ? editValues : defaultFormValues}
              initialPhotos={
                editingHouse
                  ? editingHouse.images.map((img, index) => ({
                      id: `${editingHouse.id}-${index}`,
                      previewUrl: img,
                      isCover: index === 0,
                    }))
                  : []
              }
              submitLabel={editingHouse ? "Enregistrer les modifications" : "Ajouter la maison"}
              isSubmitting={isMutating}
              onSubmit={async (values, photos) => {
                if (editingHouse?.id) {
                  await updateHouse({ houseId: editingHouse.id, values, photos });
                } else {
                  await createHouse({ values, photos });
                }
              }}
            />
          </TabsContent>

          <TabsContent value="visites">
            <OwnerVisitRequests
              visits={data?.visits || []}
              isMutating={isVisitMutating || isVisitDepositMutating || isVisitStatusMutating}
              onAction={(visitId, action) => updateVisitStatus({ visitId, action })}
              onDepositStatusChange={(visitId, depositStatus) => updateVisitDepositStatus({ visitId, depositStatus })}
              onStatusChange={(visitId, status) => updateVisitStatusChoice({ visitId, status })}
              onOpenDetails={(houseId) => navigate(`/maison/${houseId}?from=owner-visits`)}
            />
          </TabsContent>

          <TabsContent value="reservations">
            <OwnerReservationRequests
              reservations={data?.reservations || []}
              isMutating={isReservationMutating}
              onStatusChange={(reservationId, status) => updateReservationStatus({ reservationId, status })}
            />
          </TabsContent>
        </Tabs>
      </main>
      <Dialog
        open={Boolean(stopTargetHouse)}
        onOpenChange={(open) => {
          if (!open) {
            setStopTargetHouse(null);
            setStopPassword("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arrêter la publication</DialogTitle>
            <DialogDescription>
              Cette action retirera définitivement la maison des listes publiques et des réservations. Pour republier, vous devrez repayer les frais.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm">
              Maison : <span className="font-medium">{stopTargetHouse?.title}</span>
            </p>
            <Input
              type="password"
              placeholder="Confirmez avec votre mot de passe"
              value={stopPassword}
              onChange={(e) => setStopPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStopTargetHouse(null);
                setStopPassword("");
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={!stopTargetHouse || !stopPassword || isStopPublicationMutating}
              onClick={async () => {
                if (!stopTargetHouse) return;
                try {
                  await stopPublication({ houseId: stopTargetHouse.id, password: stopPassword });
                  setStopTargetHouse(null);
                  setStopPassword("");
                } catch {
                  // handled in hook
                }
              }}
            >
              Confirmer l'arrêt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default OwnerDashboard;
