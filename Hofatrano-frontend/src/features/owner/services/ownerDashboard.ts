import {
  createHouse,
  fetchOwnerDashboard,
  ownerStopHousePublication,
  ownerReservationAction,
  ownerUpdateReservationStatus,
  ownerUpdateVisitDepositStatus,
  ownerUpdateVisitStatus,
  ownerVisitAction,
  Reservation,
  updateHouse,
  Visit,
  deleteHouse,
} from "@/lib/api";
import { House, formatPrice, resolveImageKey } from "@/data/mockData";
import {
  HouseFormValues,
  HouseStatus,
  OwnerEarning,
  OwnerHouse,
  OwnerPayment,
  OwnerReservation,
  OwnerStats,
  OwnerVisit,
  PaymentStatus,
  ReservationStatus,
  UploadPhoto,
} from "@/features/owner/types";

const MAX_PHOTOS = 12;
const MAX_IMAGE_SIZE_MB = 5;
const MAX_TOTAL_UPLOAD_SIZE_MB = 12;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://hofatrano.tina-lalaina.site/api").replace(/\/$/, "");
const API_ORIGIN = new URL(API_BASE_URL).origin;

const normalizeDashboardImage = (image?: string) => {
  if (!image) return "";
  if (image.startsWith("/")) return resolveImageKey(`${API_ORIGIN}${image}`);
  return resolveImageKey(image);
};

const normalizeHouseStatus = (status?: string): HouseStatus => {
  if (!status) return "pending_validation";
  if (status === "publication_stopped") return "publication_stopped";
  if (["approved", "validated"].includes(status)) return "validated";
  if (status === "rejected") return "refused";
  if (status === "pending") return "pending_validation";
  if (["published", "draft", "expired"].includes(status)) return status as HouseStatus;
  return "pending_validation";
};

const toOwnerHouse = (house: House): OwnerHouse => ({
  ...house,
  status: house.publication_stopped ? "publication_stopped" : normalizeHouseStatus((house as House & { status?: string }).status),
  address: (house as House & { address?: string }).address || `${house.quartier}, ${house.city}`,
  publishPaymentStatus: "pending",
  featurePaymentStatus: house.featured ? "pending" : "pending",
});

const toOwnerVisit = (visit: Visit): OwnerVisit => ({
  ...visit,
  clientPhone: visit.clientPhone || "Non renseigné",
  clientWhatsapp: visit.clientWhatsapp || "",
  clientEmail: visit.clientEmail || "",
  clientFirstName: visit.clientFirstName || "",
  clientLastName: visit.clientLastName || "",
  clientPhoto: visit.clientPhoto || "",
  houseImage: "",
  housePrice: 0,
  houseCautionAmount: 0,
});

const toOwnerReservation = (reservation: Reservation): OwnerReservation => ({
  ...reservation,
  houseImage: normalizeDashboardImage(reservation.houseImage),
  status: (["pending", "confirmed", "canceled", "completed"].includes(reservation.status)
    ? reservation.status
    : "pending") as ReservationStatus,
});

export const fetchOwnerWorkspace = async () => {
  const data = await fetchOwnerDashboard();
  const houses: OwnerHouse[] = (data.houses || []).map(toOwnerHouse);
  const houseById = new Map(houses.map((house) => [Number(house.id), house]));
  const visits: OwnerVisit[] = (data.visits || []).map((visit: Visit) => ({
    ...toOwnerVisit(visit),
    houseImage: houseById.get(visit.house)?.image || "",
    housePrice: houseById.get(visit.house)?.price || 0,
    houseCautionAmount: houseById.get(visit.house)?.caution_amount || 0,
  }));
  const reservations: OwnerReservation[] = (data.reservations || []).map(toOwnerReservation);

  const reservationsWithHouseImage = reservations.map((reservation) => ({
    ...reservation,
    houseImage: reservation.houseImage || houseById.get(reservation.house)?.image || "",
  }));

  const stats: OwnerStats = {
    houses_total: houses.length,
    houses_pending_validation: houses.filter((house) => house.status === "pending_validation").length,
    visits_pending: visits.filter((visit) => visit.status === "pending").length,
    reservations_total: reservationsWithHouseImage.length,
    revenue_total: data.stats?.revenue_total || reservationsWithHouseImage.reduce((sum, reservation) => sum + reservation.total_price, 0),
    featured_ads: houses.filter((house) => house.featured).length,
  };

  const invoiceByHouse = new Map((data.publication_invoices || []).map((invoice: any) => [String(invoice.house), invoice]));

  const payments: OwnerPayment[] = houses.flatMap((house, index) => {
    const invoice = invoiceByHouse.get(house.id);
    const publication: OwnerPayment = {
      id: `pub-${house.id}`,
      houseId: house.id,
      houseTitle: house.title,
      houseImage: house.image,
      type: "publication",
      amount: invoice?.amount || 10000,
      status: invoice?.status === "PAID" ? "paid" : invoice?.status === "REJECTED" ? "failed" : "pending",
      paidAt: invoice?.updated_at || new Date(Date.now() - index * 86400000).toISOString(),
    };

    const featured: OwnerPayment = {
      id: `feat-${house.id}`,
      houseId: house.id,
      houseTitle: house.title,
      houseImage: house.image,
      type: "featured",
      amount: 20000,
      status: house.featured ? house.featurePaymentStatus : "pending",
      paidAt: new Date(Date.now() - (index + 2) * 86400000).toISOString(),
    };

    return [publication, featured];
  });

  const earnings: OwnerEarning[] = reservationsWithHouseImage.map((reservation) => ({
    id: `earning-${reservation.id}`,
    reservationId: reservation.id,
    houseTitle: reservation.houseTitle,
    grossAmount: reservation.total_price,
    commissionAmount: reservation.commission,
    netAmount: reservation.total_price - reservation.commission,
    paidAt: reservation.created_at,
  }));

  return { stats, houses, visits, reservations: reservationsWithHouseImage, payments, earnings };
};

