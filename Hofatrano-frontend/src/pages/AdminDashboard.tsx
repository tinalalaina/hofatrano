import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminUser,
  fetchAdminDashboard,
  fetchAdminUserDetail,
  markInvoiceUnderReview,
  PublicationInvoiceStatus,
  reviewPublicationInvoice,
  toggleAdminUserCertified,
  updateAdminUser,
  updateAdminSettings,
  validateHouse,
} from "@/lib/api";
import { formatPrice } from "@/data/mockData";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProfileCompletionCard } from "@/components/ProfileCompletionCard";
import { Eye } from "lucide-react";

const statusLabel: Record<PublicationInvoiceStatus, string> = {
  PENDING_PAYMENT: "En attente",
  PROOF_SUBMITTED: "Preuve soumise",
  UNDER_REVIEW: "En vérification",
  PAID: "Payée",
  REJECTED: "Refusée",
  CANCELLED: "Annulée",
};

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "dashboard"], queryFn: fetchAdminDashboard });
  const [adminComments, setAdminComments] = useState<Record<number, string>>({});
  const [searchUsers, setSearchUsers] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState({ first_name: "", last_name: "", phone: "" });
  const [certifiedSwitch, setCertifiedSwitch] = useState(false);

  const { data: selectedUser } = useQuery({
    queryKey: ["admin", "user", selectedUserId],
    queryFn: () => fetchAdminUserDetail(selectedUserId as number),
    enabled: Boolean(selectedUserId),
  });

  useEffect(() => {
    setCertifiedSwitch(Boolean(selectedUser?.is_certified));
  }, [selectedUser?.is_certified]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-10 flex-1 space-y-6">
        <h1 className="text-2xl font-display">Dashboard administrateur</h1>
        <ProfileCompletionCard />
        {data?.stats && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="border rounded-lg p-4">Utilisateurs: <b>{data.stats.total_users}</b></div>
            <div className="border rounded-lg p-4">Maisons: <b>{data.stats.total_houses}</b></div>
            <div className="border rounded-lg p-4">Maisons en attente: <b>{data.stats.pending_houses}</b></div>
            <div className="border rounded-lg p-4">Factures publication en attente: <b>{data.stats.pending_publication_invoices}</b></div>
            <div className="border rounded-lg p-4">Revenus plateforme: <b>{formatPrice(data.stats.platform_revenue)}</b></div>
          </div>
        )}

        <Tabs defaultValue="maisons">
          <TabsList>
            <TabsTrigger value="maisons">Maisons</TabsTrigger>
            <TabsTrigger value="factures">Factures publication</TabsTrigger>
            <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
            <TabsTrigger value="visites">Visites</TabsTrigger>
            <TabsTrigger value="reservations">Réservations</TabsTrigger>
            <TabsTrigger value="parametres">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="maisons" className="space-y-3">
            {data?.houses?.map((h: any) => (
              <div key={h.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{h.title}</p>
                  <p className="text-sm text-muted-foreground">{h.city} • {h.status} • paiement publication: {h.publication_paid ? "validé" : "non validé"}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={async () => {
                    await validateHouse(h.id, "approved");
                    await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
                  }}>Valider</Button>
                  <Button size="sm" variant="outline" onClick={async () => {
                    await validateHouse(h.id, "rejected");
                    await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
                  }}>Refuser</Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="factures" className="space-y-3">
            {data?.publication_invoices?.map((invoice: any) => (
              <div key={invoice.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="font-medium">{invoice.invoice_number} — {invoice.house_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.owner_name} • {formatPrice(invoice.amount)} {invoice.currency} • {statusLabel[invoice.status as PublicationInvoiceStatus]}
                    </p>
                    <p className="text-xs text-muted-foreground">Orange Money: 0372543764 (Tina)</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={async () => {
                      await markInvoiceUnderReview(invoice.id);
                      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
                      toast.success("Facture marquée en vérification.");
                    }}>Passer en vérification</Button>
                    <Button size="sm" onClick={async () => {
                      await reviewPublicationInvoice(invoice.id, "PAID", adminComments[invoice.id] || "Paiement validé.");
                      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
                      toast.success("Paiement validé.");
                    }}>Valider paiement</Button>
                    <Button size="sm" variant="destructive" onClick={async () => {
                      await reviewPublicationInvoice(invoice.id, "REJECTED", adminComments[invoice.id] || "Preuve invalide.");
                      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
                      toast.success("Paiement refusé.");
                    }}>Refuser paiement</Button>
                  </div>
                </div>

                {invoice.proof_image_url ? (
                  <img src={invoice.proof_image_url} alt="Preuve paiement" className="max-h-72 rounded border" />
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune preuve uploadée pour l'instant.</p>
                )}

                <Textarea
                  placeholder="Commentaire admin"
                  value={adminComments[invoice.id] ?? invoice.admin_comment ?? ""}
                  onChange={(e) => setAdminComments((prev) => ({ ...prev, [invoice.id]: e.target.value }))}
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="utilisateurs" className="space-y-4">
            <div className="flex justify-end">
              <Input
                className="max-w-sm"
                placeholder="Rechercher..."
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
              />
            </div>
            <div className="border rounded-2xl overflow-hidden bg-card">
              <div className="grid grid-cols-[2fr_1fr_1fr_80px] gap-3 px-4 py-3 text-xs font-semibold text-muted-foreground border-b">
                <div>UTILISATEUR</div>
                <div>RÔLE</div>
                <div>STATUT</div>
                <div className="text-center">ACTIONS</div>
              </div>
              {(data?.users || [])
                .filter((u: any) => {
                  const q = searchUsers.toLowerCase().trim();
                  if (!q) return true;
                  return `${u.first_name} ${u.last_name} ${u.username} ${u.email}`.toLowerCase().includes(q);
                })
                .map((u: any) => (
                  <div key={u.id} className="grid grid-cols-[2fr_1fr_1fr_80px] gap-3 items-center px-4 py-3 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full overflow-hidden border bg-muted shrink-0">
                        {u.photo_url ? <img src={u.photo_url} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div>
                        <p className="font-medium leading-tight">{`${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div>
                      <Badge variant="secondary">{u.role?.toUpperCase()}</Badge>
                    </div>
                    <div className={u.is_certified ? "text-emerald-600 text-sm font-medium" : "text-amber-600 text-sm font-medium"}>
                      {u.is_certified ? "VERIFIED" : "PENDING"}
                    </div>
                    <div className="flex justify-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUserId(u.id);
                          setEditDraft({ first_name: u.first_name || "", last_name: u.last_name || "", phone: u.phone || "" });
                        }}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="visites" className="space-y-2">
            {data?.visits?.map((v: any) => <div className="border rounded p-3" key={v.id}>{v.houseTitle} • {v.clientName} • {v.status} • caution {v.deposit_status}</div>)}
          </TabsContent>

          <TabsContent value="reservations" className="space-y-2">
            {data?.reservations?.map((r: any) => <div className="border rounded p-3" key={r.id}>{r.houseTitle} • {r.clientName} • {r.status} • {formatPrice(r.total_price)}</div>)}
          </TabsContent>

          <TabsContent value="parametres" className="space-y-3 max-w-xl">
            {data?.settings && (
              <div className="space-y-3">
                {[
                  { key: "publication_fee", label: "Frais publication" },
                  { key: "reservation_commission_percent", label: "Commission réservation (%)" },
                  { key: "visit_deposit", label: "Caution visite" },
                  { key: "featured_fee", label: "Prix mise en avant" },
                  { key: "support_fee", label: "Frais service client" },
                ].map((field) => (
                  <div key={field.key} className="flex gap-2 items-center">
                    <label className="w-64 text-sm">{field.label}</label>
                    <Input
                      type="number"
                      defaultValue={data.settings[field.key]}
                      onBlur={async (e) => {
                        await updateAdminSettings({ [field.key]: Number(e.target.value) } as any);
                        await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Dialog open={Boolean(selectedUserId)} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Détails utilisateur</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <Input
                  placeholder="Nom"
                  value={editDraft.first_name}
                  onChange={(e) => setEditDraft((prev) => ({ ...prev, first_name: e.target.value }))}
                />
                <Input
                  placeholder="Prénom"
                  value={editDraft.last_name}
                  onChange={(e) => setEditDraft((prev) => ({ ...prev, last_name: e.target.value }))}
                />
                <Input
                  placeholder="Téléphone"
                  value={editDraft.phone}
                  onChange={(e) => setEditDraft((prev) => ({ ...prev, phone: e.target.value }))}
                />
                <Input value={selectedUser.email} disabled />
              </div>
              <div className="text-sm text-muted-foreground">
                Statut: <span className={selectedUser.is_certified ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>{selectedUser.is_certified ? "VERIFIED" : "PENDING"}</span>
              </div>
              {selectedUser.role === "client" && (
                <div className="border rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold">Infos Fiscales (Optionnel)</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Input value={selectedUser.tax_nif || "-"} disabled />
                    <Input value={selectedUser.tax_stat || "-"} disabled />
                  </div>
                </div>
              )}
              <div className="border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Compte certifié</p>
                  <p className="text-xs text-muted-foreground">Activez ou retirez la certification de ce compte.</p>
                </div>
                <Switch
                  checked={certifiedSwitch}
                  onCheckedChange={async (checked) => {
                    if (!selectedUserId || checked === certifiedSwitch) return;
                    try {
                      await toggleAdminUserCertified(selectedUserId);
                      setCertifiedSwitch(checked);
                      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
                      await queryClient.invalidateQueries({ queryKey: ["admin", "user", selectedUserId] });
                      toast.success("Certification mise à jour.");
                    } catch {
                      toast.error("Impossible de modifier la certification.");
                    }
                  }}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={async () => {
                if (!selectedUserId) return;
                await updateAdminUser(selectedUserId, editDraft);
                await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
                await queryClient.invalidateQueries({ queryKey: ["admin", "user", selectedUserId] });
                toast.success("Utilisateur modifié.");
              }}
            >
              Modifier
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!selectedUserId) return;
                await deleteAdminUser(selectedUserId);
                await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
                setSelectedUserId(null);
                toast.success("Utilisateur supprimé.");
              }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
