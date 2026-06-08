import { House, resolveImageKey } from "@/data/mockData";
import { authHeaders } from "@/lib/auth";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://hofatrano.tina-lalaina.site/api").replace(/\/$/, "");
const API_ORIGIN = new URL(API_BASE_URL).origin;

export interface HouseQuery {
  city?: string;
  quartier?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  furnished?: boolean;
  parking?: boolean;
  water?: boolean;
  electricity?: boolean;
  available?: boolean;
  featured?: boolean;
  urgent?: boolean;
}

export interface Visit {
  id: number;
  house: number;
  houseTitle: string;
  clientName: string;
  clientFirstName?: string;
  clientLastName?: string;
  clientPhoto?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientWhatsapp?: string;
  requested_date: string;
  status: string;
  deposit_status: string;
  deposit_amount: number;
  created_at: string;
}

export interface Reservation {
  id: number;
  house: number;
  houseTitle: string;
  houseImage?: string;
  clientName: string;
  clientFirstName?: string;
  clientLastName?: string;
  clientPhoto?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientWhatsapp?: string;
  start_date: string;
  end_date: string;
  total_price: number;
  commission: number;
  status: string;
  created_at: string;
}

export type PublicationInvoiceStatus = "PENDING_PAYMENT" | "PROOF_SUBMITTED" | "UNDER_REVIEW" | "PAID" | "REJECTED" | "CANCELLED";

export interface PublicationPaymentInvoice {
  id: number;
  invoice_number: string;
  payment_reference: string;
  owner: number;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  house: number;
  house_title: string;
  house_city: string;
  house_quartier: string;
  house_reference: string;
  payment_type: "publication_fee";
  amount: number;
  currency: string;
  payment_method: "orange_money";
  orange_money_number: string;
  orange_money_account_name: string;
  external_transaction_reference: string;
  proof_image: string;
  proof_image_url: string;
  status: PublicationInvoiceStatus;
  admin_comment: string;
  verified_by: number | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformSettings {
  publication_fee: number;
  reservation_commission_percent: number;
  visit_deposit: number;
  featured_fee: number;
  support_fee: number;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "client" | "owner" | "admin";
  phone: string;
  photo_url: string;
  tax_nif: string;
  tax_stat: string;
  is_certified: boolean;
  verification_status: "VERIFIED" | "PENDING";
}

const queryString = (query: HouseQuery = {}) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === "" || value === undefined || value === false) return;
    params.set(key, String(value));
  });
  return params.toString();
};

type RawHouse = Omit<House, "image" | "images" | "createdAt"> & {
  image: string;
  images: string[];
  image_keys?: string[];
  created_at?: string;
  createdAt?: string;
};

const normalizeHouse = (house: RawHouse): House => ({
  ...house,
  id: String(house.id),
  createdAt: house.createdAt || house.created_at || new Date().toISOString(),
  image: resolveImageKey(house.image.startsWith("/") ? `${API_ORIGIN}${house.image}` : house.image),
  images: house.images.map((img) => resolveImageKey(img.startsWith("/") ? `${API_ORIGIN}${img}` : img)),
  ownerPhone: house.ownerPhone || "",
  ownerPhone1: (house as any).ownerPhone1 || "",
  ownerPhone2: (house as any).ownerPhone2 || "",
  ownerPhone3: (house as any).ownerPhone3 || "",
  ownerWhatsapp: house.ownerWhatsapp || "",
  caution_amount: Number((house as any).caution_amount || 0),
  daily_reservation_price: Number((house as any).daily_reservation_price || 0),
  ownerPhoto: house.ownerPhoto || "",
});

const jsonHeaders = () => ({ "Content-Type": "application/json", ...authHeaders() });
const formHeaders = () => ({ ...authHeaders() });

const appendFormDataValue = (formData: FormData, key: string, value: unknown) => {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item) => formData.append(key, String(item)));
    return;
  }
  formData.append(key, String(value));
};

