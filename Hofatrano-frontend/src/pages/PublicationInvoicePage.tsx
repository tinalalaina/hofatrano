import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  downloadPublicationInvoicePdf,
  fetchOwnerPublicationInvoice,
  PublicationInvoiceStatus,
  submitPublicationInvoiceProof,
} from "@/lib/api";
import { formatPrice } from "@/data/mockData";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

const statusMap: Record<PublicationInvoiceStatus, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "En attente de paiement", className: "bg-amber-100 text-amber-900" },
  PROOF_SUBMITTED: { label: "Preuve soumise", className: "bg-blue-100 text-blue-900" },
  UNDER_REVIEW: { label: "En vérification", className: "bg-indigo-100 text-indigo-900" },
  PAID: { label: "Payée", className: "bg-emerald-100 text-emerald-900" },
  REJECTED: { label: "Refusée", className: "bg-rose-100 text-rose-900" },
  CANCELLED: { label: "Annulée", className: "bg-slate-200 text-slate-800" },
};

const PublicationInvoicePage = () => {
  const { invoiceId = "" } = useParams();
  const queryClient = useQueryClient();
  const [transactionRef, setTransactionRef] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["owner", "publication-invoice", invoiceId],
    queryFn: () => fetchOwnerPublicationInvoice(invoiceId),
    enabled: Boolean(invoiceId),
  });

  const submitProofMutation = useMutation({
    mutationFn: () => {
      if (!invoice || !proofFile) throw new Error("Ajoutez une preuve avant d'envoyer.");
      return submitPublicationInvoiceProof(invoice.id, transactionRef, proofFile);
    },
    onSuccess: async () => {
      toast.success("Preuve envoyée pour vérification.");
      setTransactionRef("");
      setProofFile(null);
      await queryClient.invalidateQueries({ queryKey: ["owner", "publication-invoice", invoiceId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-10 flex-1">Chargement de la facture...</main>
        <Footer />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-10 flex-1">Facture introuvable.</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1 space-y-4">
        <Card id="invoice-print" className="overflow-hidden border-slate-200">
          <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Facturation</p>
              <h1 className="text-2xl font-semibold">FACTURE DE PAIEMENT</h1>
            </div>
            <Badge className={statusMap[invoice.status].className}>{statusMap[invoice.status].label}</Badge>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-6">
            <section className="space-y-2">
              <h2 className="font-semibold text-slate-800">Références facture</h2>
              <p><b>Numéro:</b> {invoice.invoice_number}</p>
              <p><b>Date:</b> {new Date(invoice.created_at).toLocaleString("fr-FR")}</p>
              <p><b>Référence paiement:</b> {invoice.payment_reference}</p>
              <p><b>Statut:</b> {statusMap[invoice.status].label}</p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold text-slate-800">Informations propriétaire</h2>
              <p><b>Nom:</b> {invoice.owner_name}</p>
              <p><b>Téléphone:</b> {invoice.owner_phone || "-"}</p>
              <p><b>Email:</b> {invoice.owner_email || "-"}</p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold text-slate-800">Informations maison</h2>
              <p><b>Titre:</b> {invoice.house_title}</p>
              <p><b>Ville:</b> {invoice.house_city}</p>
              <p><b>Quartier:</b> {invoice.house_quartier}</p>
              <p><b>Référence:</b> {invoice.house_reference}</p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold text-slate-800">Informations paiement</h2>
              <p><b>Type:</b> Frais de publication</p>
              <p><b>Montant:</b> {formatPrice(invoice.amount)} {invoice.currency}</p>
              <p><b>Méthode:</b> Orange Money</p>
              <p><b>Numéro Orange Money:</b> 0372543764</p>
              <p><b>Nom du compte:</b> Tina</p>
              <p><b>Référence transaction:</b> {invoice.external_transaction_reference || "-"}</p>
            </section>
          </div>

          <div className="px-6 pb-6">
            <div className="rounded-xl border border-orange-300 bg-orange-50 p-4 space-y-1 text-sm">
              <p className="font-semibold text-orange-900">Instructions de paiement</p>
              <p>1) Envoyez le paiement via Orange Money au <b>0372543764</b>.</p>
              <p>2) Vérifiez que le nom affiché est <b>Tina</b>.</p>
              <p>3) Après paiement, ajoutez la référence de transaction.</p>
              <p>4) Envoyez la preuve de paiement pour vérification.</p>
              <p>5) La publication sera validée uniquement après confirmation par l&apos;administrateur.</p>
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.print()}>Télécharger facture</Button>
          <Button variant="outline" onClick={() => downloadPublicationInvoicePdf(invoice.id, invoice.invoice_number)}>Télécharger PDF</Button>
        </div>

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Envoyer la preuve de paiement</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="txref">Référence de transaction Orange Money</Label>
              <Input id="txref" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} placeholder="Ex: OM-20260331-ABCD" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="proof">Preuve de paiement (image)</Label>
              <Input id="proof" type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <Button
            onClick={() => submitProofMutation.mutate()}
            disabled={submitProofMutation.isPending || !proofFile || !transactionRef.trim()}
          >
            {submitProofMutation.isPending ? "Envoi..." : "Soumettre la preuve"}
          </Button>

          {invoice.proof_image_url && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Preuve actuelle</p>
              <img src={invoice.proof_image_url} alt="Preuve de paiement" className="max-h-80 rounded-lg border" />
            </div>
          )}

          <div className="space-y-1">
            <Label>Commentaire administrateur</Label>
            <Textarea value={invoice.admin_comment || "Aucun commentaire."} readOnly />
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default PublicationInvoicePage;
