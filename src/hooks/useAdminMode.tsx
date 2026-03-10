import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AdminModeContextType {
  adminModeActive: boolean;
  toggleAdminMode: () => void;
}

const AdminModeContext = createContext<AdminModeContextType>({
  adminModeActive: false,
  toggleAdminMode: () => {},
});

export const useAdminMode = () => useContext(AdminModeContext);

export const AdminModeProvider = ({ children }: { children: ReactNode }) => {
  const [adminModeActive, setAdminModeActive] = useState(() => {
    try { return sessionStorage.getItem("admin_mode") === "true"; } catch { return false; }
  });

  const toggleAdminMode = useCallback(() => {
    setAdminModeActive((prev) => {
      const next = !prev;
      try { sessionStorage.setItem("admin_mode", String(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <AdminModeContext.Provider value={{ adminModeActive, toggleAdminMode }}>
      {children}
    </AdminModeContext.Provider>
  );
};