const getRequestErrorMessage = async (response: Response, fallback: string) => {
  if (response.status === 413) {
    return "Les photos sont trop lourdes pour le serveur. Réduisez leur taille puis réessayez.";
  }

  const data = await response.json().catch(() => ({}));
  if (typeof data?.detail === "string" && data.detail.trim()) return data.detail;
  return fallback;
};

export const fetchHouses = async (query: HouseQuery = {}): Promise<House[]> => {
  const qs = queryString(query);
  const response = await fetch(`${API_BASE_URL}/houses/${qs ? `?${qs}` : ""}`);
  if (!response.ok) throw new Error("Impossible de charger les maisons");
  const data: RawHouse[] = await response.json();
  return data.map(normalizeHouse);
};

export const fetchHouseById = async (id: string): Promise<House> => {
  const response = await fetch(`${API_BASE_URL}/houses/${id}/`, { headers: authHeaders() });
  if (!response.ok) throw new Error("Maison introuvable");
  const data: RawHouse = await response.json();
  return normalizeHouse(data);
};

export const createHouse = async (payload: Partial<House>, photos: File[] = []) => {
  const hasPhotos = photos.length > 0;
  const body = hasPhotos ? new FormData() : JSON.stringify(payload);

  if (hasPhotos && body instanceof FormData) {
    Object.entries(payload).forEach(([key, value]) => appendFormDataValue(body, key, value));
    photos.forEach((photo) => body.append("photos", photo));
  }

  const response = await fetch(`${API_BASE_URL}/houses/`, {
    method: "POST",
    headers: hasPhotos ? formHeaders() : jsonHeaders(),
    body,
  });
  if (!response.ok) throw new Error(await getRequestErrorMessage(response, "Impossible d'ajouter la maison"));
  return response.json();
};

export const updateHouse = async (houseId: string, payload: Partial<House>, photos: File[] = []) => {
  const hasPhotos = photos.length > 0;
  const body = hasPhotos ? new FormData() : JSON.stringify(payload);

  if (hasPhotos && body instanceof FormData) {
    Object.entries(payload).forEach(([key, value]) => appendFormDataValue(body, key, value));
    photos.forEach((photo) => body.append("photos", photo));
  }

  const response = await fetch(`${API_BASE_URL}/houses/${houseId}/`, {
    method: "PATCH",
    headers: hasPhotos ? formHeaders() : jsonHeaders(),
    body,
  });
  if (!response.ok) throw new Error(await getRequestErrorMessage(response, "Impossible de modifier la maison"));
  return response.json();
};

