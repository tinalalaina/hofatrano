const LOCAL_API_URL = "http://127.0.0.1:8000/api";
const PRODUCTION_API_URL = "https://hofatrano.tina-lalaina.site/api";

const getDefaultApiUrl = () => {
  if (import.meta.env.DEV) return LOCAL_API_URL;
  return PRODUCTION_API_URL;
};

export const API_BASE_URL = (import.meta.env.VITE_API_URL || getDefaultApiUrl()).replace(/\/$/, "");
export const API_URL = new URL(API_BASE_URL);
export const API_ORIGIN = API_URL.origin;
