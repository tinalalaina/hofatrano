import house1 from "@/assets/house-1.jpg";
import house2 from "@/assets/house-2.jpg";
import house3 from "@/assets/house-3.jpg";
import house4 from "@/assets/house-4.jpg";
import house5 from "@/assets/house-5.jpg";
import house6 from "@/assets/house-6.jpg";

export interface House {
  id: string;
  title: string;
  description: string;
  city: string;
  quartier: string;
  price: number;
  caution_amount?: number;
  daily_reservation_price?: number;
  bedrooms: number;
  bathrooms: number;
  surface: number;
  image: string;
  images: string[];
  furnished: boolean;
  parking: boolean;
  water: boolean;
  electricity: boolean;
  available: boolean;
  featured: boolean;
  urgent: boolean;
  views: number;
  ownerName: string;
  ownerPhone: string;
  ownerPhone1?: string;
  ownerPhone2?: string;
  ownerPhone3?: string;
  ownerWhatsapp: string;
  ownerPhoto?: string;
  createdAt: string;
  equipments: string[];
  rating: number;
  reviewCount: number;
  publication_paid?: boolean;
  publication_stopped?: boolean;
  publication_stopped_at?: string | null;
  status?: string;
}

const imageMap: Record<string, string> = {
  "house-1": house1,
  "house-2": house2,
  "house-3": house3,
  "house-4": house4,
  "house-5": house5,
  "house-6": house6,
};



export const cities = [
  "Antananarivo",
  "Toamasina",
  "Antsirabe",
  "Fianarantsoa",
  "Mahajanga",
  "Toliara",
  "Antsiranana",
  "Nosy Be",
];

export const quartiers: Record<string, string[]> = {
  Antananarivo: ["Ivandry", "Analamahitsy", "Ambatobe", "Isoraka", "Analakely", "Ambohitrarahaba"],
  Toamasina: ["Centre-ville", "Ankirihiry", "Ambolomadinika"],
  Antsirabe: ["Centre-ville", "Ambohimandroso"],
  Mahajanga: ["Centre-ville", "Amborovy", "Tsaramandroso"],
  "Nosy Be": ["Hell-Ville", "Ambatoloaka", "Madirokely"],
};

export const imageKeys = Object.keys(imageMap);

export const resolveImageKey = (key: string): string => {
  if (!key) return "";
  if (key.startsWith("http://") || key.startsWith("https://") || key.startsWith("data:image/") || key.startsWith("blob:") || key.startsWith("/")) {
    return key;
  }
  return imageMap[key] ?? "";
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-MG", {
    style: "currency",
    currency: "MGA",
    maximumFractionDigits: 0,
  }).format(price);
};