export const photoUploadRules = {
  maxPhotos: MAX_PHOTOS,
  maxImageSizeMb: MAX_IMAGE_SIZE_MB,
  maxTotalUploadSizeMb: MAX_TOTAL_UPLOAD_SIZE_MB,
  allowedTypes: ALLOWED_TYPES,
};

export const validatePhotos = (files: File[], existingPhotos: UploadPhoto[]): string | null => {
  if (existingPhotos.length + files.length > MAX_PHOTOS) {
    return `Maximum ${MAX_PHOTOS} photos autorisées par maison.`;
  }

  const existingUploadSize = existingPhotos.reduce((sum, photo) => sum + (photo.file?.size || 0), 0);
  const selectedUploadSize = files.reduce((sum, file) => sum + file.size, 0);
  if (existingUploadSize + selectedUploadSize > MAX_TOTAL_UPLOAD_SIZE_MB * 1024 * 1024) {
    return `Photos trop lourdes. Taille totale max : ${MAX_TOTAL_UPLOAD_SIZE_MB}MB.`;
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Format invalide (${file.name}). Formats acceptés : jpg, jpeg, png, webp.`;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      return `Image trop lourde (${file.name}). Taille max : ${MAX_IMAGE_SIZE_MB}MB par image.`;
    }
  }

  return null;
};

export const createHouseFromForm = async (values: HouseFormValues, photos: UploadPhoto[]) => {
  const orderedPhotos = photos.filter((photo) => photo.file).sort((a, b) => Number(b.isCover) - Number(a.isCover));
  const payload = {
    title: values.title,
    description: values.description,
    city: values.city,
    quartier: values.quartier,
    price: Number(values.price),
    caution_amount: Number(values.cautionAmount),
    daily_reservation_price: Number(values.dailyReservationPrice),
    bedrooms: Number(values.bedrooms),
    bathrooms: Number(values.bathrooms),
    surface: 1,
    furnished: values.furnished,
    parking: values.parking,
    water: values.water,
    electricity: values.electricity,
    available: values.available,
    featured: values.featured,
    equipments: values.equipments
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    ownerPhone1Input: values.ownerPhone1,
    ownerPhone2Input: values.ownerPhone2,
    ownerPhone3Input: values.ownerPhone3,
    ownerWhatsappInput: values.ownerWhatsapp,
  };

  return createHouse(
    payload as Partial<House>,
    orderedPhotos.map((photo) => photo.file as File),
  );
};

export const updateHouseFromForm = async (houseId: string, values: HouseFormValues, photos: UploadPhoto[]) => {
  const orderedPhotos = photos.sort((a, b) => Number(b.isCover) - Number(a.isCover));
  const uploadedFiles = orderedPhotos.filter((photo) => photo.file).map((photo) => photo.file as File);
  const existingImageUrls = orderedPhotos.filter((photo) => !photo.file).map((photo) => photo.previewUrl);

  return updateHouse(houseId, {
    title: values.title,
    description: values.description,
    city: values.city,
    quartier: values.quartier,
    price: Number(values.price),
    caution_amount: Number(values.cautionAmount),
    daily_reservation_price: Number(values.dailyReservationPrice),
    bedrooms: Number(values.bedrooms),
    bathrooms: Number(values.bathrooms),
    surface: 1,
    furnished: values.furnished,
    parking: values.parking,
    water: values.water,
    electricity: values.electricity,
    available: values.available,
    featured: values.featured,
    equipments: values.equipments
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    ownerPhone1Input: values.ownerPhone1,
    ownerPhone2Input: values.ownerPhone2,
    ownerPhone3Input: values.ownerPhone3,
    ownerWhatsappInput: values.ownerWhatsapp,
    image_urls: existingImageUrls,
  } as Partial<House>, uploadedFiles);
};

export const removeHouse = async (houseId: string) => deleteHouse(houseId);
export const stopHousePublication = async (houseId: string, password: string) => ownerStopHousePublication(houseId, password);

export const runVisitAction = async (visitId: number, action: "accept" | "refuse" | "done" | "cancel") => ownerVisitAction(visitId, action);
export const runVisitDepositStatusUpdate = async (
  visitId: number,
  depositStatus: "unpaid" | "paid" | "refunded" | "deducted" | "kept",
) => ownerUpdateVisitDepositStatus(visitId, depositStatus);
export const runVisitStatusUpdate = async (
  visitId: number,
  status: "pending" | "accepted" | "refused" | "canceled" | "done" | "no_show",
) => ownerUpdateVisitStatus(visitId, status);
export const runReservationAction = async (reservationId: number, action: "confirm" | "cancel" | "complete") =>
  ownerReservationAction(reservationId, action);
export const runReservationStatusUpdate = async (
  reservationId: number,
  status: "pending" | "confirmed" | "canceled" | "completed",
) => ownerUpdateReservationStatus(reservationId, status);

export const paymentStatusLabel = (status: PaymentStatus) => {
  if (status === "paid") return "Payé";
  if (status === "failed") return "Échoué";
  return "En attente";
};

export const paymentTypeLabel = (type: OwnerPayment["type"]) => (type === "featured" ? "Mise en avant" : "Publication");

export const formatOwnerCurrency = (amount: number) => formatPrice(amount);
