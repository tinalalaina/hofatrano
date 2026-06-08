import { clearToken, getToken, setToken } from "@/lib/auth";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://hofatrano.tina-lalaina.site/api").replace(/\/$/, "");
const API_URL = new URL(API_BASE_URL);
const API_ORIGIN = API_URL.origin;

const parseErrorMessage = async (response: Response, fallbackMessage: string) => {
  try {
    const data = await response.json();
    if (typeof data?.detail === "string" && data.detail.trim().length > 0) {
      return data.detail;
    }
    if (typeof data?.message === "string" && data.message.trim().length > 0) {
      return data.message;
    }
  } catch {
    // ignore JSON parsing errors and use fallback
  }

  try {
    const rawText = await response.text();
    if (rawText.trim().length > 0) {
      return rawText.trim();
    }
  } catch {
    // ignore text parsing errors and use fallback
  }

  return fallbackMessage;
};

const resolveAssetUrl = (url?: string | null) => {
  if (!url) return "";

  try {
    const parsed = new URL(url, API_ORIGIN);
    const sameHostname = parsed.hostname === API_URL.hostname;
    const isMediaPath = parsed.pathname.startsWith("/media/");

    if (parsed.origin === API_ORIGIN) {
      return parsed.href;
    }

    if (sameHostname && isMediaPath) {
      return `${API_ORIGIN}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    return parsed.href;
  } catch {
    if (url.startsWith("/")) return `${API_ORIGIN}${url}`;
    return `${API_ORIGIN}/${url}`;
  }
};

const normalizeSessionUser = (user: SessionUser): SessionUser => ({
  ...user,
  photo_url: resolveAssetUrl(user.photo_url),
});

export interface SessionUser {
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

export const registerUser = async (payload: {
  username: string;
  email: string;
  password: string;
  role: "client" | "owner" | "admin";
}) => {
  const registerAttempts: Record<string, unknown>[] = [
    payload,
    { ...payload, user_type: payload.role },
    { username: payload.username, email: payload.email, password: payload.password },
  ];

  let lastResponse: Response | null = null;
  for (const attemptPayload of registerAttempts) {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attemptPayload),
    });

    if (response.ok) {
      const data = await response.json();
      setToken(data.token);
      return normalizeSessionUser(data.user as SessionUser);
    }

    lastResponse = response;
    if (response.status < 500) {
      break;
    }
  }

  if (!lastResponse) throw new Error("Inscription impossible");
  throw new Error(await parseErrorMessage(lastResponse, "Inscription impossible"));
};

export const loginUser = async (identifier: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: identifier, password }),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response, "Connexion impossible"));
  const data = await response.json();
  setToken(data.token);
  return normalizeSessionUser(data.user as SessionUser);
};

export const logoutUser = async () => {
  const token = getToken();
  if (token) {
    await fetch(`${API_BASE_URL}/auth/logout/`, { method: "POST", headers: { Authorization: `Token ${token}` } });
  }
  clearToken();
};

export const fetchMe = async (): Promise<SessionUser | null> => {
  const token = getToken();
  if (!token) return null;
  const response = await fetch(`${API_BASE_URL}/auth/me/`, { headers: { Authorization: `Token ${token}` } });
  if (!response.ok) {
    clearToken();
    return null;
  }
  const data = (await response.json()) as SessionUser;
  return normalizeSessionUser(data);
};

export const updateMe = async (payload: Partial<SessionUser> | FormData) => {
  const token = getToken();
  if (!token) throw new Error("Connexion requise");
  const isFormData = payload instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/auth/me/`, {
    method: "PATCH",
    headers: isFormData ? { Authorization: `Token ${token}` } : { "Content-Type": "application/json", Authorization: `Token ${token}` },
    body: isFormData ? payload : JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response, "Impossible d'enregistrer le profil"));
  const data = (await response.json()) as SessionUser;
  return normalizeSessionUser(data);
};
