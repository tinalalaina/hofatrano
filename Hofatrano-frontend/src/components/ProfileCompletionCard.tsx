import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchMe, SessionUser, updateMe } from "@/lib/session";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, ShieldCheck, UserRound } from "lucide-react";

interface ProfileFormState {
  first_name: string;
  last_name: string;
  phone: string;
  tax_nif: string;
  tax_stat: string;
}

const toFormState = (user: SessionUser): ProfileFormState => ({
  first_name: user.first_name || "",
  last_name: user.last_name || "",
  phone: user.phone || "",
  tax_nif: user.tax_nif || "",
  tax_stat: user.tax_stat || "",
});

export const ProfileCompletionCard = () => {
  const queryClient = useQueryClient();
  const { data: me } = useQuery({ queryKey: ["auth", "me"], queryFn: fetchMe });
  const [form, setForm] = useState<ProfileFormState>({
    first_name: "",
    last_name: "",
    phone: "",
    tax_nif: "",
    tax_stat: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const isVerified = me?.verification_status === "VERIFIED" || me?.is_certified === true;
  const showVerificationIndicators = isVerified;

  useEffect(() => {
    if (me) setForm(toFormState(me));
  }, [me]);

  const saveMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: async () => {
      toast.success("Profil enregistré.");
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: () => toast.error("Impossible d'enregistrer le profil."),
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Mon Profil</h2>
        <Button
          onClick={() => {
            const formData = new FormData();
            formData.append("first_name", form.first_name);
            formData.append("last_name", form.last_name);
            formData.append("phone", form.phone);
            formData.append("tax_nif", form.tax_nif);
            formData.append("tax_stat", form.tax_stat);
            if (photoFile) formData.append("photo", photoFile);
            saveMutation.mutate(formData);
          }}
          disabled={saveMutation.isPending}
        >
          Enregistrer
        </Button>
      </div>
      <div className="grid lg:grid-cols-[280px_1fr] gap-4 items-start">
        <div className="space-y-4">
          <div className="border rounded-2xl p-6 bg-card text-center space-y-4">
            <div className="mx-auto size-28 rounded-full overflow-hidden border">
              {me?.photo_url ? (
                <img src={me.photo_url} alt="Photo profil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                  <UserRound className="size-10" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold">Photo de Profil (Selfie)</p>
              <p className="text-xs text-muted-foreground">Utilisée pour sécuriser la communauté.</p>
            </div>
            <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            {showVerificationIndicators && (
              <div className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                <BadgeCheck className="size-3.5" />
                Identité vérifiée
              </div>
            )}
          </div>

          {showVerificationIndicators && (
            <div className="border rounded-xl p-4 bg-blue-50/70 border-blue-200">
              <p className="text-sm font-semibold text-blue-800">Compte certifié</p>
              <p className="text-xs text-blue-700 mt-1">Vos documents sont validés. Vous pouvez publier et recevoir des paiements.</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="border rounded-2xl bg-card">
            <div className="px-5 py-4 border-b flex items-center gap-2 font-semibold">
              <ShieldCheck className="size-4 text-primary" />
              Identité & Contact
            </div>
            <div className="p-5 grid md:grid-cols-2 gap-3">
              <Input placeholder="Nom" value={form.first_name} onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))} />
              <Input placeholder="Prénom" value={form.last_name} onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))} />
              <Input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
              <Input placeholder="Email" type="email" value={me?.email || ""} disabled />
            </div>
          </div>

          <div className="border rounded-2xl bg-card">
            <div className="px-5 py-4 border-b font-semibold">Infos Fiscales (Optionnel)</div>
            <div className="p-5 grid md:grid-cols-2 gap-3">
              <Input placeholder="NIF" value={form.tax_nif} onChange={(e) => setForm((prev) => ({ ...prev, tax_nif: e.target.value }))} />
              <Input placeholder="STAT" value={form.tax_stat} onChange={(e) => setForm((prev) => ({ ...prev, tax_stat: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
