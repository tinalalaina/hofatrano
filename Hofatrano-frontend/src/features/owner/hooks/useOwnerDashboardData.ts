import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createHouseFromForm,
  fetchOwnerWorkspace,
  runReservationStatusUpdate,
  runVisitDepositStatusUpdate,
  runVisitStatusUpdate,
  removeHouse,
  runVisitAction,
  stopHousePublication,
  updateHouseFromForm,
} from "@/features/owner/services/ownerDashboard";
import { HouseFormValues, UploadPhoto } from "@/features/owner/types";

export const useOwnerDashboardData = () => {
  const queryClient = useQueryClient();
  const [editingHouseId, setEditingHouseId] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["owner", "workspace"], queryFn: fetchOwnerWorkspace });

  const stats = useMemo(() => query.data?.stats, [query.data?.stats]);

  const createMutation = useMutation({
    mutationFn: ({ values, photos }: { values: HouseFormValues; photos: UploadPhoto[] }) => createHouseFromForm(values, photos),
    onSuccess: async () => {
      toast.success("Maison ajoutée avec succès.");
      await queryClient.invalidateQueries({ queryKey: ["owner", "workspace"] });
    },
    onError: (error: Error) => toast.error(error.message || "Impossible d'ajouter la maison."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ houseId, values, photos }: { houseId: string; values: HouseFormValues; photos: UploadPhoto[] }) =>
      updateHouseFromForm(houseId, values, photos),
    onSuccess: async () => {
      toast.success("Maison modifiée.");
      setEditingHouseId(null);
      await queryClient.invalidateQueries({ queryKey: ["owner", "workspace"] });
    },
    onError: (error: Error) => toast.error(error.message || "Modification impossible."),
  });

  const deleteMutation = useMutation({
    mutationFn: removeHouse,
    onSuccess: async () => {
      toast.success("Maison supprimée.");
      await queryClient.invalidateQueries({ queryKey: ["owner", "workspace"] });
    },
    onError: () => toast.error("Suppression impossible."),
  });

  const visitActionMutation = useMutation({
    mutationFn: ({ visitId, action }: { visitId: number; action: "accept" | "refuse" | "done" | "cancel" }) => runVisitAction(visitId, action),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "workspace"] });
      toast.success("Action mise à jour.");
    },
    onError: (error: Error) => toast.error(error.message || "Action impossible."),
  });

  const stopPublicationMutation = useMutation({
    mutationFn: ({ houseId, password }: { houseId: string; password: string }) => stopHousePublication(houseId, password),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "workspace"] });
      toast.success("Publication arrêtée. Un nouveau paiement sera requis pour republier.");
    },
    onError: (error: Error) => toast.error(error.message || "Action impossible."),
  });

  const visitDepositMutation = useMutation({
    mutationFn: ({ visitId, depositStatus }: { visitId: number; depositStatus: "unpaid" | "paid" | "refunded" | "deducted" | "kept" }) =>
      runVisitDepositStatusUpdate(visitId, depositStatus),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "workspace"] });
      toast.success("Statut de paiement mis à jour.");
    },
    onError: (error: Error) => toast.error(error.message || "Mise à jour du paiement impossible."),
  });

  const reservationActionMutation = useMutation({
    mutationFn: ({ reservationId, status }: { reservationId: number; status: "pending" | "confirmed" | "canceled" | "completed" }) =>
      runReservationStatusUpdate(reservationId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "workspace"] });
      toast.success("Statut réservation mis à jour.");
    },
    onError: (error: Error) => toast.error(error.message || "Mise à jour réservation impossible."),
  });

  const visitStatusMutation = useMutation({
    mutationFn: ({ visitId, status }: { visitId: number; status: "pending" | "accepted" | "refused" | "canceled" | "done" | "no_show" }) =>
      runVisitStatusUpdate(visitId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "workspace"] });
      toast.success("Statut visite mis à jour.");
    },
    onError: (error: Error) => toast.error(error.message || "Mise à jour du statut impossible."),
  });

  return {
    ...query,
    stats,
    editingHouseId,
    setEditingHouseId,
    createHouse: createMutation.mutateAsync,
    updateHouse: updateMutation.mutateAsync,
    deleteHouse: deleteMutation.mutateAsync,
    updateVisitStatus: visitActionMutation.mutateAsync,
    updateVisitDepositStatus: visitDepositMutation.mutateAsync,
    updateVisitStatusChoice: visitStatusMutation.mutateAsync,
    updateReservationStatus: reservationActionMutation.mutateAsync,
    stopPublication: stopPublicationMutation.mutateAsync,
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    isVisitMutating: visitActionMutation.isPending,
    isVisitDepositMutating: visitDepositMutation.isPending,
    isVisitStatusMutating: visitStatusMutation.isPending,
    isReservationMutating: reservationActionMutation.isPending,
    isStopPublicationMutating: stopPublicationMutation.isPending,
  };
};
