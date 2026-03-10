import { create } from "zustand";

interface AdminModeState {
  adminModeActive: boolean;
  toggleAdminMode: () => void;
}

// Simple local state - persisted in sessionStorage so it resets on tab close
const getInitial = () => {
  try {
    return sessionStorage.getItem("admin_mode") === "true";
  } catch {
    return false;
  }
};

export const useAdminMode = create<AdminModeState>((set) => ({
  adminModeActive: getInitial(),
  toggleAdminMode: () =>
    set((state) => {
      const next = !state.adminModeActive;
      try { sessionStorage.setItem("admin_mode", String(next)); } catch {}
      return { adminModeActive: next };
    }),
}));