export const deleteHouse = async (houseId: string) => {
  const response = await fetch(`${API_BASE_URL}/houses/${houseId}/`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Impossible de supprimer la maison");
  return true;
};

export const createOrGetPublicationInvoiceForHouse = async (houseId: string) => {
  const response = await fetch(`${API_BASE_URL}/houses/${houseId}/publication-invoice/`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Impossible de générer la facture de publication");
  return (await response.json()) as PublicationPaymentInvoice;
};

export const ownerStopHousePublication = async (houseId: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/owner/houses/${houseId}/stop-publication/`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Impossible d'arrêter la publication");
  }
  return response.json();
};

export const fetchOwnerPublicationInvoices = async () => {
  const response = await fetch(`${API_BASE_URL}/owner/publication-invoices/`, { headers: authHeaders() });
  if (!response.ok) throw new Error("Impossible de charger vos factures");
  return (await response.json()) as PublicationPaymentInvoice[];
};

export const fetchOwnerPublicationInvoice = async (invoiceId: string) => {
  const response = await fetch(`${API_BASE_URL}/owner/publication-invoices/${invoiceId}/`, { headers: authHeaders() });
  if (!response.ok) throw new Error("Facture introuvable");
  return (await response.json()) as PublicationPaymentInvoice;
};

export const submitPublicationInvoiceProof = async (invoiceId: number, externalTransactionReference: string, proofFile: File) => {
  const formData = new FormData();
  formData.append("external_transaction_reference", externalTransactionReference);
  formData.append("proof_image", proofFile);

  const response = await fetch(`${API_BASE_URL}/owner/publication-invoices/${invoiceId}/submit-proof/`, {
    method: "POST",
    headers: formHeaders(),
    body: formData,
  });
  if (!response.ok) throw new Error("Impossible d'envoyer la preuve de paiement");
  return (await response.json()) as PublicationPaymentInvoice;
};

export const downloadPublicationInvoicePdf = async (invoiceId: number, invoiceNumber: string) => {
  const response = await fetch(`${API_BASE_URL}/owner/publication-invoices/${invoiceId}/pdf/`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Téléchargement PDF impossible");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoiceNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const fetchAdminPublicationInvoices = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/publication-invoices/`, { headers: authHeaders() });
  if (!response.ok) throw new Error("Impossible de charger les factures de publication");
  return (await response.json()) as PublicationPaymentInvoice[];
};

export const markInvoiceUnderReview = async (invoiceId: number) => {
  const response = await fetch(`${API_BASE_URL}/admin/publication-invoices/${invoiceId}/under-review/`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Impossible de passer en vérification");
  return (await response.json()) as PublicationPaymentInvoice;
};

export const reviewPublicationInvoice = async (invoiceId: number, status: "PAID" | "REJECTED", adminComment = "") => {
  const response = await fetch(`${API_BASE_URL}/admin/publication-invoices/${invoiceId}/review/`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ status, admin_comment: adminComment }),
  });
  if (!response.ok) throw new Error("Impossible de traiter la facture");
  return (await response.json()) as PublicationPaymentInvoice;
};

export const toggleFavorite = async (houseId: string) => {
  const response = await fetch(`${API_BASE_URL}/houses/${houseId}/favorite/`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error("Connexion requise");
  return response.json();
};

export const fetchFavorites = async () => {
  const response = await fetch(`${API_BASE_URL}/favorites/`, { headers: authHeaders() });
  if (!response.ok) throw new Error("Connexion requise");
  const data = await response.json();
  return data.map((f: { house: RawHouse }) => ({ ...f, house: normalizeHouse(f.house) }));
};

export const deleteFavorite = async (favoriteId: number) => {
  const response = await fetch(`${API_BASE_URL}/favorites/${favoriteId}/`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Suppression du favori impossible");
  return true;
};

export const fetchVisits = async (): Promise<Visit[]> => {
  const response = await fetch(`${API_BASE_URL}/visits/`, { headers: authHeaders() });
  if (!response.ok) throw new Error("Impossible de charger les visites");
  return response.json();
};

export const createVisit = async (house: number, requestedDateTime: string): Promise<Visit> => {
  const response = await fetch(`${API_BASE_URL}/visits/`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ house, requested_date: requestedDateTime }),
  });
  if (!response.ok) throw new Error("Impossible de créer la visite");
  return response.json();
};

export const payDeposit = async (visitId: number): Promise<Visit> => {
  const response = await fetch(`${API_BASE_URL}/visits/${visitId}/pay-deposit/`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Paiement caution impossible");
  return response.json();
};

export const ownerVisitAction = async (visitId: number, action: string): Promise<Visit> => {
  const response = await fetch(`${API_BASE_URL}/visits/${visitId}/owner-action/`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ action }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Action impossible");
  }
  return response.json();
};

export const ownerUpdateVisitDepositStatus = async (
  visitId: number,
  depositStatus: "unpaid" | "paid" | "refunded" | "deducted" | "kept",
): Promise<Visit> => {
  const response = await fetch(`${API_BASE_URL}/visits/${visitId}/owner-action/`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ action: "update_deposit_status", deposit_status: depositStatus }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Mise à jour du paiement impossible");
  }
  return response.json();
};

