import { Reservation, Visit } from "@/lib/api";
import { House } from "@/data/mockData";

export type HouseStatus = "draft" | "pending_validation" | "validated" | "refused" | "published" | "expired" | "publication_stopped";
export type ReservationStatus = "pending" | "confirmed" | "canceled" | "completed";
export type PaymentStatus = "paid" | "pending" | "failed";

export interface OwnerStats {
  houses_total: number;
  houses_pending_validation: number;
  visits_pending: number;
  reservations_total: number;
  revenue_total: number;
  featured_ads: number;
}

export interface OwnerHouse extends House {
  status: HouseStatus;
  address: string;
  publishPaymentStatus: PaymentStatus;
  featurePaymentStatus: PaymentStatus;
}

export interface OwnerVisit extends Visit {
  clientPhone: string;
  clientWhatsapp?: string;
  clientEmail?: string;
  clientFirstName?: string;
  clientLastName?: string;
  clientPhoto?: string;
  houseImage: string;
  housePrice: number;
  houseCautionAmount: number;
}

export interface OwnerReservation extends Reservation {
  status: ReservationStatus;
  houseImage: string;
}

export interface OwnerPayment {
  id: string;
  houseId: string;
  houseTitle: string;
  houseImage: string;
  type: "publication" | "featured";
  amount: number;
  status: PaymentStatus;
  paidAt: string;
}

export interface OwnerEarning {
  id: string;
  reservationId: number;
  houseTitle: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  paidAt: string;
}

export interface HouseFormValues {
  id?: string;
  title: string;
  description: string;
  city: string;
  quartier: string;
  address: string;
  price: string;
  cautionAmount: string;
  dailyReservationPrice: string;
  bedrooms: string;
  bathrooms: string;
  furnished: boolean;
  parking: boolean;
  water: boolean;
  electricity: boolean;
  available: boolean;
  equipments: string;
  ownerPhone1: string;
  ownerPhone2: string;
  ownerPhone3: string;
  ownerWhatsapp: string;
  featured: boolean;
  status: HouseStatus;
}

export interface UploadPhoto {
  id: string;
  file?: File;
  previewUrl: string;
  isCover: boolean;
}

export const houseStatusLabel: Record<HouseStatus, string> = {
  draft: "Brouillon",
  pending_validation: "En attente de validation",
  validated: "Validée",
  refused: "Refusée",
  published: "Publiée",
  expired: "Expirée",
  publication_stopped: "Publication arrêtée",
};
