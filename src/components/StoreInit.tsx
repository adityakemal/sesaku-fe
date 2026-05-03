import { useEffect } from "react";

export function StoreInit() {
  useEffect(() => {
    // Clean old localStorage keys from previous versions
    try {
      localStorage.removeItem("sesaku-store");
      localStorage.removeItem("sesaku-user");
    } catch {}
  }, []);

  return null;
}