export const ownerUpdateVisitStatus = async (
  visitId: number,
  status: "pending" | "accepted" | "refused" | "canceled" | "done" | "no_show",
): Promise<Visit> => {
  const response = await fetch(`${API_BASE_URL}/visits/${visitId}/owner-action/`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ action: "update_status", status }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Mise à jour du statut de visite impossible");
  }
  return response.json();
};

export const deleteVisit = async (visitId: number) => {
  const response = await fetch(`${API_BASE_URL}/visits/${visitId}/`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Suppression de la visite impossible");
  return true;
};

export const cancelVisit = async (visitId: number): Promise<Visit> => {
  const response = await fetch(`${API_BASE_URL}/visits/${visitId}/cancel/`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Annulation de la visite impossible");
  }
  return response.json();
};

export const fetchReservations = async (): Promise<Reservation[]> => {
  const response = await fetch(`${API_BASE_URL}/reservations/`, { headers: authHeaders() });
  if (!response.ok) throw new Error("Impossible de charger les réservations");
  return response.json();
};

export const createReservation = async (house: number, start_date: string, end_date: string): Promise<Reservation> => {
  const response = await fetch(`${API_BASE_URL}/reservations/`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ house, start_date, end_date }),
  });
  if (!response.ok) throw new Error("Impossible de réserver");
  return response.json();
};

export const deleteReservation = async (reservationId: number) => {
  const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}/`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Suppression de la réservation impossible");
  return true;
};

export const cancelReservation = async (reservationId: number): Promise<Reservation> => {
  const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}/cancel/`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Annulation de la réservation impossible");
  }
  return response.json();
};

export const ownerReservationAction = async (reservationId: number, action: "confirm" | "cancel" | "complete"): Promise<Reservation> => {
  const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}/owner-action/`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ action }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Action réservation impossible");
  }
  return response.json();
};

export const ownerUpdateReservationStatus = async (
  reservationId: number,
  status: "pending" | "confirmed" | "canceled" | "completed",
): Promise<Reservation> => {
  const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}/owner-action/`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ action: "update_status", status }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Mise à jour du statut réservation impossible");
  }
  return response.json();
};

export const fetchOwnerDashboard = async () => {
  const response = await fetch(`${API_BASE_URL}/owner/dashboard/`, { headers: authHeaders() });
  if (!response.ok) throw new Error("Accès propriétaire requis");
  const data = await response.json();
  data.houses = data.houses.map(normalizeHouse);
  return data;
};

export const fetchAdminDashboard = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard/`, { headers: authHeaders() });
  if (!response.ok) throw new Error("Accès admin requis");
  const data = await response.json();
  data.houses = data.houses.map(normalizeHouse);
  return data;
};

export const validateHouse = async (houseId: string, status: "approved" | "rejected" | "pending") => {
  const response = await fetch(`${API_BASE_URL}/houses/${houseId}/validate/`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Validation impossible");
  return response.json();
};

export const updateAdminSettings = async (payload: Partial<PlatformSettings>): Promise<PlatformSettings> => {
  const response = await fetch(`${API_BASE_URL}/admin/settings/`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Paramètres non enregistrés");
  return response.json();
};

export const fetchAdminUserDetail = async (userId: number): Promise<AdminUser> => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/`, { headers: authHeaders() });
  if (!response.ok) throw new Error("Utilisateur introuvable");
  return response.json();
};

export const updateAdminUser = async (userId: number, payload: { first_name?: string; last_name?: string; phone?: string }): Promise<AdminUser> => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/update/`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Impossible de modifier l'utilisateur");
  return response.json();
};

export const toggleAdminUserCertified = async (userId: number): Promise<AdminUser> => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-certified/`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Impossible de modifier le statut certifié");
  return response.json();
};

export const deleteAdminUser = async (userId: number) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/delete/`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Impossible de supprimer l'utilisateur");
  return true;
};
